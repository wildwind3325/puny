export default {
  get(name) {
    var arr = document.cookie.split('; ');
    for (var i = 0; i < arr.length; i++) {
      var kv = arr[i].split('=');
      if (kv[0] == name) {
        return kv[1];
      }
    }
    return '';
  },
  set(name, value, expire) {
    var now = new Date();
    now.setTime(now.getTime() + expire * 24 * 3600 * 1000);
    document.cookie = name + '=' + value + '; expires=' + now.toUTCString();
  }
};