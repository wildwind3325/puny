<template>
  <div class="title">基本</div>
  <van-grid direction="horizontal" :column-num="3">
    <van-grid-item icon="idcard" icon-color="blue" text="文件" to="/explorer" />
    <van-grid-item icon="notes-o" icon-color="#1989fa" text="笔记" to="/note/board" />
    <van-grid-item icon="friends-o" icon-color="red" text="联系人" to="/person" />
  </van-grid>
  <div class="title">系统</div>
  <van-grid direction="horizontal" :column-num="3">
    <van-grid-item icon="setting-o" icon-color="orange" text="配置" />
    <van-grid-item icon="close" icon-color="red" text="注销" @click="logout" />
  </van-grid>
</template>

<script>
import request from '../util/request';
export default {
  name: 'Home',
  data() {
    return {
    };
  },
  methods: {
    async logout() {
      try {
        await request.post('/api/common?_module=login&_action=logout');
        this.$router.replace('/');
      } catch (err) { }
    }
  }
};
</script>