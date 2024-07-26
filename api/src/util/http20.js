var http = require('http');
var http2 = require('http2');
var tls = require('tls');

class HTTP20 {
  constructor() {
    this.ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0';
  }

  parseUrl(url) {
    let p1 = url.indexOf('//') + 2;
    let p2 = url.indexOf('/', p1);
    let server = p2 < 0 ? url : url.substring(0, p2);
    let pathname = p2 < 0 ? '/' : url.substring(p2);
    let ep = p2 < 0 ? url.substring(p1) : url.substring(p1, p2);
    let p3 = ep.lastIndexOf(':');
    if (p3 < 0) {
      let port = url.substring(0, url.indexOf(':')) === 'http' ? 80 : 443;
      return {
        server: server,
        pathname: pathname,
        host: ep,
        port: port
      };
    } else {
      return {
        server: server,
        pathname: pathname,
        host: ep.substring(0, p3),
        port: parseInt(ep.substring(p3 + 1))
      };
    }
  }

  http_head(url, headers, proxy_host, proxy_port) {
    let { server, pathname, host, port } = this.parseUrl(url);
    return new Promise((resolve, reject) => {
      let req = http.request({
        method: 'CONNECT',
        host: proxy_host,
        port: proxy_port,
        path: host + ':' + port
      });
      req.end();
      req.on('connect', (res, socket) => {
        let client = http2.connect(server, {
          createConnection: () => tls.connect({
            host: host,
            servername: host,
            port: port,
            socket: socket,
            ALPNProtocols: ['h2']
          })
        });
        client.on('error', err => reject(err));
        let options = {
          ':method': 'HEAD',
          ':path': pathname,
          'host': host,
          'user-agent': this.ua
        };
        Object.assign(options, headers || {});
        let request = client.request(options);
        request.on('response', (headers, flags) => {
          request.on('end', () => {
            client.close();
            resolve(headers);
          });
        });
        request.end();
      });
      req.on('error', err => reject(err));
    });
  }

  http_get(url, headers, proxy_host, proxy_port) {
    let { server, pathname, host, port } = this.parseUrl(url);
    return new Promise((resolve, reject) => {
      let req = http.request({
        method: 'CONNECT',
        host: proxy_host,
        port: proxy_port,
        path: host + ':' + port
      });
      req.end();
      req.on('connect', (res, socket) => {
        let client = http2.connect(server, {
          createConnection: () => tls.connect({
            host: host,
            servername: host,
            port: port,
            socket: socket,
            ALPNProtocols: ['h2']
          })
        });
        client.on('error', err => reject(err));
        let options = {
          ':method': 'GET',
          ':path': pathname,
          'host': host,
          'user-agent': this.ua
        };
        Object.assign(options, headers || {});
        let request = client.request(options);
        request.on('response', (headers, flags) => {
          let data = '';
          request.on('data', chunk => { data += chunk; });
          request.on('end', () => {
            client.close();
            resolve(data);
          });
        });
        request.end();
      });
      req.on('error', err => reject(err));
    });
  }

  http_post(url, headers, body, proxy_host, proxy_port) {
    let { server, pathname, host, port } = this.parseUrl(url);
    return new Promise((resolve, reject) => {
      let req = http.request({
        method: 'CONNECT',
        host: proxy_host,
        port: proxy_port,
        path: host + ':' + port
      });
      req.end();
      req.on('connect', (res, socket) => {
        let client = http2.connect(server, {
          createConnection: () => tls.connect({
            host: host,
            servername: host,
            port: port,
            socket: socket,
            ALPNProtocols: ['h2']
          })
        });
        client.on('error', err => reject(err));
        let options = {
          ':method': 'POST',
          ':path': pathname,
          'host': host,
          'user-agent': this.ua
        };
        Object.assign(options, headers || {});
        let request = client.request(options);
        request.on('response', (headers, flags) => {
          let data = '';
          request.on('data', chunk => { data += chunk; });
          request.on('end', () => {
            client.close();
            resolve({
              headers: headers,
              data: data
            });
          });
        });
        request.write(body);
        request.end();
      });
      req.on('error', err => reject(err));
    });
  }

  http_data(url, headers, proxy_host, proxy_port) {
    let { server, pathname, host, port } = this.parseUrl(url);
    return new Promise((resolve, reject) => {
      let req = http.request({
        method: 'CONNECT',
        host: proxy_host,
        port: proxy_port,
        path: host + ':' + port
      });
      req.end();
      req.on('connect', (res, socket) => {
        let client = http2.connect(server, {
          createConnection: () => tls.connect({
            host: host,
            servername: host,
            port: port,
            socket: socket,
            ALPNProtocols: ['h2']
          })
        });
        client.on('error', err => reject(err));
        let options = {
          ':method': 'GET',
          ':path': pathname,
          'host': host,
          'user-agent': this.ua
        };
        Object.assign(options, headers || {});
        let request = client.request(options);
        request.on('response', (headers, flags) => {
          let data = [];
          request.on('data', chunk => { data.push(chunk); });
          request.on('end', () => {
            client.close();
            resolve(Buffer.concat(data));
          });
        });
        request.end();
      });
      req.on('error', err => reject(err));
    });
  }
}

module.exports = new HTTP20();