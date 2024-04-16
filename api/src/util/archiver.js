var cp = require('child_process');

var baseService = require('../service/base');

var zip_exe = '', zip_extract = '', zip_compress = '';

var archiver = {
  async init(user_id) {
    zip_exe = await baseService.getConfig(user_id, 'zip_exe');
    zip_extract = await baseService.getConfig(user_id, 'zip_extract');
    zip_compress = await baseService.getConfig(user_id, 'zip_compress');
    if (!zip_exe || !zip_extract || !zip_compress) {
      return {
        code: 1,
        msg: '初始化失败，配置未完成。'
      };
    } else {
      return { code: 0 };
    }
  },
  async extract(file, folder) {
    if (!zip_exe || !zip_extract) {
      let res = await this.init();
      if (res.code !== 0) {
        return res;
      }
    }
    cp.execSync(zip_exe + ' ' + zip_extract.replace('%FILE%', file).replace('%FOLDER%', folder));
    return { code: 0 };
  },
  async compress(folder, file) {
    if (!zip_exe || !zip_compress) {
      let res = await this.init();
      if (res.code !== 0) {
        return res;
      }
    }
    cp.execSync(zip_exe + ' ' + zip_compress.replace('%FILE%', file).replace('%FOLDER%', folder));
    return { code: 0 };
  }
};

module.exports = archiver;