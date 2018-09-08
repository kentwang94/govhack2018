const pgp = require('pg-promise')();
const db = pgp('postgres://ubuntu@localhost:5432/govhack');


module.exports = db;