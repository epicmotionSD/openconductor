#!/bin/bash
echo "🌟 Sonnier Ventures Ecosystem Metrics"
echo "======================================"
psql "$SUPABASE_DATABASE_URL" -t << SQL
SELECT 
  s.name || ': ' || 
  COALESCE(st.cli_installs, 0) || ' installs, ' ||
  COALESCE(st.github_stars, 0) || ' stars'
FROM mcp_servers s
LEFT JOIN server_stats st ON s.id = st.server_id
WHERE s.repository_owner = 'sonnierventures'
ORDER BY COALESCE(st.cli_installs, 0) DESC;
SQL
