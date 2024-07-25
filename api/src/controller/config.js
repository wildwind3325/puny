var DB = require('../dao/db');

class ConfigController {
  constructor() {
  }

  async list(req, res, data) {
    let db = new DB();
    let list = await db.find('select * from "config" where "user_id" = :user_id', { user_id: req.session.user.id });
    res.send({
      code: 0,
      data: list
    });
  }

  async add(req, res, data) {
    let db = new DB();
    let forum = await db.findOne('select * from "config" where "user_id" = :user_id and "name" = :name', {
      user_id: req.session.user.id,
      name: data.name
    });
    if (forum) {
      res.send({
        code: 1,
        msg: '该名称已经存在'
      });
      return;
    }
    let item = {
      user_id: req.session.user.id,
      name: data.name,
      value: data.value
    };
    await db.insert('config', item);
    res.send({
      code: 0,
      data: item
    });
  }

  async edit(req, res, data) {
    let db = new DB();
    let forum = await db.findOne('select * from "config" where "user_id" = :user_id and "id" <> :id and "name" = :name', {
      user_id: req.session.user.id,
      id: data.id,
      name: data.name
    });
    if (forum) {
      res.send({
        code: 1,
        msg: '该名称已经存在'
      });
      return;
    }
    await db.update('config', {
      id: data.id,
      name: data.name,
      value: data.value,
      updated_at: new Date().format('yyyy-MM-dd HH:mm:ss')
    });
    res.send({ code: 0 });
  }

  async remove(req, res, data) {
    let db = new DB();
    await db.delete('config', data.id);
    res.send({ code: 0 });
  }
}

module.exports = new ConfigController();