const { createHash, randomBytes } = require('crypto');
const { Pool } = require('pg');

async function createAdminKey() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
  });

  try {
    // Generate a secure API key
    const apiKey = 'oc_admin_' + randomBytes(32).toString('hex');
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    
    // Admin permissions - full access
    const permissions = {
      "servers": {
        "read": true,
        "write": true,
        "delete": true,
        "verify": true
      },
      "marketing": {
        "read": true,
        "write": true,
        "publish": true
      },
      "analytics": {
        "read": true,
        "export": true
      },
      "admin": {
        "full_access": true
      }
    };

    // Insert admin API key
    const result = await pool.query(`
      INSERT INTO api_keys (
        key_hash, 
        name, 
        permissions, 
        rate_limit_per_hour,
        active,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name
    `, [
      keyHash,
      'Admin Master Key',
      JSON.stringify(permissions),
      10000, // High rate limit for admin
      true,
      null // No expiration
    ]);

    console.log('✅ Admin API Key Created Successfully!');
    console.log('━'.repeat(50));
    console.log(`API Key: ${apiKey}`);
    console.log(`Key ID: ${result.rows[0].id}`);
    console.log('━'.repeat(50));
    console.log('');
    console.log('🔒 IMPORTANT: Save this key securely!');
    console.log('This is the only time you will see the full key.');
    console.log('');
    console.log('To use in admin requests:');
    console.log(`Authorization: Bearer ${apiKey}`);
    console.log('');
    console.log('Admin Dashboard: http://localhost:3002/admin');
    
  } catch (error) {
    console.error('❌ Error creating admin key:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the function
createAdminKey().then(() => {
  console.log('✅ Admin setup complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Admin setup failed:', error);
  process.exit(1);
});