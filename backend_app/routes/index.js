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
    "FROM clean_trees, path " +
    "WHERE ST_DWithin(clean_trees.geom, path.geom, 100, TRUE)",
    points2WKT(path)
  ).then(result => {
    let wayPoint = [{lat: -37.81, lng: 144.96}, {lat: -37.80, lng: 144.95}];
    resObject.tree_cnt = result;
    resObject.way_point = wayPoint;
    resObject.toilet = [{lat: -37.8063, lng: 144.9596}];
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
