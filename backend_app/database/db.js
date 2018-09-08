const pgp = require('pg-promise')();
const db = pgp('postgres://postgres:govhack@localhost:5432/govhack');


module.exports = db;