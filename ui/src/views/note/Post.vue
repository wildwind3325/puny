<template>
  <van-nav-bar title="查看帖子" left-arrow @click-left="$router.back()" />
  <div style="padding: 8px 16px;">
    <van-space>
      <van-button type="primary" size="small" @click="create">写回复</van-button>
    </van-space>
  </div>
  <div v-for="(item, index) in list" :key="index">
    <van-cell-group>
      <van-swipe-cell>
        <van-cell :border="false" :value="item.created_at">
          <template #title>
            <span style="color: orange;">{{ item.title }}</span>
          </template>
        </van-cell>
        <template #right>
          <van-button type="warning" @click="edit(item)">编辑</van-button>
          <van-button type="danger" @click="remove(index)">删除</van-button>
        </template>
      </van-swipe-cell>
    </van-cell-group>
    <div v-html="item.content" style="padding: 8px 16px;">
    </div>
  </div>
  <Editor ref="editor" @post_add="onAdd" />
</template>

<script>
import common from '../../components/common';
import request from '../../util/request';
import Editor from './Editor.vue';
export default {
  name: 'NotePost',
  components: { Editor },
  data() {
    return {
      forum_id: 0,
      post_id: 0,
      list: []
    };
  },
  async mounted() {
    this.post_id = parseInt(this.$route.params.id);
    try {
      let res = await request.post('/api/common?_module=note&_action=post_list', { post_id: this.post_id });
      if (res.data.code !== 0) {
        common.notify('danger', '加载数据失败：' + res.data.msg);
      } else {
        this.list = res.data.data;
        if (this.list.length === 0) {
          this.$router.back();
          common.notify('danger', '加载数据失败：未找到任何帖子。');
        } else {
          this.forum_id = this.list[0].forum_id;
        }
      }
    } catch (err) {
      common.notify('danger', '加载数据失败：' + err.message);
    }
  },
  methods: {
    create() {
      this.$refs.editor.init({
        id: 0,
        forum_id: this.forum_id,
        parent_id: this.post_id,
        title: '',
        content: ''
      });
    },
    async edit(item) {
      this.$refs.editor.init(item);
    },
    async remove(index) {
      let result = await common.confirm('确认', '是否删除该项目？');
      if (!result) return;
      try {
        let res = await request.post('/api/common?_module=note&_action=post_remove', { id: this.list[index].id });
        if (res.data.code !== 0) {
          common.notify('danger', '操作失败：' + res.data.msg);
        } else {
          if (index === 0) {
            this.$router.back();
          } else {
            this.list.splice(index, 1);
          }
          common.notify('success', '操作成功');
        }
      } catch (err) {
        common.notify('danger', '操作失败：' + err.message);
      }
    },
    onAdd(post) {
      this.list.push(post);
    }
  }
};
</script>