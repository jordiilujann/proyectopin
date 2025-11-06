const http = require('http');

// Test if proxy is working by making a request to the frontend
const options = {
  hostname: 'localhost',
  port: 4201,
  path: '/api/spotify/tracks?q=limbo',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers['content-type']);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data.substring(0, 200) + '...');
    try {
      const jsonData = JSON.parse(data);
      console.log('JSON parsed successfully');
    } catch (e) {
      console.log('Not valid JSON - might be HTML');
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();