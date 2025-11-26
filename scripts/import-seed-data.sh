#!/bin/bash

# Import seed data from JSON files into local PostgreSQL

set -e

echo "📤 Importing seed data into local PostgreSQL..."
echo ""

DB_NAME="openconductor"
DB_USER="openconductor"
DB_PASSWORD="openconductor_dev_password"
DB_HOST="localhost"
DB_PORT="5432"

SEED_DIR="seed-data"

if [ ! -d "$SEED_DIR" ]; then
    echo "❌ Seed data directory not found: $SEED_DIR"
    echo "Please run ./pull-supabase-data.sh first"
    exit 1
fi

echo "🧪 Testing database connection..."
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Cannot connect to database"
    echo "Please run ./fix-pg-auth.sh first"
    exit 1
fi

echo "✅ Database connection successful"
echo ""

# Create a Python script to import JSON data
cat > /tmp/import_json_to_pg.py << 'PYTHON'
import json
import sys
import psycopg2
from psycopg2.extras import Json

def import_table(conn, table_name, json_file):
    with open(json_file, 'r') as f:
        data = json.load(f)

    if not data:
        print(f"   ⚠️  No data in {json_file}")
        return 0

    cursor = conn.cursor()

    # Get column names from first record
    columns = list(data[0].keys())

    # Build INSERT statement with ON CONFLICT DO NOTHING
    placeholders = ', '.join(['%s'] * len(columns))
    columns_str = ', '.join([f'"{col}"' for col in columns])

    insert_query = f"""
        INSERT INTO {table_name} ({columns_str})
        VALUES ({placeholders})
        ON CONFLICT DO NOTHING
    """

    inserted = 0
    for record in data:
        try:
            # Convert dict/list values to JSONB
            values = []
            for col in columns:
                val = record[col]
                if isinstance(val, (dict, list)):
                    values.append(Json(val))
                else:
                    values.append(val)

            cursor.execute(insert_query, values)
            if cursor.rowcount > 0:
                inserted += 1
        except Exception as e:
            print(f"      Error inserting record: {e}")
            continue

    conn.commit()
    cursor.close()
    return inserted

if __name__ == '__main__':
    import os

    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        port=os.environ.get('DB_PORT', '5432'),
        database=os.environ.get('DB_NAME', 'openconductor'),
        user=os.environ.get('DB_USER', 'openconductor'),
        password=os.environ.get('DB_PASSWORD', 'openconductor_dev_password')
    )

    tables = ['mcp_servers', 'server_stats', 'server_versions', 'discovery_sources']
    seed_dir = sys.argv[1] if len(sys.argv) > 1 else 'seed-data'

    for table in tables:
        json_file = f'{seed_dir}/{table}.json'
        if os.path.exists(json_file):
            print(f'   Importing: {table}')
            count = import_table(conn, table, json_file)
            print(f'      ✓ Inserted {count} records')
        else:
            print(f'   ⚠️  File not found: {json_file}')

    conn.close()
    print('')
    print('✅ Import complete!')

PYTHON

echo "📊 Importing data..."
echo ""

# Install psycopg2 if not available
if ! python3 -c "import psycopg2" 2>/dev/null; then
    echo "Installing psycopg2..."
    pip3 install psycopg2-binary --user -q
fi

# Run the import script
export DB_HOST=$DB_HOST
export DB_PORT=$DB_PORT
export DB_NAME=$DB_NAME
export DB_USER=$DB_USER
export DB_PASSWORD=$DB_PASSWORD

python3 /tmp/import_json_to_pg.py $SEED_DIR

echo ""
echo "📈 Database statistics:"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT
    'mcp_servers' as table_name,
    COUNT(*) as record_count
FROM mcp_servers
UNION ALL
SELECT
    'server_stats' as table_name,
    COUNT(*) as record_count
FROM server_stats
UNION ALL
SELECT
    'server_versions' as table_name,
    COUNT(*) as record_count
FROM server_versions;
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Seed data imported successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
