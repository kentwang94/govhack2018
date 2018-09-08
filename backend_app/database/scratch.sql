WITH path AS(
  SELECT ST_LineFromText('') AS geom
)
SELECT COUNT(*)
FROM clean_trees, path
WHERE ST_DWithin(clean_trees.geom, path.geom, 100, TRUE);


WITH destination AS(
  SELECT ST_LineFromText('') AS geom
)
SELECT SUM(parking_spaces) AS total
FROM clean_off_parking, destination
WHERE ST_DWithin(clean_off_parking.geom, destination.geom, 200, TRUE)
GROUP BY parking_spaces;


WITH
