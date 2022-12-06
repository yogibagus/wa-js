const express = require('express');
const app = express();
const port = 3000;

app.get('/qr', (req, res) => {
  
});

app.listen(port, () => {
  console.log(`cli-nodejs-api listening at http://localhost:${port}`)
});