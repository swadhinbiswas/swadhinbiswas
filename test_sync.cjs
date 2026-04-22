const https = require('https');
const payload = JSON.stringify({
  settings: { github_update_secret: process.env.CRON_SECRET || 'test_secret' }
});

const options = {
  hostname: 'swadhin.cv',
  port: 443,
  path: '/api/admin/settings',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response body:', data);
  });
});
req.on('error', (e) => console.error(e));
req.write(payload);
req.end();
