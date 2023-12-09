var express = require('express');
var log4js = require('log4js');
var multer = require('multer');
var jwt = require('jsonwebtoken');

var baseService = require('./service/base');
var dingdingService = require('./service/dingding');
var config = require('./config/config');
var DB = require('./dao/db');

var router = express.Router();
var logger = log4js.getLogger();

router.get('/login', async function (req, res, next) {
  let result = await dingdingService.login(req.query.authCode);
  if (result.code !== 0) {
    res.send({
      code: 1,
      msg: '登录失败，请联系管理员'
    });
    return;
  }
  let db = new DB();
  let list = await db.find('select * from `view_base_user` where `mobile` = :mobile and status = 0', { mobile: result.data.mobile });
  if (list.length === 0) {
    res.send({
      code: 1,
      msg: '该用户不存在或已被停用'
    });
  } else {
    let user = list[0];
    user.department_name = user.department_name || '';
    user.station_name = user.station_name || '';
    user.roles = JSON.parse(user.roles);
    let token = jwt.sign(user, config.secret, { expiresIn: '7d' });
    res.cookie(config.cookie_name, token, {
      maxAge: 1000 * 3600 * 24 * 7,
      httpOnly: true,
      sameSite: 'lax'
    });
    res.redirect(req.query.target_uri || '/#/');
  }
});

router.post('/anonymous', async function (req, res, next) {
  try {
    let result = baseService.preProcess(req, true);
    if (result.code !== 0) {
      res.send(result);
    } else {
      let controller = result.controller;
      let method = result.method;
      let data = result.data;
      await method.call(controller, req, res, data);
    }
  } catch (err) {
    logger.error(err.message, err);
    res.send({
      code: 1,
      msg: '处理请求时发生异常'
    });
  }
});

router.post('/common', async function (req, res, next) {
  try {
    let result = baseService.preProcess(req);
    if (result.code !== 0) {
      res.send(result);
    } else {
      let controller = result.controller;
      let method = result.method;
      let data = result.data;
      await method.call(controller, req, res, data);
    }
  } catch (err) {
    logger.error(err.message, err);
    res.send({
      code: 1,
      msg: '处理请求时发生异常'
    });
  }
});

router.get('/download', async function (req, res, next) {
  try {
    let result = baseService.preProcess(req);
    if (result.code !== 0) {
      res.send(result);
    } else {
      let controller = result.controller;
      let method = result.method;
      let data = result.data;
      await method.call(controller, req, res, data);
    }
  } catch (err) {
    logger.error(err.message, err);
    let str = '下载失败：' + err.message;
    res.status(200).set({
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename=error.txt'
    });
    res.end(Buffer.from(str, 'utf-8'));
  }
});

router.post('/upload', multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10485760 }
}).single('file'), async function (req, res, next) {
  try {
    let result = baseService.preProcess(req);
    if (result.code !== 0) {
      res.send(result);
    } else {
      let controller = result.controller;
      let method = result.method;
      let data = result.data;
      await method.call(controller, req, res, data);
    }
  } catch (err) {
    logger.error(err.message, err);
    res.send({
      code: 1,
      msg: '处理请求时发生异常'
    });
  }
});

module.exports = router;