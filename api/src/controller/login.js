var config = require('../config/config');

class LoginController {
  constructor() {
    this.rules = {
      logout: {},
      status: {}
    };
  }

  logout(req, res, data) {
    res.clearCookie(config.cookie_name);
    res.send({ code: 0 });
  }

  status(req, res, data) {
    res.send({
      code: 0,
      data: { loggedIn: true }
    });
  }
}

module.exports = new LoginController();