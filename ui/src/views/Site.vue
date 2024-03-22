<template>
  <van-nav-bar title="站点" left-arrow @click-left="$router.back()" />
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
      <van-cell :title="item.name" :value="item.created_at.substring(0, 10)" @click="edit(item)" />
      <template #right>
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
        <van-field v-model="person.name" label="姓名" />
        <van-field v-model="person.company" label="公司" />
        <van-field v-model="person.title" label="职务" />
        <van-field v-model="person.phone" label="电话" />
        <van-field v-model="person.email" label="邮箱" />
        <van-field v-model="person.birthday" type="date" label="生日" />
        <van-field v-model="person.address" label="地址" />
        <van-field v-model="person.remark" label="备注" />
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
      site: {
        id: 0,
        name: '',
        company: '',
        title: '',
        phone: '',
        email: '',
        birthday: '',
        address: '',
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
        let res = await request.post('/api/common?_module=person&_action=list', {
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
      this.person = {
        id: 0,
        name: '',
        company: '',
        title: '',
        phone: '',
        email: '',
        birthday: '',
        address: '',
        remark: ''
      };
      this.show = true;
    },
    edit(item) {
      this.person = {
        id: item.id,
        name: item.name,
        company: item.company,
        title: item.title,
        phone: item.phone,
        email: item.email,
        birthday: item.birthday,
        address: item.address,
        remark: item.remark
      };
      this.editItem = item;
      this.show = true;
    },
    async save() {
      if (!this.person.name) {
        common.notify('warning', '姓名不能为空');
        return;
      }
      let action = 'add';
      if (this.person.id !== 0) {
        action = 'edit';
      }
      try {
        let res = await request.post('/api/common?_module=person&_action=' + action, this.person);
        if (res.data.code !== 0) {
          common.notify('danger', '操作失败：' + res.data.msg);
        } else {
          if (action === 'add') {
            this.list.unshift(res.data.data);
          } else {
            Object.assign(this.editItem, this.person);
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
        let res = await request.post('/api/common?_module=person&_action=remove', { id: this.list[index].id });
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