var request = require('request');

const worker = request.defaults({
  rejectUnauthorized: false,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/78.0'
  }
});

var http = {
  request(options) {
    return new Promise((resolve, reject) => {
      worker(options, (error, response, body) => {
        resolve({
          error: error,
          response: response,
          body: body
        });
      });
    });
  }
};

module.exports = http;