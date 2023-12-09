var DB = require('../dao/db');
var util = require('../util/util');
var securityService = require('./security');

class BaseService {
  constructor() {
    this.safeModules = ['login', 'data'];
  }

  preProcess(req, anonymous) {
    let data = Object.assign({}, req.query, req.body);
    let module = data._module;
    let action = data._action;
    if (!/^[a-zA-Z0-9\.]+$/.test(module) || !/^[a-zA-Z0-9]+$/.test(action)) {
      return {
        code: 1,
        msg: '错误的请求'
      };
    }
    if (anonymous !== true || this.safeModules.indexOf(module) < 0) {
      if (!req.auth) {
        return {
          code: -1,
          msg: '尚未登录或登录已超时'
        };
      }
      if (req.auth.is_admin === 0) {
        if (!securityService.hasPrivilege(req.auth, module + '.' + action)) {
          return {
            code: 1,
            msg: '你没有权限进行此操作'
          };
        }
      }
    }
    module = module.replace(/\./g, '/');
    let controller, method;
    try {
      controller = require('../controller/' + module);
      method = controller[action];
    } catch (err) { }
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

  async writeLog(file, category, content, operator) {
    let db = new DB();
    await db.insert('base_log', {
      module: util.getPath(file),
      category: category,
      content: content,
      created_by: operator
    });
  }

  async getConfig(code) {
    let db = new DB();
    let list = await db.find('select `value` from `base_config` where `code` = :code', { code: code });
    if (list.length > 0) return list[0].value;
    return null;
  }
}

module.exports = new BaseService();