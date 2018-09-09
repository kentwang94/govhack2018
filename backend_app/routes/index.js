var express = require('express');
var router = express.Router();
const db = require('../database/db.js');
const http = require('http');

let points2text = (pts) => {
  return "LINESTRING(" + pts.map(x => '' + x.lng + ' ' + x.lat).join(', ') + ')';
};

let point2text = (pt) => {
  return "POINT(" + pt.lng + ' ' + pt.lat + ')'
};

const statMode1 = [0.05, 0.5, 0.05, 0.0 , 0.4 ];
const statMode2 = [0.25, 0.0, 0.25, 0.25, 0.25];
const statMode3 = [0.1 , 0.0, 0.05, 0.05, 0.8 ];

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('gov_hack');
});

router.post('/path', (req, res) => {
  console.log(req.body);
  let path = req.body['path'];
  console.log(req.body['diability'] === false);
  console.log(req.body['diability'] === 'false');
  let pathStr = points2text(path);
  let distance = req.body['distance'];
  let wayPoints = [];
  let resObject = {};
  let _tree_cnt = 0;
  let _dist = 0;
  let _tree_per = 0;
  let _parkings = 0;
  let _foot_per = 0;


  db.oneOrNone( //Query the number of trees within 100 metres along the path
    "WITH path AS( " +
    "  SELECT ST_LineFromText($1) AS geom " +
    ") " +
    "SELECT COUNT(*) " +
    "FROM clean_trees, path " +
    "WHERE ST_DWithin(clean_trees.geom, path.geom, 100, TRUE)",
    pathStr
  ).then(result => {
    if (result === null) result = 0;
    //let wayPoint = [{lat: -37.81, lng: 144.96}, {lat: -37.80, lng: 144.95}];
    //resObject.tree_cnt = result['count'];
    _tree_cnt = result['count'];
    _dist = distance['distance']['value'];
    _tree_per = _tree_cnt / _dist > 0.7 ? 0.7 : _tree_cnt / _dist;
    db.oneOrNone( //Query the total parking spaces within 250 metres within the destination
      "WITH destination AS( " +
      "  SELECT ST_PointFromText($1) AS geom " +
      ") " +
      "SELECT SUM(parking_spaces) " +
      "FROM clean_off_parking, destination " +
      "WHERE ST_DWithin(clean_off_parking.geom, destination.geom, 250, TRUE)",
      point2text(path[path.length - 1])
    ).then(result => {
      if (result === null) result = 0;
      _parkings = result['sum'];
      db.oneOrNone( // Query the foot path density within 300 metres
        "WITH sensors AS ( " +
        "  SELECT sensor_id " +
        "  FROM ped_sensor " +
        "  WHERE ST_DWithin(ped_sensor.geom, " +
        "    (SELECT ST_LineFromText($1)), 300, TRUE) " +
        "), acc AS ( " +
        "  SELECT AVG(hourly_counts) AS avg " +
        "  FROM sensors, clean_ped_volumn " +
        "  WHERE sensors.sensor_id = clean_ped_volumn.sensor_id AND " +
        "        clean_ped_volumn.isodow = (SELECT EXTRACT(ISODOW FROM now() AT TIME ZONE 'AEST')) AND " +
        "        clean_ped_volumn.time = (SELECT EXTRACT(HOUR FROM now() AT TIME ZONE 'AEST')) " +
        "  GROUP BY sensors.sensor_id " +
        ") " +
        "SELECT AVG(avg) FROM acc",
        pathStr
      ).then(result => {
        if (result === null) result = 0;
        _foot_per = result > 2000 ? 1 : result / 2000;
      });
      db.any( // Query toilets with disabled accessibility within 300 metres
        "SELECT lat, lon AS lng " +
        "FROM clean_wheeltoilets " +
        "WHERE ST_DWithin(geom,(SELECT ST_LineFromText($1)),300, TRUE)",
        pathStr
      ).then(result => {
        resObject.toilet = result;
        http.get('http://43.240.99.61:16666/dialogflow?endLatitude=' +
          distance['end_location']['lat'] + '&endLongitude=' + distance['end_location']['lng'],
          (res) => {
            const {statusCode} = res;
            const contentType = res.headers['content-type'];

            let error;
            if (statusCode !== 200) {
              error = new Error('Request Failed.\n' +
                `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
              error = new Error('Invalid content-type.\n' +
                `Expected application/json but received ${contentType}`);
            }
            if (error) {
              console.error(error.message);
              // consume response data to free up memory
              res.resume();
              return;
            }
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => {
              rawData += chunk;
            });
            res.on('end', () => {
              try {
                const parsedData = JSON.parse(rawData);
                console.log(parsedData);
                resObject.suggestion = parsedData;
                let statNum = [
                  parsedData['weather_score'],
                  parsedData['car_park_vacant_rate'],
                  parsedData['air_q_level'],
                  _tree_per,
                  _foot_per
                ];
                console.log(statNum);
                let statScore = 0;
                for (let i = 0; i < 5; i ++){
                  statScore += statNum[i] *statMode1[i];
                }
                if (req.body['wandering']) {
                  statScore = 0;
                  for (let i = 0; i < 5; i ++){
                    statScore += statNum[i] *statMode2[i];
                  }
                }
                if (req.body['diability']) {
                  statScore = 0;
                  for (let i = 0; i < 5; i ++){
                    statScore += statNum[i] *statMode3[i];
                  }
                }
                resObject.suggestion['mode'] = statScore > 0.5 ? 'walk' : 'drive';
                console.log(resObject);
                res.send(resObject);
              } catch (e) {
                console.error(e.message);
              }
            });
          }).on('error', (e) => {
          console.error(`Got error: ${e.message}`);
        });
      });

    });
  });
});


/**
 * # off street parking, destination, 250 metres
 * # no.trees / total_foot_path_distance
 * # ped_volume  $$ sensor_list
 */
module.exports = router;
