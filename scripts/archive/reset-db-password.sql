-- Reset the openconductor user password
ALTER USER openconductor WITH PASSWORD 'openconductor_dev_password';

-- Verify the user exists
\du openconductor

\echo ''
\echo '✅ Password reset complete!'
\echo ''
\echo 'Test with:'
\echo '  PGPASSWORD=openconductor_dev_password psql -h localhost -U openconductor -d openconductor -c "SELECT version();"'
\echo ''
