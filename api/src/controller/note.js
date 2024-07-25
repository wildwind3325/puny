var DB = require('../dao/db');

class LoginController {
  constructor() {
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

  async forum_info(req, res, data) {
    let db = new DB();
    let forum = await db.findOne('select * from "forum" where "user_id" = :user_id and "id" = :forum_id', {
      user_id: req.session.user.id,
      forum_id: data.forum_id
    });
    if (!forum) {
      res.send({
        code: 1,
        msg: '该版面不存在'
      });
      return;
    }
    res.send({
      code: 0,
      data: forum.name
    });
  }

  async topic_list(req, res, data) {
    let db = new DB();
    let result = await db.findByPage({
      fields: [],
      table: 'post',
      where: 'where "forum_id" = :forum_id and "parent_id" = 0',
      params: { forum_id: data.forum_id },
      pageSize: data.pageSize,
      pageNumber: data.pageNumber,
      orderBy: 'order by "created_at" desc'
    });
    res.send({
      code: 0,
      data: result
    });
  }

  async post_list(req, res, data) {
    let db = new DB();
    let list = await db.find('select * from "post" where "id" = :post_id or "parent_id" = :post_id', { post_id: data.post_id });
    res.send({
      code: 0,
      data: list
    });
  }

  async post_add(req, res, data) {
    let db = new DB();
    let item = {
      forum_id: data.forum_id,
      parent_id: data.parent_id,
      title: data.title,
      content: data.content
    };
    await db.insert('post', item);
    item = await db.findById('post', item.id);
    res.send({
      code: 0,
      data: item
    });
  }

  async post_edit(req, res, data) {
    let db = new DB();
    await db.update('post', {
      id: data.id,
      title: data.title,
      content: data.content,
      updated_at: new Date().format('yyyy-MM-dd HH:mm:ss')
    });
    res.send({ code: 0 });
  }

  async post_remove(req, res, data) {
    let db = new DB();
    await db.executeUpdate('delete from "post" where "id" = :id or "parent_id" = :id', { id: data.id });
    res.send({ code: 0 });
  }
}

module.exports = new LoginController();