var http = require('http');
var http2 = require('http2');
var tls = require('tls');

var DB = require('../dao/db');

class PixivService {
  constructor() {
    this.cookie = '';
    this.enable_proxy = true;
    this.proxy_host = '127.0.0.1';
    this.proxy_port = 10809;
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

  init(cookie, proxy) {
    this.cookie = cookie;
    if (proxy) {
      this.enable_proxy = true;
      let arr = proxy.split('//')[1].split(':');
      this.proxy_host = arr[0];
      this.proxy_port = parseInt(arr[1]);
    } else {
      this.enable_proxy = false;
      this.proxy_host = '127.0.0.1';
      this.proxy_port = 10809;
    }
  }

  http_head(url, headers) {
    let { server, pathname, host, port } = this.parseUrl(url);
    return new Promise((resolve, reject) => {
      let req = http.request({
        method: 'CONNECT',
        host: this.proxy_host,
        port: this.proxy_port,
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
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
          'cookie': this.cookie
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

  http_get(url, headers) {
    let { server, pathname, host, port } = this.parseUrl(url);
    return new Promise((resolve, reject) => {
      let req = http.request({
        method: 'CONNECT',
        host: this.proxy_host,
        port: this.proxy_port,
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
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
          'cookie': this.cookie
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

  http_data(url, headers) {
    let { server, pathname, host, port } = this.parseUrl(url);
    return new Promise((resolve, reject) => {
      let req = http.request({
        method: 'CONNECT',
        host: this.proxy_host,
        port: this.proxy_port,
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
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
          'cookie': this.cookie
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

  async getArtist(id) {
    let db = new DB();
    let artist = await db.findOne('select * from "artist" where "px_id" = :id', { id: id });
    return artist;
  }
}

module.exports = new PixivService();