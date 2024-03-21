<template>
  <van-nav-bar :title="forum_name" left-arrow @click-left="$router.back()" />
  <div style="padding: 8px 16px;">
    <van-space>
      <van-button type="primary" size="small" @click="create">新主题</van-button>
      <van-button type="success" size="small" @click="query()">刷新</van-button>
    </van-space>
  </div>
  <van-pagination v-model="pageNumber" :total-items="total" mode="simple" @change="query" />
  <van-cell-group>
    <van-swipe-cell v-for="(item, index) in list" :key="index">
      <van-cell :border="false" :title="item.title" :value="item.created_at.substring(0, 10)"
        @click="$router.push('/note/post/' + item.id)" />
      <template #right>
        <van-button type="danger" @click="remove(index)">删除</van-button>
      </template>
    </van-swipe-cell>
  </van-cell-group>
  <Editor ref="editor" @post_add="onAdd" />
</template>

<script>
import common from '../../components/common';
import request from '../../util/request';
import Editor from './Editor.vue';
export default {
  name: 'NoteForum',
  components: { Editor },
  data() {
    return {
      forum_id: 0,
      forum_name: '',
      pageNumber: 1,
      total: 0,
      list: []
    };
  },
  async mounted() {
    this.forum_id = parseInt(this.$route.params.id);
    await this.init();
    await this.query(1);
  },
  async activated() {
    let forum_id = parseInt(this.$route.params.id);
    if (this.forum_id !== forum_id) {
      this.forum_id = forum_id;
      await this.init();
      await this.query(1);
    }
  },
  methods: {
    async init() {
      try {
        let res = await request.post('/api/common?_module=note&_action=forum_info', { forum_id: this.forum_id });
        if (res.data.code !== 0) {
          common.notify('danger', '加载数据失败：' + res.data.msg);
        } else {
          this.forum_name = res.data.data;
        }
      } catch (err) {
        common.notify('danger', '加载数据失败：' + err.message);
      }
    },
    async query(pageNumber) {
      try {
        let res = await request.post('/api/common?_module=note&_action=topic_list', {
          forum_id: this.forum_id,
          pageSize: 8,
          pageNumber: pageNumber || this.pageNumber
        });
        if (res.data.code !== 0) {
          common.notify('danger', '加载数据失败：' + res.data.msg);
        } else {
          this.total = res.data.data.total;
          this.pageNumber = res.data.data.pageNumber;
          this.list = res.data.data.rows;
        }
      } catch (err) {
        common.notify('danger', '加载数据失败：' + err.message);
      }
    },
    create() {
      this.$refs.editor.init({
        id: 0,
        forum_id: this.forum_id,
        parent_id: 0,
        title: '',
        content: ''
      });
    },
    onAdd(post) {
      this.list.unshift(post);
    },
    async remove(index) {
      let result = await common.confirm('确认', '是否删除该项目？');
      if (!result) return;
      try {
        let res = await request.post('/api/common?_module=note&_action=post_remove', { id: this.list[index].id });
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