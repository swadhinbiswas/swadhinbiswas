const https = require('https');

async function updateSecret() {
  const payload = JSON.stringify({
    settings: { github_update_secret: process.env.CRON_SECRET }
  });

  const options = {
    hostname: new URL(process.env.PUBLIC_SITE_URL).hostname,
    port: 443,
    path: '/api/admin/settings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length,
      'Authorization': `Bearer ${process.env.ADMIN_SECRET || process.env.CRON_SECRET}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ CRON_SECRET synced');
          resolve();
        } else {
          console.warn('⚠️  Sync returned:', res.statusCode);
          resolve();
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

updateSecret().catch(e => console.error('Sync attempt:', e.message));
