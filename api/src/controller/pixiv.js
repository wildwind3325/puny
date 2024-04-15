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
      let session_id = await baseService.getConfig(user_id, 'px_session');
      if (!session_id) throw new Error('Pixiv SessionID未设置');
      let proxy = await baseService.getConfig(user_id, 'proxy');
      pixivService.init(session_id, proxy);
      let zip_cg = parseInt(await baseService.getConfig(user_id, 'zip_cg'));
      if (isNaN(zip_cg) || zip_cg < 2) throw new Error('打包设置不正确');

      let page = 1;
      let cgs = [];
      while (true) {
        if (this.cancel) break;
        let url = 'https://www.pixiv.net/ajax/follow_latest/illust?mode=all&lang=zh&p=' + page;
        let result = JSON.parse(await pixivService.http_get(url, { 'Referrer': 'https://www.pixiv.net/bookmark_new_illust.php?p=' + page }));
        if (result.error === true) throw new Error(result.message);
        let list = result.body.thumbnails.illust;
        for (let i = 0; i < list.length; i++) {
          if (this.cancel) break;
          let id = parseInt(list[i].id);
          if (id < px_update) break;
          cgs.unshift({
            id: id,
            type: list[i].illustType,
            count: list[i].pageCount,
            user_id: list[i].userId,
            thumbnail: list[i].url
          });
        }
        if (parseInt(list[list.length - 1].id) < px_update) break;
        page++;
      }

      this.message = '0 / ' + cgs.length;
      for (let i = 0; i < cgs.length; i++) {
        if (this.cancel) break;
        let cg = cgs[i];
        let files = await this.download(dir, cg.id, i, cgs.length, zip_cg);
        let str = '';
        for (let j = 0; j < files.length; j++) {
          str += ',' + files[j];
        }
        if (this.cancel) break;
        let artist = await pixivService.getArtist(cg.id);
        if (artist) {
          fs.appendFileSync(dir + 'update.log', '1,' + cg.user_id + ',' + cg.id + str + '\r\n', { encoding: 'utf-8' });
          await db.update('artist', {
            id: artist.id,
            px_updated_to: cg.id,
            updated_at: new Date().format('yyyy-MM-dd HH:mm:ss')
          })
        } else {
          fs.appendFileSync(dir + 'update.log', '0,' + cg.user_id + ',' + cg.id + str + '\r\n', { encoding: 'utf-8' });
        }
        await baseService.setConfig(user_id, 'px_update', cg.id);
        this.message = (i + 1) + ' / ' + cgs.length;
        this.cancel = true;
      }
    } catch (err) {
      this.logger.error(err.message, err);
    } finally {
      this.cancel = false;
      this.busy = false;
    }
  }

  async download(dir, id, pointer, total, zip_cg) {
    let files = [];
    let content = await pixivService.http_get('https://www.pixiv.net/artworks/' + id);
    let page = cheerio.load(content);
    let meta = JSON.parse(page('meta#meta-preload-data').attr('content'));
    let illust = meta.illust[id + ''].userIllusts[id + ''];
    if (illust.illustType !== 2) {
      let count = illust.pageCount;
      if (count === 1) {
        let url = meta.illust[id + ''].urls.original;
        let filename = id + file.getExtension(url);
        if (!fs.existsSync(dir + filename)) {
          let buffer = await pixivService.http_data(url, { 'Referrer': 'https://www.pixiv.net/artworks/' + id });
          fs.writeFileSync(dir + filename, buffer);
        }
        files.push(filename);
      } else {
        if (!fs.existsSync(dir + id + '.zip')) {
          let data = JSON.parse(await pixivService.http_get('https://www.pixiv.net/ajax/illust/' + id + '/pages', { 'Referrer': 'https://www.pixiv.net/artworks/' + id }));
          let len = Math.max(2, ((count - 1) + '').length);
          for (let i = 0; i < count; i++) {
            if (this.cancel) break;
            let url = data.body[i].urls.original;
            let filename = id + '_' + (i + '').padStart(len, '0') + file.getExtension(url);
            if (!fs.existsSync(dir + filename)) {
              let buffer = await pixivService.http_data(url, { 'Referrer': 'https://www.pixiv.net/artworks/' + id });
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
            await archiver.compress(temp_dir + '*', dir + id + '.zip');
            fs.unlinkSync(temp_dir);
          }
        }
        if (count >= zip_cg) files = [dir + id + '.zip'];
      }
    } else {
      let data = JSON.parse(await pixivService.http_get('https://www.pixiv.net/ajax/illust/' + id + '/ugoira_meta', { 'Referrer': 'https://www.pixiv.net/artworks/' + id }));
      let url = data.body.originalSrc ? data.body.originalSrc : data.body.src;
    }
    return files;
  }
}

module.exports = new PixivController();