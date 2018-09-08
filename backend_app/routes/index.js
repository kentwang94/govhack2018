var express = require('express');
var router = express.Router();
const db = require('../database/db.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('gov_hack');
});

router.get('/path', (req, res) => {
  console.log(req.body);
  db.any(
    "SELECT * FROM clean_air LIMIT 1"
  ).then(result => {
    let wayPoint = {lat: 10, lon: -10};
    let resObject = {};
    resObject.title = 'Bookings';
    resObject.bookingList = result;
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
