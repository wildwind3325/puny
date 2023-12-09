var log4js = require('log4js');
var Sequelize = require('sequelize');

var cm = require('../dao/cm');
var securityService = require('../service/security');

var init = async () => {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'DEV';
  }

  log4js.configure('./src/config/log4js-' + process.env.NODE_ENV.toLowerCase() + '.json');
  let logger = log4js.getLogger();

  let dbs = require('./database-' + process.env.NODE_ENV.toLowerCase() + '.json');
  for (let key in dbs) {
    let conn = new Sequelize(dbs[key]);
    if (conn.options.logging !== false) {
      conn.options.logging = msg => { logger.info(msg); };
    }
    cm.set(key, conn);
  }

  await securityService.init();
};

module.exports = { init: init };