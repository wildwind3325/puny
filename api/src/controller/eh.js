class EHController {
  constructor() {
    this.rules = {
      login: {},
      init: {},
      download: {}
    };
  }

  login(req, res, data) {
    res.send({ code: 0 });
  }

  init(req, res, data) {
    res.send({ code: 0 });
  }

  download(req, res, data) {
    res.send({ code: 0 });
  }
}

module.exports = new EHController();