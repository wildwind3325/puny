var config = require('../config/config');
var DB = require('../dao/db');
var util = require('../util/util');

class LoginController {
  constructor() {
  }

  async login(req, res, data) {
    if (!data.account || !data.password) {
      res.send({
        code: 1,
        msg: '请输入账号和密码'
      });
      return;
    }
    let db = new DB();
    let user = await db.findOne('select * from "user" where "account" = :account and "password" = :password', {
      account: data.account,
      password: util.md5(data.password).toUpperCase()
    });
    if (!user) {
      res.send({
        code: 1,
        msg: '错误的用户名或密码'
      });
      return;
    }
    req.session.user = user;
    res.send({ code: 0 });
  }

  logout(req, res, data) {
    req.session.destroy(err => { });
    res.clearCookie(config.cookie.name);
    res.send({ code: 0 });
  }

  status(req, res, data) {
    res.send({
      code: 0,
      data: { loggedIn: req.session.user ? true : false }
    });
  }
}

module.exports = new LoginController();