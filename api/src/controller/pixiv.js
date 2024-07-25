var cheerio = require('cheerio');
var fs = require('fs');
var log4js = require('log4js');

var archiver = require('../util/archiver');
var baseService = require('../service/base');
var DB = require('../dao/db');
var file = require('../api/file');
var pixivService = require('../service/pixiv');
var util = require('../util/util');

class PixivController {
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
        message: this.message
      }
    });
  }

  async update(req, res, data) {
    if (this.busy) {
      res.send({
        code: 1,
        msg: '当前有下载任务正在进行中'
      });
      return;
    }
    this.cancel = false;
    this.busy = true;
    this.message = '0 / 1';
    let user_id = req.session.user.id;
    res.send({ code: 0 });
    try {
      let db = new DB();
      let base_dir = await baseService.getConfig(user_id, 'base_dir');
      if (!base_dir) throw new Error('根路径未设置');
      let dir = base_dir + 'update' + this.seperator;
      let px_update = await baseService.getConfig(user_id, 'px_update');
      if (!px_update) throw new Error('更新进度未设置');
      px_update = parseInt(px_update);
      if (px_update < 0 || isNaN(px_update)) throw new Error('更新进度设置错误');
      let px_cookie = await baseService.getConfig(user_id, 'px_cookie');
      if (!px_cookie) throw new Error('Cookie未设置');
      let proxy = await baseService.getConfig(user_id, 'proxy');
      pixivService.init(px_cookie, proxy);
      let zip_cg = parseInt(await baseService.getConfig(user_id, 'zip_cg'));
      if (isNaN(zip_cg) || zip_cg < 2) throw new Error('打包设置不正确');

      let page = 1;
      let cgs = [];
      while (true) {
        if (this.cancel) break;
        let url = 'https://www.pixiv.net/ajax/follow_latest/illust?mode=all&lang=zh&p=' + page;
        let result = JSON.parse(await pixivService.http_get(url, { 'referer': 'https://www.pixiv.net/bookmark_new_illust.php?p=' + page }));
        if (result.error === true) throw new Error(result.message);
        let list = result.body.thumbnails.illust;
        for (let i = 0; i < list.length; i++) {
          if (this.cancel) break;
          let id = parseInt(list[i].id);
          if (id <= px_update) break;
          cgs.unshift({
            id: id,
            type: list[i].illustType,
            count: list[i].pageCount,
            pixiv_id: list[i].userId,
            thumbnail: list[i].url
          });
        }
        if (parseInt(list[list.length - 1].id) <= px_update || cgs.length >= 1000) break;
        page++;
      }

      this.message = '0 / ' + cgs.length;
      for (let i = 0; i < cgs.length; i++) {
        if (this.cancel) break;
        let cg = cgs[i];
        let files = await this.download(user_id, dir, cg.id, i, cgs.length, zip_cg);
        let str = '';
        for (let j = 0; j < files.length; j++) {
          str += ',' + files[j];
        }
        if (this.cancel) break;
        let artist = await pixivService.getArtist(user_id, cg.pixiv_id);
        if (artist) {
          fs.appendFileSync(dir + 'update.log', '1,' + cg.pixiv_id + ',' + cg.id + str + '\r\n', { encoding: 'utf-8' });
          await db.update('artist', {
            id: artist.id,
            px_updated_to: cg.id,
            updated_at: new Date().format('yyyy-MM-dd HH:mm:ss')
          })
        } else {
          fs.appendFileSync(dir + 'update.log', '0,' + cg.pixiv_id + ',' + cg.id + str + '\r\n', { encoding: 'utf-8' });
        }
        await baseService.setConfig(user_id, 'px_update', cg.id);
        this.message = (i + 1) + ' / ' + cgs.length;
      }
    } catch (err) {
      this.logger.error(err.message, err);
    } finally {
      this.cancel = false;
      this.busy = false;
    }
  }

  async apply(req, res, data) {
    if (this.busy) {
      res.send({
        code: 1,
        msg: '当前有下载任务正在进行中'
      });
      return;
    }
    try {
      let user_id = req.session.user.id;
      let base_dir = await baseService.getConfig(user_id, 'base_dir');
      if (!base_dir) throw new Error('根路径未设置');
      let dir = base_dir + 'update' + this.seperator;
      let file = dir + 'update.log';
      let lines = fs.readFileSync(file, { encoding: 'utf-8' }).split('\r\n');
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (!line) break;
        let arr = line.split(',');
        if (arr[0] === '0') continue;
        let pixiv_id = arr[1];
        let artist = await pixivService.getArtist(user_id, pixiv_id);
        if (!artist) continue;
        let download_dir = base_dir + artist.rating.toString().padStart(2, '0') + this.seperator + artist.name + this.seperator;
        if (fs.existsSync(download_dir + 'pixiv' + this.seperator)) download_dir += 'pixiv' + this.seperator;
        for (let j = 3; j < arr.length; j++) {
          if (!arr[j]) break;
          fs.renameSync(dir + arr[j], download_dir + arr[j]);
        }
      }
      res.send({ code: 0 });
    } catch (err) {
      res.send({
        code: 1,
        msg: err.message
      });
    }
  }

  async renew(req, res, data) {
    if (this.busy) {
      res.send({
        code: 1,
        msg: '当前有下载任务正在进行中'
      });
      return;
    }
    this.cancel = false;
    this.busy = true;
    let dir = data.dir;
    let user_id = req.session.user.id;
    res.send({ code: 0 });
    try {
      let base_dir = await baseService.getConfig(user_id, 'base_dir');
      if (!base_dir) throw new Error('根路径未设置');
      let px_cookie = await baseService.getConfig(user_id, 'px_cookie');
      if (!px_cookie) throw new Error('Cookie未设置');
      let proxy = await baseService.getConfig(user_id, 'proxy');
      pixivService.init(px_cookie, proxy);
      let zip_cg = parseInt(await baseService.getConfig(user_id, 'zip_cg'));
      if (isNaN(zip_cg) || zip_cg < 2) throw new Error('打包设置不正确');

      let artist = await pixivService.parseArtist(user_id, dir, this.seperator);
      let profile = JSON.parse(await pixivService.http_get('https://www.pixiv.net/ajax/user/' + artist.px_id + '/profile/all'));
      let cgs = [];
      let px_updated_to = parseInt(artist.px_updated_to);
      for (let key in profile.body.illusts) {
        let val = parseInt(key);
        if (val > px_updated_to) cgs.push(parseInt(key));
      }
      for (let key in profile.body.manga) {
        let val = parseInt(key);
        if (val > px_updated_to) cgs.push(parseInt(key));
      }
      let download_dir = base_dir + artist.rating.toString().padStart(2, '0') + this.seperator + artist.name + this.seperator;
      if (fs.existsSync(download_dir + 'pixiv' + this.seperator)) download_dir += 'pixiv' + this.seperator;
      this.message = '0 / ' + cgs.length;
      for (let i = 0; i < cgs.length; i++) {
        if (this.cancel) break;
        await this.download(user_id, download_dir, cgs[i], i, cgs.length, zip_cg);
        this.message = (i + 1) + ' / ' + cgs.length;
      }
    } catch (err) {
      this.logger.error(err.message, err);
    } finally {
      this.cancel = false;
      this.busy = false;
    }
  }

  async batch(req, res, data) {
    if (this.busy) {
      res.send({
        code: 1,
        msg: '当前有下载任务正在进行中'
      });
      return;
    }
    this.cancel = false;
    this.busy = true;
    let dir = data.dir;
    let cgs = data.cgs;
    let user_id = req.session.user.id;
    res.send({ code: 0 });
    try {
      let px_cookie = await baseService.getConfig(user_id, 'px_cookie');
      if (!px_cookie) throw new Error('Cookie未设置');
      let proxy = await baseService.getConfig(user_id, 'proxy');
      pixivService.init(px_cookie, proxy);
      let zip_cg = parseInt(await baseService.getConfig(user_id, 'zip_cg'));
      if (isNaN(zip_cg) || zip_cg < 2) throw new Error('打包设置不正确');

      this.message = '0 / ' + cgs.length;
      for (let i = 0; i < cgs.length; i++) {
        if (this.cancel) break;
        await this.download(user_id, dir, cgs[i], i, cgs.length, zip_cg);
        this.message = (i + 1) + ' / ' + cgs.length;
      }
    } catch (err) {
      this.logger.error(err.message, err);
    } finally {
      this.cancel = false;
      this.busy = false;
    }
  }

  async download(user_id, dir, id, pointer, total, zip_cg) {
    let files = [];
    let referer = 'https://www.pixiv.net/artworks/' + id;
    let content = await pixivService.http_get(referer);
    let page = cheerio.load(content);
    let meta = JSON.parse(page('meta#meta-preload-data').attr('content'));
    let illust = meta.illust[id + ''].userIllusts[id + ''];
    if (illust.illustType !== 2) {
      let count = illust.pageCount;
      if (count === 1) {
        let url = meta.illust[id + ''].urls.original;
        let filename = id + file.getExtension(url);
        if (!fs.existsSync(dir + filename)) {
          let buffer = await pixivService.http_data(url, { 'referer': referer });
          fs.writeFileSync(dir + filename, buffer);
        }
        files.push(filename);
      } else {
        if (!fs.existsSync(dir + id + '.zip')) {
          let data = JSON.parse(await pixivService.http_get('https://www.pixiv.net/ajax/illust/' + id + '/pages', { 'referer': referer }));
          let len = Math.max(2, ((count - 1) + '').length);
          for (let i = 0; i < count; i++) {
            if (this.cancel) break;
            let url = data.body[i].urls.original;
            let filename = id + '_' + (i + '').padStart(len, '0') + file.getExtension(url);
            if (!fs.existsSync(dir + filename)) {
              let buffer = await pixivService.http_data(url, { 'referer': referer });
              fs.writeFileSync(dir + filename, buffer);
            }
            files.push(filename);
            this.message = pointer + ' / ' + total + ' | ' + (i + 1) + ' / ' + count;
          }
          if (!this.cancel && count >= zip_cg) {
            let uid = util.uid();
            fs.mkdirSync(dir + uid);
            let temp_dir = dir + uid + this.seperator;
            for (let i = 0; i < files.length; i++) {
              fs.renameSync(dir + files[i], temp_dir + files[i].substring(files[i].indexOf('_') + 1));
            }
            await archiver.compress(user_id, temp_dir + '*', dir + id + '.zip');
            fs.rmdirSync(temp_dir);
          }
        }
        if (count >= zip_cg) files = [dir + id + '.zip'];
      }
    } else {
      let filename = id + '.zip';
      if (!fs.existsSync(dir + filename)) {
        let data = JSON.parse(await pixivService.http_get('https://www.pixiv.net/ajax/illust/' + id + '/ugoira_meta', { 'referer': referer }));
        let str = '';
        for (let i = 0; i < data.body.frames.length; i++) {
          str += data.body.frames[i].file + ',' + data.body.frames[i].delay + '\r\n';
          fs.writeFileSync(dir + id + '.frames', str, { encoding: 'utf-8' });
        }
        let url = data.body.originalSrc ? data.body.originalSrc : data.body.src;
        let headers = await pixivService.http_head(url, { 'referer': referer });
        let len = parseInt(headers['content-length']);
        let arr = [];
        let times = Math.floor(len / 300000);
        if (len % 300000 !== 0) times++;
        for (let i = 0; i < times; i++) {
          let start = i * 300000;
          let end = (i + 1) * 300000 - 1;
          if (end >= len) end = len - 1;
          let buffer = await pixivService.http_data(url, {
            'referer': referer,
            'range': 'bytes=' + start + '-' + end
          });
          arr.push(buffer);
        }
        fs.writeFileSync(dir + filename, Buffer.concat(arr));
      }
      files.push(id + '.frames', filename);
    }
    return files;
  }

  stop(req, res, data) {
    this.cancel = true;
    res.send({ code: 0 });
  }
}

module.exports = new PixivController();