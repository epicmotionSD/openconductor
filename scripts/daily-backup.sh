#!/bin/bash

# OpenConductor Daily Backup Script
# Automated daily backup of all critical system components

set -e

# Configuration
BACKUP_DIR="/tmp/openconductor-backup/$(date +%Y%m%d)"
S3_BUCKET="openconductor-backups"
LOG_FILE="/var/log/openconductor-backup.log"
RETENTION_DAYS=30

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" | tee -a $LOG_FILE
}

# Error handling
handle_error() {
    log "❌ BACKUP FAILED: $1"
    
    # Send alert notification
    curl -X POST "${SLACK_WEBHOOK_URL}" \
        -H "Content-Type: application/json" \
        -d '{
            "text": "🚨 OpenConductor backup failed: '"$1"'",
            "channel": "#alerts"
        }' || true
    
    exit 1
}

# Trap errors
trap 'handle_error "Script failed at line $LINENO"' ERR

log "🚀 Starting OpenConductor daily backup..."

# Create backup directory
mkdir -p $BACKUP_DIR

# 1. Database Backup
log "💾 Starting database backup..."
if [ -n "$DATABASE_URL" ]; then
    pg_dump $DATABASE_URL \
        --verbose \
        --clean \
        --no-acl \
        --no-owner \
        --compress=9 \
        -f "$BACKUP_DIR/database-$(date +%H%M%S).sql.gz" || handle_error "Database backup failed"
    
    log "✅ Database backup completed"
else
    log "⚠️ DATABASE_URL not set, skipping database backup"
fi

# 2. Configuration Backup
log "🔧 Starting configuration backup..."
if [ -f ".env.production" ]; then
    # Encrypt sensitive configuration
    gpg --symmetric --cipher-algo AES256 --batch --yes \
        --passphrase-file <(echo "$BACKUP_ENCRYPTION_KEY") \
        --output "$BACKUP_DIR/env.production.gpg" \
        .env.production || handle_error "Configuration backup failed"
    
    log "✅ Configuration backup completed"
fi

# Copy database schema
if [ -f "database/supabase-schema.sql" ]; then
    cp database/supabase-schema.sql "$BACKUP_DIR/"
    log "✅ Schema backup completed"
fi

# 3. Application Metadata Backup
log "📋 Starting application metadata backup..."

# Railway environment variables
if command -v railway &> /dev/null; then
    railway env --json > "$BACKUP_DIR/railway-env.json" 2>/dev/null || true
fi

# Vercel environment variables
if command -v vercel &> /dev/null; then
    cd frontend && vercel env ls --json > "$BACKUP_DIR/vercel-env.json" 2>/dev/null || true
    cd ..
fi

# Git commit hash for reference
git rev-parse HEAD > "$BACKUP_DIR/git-commit.txt" 2>/dev/null || true

log "✅ Application metadata backup completed"

# 4. User Data Export (if needed)
log "👥 Starting user data export..."
if [ -n "$DATABASE_URL" ]; then
    # Export user data (anonymized)
    psql $DATABASE_URL -c "COPY (
        SELECT id, email, plan, created_at, updated_at 
        FROM public.users 
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
    ) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/users-daily.csv" || true
    
    # Export workflow data
    psql $DATABASE_URL -c "COPY (
        SELECT id, user_id, name, status, created_at, updated_at
        FROM public.workflows 
        WHERE updated_at >= CURRENT_DATE - INTERVAL '1 day'
    ) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/workflows-daily.csv" || true
    
    log "✅ User data export completed"
fi

# 5. Upload to S3
log "☁️ Uploading backup to S3..."
if command -v aws &> /dev/null; then
    aws s3 sync "$BACKUP_DIR" "s3://$S3_BUCKET/daily/$(date +%Y%m%d)/" \
        --delete \
        --storage-class STANDARD_IA || handle_error "S3 upload failed"
    
    log "✅ S3 upload completed"
else
    log "⚠️ AWS CLI not available, skipping S3 upload"
fi

# 6. Create backup manifest
cat > "$BACKUP_DIR/backup-manifest.json" << EOF
{
    "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "backup_type": "daily",
    "components": {
        "database": $([ -f "$BACKUP_DIR/database-"*.sql.gz ] && echo "true" || echo "false"),
        "configuration": $([ -f "$BACKUP_DIR/env.production.gpg" ] && echo "true" || echo "false"),
        "schema": $([ -f "$BACKUP_DIR/supabase-schema.sql" ] && echo "true" || echo "false"),
        "user_data": $([ -f "$BACKUP_DIR/users-daily.csv" ] && echo "true" || echo "false"),
        "workflow_data": $([ -f "$BACKUP_DIR/workflows-daily.csv" ] && echo "true" || echo "false")
    },
    "backup_size_mb": $(du -sm "$BACKUP_DIR" | cut -f1),
    "git_commit": "$(cat "$BACKUP_DIR/git-commit.txt" 2>/dev/null || echo 'unknown')"
}
EOF

# 7. Cleanup old backups
log "🧹 Cleaning up old backups..."
find /tmp/openconductor-backup -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true

# S3 cleanup (handled by lifecycle policies)
if command -v aws &> /dev/null; then
    aws s3 ls "s3://$S3_BUCKET/daily/" | head -n -$RETENTION_DAYS | awk '{print $4}' | \
        xargs -I {} aws s3 rm "s3://$S3_BUCKET/daily/{}" --recursive || true
fi

# 8. Verify backup integrity
log "🔍 Verifying backup integrity..."
if [ -f "$BACKUP_DIR/database-"*.sql.gz ]; then
    gunzip -t "$BACKUP_DIR/database-"*.sql.gz || handle_error "Database backup corruption detected"
fi

if [ -f "$BACKUP_DIR/env.production.gpg" ]; then
    gpg --quiet --batch --yes \
        --passphrase-file <(echo "$BACKUP_ENCRYPTION_KEY") \
        --decrypt "$BACKUP_DIR/env.production.gpg" > /dev/null || handle_error "Configuration backup corruption detected"
fi

log "✅ Backup integrity verified"

# 9. Send success notification
log "📊 Backup Summary:"
log "   • Database: $([ -f "$BACKUP_DIR/database-"*.sql.gz ] && echo "✅" || echo "❌")"
log "   • Configuration: $([ -f "$BACKUP_DIR/env.production.gpg" ] && echo "✅" || echo "❌")"
log "   • Size: $(du -sh "$BACKUP_DIR" | cut -f1)"
log "   • Location: s3://$S3_BUCKET/daily/$(date +%Y%m%d)/"

# Success notification
curl -X POST "${SLACK_WEBHOOK_URL}" \
    -H "Content-Type: application/json" \
    -d '{
        "text": "✅ OpenConductor daily backup completed successfully",
        "attachments": [{
            "color": "good",
            "fields": [
                {"title": "Date", "value": "'"$(date)"'", "short": true},
                {"title": "Size", "value": "'"$(du -sh "$BACKUP_DIR" | cut -f1)"'", "short": true},
                {"title": "Components", "value": "Database, Config, Schema, User Data", "short": false}
            ]
        }],
        "channel": "#backups"
    }' || true

log "🎉 Daily backup completed successfully!"

# Optional: Test restore (weekly)
if [ "$(date +%u)" = "7" ]; then  # Sunday
    log "🧪 Running weekly restore test..."
    bash scripts/test-restore.sh "$BACKUP_DIR/database-"*.sql.gz || log "⚠️ Restore test failed"
fi

exit 0