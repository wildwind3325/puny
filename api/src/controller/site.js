var DB = require('../dao/db');

class SiteController {
  constructor() {
  }

  async list(req, res, data) {
    let db = new DB();
    let where = 'where "user_id" = :user_id';
    let params = { user_id: req.session.user.id };
    if (data.keyword) {
      where += ' and ("name" like :keyword or "url" like :keyword or "remark" like :keyword)';
      params.keyword = '%' + data.keyword + '%';
    }
    let result = await db.findByPage({
      fields: [],
      table: 'site',
      where: where,
      params: params,
      pageSize: data.pageSize,
      pageNumber: data.pageNumber,
      orderBy: 'order by "count" desc'
    });
    for (let i = 0; i < result.rows.length; i++) {
      result.rows[i].show_account = false;
      let accounts = await db.find('select * from "site_account" where "site_id" = :site_id', { site_id: result.rows[i].id });
      accounts.push({
        id: 0,
        site_id: result.rows[i].id,
        account: '',
        password: '',
        question: '',
        answer: '',
        remark: ''
      });
      result.rows[i].accounts = accounts;
    }
    res.send({
      code: 0,
      data: result
    });
  }

  async add(req, res, data) {
    let db = new DB();
    let item = Object.assign({ user_id: req.session.user.id }, data);
    await db.insert('site', item);
    item = await db.findById('site', item.id);
    res.send({
      code: 0,
      data: item
    });
  }

  async edit(req, res, data) {
    let db = new DB();
    let item = Object.assign({ updated_at: new Date().format('yyyy-MM-dd HH:mm:ss') }, data);
    await db.update('site', item);
    res.send({ code: 0 });
  }

  async remove(req, res, data) {
    let db = new DB();
    await db.executeUpdate('delete from "site_account" where "site_id" = :id', { id: data.id });
    await db.delete('site', data.id);
    res.send({ code: 0 });
  }

  async account_list(req, res, data) {
    let db = new DB();
    let list = await db.find('select * from "site_account" where "site_id" = :site_id', { site_id: data.site_id });
    res.send({
      code: 0,
      data: list
    });
  }

  async account_add(req, res, data) {
    let db = new DB();
    let item = {
      site_id: data.site_id,
      account: data.account,
      password: data.password,
      question: data.question,
      answer: data.answer,
      remark: data.remark
    };
    await db.insert('site_account', item);
    item = await db.findById('site_account', item.id);
    res.send({
      code: 0,
      data: item
    });
  }

  async account_edit(req, res, data) {
    let db = new DB();
    await db.update('site_account', {
      id: data.id,
      account: data.account,
      password: data.password,
      question: data.question,
      answer: data.answer,
      remark: data.remark,
      updated_at: new Date().format('yyyy-MM-dd HH:mm:ss')
    });
    res.send({ code: 0 });
  }

  async account_remove(req, res, data) {
    let db = new DB();
    await db.executeUpdate('delete from "site_account" where "id" = :id', { id: data.id });
    res.send({ code: 0 });
  }

  async visit(req, res, data) {
    let db = new DB();
    let site = await db.findById('site', data.id);
    await db.update('site', {
      id: data.id,
      count: site.count + 1
    });
    res.redirect(site.url);
  }
}

module.exports = new SiteController();