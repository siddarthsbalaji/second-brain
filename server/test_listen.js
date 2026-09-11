const express = require('express');
const app = express();
const net = require('net');

const server1 = net.createServer();
server1.listen(5001, () => {
  console.log('Server 1 listening on 5001');
  
  const server2 = app.listen(5001, () => {
    console.log('Server 2 listening on 5001 - THIS SHOULD NOT PRINT');
  });
  
  server2.on('error', (err) => {
    console.log('Server 2 error:', err.message);
    process.exit(0);
  });
});
