var express = require('express');
var router = express.Router();
const db = require('../database/db.js');

let points2text = (pts) => {
  return "LINESTRING(" + pts.map(x => '' + x.lng + ' ' + x.lat).join(', ') + ')';
};

let point2text = (pt) => {
  return "POINT(" + pt.lng + ' ' + pt.lat + ')'
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('gov_hack');
});

router.post('/path', (req, res) => {
  let path = req.body['path'];
  let distance = req.body['distance'];
  let resObject = {};
  db.one( //Query the number of trees within 100 metres along the path
    "WITH path AS( " +
    "  SELECT ST_LineFromText($1) AS geom " +
    ") " +
    "SELECT COUNT(*) " +
    "FROM clean_trees, path " +
    "WHERE ST_DWithin(clean_trees.geom, path.geom, 100, TRUE)",
    points2text(path)
  ).then(result => {
    let wayPoint = [{lat: -37.81, lng: 144.96}, {lat: -37.80, lng: 144.95}];
    resObject.tree_cnt = result;
    resObject.way_point = wayPoint;
    resObject.toilet = [{lat: -37.8063, lng: 144.9596}];
    db.one( //Query the total parking spaces within 250 metres within the destination
      "WITH destination AS( " +
      "  SELECT ST_PointFromText($1) AS geom " +
      ") " +
      "SELECT SUM(parking_spaces) AS total " +
      "FROM clean_off_parking, destination " +
      "WHERE ST_DWithin(clean_off_parking.geom, destination.geom, 250, TRUE) " +
      "GROUP BY parking_spaces;",
      point2text(path[path.length-1])
    ).then(result => {
      resObject.parking_spaces = result;
      //db.any().then(result => {});

      console.log(resObject);
      res.send(resObject);
    });
  });
});


/**
 * # off street parking, destination, 200 metres
 * # no.trees / total_foot_path_distance
 * # ped_volume  $$ sensor_list
 */
module.exports = router;
