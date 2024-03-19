<template>
  <van-nav-bar title="版面" left-arrow @click-left="$router.back()" />
  <div style="padding: 8px 16px;">
    <van-space>
      <van-button type="primary" size="small" @click="create">创建</van-button>
    </van-space>
  </div>
  <van-cell-group>
    <van-swipe-cell v-for="(item, index) in list" :key="index">
      <van-cell :border="false" :title="item.name" />
      <template #right>
        <van-button square type="warning" text="修改" />
        <van-button square type="danger" text="删除" />
      </template>
    </van-swipe-cell>
  </van-cell-group>
</template>

<script>
import common from '../../components/common';
import request from '../../util/request';
export default {
  name: 'NoteForum',
  data() {
    return {
      list: [{
        id: 1,
        name: '工作日志'
      }]
    };
  },
  mounted() {
  },
  methods: {
    create() {
      let name = window.prompt('请输入名称：');
      if (!name) return;
    }
  }
};
</script>