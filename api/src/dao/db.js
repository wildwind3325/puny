var { QueryTypes } = require('sequelize');

var cm = require('./cm');
var QueryOption = require('./query-option');

/** 数据库操作帮助类 */
class DB {
  /**
   * 构建新的数据库连接实例
   * @param {string} name 连接名称
   */
  constructor(name) {
    this.conn = cm.get(name);
    this.dialect = this.conn.options.dialect;
    this.sep = '';
    switch (this.dialect) {
      case 'mysql':
      case 'sqlite':
        this.sep = '`';
        break;
      case 'mssql':
      case 'postgres':
        this.sep = '"';
        break;
      default:
        break;
    }
  }

  /**
   * 开启一个非托管事务
   * @returns {Promise<void>}
   */
  beginTransaction() {
    return new Promise((resolve, reject) => {
      this.conn.transaction().then(t => {
        this.transaction = t;
        resolve();
      }).catch(error => {
        reject(error);
      });
    });
  }

  /**
   * 提交当前事务
   * @returns {Promise<void>}
   */
  commit() {
    if (this.transaction) {
      let promise = this.transaction.commit();
      this.transaction = undefined;
      return promise;
    } else {
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
  }

  /**
   * 回滚当前事务
   * @returns {Promise<void>}
   */
  rollback() {
    if (this.transaction) {
      let promise = this.transaction.rollback();
      this.transaction = undefined;
      return promise;
    } else {
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
  }

  /**
   * 执行数据库查询，内部方法。
   * @param {string} sql 查询语句
   * @param {any} options 配置数据
   * @returns {Promise<any>} 查询结果
   */
  async execute(sql, options) {
    options = options || {};
    if (this.transaction) {
      options.transaction = this.transaction;
    }
    let result = await this.conn.query(sql, options);
    return result;
  }

  /**
   * 执行数据库更新操作
   * @param {string} sql 查询语句
   * @param {any} params 参数
   * @returns {Promise<number>} 受影响的条目数
   */
  executeUpdate(sql, params) {
    return new Promise((resolve, reject) => {
      this.execute(sql, {
        type: QueryTypes.UPDATE,
        replacements: params
      }).then(result => {
        resolve(result[1]);
      }).catch(error => {
        reject(error);
      });
    });
  }

  /**
   * 执行实体插入操作
   * @param {string} table 数据表名
   * @param {any} obj 实体对象
   * @returns {Promise<any>} 更新结果
   */
  async insert(table, obj) {
    let sql = 'INSERT INTO ' + this.sep + table + this.sep + ' (';
    let values = ' VALUES (';
    for (let prop in obj) {
      if (prop !== 'id') {
        sql += this.sep + prop + this.sep + ', ';
        values += ':' + prop + ', ';
      }
    }
    sql = sql.substring(0, sql.length - 2);
    values = values.substring(0, values.length - 2);
    sql += ')' + values + ')';
    if (this.dialect === 'mssql') {
      sql += '; SELECT SCOPE_IDENTITY() AS \'id\'';
    } else if (this.dialect === 'postgres') {
      sql += ' RETURNING "id"';
    }
    let result = await this.execute(sql, {
      type: QueryTypes.INSERT,
      replacements: obj
    });
    if (this.dialect === 'mssql') {
      obj['id'] = result[0].id;
    } else if (this.dialect === 'postgres') {
      obj['id'] = result[0][0].id;
    } else {
      obj['id'] = result[0];
    }
    return result;
  }

  /**
   * 执行实体更新操作
   * @param {string} table 数据表名
   * @param {any} obj 实体对象
   * @returns {Promise<number>} 受影响的条目数
   */
  async update(table, obj) {
    let sql = 'UPDATE ' + this.sep + table + this.sep + ' SET ';
    for (let prop in obj) {
      if (prop !== 'id') {
        sql += this.sep + prop + this.sep + ' = :' + prop + ', ';
      }
    }
    sql = sql.substring(0, sql.length - 2);
    sql += ' WHERE ' + this.sep + 'id' + this.sep + ' = :id';
    let result = await this.execute(sql, {
      type: QueryTypes.UPDATE,
      replacements: obj
    });
    return result[1];
  }

  /**
   * 执行实体物理删除操作
   * @param {string} table 数据表名
   * @param {number} id 自增主键
   * @returns {Promise<number>} 受影响的条目数
   */
  async delete(table, id) {
    let sql = 'DELETE FROM ' + this.sep + table + this.sep + ' WHERE ' + this.sep + 'id' + this.sep + ' = :id';
    let result = await this.execute(sql, {
      type: QueryTypes.UPDATE,
      replacements: { id: id }
    });
    return result[1];
  }

  /**
   * 根据自增主键查询实体
   * @param {string} table 数据表名
   * @param {number} id 自增主键
   * @param {boolean} lock 是否锁定行
   * @returns {Promise<any>} 单条查询记录
   */
  async findById(table, id, lock) {
    let sql = 'SELECT * FROM ' + this.sep + table + this.sep;
    if (lock && this.transaction && this.dialect === 'mssql') {
      sql += ' WITH (ROWLOCK, UPDLOCK)';
    }
    sql += ' WHERE ' + this.sep + 'id' + this.sep + ' = :id';
    if (lock && this.transaction && (this.dialect === 'mysql' || this.dialect === 'postgres')) {
      sql += ' FOR UPDATE';
    }
    let rows = await this.execute(sql, {
      type: QueryTypes.SELECT,
      replacements: { id: id }
    });
    if (rows.length > 0) {
      return rows[0];
    }
    return null;
  }

  /**
   * 执行一般查询操作
   * @param {string} sql 查询语句
   * @param {any} params 参数
   * @returns {Promise<Array>} 查询结果数组
   */
  async find(sql, params) {
    let result = await this.execute(sql, {
      type: QueryTypes.SELECT,
      replacements: params
    });
    return result;
  }

  /**
   * 执行单表查询操作
   * @param {string} table 数据表名
   * @param {Array} fields 查询列
   * @param {string} where 查询条件
   * @param {string} orderBy 排序
   * @param {any} params 参数
   * @returns {Promise<Array>} 查询结果数组
   */
  async findByTable(table, fields, where, orderBy, params) {
    let all = this.buildFields(fields);
    let sql = 'SELECT ' + all + ' FROM ' + this.sep + table + this.sep + ' ' + where + ' ' + orderBy;
    let result = await this.execute(sql, {
      type: QueryTypes.SELECT,
      replacements: params
    });
    return result;
  }

  /**
   * 执行分页查询操作
   * @param {QueryOption} options 配置数据
   * @returns {Promise<any>} 查询结果数组
   */
  async findByPage(options) {
    let sql = 'SELECT COUNT(*) AS total FROM ' + this.sep + options.table + this.sep + ' ' + options.where;
    let result = await this.find(sql, options.params);
    let total = parseInt(result[0].total);
    let pageSize = options.pageSize, pageNumber = options.pageNumber;
    if (total <= pageSize * (pageNumber - 1)) {
      pageNumber = Math.max(Math.ceil(total / pageSize), 1);
    }
    let from = pageSize * (pageNumber - 1);
    let orderBy = options.orderBy || 'ORDER BY ' + this.sep + 'id' + this.sep + ' ASC';
    let where = options.where || '';
    let all = this.buildFields(options.fields);
    if (this.dialect === 'mssql') {
      sql = 'SELECT ' + all + ' FROM ' + this.sep + options.table + this.sep + ' '
        + where + ' ' + orderBy + ' OFFSET ' + from + ' ROWS FETCH NEXT ' + pageSize + ' ROWS ONLY';
    } else {
      sql = 'SELECT ' + all + ' FROM ' + this.sep + options.table + this.sep + ' '
        + where + ' ' + orderBy + ' LIMIT ' + from + ', ' + pageSize;
    }
    result = await this.find(sql, options.params);
    return {
      total: total,
      pageSize: pageSize,
      pageNumber: pageNumber,
      rows: result
    };
  }

  /**
   * 将字段列表转换为选择内容
   * @param {Array} fields 字段列表
   * @returns {string} SQL格式的字段
   */
  buildFields(fields) {
    if (!fields || fields.length === 0) {
      return '*';
    }
    let all = this.sep + fields[0] + this.sep;
    for (let i = 1; i < fields.length; i++) {
      all += ', ' + this.sep + fields[i] + this.sep;
    }
    return all;
  }
}

module.exports = DB;