-- Link MCP servers to stacks
-- Run this AFTER creating the stacks tables

-- Essential Stack (fundamental tools)
INSERT INTO stack_servers (stack_id, server_id, sort_order)
SELECT
  (SELECT id FROM stacks WHERE slug = 'essential'),
  ms.id,
  ROW_NUMBER() OVER () - 1
FROM (VALUES
  ('filesystem-mcp'),
  ('brave-search-mcp'),
  ('fetch-mcp'),
  ('time-mcp'),
  ('mcp-memory')
) AS slugs(slug)
JOIN mcp_servers ms ON ms.slug = slugs.slug
ON CONFLICT (stack_id, server_id) DO UPDATE
SET sort_order = EXCLUDED.sort_order;

-- Coder Stack (complete development environment)
INSERT INTO stack_servers (stack_id, server_id, sort_order)
SELECT
  (SELECT id FROM stacks WHERE slug = 'coder'),
  ms.id,
  ROW_NUMBER() OVER () - 1
FROM (VALUES
  ('github-mcp'),
  ('postgresql-mcp'),
  ('filesystem-mcp'),
  ('mcp-memory'),
  ('sequential-thinking'),
  ('brave-search-mcp')
) AS slugs(slug)
JOIN mcp_servers ms ON ms.slug = slugs.slug
ON CONFLICT (stack_id, server_id) DO UPDATE
SET sort_order = EXCLUDED.sort_order;

-- Writer Stack (research and writing)
INSERT INTO stack_servers (stack_id, server_id, sort_order)
SELECT
  (SELECT id FROM stacks WHERE slug = 'writer'),
  ms.id,
  ROW_NUMBER() OVER () - 1
FROM (VALUES
  ('brave-search-mcp'),
  ('fetch-mcp'),
  ('filesystem-mcp'),
  ('mcp-memory'),
  ('google-drive-mcp')
) AS slugs(slug)
JOIN mcp_servers ms ON ms.slug = slugs.slug
ON CONFLICT (stack_id, server_id) DO UPDATE
SET sort_order = EXCLUDED.sort_order;

-- Verify the linking
SELECT
  s.name AS stack_name,
  COUNT(ss.server_id) AS server_count
FROM stacks s
LEFT JOIN stack_servers ss ON s.id = ss.stack_id
GROUP BY s.id, s.name
ORDER BY s.slug;
