# OpenConductor Backup & Disaster Recovery Strategy

## Overview
Comprehensive backup and disaster recovery procedures for OpenConductor production environment, ensuring 99.9% uptime and zero data loss tolerance.

## Backup Architecture

### 1. Database Backups (Supabase PostgreSQL)

#### Automated Backups
```bash
# Daily automated backups (via Supabase)
- Full database backup: Daily at 2:00 AM UTC
- Point-in-time recovery: Available for last 7 days
- Cross-region replication: Enabled to US-West

# Custom backup script for critical data
#!/bin/bash
pg_dump $DATABASE_URL \
  --verbose \
  --clean \
  --no-acl \
  --no-owner \
  -f "openconductor-backup-$(date +%Y%m%d-%H%M%S).sql"
```

#### Backup Schedule
- **Full Backup**: Daily at 2:00 AM UTC
- **Incremental Backup**: Every 6 hours
- **Transaction Log Backup**: Every 15 minutes
- **Cross-region Backup**: Weekly to different region

#### Retention Policy
- **Daily backups**: Retained for 30 days
- **Weekly backups**: Retained for 12 weeks
- **Monthly backups**: Retained for 12 months
- **Yearly backups**: Retained for 7 years (compliance)

### 2. Application Code Backups

#### Git Repository Strategy
```bash
# Multi-repository backup strategy
Primary: GitHub (openconductor/openconductor)
Mirror 1: GitLab (automated sync)
Mirror 2: Bitbucket (automated sync)
Local: Automated local clones on secure servers
```

#### Code Backup Schedule
- **Real-time**: Git commits trigger automatic mirroring
- **Daily**: Full repository clone to secure storage
- **Weekly**: Tagged releases archived separately

### 3. Configuration & Secrets Backup

#### Environment Variables
```bash
# Encrypted backup of production configurations
# Stored in multiple secure locations:

# 1. HashiCorp Vault (primary)
vault kv put secret/openconductor/prod @.env.production

# 2. AWS Secrets Manager (backup)
aws secretsmanager create-secret \
  --name "openconductor/production" \
  --secret-string file://.env.production

# 3. Encrypted local backup
gpg --symmetric --cipher-algo AES256 .env.production
```

#### SSL Certificates
- **Automated**: Vercel and Railway handle certificate renewal
- **Backup**: Certificate metadata stored in secure vault
- **Monitoring**: Certificate expiration alerts set up

### 4. User Data & Analytics Backup

#### User Data Protection
```sql
-- Daily user data backup
COPY (
  SELECT * FROM public.users 
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
) TO 'users_backup_daily.csv' WITH CSV HEADER;

-- Workflow data backup
COPY (
  SELECT * FROM public.workflows 
  WHERE updated_at >= CURRENT_DATE - INTERVAL '1 day'
) TO 'workflows_backup_daily.csv' WITH CSV HEADER;
```

#### Analytics Data Retention
- **Raw events**: 90 days in hot storage, 2 years in cold storage
- **Aggregated data**: 5 years retention
- **Financial data**: 7 years retention (compliance)

## Disaster Recovery Procedures

### 1. Recovery Time Objectives (RTO)

| Component | RTO Target | Recovery Method |
|-----------|------------|-----------------|
| Frontend (Vercel) | 5 minutes | Automatic failover |
| Backend API (Railway) | 15 minutes | Container restart/redeploy |
| Database (Supabase) | 30 minutes | Point-in-time recovery |
| WebSocket services | 10 minutes | Auto-scaling recovery |
| Full system | 60 minutes | Complete infrastructure rebuild |

### 2. Recovery Point Objectives (RPO)

| Data Type | RPO Target | Backup Frequency |
|-----------|------------|------------------|
| User data | 15 minutes | Real-time replication |
| Workflow definitions | 15 minutes | Real-time replication |
| System configuration | 1 hour | Hourly backups |
| Analytics data | 4 hours | Periodic aggregation |
| Financial transactions | 0 minutes | Synchronous replication |

### 3. Failover Procedures

#### Automatic Failover
```yaml
# Vercel Frontend - Automatic
- Global CDN with automatic failover
- Edge function redundancy
- Automatic traffic routing

# Railway Backend - Semi-automatic  
- Health check failures trigger restart
- Auto-scaling based on load
- Manual intervention for critical failures

# Supabase Database - Automatic
- Multi-AZ deployment with automatic failover
- Read replicas for disaster recovery
- Point-in-time recovery capabilities
```

#### Manual Failover Steps
1. **Detect Issue**: Monitoring alerts trigger investigation
2. **Assess Impact**: Determine scope and affected services
3. **Execute Failover**: Switch to backup systems
4. **Verify Recovery**: Run health checks and smoke tests
5. **Monitor**: Ensure stable operation
6. **Post-mortem**: Document incident and improve procedures

### 4. Data Recovery Procedures

#### Database Recovery
```bash
# Point-in-time recovery
supabase db recover --ref [project-ref] --timestamp "2025-01-15 10:30:00"

# Full database restore from backup
pg_restore --verbose --clean --no-acl --no-owner \
  -h [db-host] -U [username] -d [database] \
  openconductor-backup-20250115.sql
```

#### Application Recovery
```bash
# Redeploy from backup
git clone https://github.com/openconductor/openconductor.git
cd openconductor

# Deploy backend
railway deploy --environment production

# Deploy frontend  
cd frontend && vercel --prod
```

## Backup Scripts

### 1. Daily Backup Script
```bash
#!/bin/bash
# openconductor/scripts/daily-backup.sh

set -e

LOG_FILE="/var/log/openconductor-backup.log"
BACKUP_DIR="/backup/openconductor/$(date +%Y/%m/%d)"
S3_BUCKET="openconductor-backups"

echo "$(date): Starting daily backup..." >> $LOG_FILE

# Create backup directory
mkdir -p $BACKUP_DIR

# 1. Database backup
echo "$(date): Backing up database..." >> $LOG_FILE
pg_dump $DATABASE_URL > $BACKUP_DIR/database-$(date +%H%M%S).sql

# 2. Configuration backup
echo "$(date): Backing up configuration..." >> $LOG_FILE
cp .env.production $BACKUP_DIR/
cp -r database/ $BACKUP_DIR/

# 3. Application state backup
echo "$(date): Backing up application state..." >> $LOG_FILE
railway env --json > $BACKUP_DIR/railway-env.json
vercel env ls --json > $BACKUP_DIR/vercel-env.json

# 4. Upload to S3
echo "$(date): Uploading to S3..." >> $LOG_FILE
aws s3 sync $BACKUP_DIR s3://$S3_BUCKET/daily/$(date +%Y%m%d)/

# 5. Cleanup old local backups (keep 7 days)
find /backup/openconductor -type d -mtime +7 -exec rm -rf {} \;

echo "$(date): Daily backup completed successfully" >> $LOG_FILE
```

### 2. Disaster Recovery Script
```bash
#!/bin/bash
# openconductor/scripts/disaster-recovery.sh

set -e

RECOVERY_TYPE=$1 # full, database, application
BACKUP_DATE=$2   # YYYYMMDD
S3_BUCKET="openconductor-backups"

if [ -z "$RECOVERY_TYPE" ] || [ -z "$BACKUP_DATE" ]; then
  echo "Usage: $0 <full|database|application> <YYYYMMDD>"
  exit 1
fi

echo "🚨 Starting disaster recovery: $RECOVERY_TYPE for $BACKUP_DATE"

case $RECOVERY_TYPE in
  "full")
    echo "🔄 Full system recovery..."
    
    # 1. Download backups
    aws s3 sync s3://$S3_BUCKET/daily/$BACKUP_DATE/ ./recovery/
    
    # 2. Restore database
    pg_restore --clean --no-acl --no-owner \
      -h [db-host] -U [username] -d [database] \
      recovery/database-*.sql
    
    # 3. Redeploy applications
    railway deploy --environment production
    cd frontend && vercel --prod
    
    echo "✅ Full recovery completed"
    ;;
    
  "database")
    echo "🔄 Database recovery..."
    aws s3 cp s3://$S3_BUCKET/daily/$BACKUP_DATE/database-*.sql ./
    pg_restore --clean --no-acl --no-owner ./database-*.sql
    echo "✅ Database recovery completed"
    ;;
    
  "application")
    echo "🔄 Application recovery..."
    railway deploy --environment production
    cd frontend && vercel --prod
    echo "✅ Application recovery completed"
    ;;
    
  *)
    echo "❌ Invalid recovery type: $RECOVERY_TYPE"
    exit 1
    ;;
esac

echo "🎉 Disaster recovery completed successfully"
```

## Monitoring & Alerting

### 1. Backup Monitoring
```bash
# Monitor backup success/failure
#!/bin/bash

# Check last backup timestamp
LAST_BACKUP=$(aws s3 ls s3://openconductor-backups/daily/ --recursive | tail -1 | awk '{print $1, $2}')
LAST_BACKUP_EPOCH=$(date -d "$LAST_BACKUP" +%s)
CURRENT_EPOCH=$(date +%s)
HOURS_AGO=$(( (CURRENT_EPOCH - LAST_BACKUP_EPOCH) / 3600 ))

if [ $HOURS_AGO -gt 25 ]; then
  echo "🚨 ALERT: Last backup was $HOURS_AGO hours ago"
  # Send alert to monitoring system
  curl -X POST $SLACK_WEBHOOK_URL -d '{
    "text": "🚨 OpenConductor backup failure: Last backup was '$HOURS_AGO' hours ago",
    "channel": "#alerts"
  }'
fi
```

### 2. Recovery Testing
```bash
# Monthly disaster recovery testing
#!/bin/bash

echo "🧪 Starting monthly DR test..."

# 1. Create test environment
railway create openconductor-dr-test

# 2. Restore from backup to test environment
pg_restore --verbose --clean \
  -h [test-db-host] -U [username] -d [test-database] \
  latest-backup.sql

# 3. Deploy application to test environment
railway deploy --environment dr-test

# 4. Run smoke tests
node tests/e2e/production-tests.js

# 5. Cleanup test environment
railway delete openconductor-dr-test --confirm

echo "✅ DR test completed"
```

## Security & Compliance

### 1. Backup Encryption
- **At Rest**: AES-256 encryption for all stored backups
- **In Transit**: TLS 1.3 for all backup transfers
- **Key Management**: AWS KMS or HashiCorp Vault

### 2. Access Control
- **Backup Access**: Limited to DevOps team members
- **Recovery Operations**: Require dual approval
- **Audit Logging**: All backup/recovery operations logged

### 3. Compliance Requirements
- **GDPR**: User data backup with right to deletion
- **SOX**: Financial data 7-year retention
- **HIPAA**: If handling health data (future)

## Cost Optimization

### 1. Storage Tiers
```bash
# Lifecycle policies for cost optimization
aws s3api put-bucket-lifecycle-configuration \
  --bucket openconductor-backups \
  --lifecycle-configuration '{
    "Rules": [{
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 365,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ]
    }]
  }'
```

### 2. Backup Size Optimization
- **Compression**: gzip compression for SQL dumps
- **Incremental**: Only backup changed data
- **Deduplication**: Remove duplicate files

## Emergency Contacts & Procedures

### 1. Incident Response Team
- **Primary**: DevOps Lead (+1-555-0101)
- **Secondary**: CTO (+1-555-0102)  
- **Database Expert**: DBA (+1-555-0103)
- **Security Officer**: CISO (+1-555-0104)

### 2. Escalation Procedures
1. **Level 1** (0-15 min): DevOps team assessment
2. **Level 2** (15-30 min): Management notification
3. **Level 3** (30+ min): Executive team involvement
4. **Level 4** (1+ hour): External vendor engagement

### 3. Communication Plan
- **Internal**: Slack #incidents channel
- **External**: Status page updates
- **Customers**: Email notifications for major incidents
- **Stakeholders**: Executive briefings for critical issues

## Testing & Validation

### 1. Recovery Testing Schedule
- **Daily**: Automated backup verification
- **Weekly**: Point-in-time recovery test
- **Monthly**: Full disaster recovery simulation
- **Quarterly**: Cross-region failover test

### 2. Success Criteria
- **Database Recovery**: < 30 minutes to restore
- **Application Recovery**: < 15 minutes to redeploy  
- **Data Integrity**: 100% data consistency validation
- **Performance**: Within 5% of pre-incident performance

## Backup Verification Checklist

- [ ] Database backup completed successfully
- [ ] Backup file integrity verified (checksums)
- [ ] Backup uploaded to multiple storage locations
- [ ] Point-in-time recovery tested
- [ ] Application configuration backed up
- [ ] SSL certificates backed up
- [ ] Monitoring dashboards backed up
- [ ] Documentation updated
- [ ] Team notified of backup status
- [ ] Recovery procedures tested

## Annual Disaster Recovery Audit

### Audit Checklist
- [ ] Review and update RTO/RPO objectives
- [ ] Test all recovery procedures
- [ ] Validate backup retention policies
- [ ] Update emergency contact information
- [ ] Review and update documentation
- [ ] Conduct tabletop exercises
- [ ] Update incident response procedures
- [ ] Review compliance requirements
- [ ] Optimize backup costs
- [ ] Update security procedures

---

**Last Updated**: January 2025  
**Next Review**: July 2025  
**Owner**: DevOps Team  
**Approval**: CTO