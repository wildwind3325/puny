var fs = require('fs');

var baseService = require('../service/base');
var DB = require('../dao/db');

class ArtistController {
  constructor() {
  }

  async list(req, res, data) {
    let db = new DB();
    let where = 'where "user_id" = :user_id';
    let params = { user_id: req.session.user.id };
    if (data.keyword) {
      where += ' and ("name" like :keyword or "px_id" like :keyword or "ib_id" like :keyword or "remark" like :keyword)';
      params.keyword = '%' + data.keyword + '%';
    }
    let result = await db.findByPage({
      fields: [],
      table: 'artist',
      where: where,
      params: params,
      pageSize: data.pageSize,
      pageNumber: data.pageNumber,
      orderBy: ''
    });
    res.send({
      code: 0,
      data: result
    });
  }

  async add(req, res, data) {
    let db = new DB();
    let artist = await db.findOne('select * from "artist" where "user_id" = :user_id and "name" = :name', {
      user_id: req.session.user.id,
      name: data.name
    });
    if (artist) {
      res.send({
        code: 1,
        msg: '该名称已经存在'
      });
      return;
    }
    let item = Object.assign({ user_id: req.session.user.id }, data);
    await db.insert('artist', item);
    item = await db.findById('artist', item.id);
    let base_dir = await baseService.getConfig(req.session.user.id, 'base_dir');
    let seperator = process.platform.startsWith('win') ? '\\' : '/';
    let artist_dir = base_dir + '0' + item.rating + seperator + item.name + seperator;
    fs.mkdirSync(artist_dir);
    if (item.px_id) {
      fs.mkdirSync(artist_dir + 'px_' + item.px_id + seperator);
    }
    if (item.ib_id) {
      fs.mkdirSync(artist_dir + 'ib_' + item.ib_id + seperator);
    }
    res.send({
      code: 0,
      data: item
    });
  }

  async edit(req, res, data) {
    let db = new DB();
    let artist = await db.findOne('select * from "artist" where "user_id" = :user_id and "id" <> :id and "name" = :name', {
      user_id: req.session.user.id,
      id: data.id,
      name: data.name
    });
    if (artist) {
      res.send({
        code: 1,
        msg: '该名称已经存在'
      });
      return;
    }
    artist = await db.findById('artist', data.id);
    if (artist.name !== data.name || artist.rating !== data.rating) {
      let base_dir = await baseService.getConfig(req.session.user.id, 'base_dir');
      let seperator = process.platform.startsWith('win') ? '\\' : '/';
      fs.renameSync(base_dir + '0' + artist.rating + seperator + artist.name, base_dir + '0' + data.rating + seperator + data.name);
    }
    let item = Object.assign({ updated_at: new Date().format('yyyy-MM-dd HH:mm:ss') }, data);
    await db.update('artist', item);
    res.send({ code: 0 });
  }

  async remove(req, res, data) {
    let db = new DB();
    await db.delete('artist', data.id);
    res.send({ code: 0 });
  }
}

module.exports = new ArtistController();