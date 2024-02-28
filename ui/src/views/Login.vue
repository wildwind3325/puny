<template>
  <div style="padding: 10px 16px;">
    <span class="header">用户登录</span>
  </div>
  <van-cell-group inset>
    <van-field v-model="account" label="账号" />
    <van-field v-model="password" type="password" label="密码" />
  </van-cell-group>
  <div style="padding: 10px 16px;">
    <van-button type="primary" block @click="login">登录</van-button>
  </div>
</template>

<script>
import common from '../components/common';
import request from '../util/request';
export default {
  name: 'Login',
  data() {
    return {
      account: localStorage.getItem('account') || '',
      password: ''
    };
  },
  async mounted() {
    try {
      let target = localStorage.getItem('target_uri') || '/home';
      let res = await request.post('/api/common?_module=login&_action=status');
      if (res.data.code === 0 && res.data.data.loggedIn) {
        localStorage.removeItem('target_uri');
        this.$router.replace(target);
      }
    } catch (err) { }
  },
  methods: {
    async login() {
      if (!this.account || !this.password) {
        common.notify('warning', '请输入账号和密码');
        return;
      }
      try {
        let res = await request.post('/api/common?_module=login&_action=login', {
          account: this.account,
          password: this.password
        });
        if (res.data.code !== 0) {
          common.notify('danger', '登录失败：' + res.data.msg);
          return;
        }
        localStorage.setItem('account', this.account);
        this.$router.replace('/home');
      } catch (err) {
        common.notify('danger', '登录失败：' + err.message);
      }
    }
  }
};
</script>

<style scoped>
.header {
  display: block;
  text-align: center;
  height: 40px;
  line-height: 40px;
  font-size: 24px;
  font-weight: bold;
  color: #969799;
}
</style>