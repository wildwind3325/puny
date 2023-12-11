var config = require('../config/config');

class LoginController {
  constructor() {
    this.rules = {
      login: {},
      logout: {},
      status: {}
    };
  }

  login(req, res, data) {
    let user = {
      account: 'whatever'
    };
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