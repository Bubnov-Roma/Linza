-- Находим группы (по title), где НИ у одной записи не стоит isPrimary
WITH orphan_groups AS (
  SELECT title
  FROM "Equipment"
  GROUP BY title
  HAVING COUNT(*) FILTER (WHERE "isPrimary" = true) = 0
),
first_in_group AS (
  SELECT DISTINCT ON (e.title) e.id
  FROM "Equipment" e
  JOIN orphan_groups og ON og.title = e.title
  ORDER BY e.title, e."createdAt" ASC
)
UPDATE "Equipment"
SET "isPrimary" = true
WHERE id IN (SELECT id FROM first_in_group);
