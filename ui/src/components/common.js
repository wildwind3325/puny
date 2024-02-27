import { showConfirmDialog, showDialog, showNotify } from 'vant';

export default {
  notify(type, message) {
    showNotify({ type: type, message: message });
  },
  alert(title, message) {
    return new Promise((resolve, reject) => {
      showDialog({
        title: title,
        message: message,
      }).then(() => {
        resolve();
      });
    });
  },
  confirm(title, message) {
    return new Promise((resolve, reject) => {
      showConfirmDialog({
        title: title,
        message: message,
      }).then(() => {
        resolve(true);
      }).catch(() => {
        resolve(false);
      });
    });
  }
};