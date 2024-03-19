var DB = require('../dao/db');

class LoginController {
  constructor() {
    this.rules = {};
  }

  async forum_list(req, res, data) {
    let db = new DB();
    let list = await db.find('select * from "forum" where "user_id" = :user_id', { user_id: req.session.user.id });
    res.send({
      code: 0,
      data: list
    });
  }

  async forum_add(req, res, data) {
    let db = new DB();
    let forum = await db.findOne('select * from "forum" where "user_id" = :user_id and "name" = :name', {
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
      name: data.name
    };
    await db.insert('forum', item);
    res.send({
      code: 0,
      data: item
    });
  }

  async forum_edit(req, res, data) {
    let db = new DB();
    let forum = await db.findOne('select * from "forum" where "user_id" = :user_id and "id" <> :id and "name" = :name', {
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
    await db.update('forum', {
      id: data.id,
      name: data.name,
      updated_at: new Date().format('yyyy-MM-dd HH:mm:ss')
    });
    res.send({ code: 0 });
  }

  async forum_remove(req, res, data) {
    let db = new DB();
    let count = await db.findOne('select count(*) total from "post" where "forum_id" = :forum_id', { forum_id: data.id });
    if (count.total > 0) {
      res.send({
        code: 1,
        msg: '该版面不为空'
      });
      return;
    }
    await db.delete('forum', data.id);
    res.send({ code: 0 });
  }
}

module.exports = new LoginController();