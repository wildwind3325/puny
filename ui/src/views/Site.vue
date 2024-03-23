<template>
  <van-nav-bar title="收藏夹" left-arrow @click-left="$router.back()" />
  <div style="padding: 8px 16px;">
    <van-space>
      <van-button type="primary" size="small" @click="create">新建</van-button>
      <input v-model="keyword" style="height: 30px; border: 0px;" />
      <van-button type="success" size="small" icon="search" @click="query(1)">搜索</van-button>
    </van-space>
  </div>
  <van-pagination v-model="pageNumber" :total-items="total" mode="simple" @change="query" />
  <van-cell-group>
    <van-swipe-cell v-for="(item, index) in list" :key="index">
      <van-cell :title="item.name" :value="item.created_at.substring(0, 10)" />
      <template #right>
        <van-button type="warning" @click="edit(item)">编辑</van-button>
        <van-button type="danger" @click="remove(index)">删除</van-button>
      </template>
    </van-swipe-cell>
  </van-cell-group>
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
        <van-field v-model="form.name" label="名称" />
        <van-field v-model="form.url" label="地址" />
        <van-field v-model="form.count" type="number" label="计数" />
        <van-field v-model="form.remark" label="备注" />
      </van-cell-group>
    </div>
  </div>
</template>

<script>
import common from '../components/common';
import request from '../util/request';
export default {
  name: 'Site',
  data() {
    return {
      keyword: '',
      pageNumber: 1,
      total: 0,
      list: [],
      show: false,
      form: {
        id: 0,
        name: '',
        url: '',
        count: 0,
        remark: ''
      },
      editItem: null
    };
  },
  mounted() {
    this.query(1);
  },
  methods: {
    async query(pageNumber) {
      try {
        let res = await request.post('/api/common?_module=site&_action=list', {
          keyword: this.keyword,
          pageSize: 10,
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
      this.form = {
        id: 0,
        name: '',
        url: '',
        count: 0,
        remark: ''
      };
      this.show = true;
    },
    edit(item) {
      this.form = {
        id: item.id,
        name: item.name,
        url: item.url,
        count: item.count,
        remark: item.remark
      };
      this.editItem = item;
      this.show = true;
    },
    async save() {
      if (!this.form.name || !this.form.url) {
        common.notify('warning', '名称和地址不能为空');
        return;
      }
      let action = 'add';
      if (this.form.id !== 0) {
        action = 'edit';
      }
      try {
        let res = await request.post('/api/common?_module=site&_action=' + action, this.form);
        if (res.data.code !== 0) {
          common.notify('danger', '操作失败：' + res.data.msg);
        } else {
          if (action === 'add') {
            this.list.unshift(res.data.data);
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
        let res = await request.post('/api/common?_module=site&_action=remove', { id: this.list[index].id });
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