var kvs = {};
var config = {
  load(data) {
    kvs = data;
  },
  get(key) {
    return kvs[key] || '';
  },
  set(key, value) {
    kvs[key] = value;
  }
};

export default config;