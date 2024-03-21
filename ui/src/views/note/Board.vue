<template>
  <van-nav-bar title="版面" left-arrow @click-left="$router.back()" />
  <div style="padding: 8px 16px;">
    <van-space>
      <van-button type="primary" size="small" @click="create">创建</van-button>
    </van-space>
  </div>
  <van-cell-group>
    <van-swipe-cell v-for="(item, index) in list" :key="index">
      <van-cell :border="false" :title="item.name" :value="item.created_at.substring(0, 10)"
        @click="$router.push('/note/forum/' + item.id)" />
      <template #right>
        <van-button type="warning" @click="edit(item)">修改</van-button>
        <van-button type="danger" @click="remove(index)">删除</van-button>
      </template>
    </van-swipe-cell>
  </van-cell-group>
</template>

<script>
import common from '../../components/common';
import request from '../../util/request';
export default {
  name: 'NoteBoard',
  data() {
    return {
      list: []
    };
  },
  async mounted() {
    try {
      let res = await request.post('/api/common?_module=note&_action=forum_list');
      if (res.data.code !== 0) {
        common.notify('danger', '加载数据失败：' + res.data.msg);
      } else {
        this.list = res.data.data;
      }
    } catch (err) {
      common.notify('danger', '加载数据失败：' + err.message);
    }
  },
  methods: {
    async create() {
      let name = window.prompt('请输入名称：');
      if (!name) return;
      try {
        let res = await request.post('/api/common?_module=note&_action=forum_add', { name: name });
        if (res.data.code !== 0) {
          common.notify('danger', '操作失败：' + res.data.msg);
        } else {
          this.list.push(res.data.data);
          common.notify('success', '操作成功');
        }
      } catch (err) {
        common.notify('danger', '操作失败：' + err.message);
      }
    },
    async edit(item) {
      let name = window.prompt('请输入名称：', item.name);
      if (!name) return;
      try {
        let res = await request.post('/api/common?_module=note&_action=forum_edit', {
          id: item.id,
          name: name
        });
        if (res.data.code !== 0) {
          common.notify('danger', '操作失败：' + res.data.msg);
        } else {
          item.name = name;
          common.notify('success', '操作成功');
        }
      } catch (err) {
        common.notify('danger', '操作失败：' + err.message);
      }
    },
    async remove(index) {
      let result = await common.confirm('确认', '是否删除该项目？');
      if (!result) return;
      try {
        let res = await request.post('/api/common?_module=note&_action=forum_remove', { id: this.list[index].id });
        if (res.data.code !== 0) {
          common.notify('danger', '操作失败：' + res.data.msg);
        } else {
          this.list.splice(index, 1);
          common.notify('success', '操作成功');
        }
      } catch (err) {
        common.notify('danger', '操作失败：' + err.message);
      }
    }
  }
};
</script>