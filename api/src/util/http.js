var axios = require('axios').default;
var https = require('https');

const worker = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0'
  },
  maxRedirects: 0,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

module.exports = worker;