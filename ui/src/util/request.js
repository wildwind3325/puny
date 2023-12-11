import axios from 'axios';

import router from '../router/index';

const request = axios.create({});

request.interceptors.request.use(function (config) {
  if (config.headers.Spin !== 'false') window.$spin.show();
  return config;
}, function (error) {
  window.$spin.hide();
  return Promise.reject(error);
});

request.interceptors.response.use(function (response) {
  window.$spin.hide();
  if (response.data.code < 0 && router.currentRoute.value.fullPath !== '/') {
    localStorage.setItem('target_uri', router.currentRoute.value.fullPath);
    router.replace('/');
  }
  return response;
}, function (error) {
  window.$spin.hide();
  return Promise.reject(error);
});

export default request;