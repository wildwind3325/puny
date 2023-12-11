var express = require('express');
var http = require('http');
var path = require('path');
var session = require('express-session');
var log4js = require('log4js');
var Sequelize = require('sequelize');

require('./util/enhance');
var config = require('./config/config');
var cm = require('./dao/cm');
var router = require('./router');

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'DEV';
}

log4js.configure('./src/config/log4js-' + process.env.NODE_ENV.toLowerCase() + '.json');

var conn = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../data/default.db'),
  logging: false
});
cm.set('default', conn);

var app = express();
var server = http.createServer(app);

app.use(log4js.connectLogger(log4js.getLogger(), { level: 'info' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));
app.use(session({
  name: config.cookie.name,
  secret: config.cookie.secret,
  resave: false,
  rolling: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 3600 * 24,
    sameSite: 'lax'
  }
}));

app.use(express.static(path.join(__dirname, '../public')));
app.use('/api', router);

app.use(function (req, res, next) {
  res.status(404).send({
    code: 1,
    msg: '404 页面不存在'
  });
});

app.use(async function (err, req, res, next) {
  res.status(err.status || 500).send({
    code: 1,
    msg: '处理请求时发生异常'
  });
});

process.on('unhandledRejection', (error, promise) => {
  console.error('unhandledRejection', error);
});

process.on('uncaughtException', (error, origin) => {
  console.error('uncaughtException', error);
});

module.exports = { app: app, server: server };