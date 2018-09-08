var express = require('express');
var router = express.Router();
const db = require('..database/db.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('gov_hack');
});

router.get('/path', (req, res) => {

  let wayPoint = [
    {
      lat: 1,
      lon: 2
    },
    {
      lat: 3,
      lon: 4
    }
  ];

  db.any(
    "SELECT * FROM clean_air LIMIT 1"
  ).then(result => {
    renderObject.title = 'Bookings';
    renderObject.bookingList = result;
    renderObject.wayPoint = wayPoint;
    res.render('index', renderObject);
  });
});

module.exports = router;
