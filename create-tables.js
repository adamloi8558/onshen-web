// Simple script to create tables using Next.js server environment
const { spawn } = require('child_process');

// Create a simple HTTP request to trigger table creation
const http = require('http');
const https = require('https');

const url = 'http://localhost:3000/api/create-tables';

console.log('Triggering table creation via API...');

const req = http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});