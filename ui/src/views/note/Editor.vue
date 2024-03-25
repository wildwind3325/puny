<template>
  <div v-show="show" class="overlay" style="z-index: 100;">
    <div style="height: 46px;"></div>
    <div style="height: calc(100vh - 46px); background-color: white;">
      <div style="padding: 8px 16px;">
        <van-space>
          <van-button type="success" size="small" @click="save">保存</van-button>
          <van-button type="warning" size="small" @click="show = false">取消</van-button>
        </van-space>
      </div>
      <van-cell-group>
        <van-field v-model="title" label="标题" />
      </van-cell-group>
      <Editor v-model="content" :init="options" />
    </div>
  </div>
</template>

<script>
import common from '../../components/common';
import request from '../../util/request';
import Editor from '@tinymce/tinymce-vue';
export default {
  name: 'NoteEditor',
  components: { Editor },
  data() {
    return {
      form: {
        id: 0,
        forum_id: 0,
        parent_id: 0,
        title: '',
        content: ''
      },
      show: false,
      title: '',
      options: {
        language: 'zh-Hans',
        branding: false,
        menubar: false,
        resize: false
      },
      content: ''
    };
  },
  methods: {
    init(post) {
      this.form = post;
      if (this.form.id > 0) {
        this.title = this.form.title;
        this.content = this.form.content;
      } else {
        this.title = '';
        this.content = '';
      }
      this.show = true;
    },
    async save() {
      if (!this.title || !this.content) {
        common.notify('warning', '标题和内容不能为空');
        return;
      }
      let action = 'post_add';
      if (this.form.id !== 0) {
        action = 'post_edit';
      }
      try {
        let res = await request.post('/api/common?_module=note&_action=' + action, {
          id: this.form.id,
          forum_id: this.form.forum_id,
          parent_id: this.form.parent_id,
          title: this.title,
          content: this.content
        });
        if (res.data.code !== 0) {
          common.notify('danger', '操作失败：' + res.data.msg);
        } else {
          this.show = false;
          this.form.title = this.title;
          this.form.content = this.content;
          this.$emit(action, action === 'post_add' ? res.data.data : this.form);
          common.notify('success', '操作成功');
        }
      } catch (err) {
        common.notify('danger', '操作失败：' + err.message);
      }
    }
  }
};
</script>