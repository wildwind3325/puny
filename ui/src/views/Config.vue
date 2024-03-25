<template>
  <van-nav-bar title="配置" left-arrow @click-left="$router.back()" />
  <div style="padding: 8px 16px;">
    <van-space>
      <van-button type="primary" size="small" @click="create">新建</van-button>
    </van-space>
  </div>
  <van-cell-group>
    <van-swipe-cell v-for="(item, index) in list" :key="index">
      <van-cell :title="item.name" :value="item.value" />
      <template #right>
        <van-button type="warning" @click="edit(item)">编辑</van-button>
        <van-button type="danger" @click="remove(index)">删除</van-button>
      </template>
    </van-swipe-cell>
  </van-cell-group>
  <van-dialog v-model:show="show" title="配置项">
    <van-cell-group>
      <van-field v-model="form.name" label="名称" />
      <van-field v-model="form.value" label="值" />
    </van-cell-group>
    <template #footer>
      <div style="padding: 8px 16px; text-align: center;">
        <van-space>
          <van-button type="success" @click="save">保存</van-button>
          <van-button type="warning" @click="show = false">取消</van-button>
        </van-space>
      </div>
    </template>
  </van-dialog>
</template>

<script>
import common from '../components/common';
import request from '../util/request';
export default {
  name: 'Config',
  data() {
    return {
      list: [],
      show: false,
      form: {
        id: 0,
        name: '',
        value: ''
      },
      editItem: null
    };
  },
  async mounted() {
    try {
      let res = await request.post('/api/common?_module=config&_action=list');
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
    create() {
      this.form = {
        id: 0,
        name: '',
        value: ''
      };
      this.show = true;
    },
    edit(item) {
      this.form = {
        id: item.id,
        name: item.name,
        value: item.value
      };
      this.editItem = item;
      this.show = true;
    },
    async save() {
      if (!this.form.name || !this.form.value) {
        common.notify('warning', '名称和值不能为空');
        return;
      }
      let action = 'add';
      if (this.form.id !== 0) {
        action = 'edit';
      }
      try {
        let res = await request.post('/api/common?_module=config&_action=' + action, this.form);
        if (res.data.code !== 0) {
          common.notify('danger', '操作失败：' + res.data.msg);
        } else {
          if (action === 'add') {
            this.list.push(res.data.data);
          } else {
            Object.assign(this.editItem, this.form);
          }
          this.show = false;
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
        let res = await request.post('/api/common?_module=config&_action=remove', { id: this.list[index].id });
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