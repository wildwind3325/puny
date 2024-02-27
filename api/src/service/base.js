class BaseService {
  constructor() {
    this.safeModules = ['login'];
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
    if (anonymous !== true && this.safeModules.indexOf(module) < 0) {
      if (!req.session.user) {
        return {
          code: -1,
          msg: '尚未登录或登录已超时'
        };
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
}

module.exports = new BaseService();