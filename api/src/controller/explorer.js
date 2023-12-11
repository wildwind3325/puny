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
      media: {},
      zip_open: {},
      zip_close: {},
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
}

module.exports = new ExplorerController();