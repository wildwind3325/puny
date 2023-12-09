/** 分页查询参数类 */
class QueryOption {
  /**
   * 构建新的查询参数实例
   */
  constructor() {
    /** 字段清单，留空获取全部 */
    this.fields = [];
    /** 数据表名称 */
    this.table = '';
    /** 查询条件 */
    this.where = '';
    /** 查询参数 */
    this.params = {};
    /** 分页大小 */
    this.pageSize = 10;
    /** 页码，首页为1 */
    this.pageNumber = 1;
    /** 排序方式 */
    this.orderBy = '';
  }
}

module.exports = QueryOption;