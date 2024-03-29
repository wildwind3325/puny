<template>
  <van-nav-bar title="艺术家" left-arrow @click-left="$router.back()" />
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
      <van-cell>
        <template #title>
          <span>{{ item.name }}</span>
          <van-icon v-if="item.px_id" name="./img/pixiv.ico" style="margin-left: 8px;" />
          <van-icon v-if="item.ib_id" name="./img/inkbunny.ico" style="margin-left: 8px;" />
        </template>
        <template #value>
          <van-rate v-model="item.rating" readonly />
        </template>
      </van-cell>
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
        <van-field label="评级">
          <template #input>
            <van-rate v-model="form.rating" />
          </template>
        </van-field>
        <van-field v-model="form.px_id" label="Pixiv" />
        <van-field v-model="form.px_updated_to" label="更新至" />
        <van-field v-model="form.ib_id" label="Inkbunny" />
        <van-field v-model="form.ib_updated_to" label="更新至" />
        <van-field v-model="form.remark" label="备注" />
      </van-cell-group>
    </div>
  </div>
</template>

<script>
import common from '../components/common';
import request from '../util/request';
export default {
  name: 'Artist',
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
        rating: 1,
        px_id: '',
        px_updated_to: '',
        ib_id: '',
        ib_updated_to: '',
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
        let res = await request.post('/api/common?_module=artist&_action=list', {
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
        rating: 1,
        px_id: '',
        px_updated_to: '',
        ib_id: '',
        ib_updated_to: '',
        remark: ''
      };
      this.show = true;
    },
    edit(item) {
      this.form = {
        id: item.id,
        name: item.name,
        rating: item.rating,
        px_id: item.px_id,
        px_updated_to: item.px_updated_to,
        ib_id: item.ib_id,
        ib_updated_to: item.ib_updated_to,
        remark: item.remark
      };
      this.editItem = item;
      this.show = true;
    },
    async save() {
      if (!this.form.name) {
        common.notify('warning', '名称不能为空');
        return;
      }
      let action = 'add';
      if (this.form.id !== 0) {
        action = 'edit';
      }
      try {
        let res = await request.post('/api/common?_module=artist&_action=' + action, this.form);
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
        let res = await request.post('/api/common?_module=artist&_action=remove', { id: this.list[index].id });
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