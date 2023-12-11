var DB = require('../dao/db');

class ConfigController {
  constructor() {
    this.rules = {
      load: {},
      save: {}
    };
  }

  async load(req, res, data) {
    let db = new DB();
    let rows = await db.find('select * from [config]');
    let kvs = {};
    for (let i = 0; i < rows.length; i++) {
      kvs[rows[i].name] = rows[i].value;
    }
    res.send({
      code: 0,
      data: kvs
    });
  }

  async save(req, res, data) {
    let db = new DB();
    for (let i = 0; i < data.names.length; i++) {
      await db.executeUpdate('update [config] set [value] = :value where [name] = :name', {
        name: data.names[i],
        value: data.values[i]
      });
    }
    res.send({ code: 0 });
  }
}

module.exports = new ConfigController();