var express = require('express');
var router = express.Router();
const db = require('../database/db.js');

let points2WKT = (pts) => {
  return "LINESTRING(" + pts.map(x => '' + x.lng + ' ' + x.lat).join(', ') + ')';
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('gov_hack');
});

router.post('/path', (req, res) => {
  let path = req.body['path'];
  let distance = req.body['distance'];
  let resObject = {};
  db.any(
    "WITH path AS( " +
    "  SELECT ST_LineFromText($1) AS geom " +
    ") " +
    "SELECT COUNT(*) " +
    "FROM clean_trees " +
    "WHERE ST_DWithin(clean_trees.geom, path.geom, 100, TRUE)",
    points2WKT(path)
  ).then(result => {
    let wayPoint = [{lat: -38, lng: 145}, {lat: -39, lng: 146}];
    resObject.treeCnt = result;
    resObject.wayPoint = wayPoint;
    console.log(resObject);
    res.send(resObject);
  });
});


/**
 * # off street parking
 * # no.trees / total_foot_path_distance
 * # ped_volume
 */
module.exports = router;
