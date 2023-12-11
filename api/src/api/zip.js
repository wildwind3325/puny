var fs = require('fs');
var yauzl = require('yauzl');
var file = require('./file');

var zf = null;
var tree = {};
var entries = {};

var zip = {
  loadUgoira(name) {
    return new Promise((resolve, reject) => {
      try {
        let images = [], delays = [], indexs = {};
        let frames = fs.readFileSync(name, { encoding: 'utf-8' }).split('\r\n');
        for (let i = 0; i < frames.length; i++) {
          if (!frames[i]) continue;
          let kv = frames[i].split(',');
          indexs[kv[0]] = i;
          delays.push(parseInt(kv[1]));
        }
        yauzl.open(name.replace('.frames', '.zip'), {
          lazyEntries: true,
          autoClose: false
        }, function (err, zipfile) {
          if (err) reject(err);
          zipfile.once('end', function () {
            zipfile.close();
            resolve({
              images: images,
              delays: delays
            });
          });
          zipfile.readEntry();
          zipfile.on('entry', function (entry) {
            zipfile.openReadStream(entry, function (err, stream) {
              if (err) reject(err);
              let buffer = [];
              stream.on('data', data => buffer.push(data));
              stream.on('end', function () {
                images[indexs[entry.fileName]] = 'data:' + file.getImageMime(entry.fileName) + ';base64,' + Buffer.concat(buffer).toString('base64');
                zipfile.readEntry();
              });
              stream.on('error', function () {
                images[indexs[entry.fileName]] = null;
                zipfile.readEntry();
              });
            });
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  open(name) {
    return new Promise((resolve, reject) => {
      try {
        yauzl.open(name, {
          lazyEntries: true,
          autoClose: false
        }, function (err, zipfile) {
          if (err) reject(err);
          zf = zipfile;
          tree = {};
          entries = {};
          zipfile.once('end', function () {
            for (let key in tree) {
              tree[key].folders.sort();
              tree[key].files.sort((f1, f2) => {
                return f1.name.localeCompare(f2.name);
              });
            }
            resolve();
          });
          zipfile.readEntry();
          zipfile.on('entry', function (entry) {
            if (/\/$/.test(entry.fileName)) {
              if (!tree[entry.fileName]) tree[entry.fileName] = { folders: [], files: [] };
              let p = entry.fileName.substr(0, entry.fileName.length - 1).lastIndexOf('/');
              let parent = '/';
              if (p >= 0) parent = entry.fileName.substr(0, p + 1);
              if (!tree[parent]) tree[parent] = { folders: [], files: [] };
              tree[parent].folders.push(entry.fileName.substr(p + 1, entry.fileName.length - p - 2));
            } else {
              let p = entry.fileName.lastIndexOf('/');
              let parent = '/';
              if (p >= 0) parent = entry.fileName.substr(0, p + 1);
              if (!tree[parent]) tree[parent] = { folders: [], files: [] };
              tree[parent].files.push({
                name: entry.fileName.substr(p + 1, entry.fileName.length - p - 1),
                size: entry.uncompressedSize,
                fsize: file.getSizeString(entry.uncompressedSize),
                ctime: entry.getLastModDate().format('yyyy-MM-dd HH:mm:ss')
              });
              entries[entry.fileName] = entry;
            }
            zipfile.readEntry();
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  list(route) {
    let parent = '';
    if (route.length === 0) {
      parent = '/';
    } else {
      for (let i = 0; i < route.length; i++) {
        parent += route[i] + '/';
      }
    }
    return {
      success: true,
      folders: tree[parent].folders,
      files: tree[parent].files
    };
  },
  load(entryName) {
    return new Promise((resolve, reject) => {
      try {
        let entry = entries[entryName];
        zf.openReadStream(entry, function (err, stream) {
          if (err) reject(err);
          let buffer = [];
          stream.on('data', data => buffer.push(data));
          stream.on('end', function () {
            resolve(Buffer.concat(buffer));
          });
          stream.on('error', function () {
            reject(new Error('Read stream error.'));
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  close() {
    try {
      if (zf) {
        zf.close();
        zf = null;
      }
    } catch (err) { }
    tree = {};
    entries = {};
  }
};

module.exports = zip;