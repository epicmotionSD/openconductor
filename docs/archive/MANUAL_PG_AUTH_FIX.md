# Manual PostgreSQL Authentication Fix

The authentication configuration needs to be updated to allow password authentication for the `openconductor` user.

## Steps to Fix

### 1. Open a new terminal and edit the PostgreSQL authentication config:

```bash
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

### 2. Find the section that looks like this:

```
# Database administrative login by Unix domain socket
local   all             postgres                                peer
```

### 3. Add these two lines RIGHT AFTER that section (before any other rules):

```
# OpenConductor local development
host    openconductor   openconductor   127.0.0.1/32            md5
host    openconductor   openconductor   ::1/128                 md5
```

Your file should look like this:

```
# Database administrative login by Unix domain socket
local   all             postgres                                peer

# OpenConductor local development
host    openconductor   openconductor   127.0.0.1/32            md5
host    openconductor   openconductor   ::1/128                 md5

# TYPE  DATABASE        USER            ADDRESS                 METHOD
... (rest of the file)
```

### 4. Save the file:
- Press `Ctrl+O` to save
- Press `Enter` to confirm
- Press `Ctrl+X` to exit

### 5. Reload PostgreSQL:

```bash
sudo systemctl reload postgresql
```

### 6. Test the connection:

```bash
PGPASSWORD=openconductor_dev_password psql -h localhost -U openconductor -d openconductor -c 'SELECT version();'
```

If you see the PostgreSQL version output, authentication is working!

### 7. Then continue with the data import:

```bash
# Apply schema
PGPASSWORD=openconductor_dev_password psql -h localhost -U openconductor -d openconductor -f packages/api/src/db/schema.sql

# Pull data from Supabase
./pull-supabase-data.sh

# Import data
./import-seed-data.sh
```

## Troubleshooting

If you still get authentication errors:

1. Check the pg_hba.conf file was saved correctly:
   ```bash
   sudo cat /etc/postgresql/16/main/pg_hba.conf | grep openconductor
   ```

2. Make sure PostgreSQL was reloaded:
   ```bash
   sudo systemctl status postgresql
   ```

3. Check PostgreSQL logs:
   ```bash
   sudo tail -n 50 /var/log/postgresql/postgresql-16-main.log
   ```
