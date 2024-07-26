var cheerio = require('cheerio');
var fs = require('fs');
var log4js = require('log4js');

var baseService = require('../service/base');
var http = require('../util/http');

class EHController {
  constructor() {
    this.logger = log4js.getLogger();
    this.seperator = process.platform.startsWith('win') ? '\\' : '/';
    this.cancel = false;
    this.busy = false;
    this.message = '0 / 0';
  }

  info(req, res, data) {
    res.send({
      code: 0,
      data: {
        busy: this.busy,
        msg: this.message
      }
    });
  }

  async download(req, res, data) {
    if (this.busy) {
      res.send({
        code: 1,
        msg: '当前有其他任务正在进行中'
      });
      return;
    }
    this.cancel = false;
    this.busy = true;
    let dir = data.dir;
    let indexing = data.indexing;
    let medium = data.medium;
    let user_id = req.session.user.id;
    res.send({ code: 0 });

    try {
      let eh_cookie = await baseService.getConfig(user_id, 'eh_cookie');
      if (!eh_cookie) throw new Error('Cookie未设置');
      let proxy = await baseService.getConfig(user_id, 'proxy');
      let list = [];
      let p = 0;
      this.message = '0 / 1';
      while (true) {
        let url = p === 0 ? data.gallery : data.gallery + '?p=' + p;
        let result = await http.request({
          method: 'GET',
          url: url,
          headers: { 'cookie': eh_cookie },
          proxy: proxy
        });
        let page = cheerio.load(result.body);
        page('div#gdt').find('a').each((i, elem) => {
          list.push(elem.attribs.href);
        });
        let pager = page('p.gpc').first().text().split(' ');
        if (pager[3] == pager[5]) {
          break;
        }
        p++;
      }
      let from = parseInt(data.from);
      if (isNaN(from) || from <= 0) from = 1;
      let to = parseInt(data.to);
      if (isNaN(to) || to > list.length) to = list.length;
      let count = to - from + 1;
      if (count < 0) count = 0;
      let mask = Math.max(list.length.toString().length, 2);
      this.message = '0 / ' + count;
      for (let i = 0; i < count; i++) {
        let result = await http.request({
          method: 'GET',
          url: list[from - 1 + i],
          headers: { 'cookie': eh_cookie },
          proxy: proxy
        });
        let page = cheerio.load(result.body);
        let image, filename, size;
        let elem = page('div#i6').children('div')[2];
        if (!elem || medium) {
          image = page('img#img').first().attr('src');
          let str = page('div#i4').children('div').first().text();
          filename = str.substring(0, str.indexOf(' '));
        } else {
          image = elem.lastChild.attribs['href'];
          filename = image.substring(image.lastIndexOf('/') + 1);
        }
        if (indexing) {
          filename = (from + i).toString().padStart(mask, '0') + '_' + filename;
        }
        result = await http.request({
          method: 'HEAD',
          url: image,
          headers: { 'cookie': eh_cookie },
          proxy: proxy
        });
        let headers = result.response.headers;
        size = parseInt(headers['content-length']);
        if (fs.existsSync(dir + filename)) {
          this.message = (i + 1) + ' / ' + count;
          continue;
        }
        result = await http.request({
          method: 'GET',
          url: image,
          headers: { 'cookie': eh_cookie },
          proxy: proxy,
          encoding: null
        });
        if (result.body.length !== size) throw new Error('下载文件尺寸错误');
        fs.writeFileSync(dir + filename, result.body);
        this.message = (i + 1) + ' / ' + count;
      }
    } catch (err) {
      this.logger.error(err.message, err);
    } finally {
      this.cancel = false;
      this.busy = false;
    }
  }
}

module.exports = new EHController();