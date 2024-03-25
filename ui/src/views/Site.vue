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
    <div v-for="(item, index) in list" :key="index">
      <van-swipe-cell>
        <van-cell :value="item.count">
          <template #title>
            <span style="color: #323233;" @click="visit(item)">{{ item.name }}</span>
            <span style="margin-left: 8px; color: dodgerblue;" @click="copy(item.url)">复制</span>
            <span style="margin-left: 8px; color: orange;" @click="item.show_account = !item.show_account">账号</span>
          </template>
        </van-cell>
        <template #right>
          <van-button type="warning" @click="edit(item)">编辑</van-button>
          <van-button type="danger" @click="remove(index)">删除</van-button>
        </template>
      </van-swipe-cell>
      <van-tabs v-show="item.show_account" type="card" shrink style="margin-top: 8px;">
        <van-tab v-for="(account, account_index) in item.accounts" :key="account_index"
          :title="'账号' + (account_index + 1)">
          <van-cell-group inset>
            <van-field v-model="account.account" clearable label="账号">
              <template #button>
                <van-button size="small" type="primary" @click="copy(account.account)">复制</van-button>
              </template>
            </van-field>
            <van-field v-model="account.password" clearable label="密码">
              <template #button>
                <van-button size="small" type="primary" @click="copy(account.password)">复制</van-button>
              </template>
            </van-field>
            <van-field v-model="account.question" clearable label="问题">
              <template #button>
                <van-button size="small" type="primary" @click="copy(account.question)">复制</van-button>
              </template>
            </van-field>
            <van-field v-model="account.answer" clearable label="回答">
              <template #button>
                <van-button size="small" type="primary" @click="copy(account.answer)">复制</van-button>
              </template>
            </van-field>
            <van-field v-model="account.remark" clearable label="备注">
              <template #button>
                <van-button size="small" type="primary" @click="copy(account.remark)">复制</van-button>
              </template>
            </van-field>
            <div style="padding: 10px 16px;">
              <van-space>
                <van-button type="primary" size="small" @click="saveAccount(item, account)">保存</van-button>
                <van-button type="danger" size="small" @click="removeAccount(item, account_index)">删除</van-button>
              </van-space>
            </div>
          </van-cell-group>
        </van-tab>
      </van-tabs>
    </div>
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
    },
    visit(item) {
      item.count++;
      window.open('/api/download?_module=site&_action=visit&id=' + item.id, '_blank');
    },
    copy(str) {
      navigator.clipboard.writeText(str);
      common.notify('success', '内容已复制');
    },
    async saveAccount(site, account) {
      let action = 'account_add';
      if (account.id !== 0) {
        action = 'account_edit';
      }
      try {
        let res = await request.post('/api/common?_module=site&_action=' + action, account);
        if (res.data.code !== 0) {
          common.notify('danger', '操作失败：' + res.data.msg);
        } else {
          if (action === 'account_add') {
            Object.assign(account, res.data.data);
            site.accounts.push({
              id: 0,
              site_id: site.id,
              account: '',
              password: '',
              question: '',
              answer: '',
              remark: ''
            });
          }
          common.notify('success', '操作成功');
        }
      } catch (err) {
        common.notify('danger', '操作失败：' + err.message);
      }
    },
    async removeAccount(site, index) {
      let account = site.accounts[index];
      if (account.id === 0) return;
      let result = await common.confirm('确认', '是否删除该项目？');
      if (!result) return;
      try {
        let res = await request.post('/api/common?_module=site&_action=account_remove', { id: account.id });
        if (res.data.code !== 0) {
          common.notify('danger', '操作失败：' + res.data.msg);
        } else {
          site.accounts.splice(index, 1);
          common.notify('success', '操作成功');
        }
      } catch (err) {
        common.notify('danger', '操作失败：' + err.message);
      }
    }
  }
};
</script>