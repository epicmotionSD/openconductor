-- OpenConductor Local Database Setup
-- Run this with: sudo -u postgres psql -f create-local-db.sql

-- Create user
CREATE USER openconductor WITH PASSWORD 'openconductor_dev_password';

-- Create database
CREATE DATABASE openconductor OWNER openconductor;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE openconductor TO openconductor;

-- Connect to the database
\c openconductor

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO openconductor;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO openconductor;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO openconductor;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Show success message
\echo ''
\echo '✅ Database "openconductor" created successfully!'
\echo ''
\echo 'User: openconductor'
\echo 'Password: openconductor_dev_password'
\echo 'Database: openconductor'
\echo ''
\echo 'Next steps:'
\echo '1. Run: PGPASSWORD=openconductor_dev_password psql -h localhost -U openconductor -d openconductor -f packages/api/src/db/schema.sql'
\echo '2. Then run migrations from packages/api/src/db/migrations/'
\echo ''
