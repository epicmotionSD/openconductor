-- Test and fix authentication for openconductor user
-- Run with: sudo -u postgres psql

-- Show current user
SELECT current_user;

-- Connect to the openconductor database
\c openconductor

-- Drop and recreate the user with a clear password
DROP USER IF EXISTS openconductor;
CREATE USER openconductor WITH PASSWORD 'openconductor_dev_password';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE openconductor TO openconductor;
GRANT ALL ON SCHEMA public TO openconductor;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO openconductor;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO openconductor;
ALTER SCHEMA public OWNER TO openconductor;

-- Show the user
\du openconductor

\echo ''
\echo '✅ User recreated with password!'
\echo ''
\echo 'Now test with:'
\echo '  PGPASSWORD=openconductor_dev_password psql -h 127.0.0.1 -p 5432 -U openconductor -d openconductor -c "SELECT current_user;"'
\echo ''
