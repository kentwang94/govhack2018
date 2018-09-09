WITH path AS(
  SELECT ST_LineFromText('') AS geom
)
SELECT COUNT(*)
FROM clean_trees, path
WHERE ST_DWithin(clean_trees.geom, path.geom, 100, TRUE);


WITH destination AS(
  SELECT ST_PointFromText('POINT(144.95791 -37.79979)') AS geom
)
SELECT SUM(parking_spaces) AS total
FROM clean_off_parking, destination
WHERE ST_DWithin(clean_off_parking.geom, destination.geom, 200, TRUE);


WITH path AS(
  SELECT ST_LineFromText('') AS geom
), sensors AS (
  SELECT sensor_id
  FROM ped_sensor, path
  WHERE ST_DWithin(ped_sensor.geom, path.geom, 200, TRUE)
)
SELECT AVG(hourly_counts)
FROM sensors, clean_ped_volumn
WHERE sensors.sensor_id = clean_ped_volumn.sensor_id AND
      clean_ped_volumn.isodow = (SELECT EXTRACT(ISODOW FROM now() AT TIME ZONE 'AEST')) AND
      clean_ped_volumn.time = (SELECT EXTRACT(HOUR FROM now() AT TIME ZONE 'AEST'));

CREATE TABLE ped_sensor (
  sensor_id INTEGER,
  lat       FLOAT,
  lon       FLOAT
);

SELECT AddGeometryColumn ('ped_sensor','geom',4326,'POINT',2);
UPDATE ped_sensor SET geom = ST_SetSrid(ST_MakePoint(lon, lat), 4326);

ALTER TABLE clean_ped_volumn
DROP COLUMN lat,
DROP COLUMN lon,
DROP COLUMN geom;

ALTER TABLE clean_ped_volumn
ADD COLUMN isodow INTEGER;

UPDATE clean_ped_volumn SET isodow = (CASE
  WHEN day = 'Monday'    THEN 1
  WHEN day = 'Tuesday'   THEN 2
  WHEN day = 'Wednesday' THEN 3
  WHEN day = 'Thursday'  THEN 4
  WHEN day = 'Friday'    THEN 5
  WHEN day = 'Saturday'  THEN 6
  WHEN day = 'Sunday'    THEN 7
  ELSE 0
END);

SELECT EXTRACT(hour FROM now() AT TIME ZONE 'AEST');



SELECT lat, lon AS lng
FROM clean_wheeltoilets
WHERE ST_DWithin(geom,(SELECT ST_LineFromText('LINESTRING(144.95791 -37.79979, 144.95791 -37.79979)')),200, TRUE);




WITH sensors AS (
  SELECT sensor_id
  FROM ped_sensor
  WHERE ST_DWithin(ped_sensor.geom,
    (SELECT ST_LineFromText('LINESTRING(144.95791 -37.79979, 144.95791 -37.79979)')), 200, TRUE)
), acc AS (
  SELECT AVG(hourly_counts) AS avg
  FROM sensors, clean_ped_volumn
  WHERE sensors.sensor_id = clean_ped_volumn.sensor_id AND
        clean_ped_volumn.isodow = (SELECT EXTRACT(ISODOW FROM now() AT TIME ZONE 'AEST')) AND
        clean_ped_volumn.time = (SELECT EXTRACT(HOUR FROM now() AT TIME ZONE 'AEST'))
  GROUP BY sensors.sensor_id
)
SELECT AVG(avg) FROM acc;


