var DB = require('../dao/db');

class PersonController {
  constructor() {
  }

  async list(req, res, data) {
    let db = new DB();
    let where = 'where "user_id" = :user_id';
    let params = { user_id: req.session.user.id };
    if (data.keyword) {
      where += ' and ("name" like :keyword or "company" like :keyword or "phone" like :keyword or "remark" like :keyword)';
      params.keyword = '%' + data.keyword + '%';
    }
    let result = await db.findByPage({
      fields: [],
      table: 'person',
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
    let item = Object.assign({ user_id: req.session.user.id }, data);
    await db.insert('person', item);
    item = await db.findById('person', item.id);
    res.send({
      code: 0,
      data: item
    });
  }

  async edit(req, res, data) {
    let db = new DB();
    let item = Object.assign({ updated_at: new Date().format('yyyy-MM-dd HH:mm:ss') }, data);
    await db.update('person', item);
    res.send({ code: 0 });
  }

  async remove(req, res, data) {
    let db = new DB();
    await db.delete('person', data.id);
    res.send({ code: 0 });
  }
}

module.exports = new PersonController();