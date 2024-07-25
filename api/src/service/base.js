var DB = require('../dao/db');

class BaseService {
  constructor() {
    this.safeModules = ['login'];
  }

  preProcess(req) {
    let data = Object.assign({}, req.query, req.body);
    let module = data._module;
    let action = data._action;
    if (!/^[a-zA-Z0-9\._]+$/.test(module) || !/^[a-zA-Z0-9_]+$/.test(action)) {
      return {
        code: 1,
        msg: '错误的请求'
      };
    }
    if (!req.session.user && this.safeModules.indexOf(module) < 0) {
      return {
        code: -1,
        msg: '尚未登录或登录已超时'
      };
    }
    module = module.replace(/\./g, '/');
    let controller, method;
    try {
      controller = require('../controller/' + module);
      method = controller[action];
    } catch (err) { console.log(err); }
    if (!method || !method instanceof Function) {
      return {
        code: 1,
        msg: '不存在的模块或方法'
      };
    }
    let rules = controller.rules;
    if (rules && rules[action]) {
      for (let key in rules[action]) {
        let rule = rules[action][key];
        if ((rule instanceof RegExp && !rule.test(data[key]))
          || (rule instanceof Function && !rule.call(controller, data[key]))) {
          return {
            code: 1,
            msg: '请求的参数不符合要求'
          };
        }
      }
    }
    delete data._module;
    delete data._action;
    return {
      code: 0,
      controller: controller,
      method: method,
      data: data
    };
  }

  async setConfig(user_id, name, value) {
    let db = new DB();
    await db.executeUpdate('update "config" set "value" = :value where "user_id" = :user_id and "name" = :name', {
      user_id: user_id,
      name: name,
      value: value
    });
  }

  async getConfig(user_id, name) {
    let db = new DB();
    let list = await db.find('select "value" from "config" where "user_id" = :user_id and "name" = :name', {
      user_id: user_id,
      name: name
    });
    if (list.length > 0) return list[0].value;
    return null;
  }
}

module.exports = new BaseService();