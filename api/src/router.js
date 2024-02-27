var express = require('express');
var log4js = require('log4js');
var multer = require('multer');

var baseService = require('./service/base');

var router = express.Router();
var logger = log4js.getLogger();

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