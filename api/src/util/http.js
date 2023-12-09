var axios = require('axios').default;
var https = require('https');

const worker = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
  },
  timeout: 10000,
  maxRedirects: 0,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

var http = {
  request(options) {
    return new Promise((resolve, reject) => {
      worker(options).then(function (response) {
        resolve(response);
      }).catch(function (error) {
        reject(error);
      });
    });
  }
};

module.exports = http;