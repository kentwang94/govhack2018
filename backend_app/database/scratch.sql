WITH path AS(
  SELECT ST_LineFromText('') AS geom
)
SELECT COUNT(*)
FROM clean_trees
WHERE ST_DWithin(clean_trees.geom, path.geom, 100, TRUE);