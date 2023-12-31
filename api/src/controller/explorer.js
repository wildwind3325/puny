var cp = require('child_process');
var fs = require('fs');

var omggif = require('../api/omggif');
var file = require('../api/file');
var zip = require('../api/zip');

class ExplorerController {
  constructor() {
    this.rules = {
      init: {},
      refresh: {},
      image: {},
      zip_open: {},
      zip_close: {},
      play: {},
      exec: {}
    };
    this.seperator = process.platform.startsWith('win') ? '\\' : '/';
  }

  init(req, res, data) {
    res.send({
      code: 0,
      data: this.seperator
    });
  }

  refresh(req, res, data) {
    if (data.zipFile) {
      res.send(zip.list(data.zipRoute));
      return;
    }
    let folders = [];
    let files = [];
    if (process.platform.startsWith('win') && data.dirRoute.length === 1) {
      let stdout = cp.execSync('wmic logicaldisk get name').toString();
      folders = stdout.split('\r\r\n')
        .filter(value => /[A-Za-z]:/.test(value))
        .map(value => value.trim());
    } else {
      let dir = file.genPath(data.dirRoute);
      let list = fs.readdirSync(dir, { withFileTypes: true });
      for (let i = 0; i < list.length; i++) {
        if (list[i].isDirectory()) {
          if (list[i].name.toUpperCase() !== '$RECYCLE.BIN' && list[i].name !== 'System Volume Information') {
            folders.push(list[i].name);
          }
        } else {
          try {
            let stat = fs.statSync(dir + list[i].name);
            files.push({
              name: list[i].name,
              size: stat.size,
              fsize: file.getSizeString(stat.size),
              ctime: stat.ctime.format('yyyy-MM-dd HH:mm:ss')
            });
          } catch (err) { }
        }
      }
    }
    res.send({
      code: 0,
      data: {
        folders: folders,
        files: files
      }
    });
  }

  async image(req, res, data) {
    let ext = file.getExtension(data.file);
    if (ext === '.frames') {
      let ugoira = await zip.loadUgoira(file.genPath(data.dirRoute) + data.file);
      res.send({
        code: 0,
        data: ugoira
      });
      return;
    }
    let buffer;
    if (data.zipFile) {
      let route = '';
      for (let i = 0; i < data.zipRoute.length; i++) {
        route += data.zipRoute[i] + '/';
      }
      buffer = await zip.load(route + data.file);
    } else {
      buffer = fs.readFileSync(file.genPath(data.dirRoute) + data.file);
    }
    let header = '';
    for (let i = 0; i < 6; i++) {
      if (buffer.length <= i) break;
      header += String.fromCharCode(buffer[i]);
    }
    if (header === 'GIF89a') {
      let reader = new omggif.GifReader(buffer);
      if (reader.numFrames() > 1) {
        let images = [];
        for (let i = 0; i < reader.numFrames(); i++) {
          let info = reader.frameInfo(i);
          let data = new Uint8ClampedArray(info.width * info.height * 4);
          reader.decodeAndBlitFrameRGBA(i, data);
          images.push({
            data: Buffer.from(data).toString('base64'),
            delay: (info.delay * 10) || 50,
            width: info.width,
            height: info.height
          });
        }
        res.send({
          code: 0,
          data: {
            gif: true,
            images: images
          }
        });
        return;
      }
    }
    res.send({
      code: 0,
      data: {
        gif: false,
        image: 'data:' + file.getImageMime(data.file) + ';base64,' + Buffer.from(buffer).toString('base64')
      }
    });
  }

  async zip_open(req, res, data) {
    await zip.open(req.body.file);
    res.send({ code: 0 });
  }

  zip_close(req, res, data) {
    zip.close();
    res.send({ code: 0 });
  }

  play(req, res, data) {
    if (file.isMedia(data.file)) {
      res.sendFile(data.file);
    } else {
      res.status(403).end();
    }
  }

  exec(req, res, data) {
    cp.exec(data.file);
    res.send({ code: 0 });
  }
}

module.exports = new ExplorerController();