<template>
  <van-popup v-model:show="visible" round>
    <div style="width: 80vw; padding: 8px 12px;">
      <div>
        <van-space>
          <van-button type="primary" size="small" :disabled="busy" @click="update">更新</van-button>
          <van-button type="success" size="small" :disabled="busy" @click="download">下载</van-button>
          <van-switch v-model="busy" disabled />
          <van-button type="warning" size="small">{{ status }}</van-button>
          <van-button type="danger" size="small" :disabled="!busy" @click="cancel">停止</van-button>
        </van-space>
      </div>
      <van-field v-model="cg_ids" rows="3" autosize type="textarea" label="作品ID" style="margin-top: 10px;">
        <template #button>
          <van-button size="small" type="primary" :disabled="busy" @click="batch">批量下载</van-button>
        </template>
      </van-field>
    </div>
  </van-popup>
</template>

<script>
import common from '../components/common';
import request from '../util/request';
import explorer from '../api/explorer';
export default {
  name: 'Pixiv',
  data() {
    return {
      visible: false,
      busy: false,
      cg_ids: '',
      status: '0 / 0',
      timer: null
    };
  },
  mounted() {
    this.timer = setInterval(this.info, 5000);
    this.info();
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  methods: {
    show() {
      this.visible = true;
    },
    async info() {
      try {
        let res = await request.post('/api/common?_module=pixiv&_action=info');
        if (res.data.code === 0) {
          this.busy = res.data.data.busy;
          this.status = res.data.data.message;
        }
      } catch (err) { }
    },
    async update() {
      try {
        let res = await request.post('/api/common?_module=pixiv&_action=update');
        if (res.data.code !== 0) {
          common.notify('danger', '提交失败：' + res.data.msg);
        } else {
          common.notify('success', '提交成功');
        }
      } catch (err) {
        common.notify('danger', '提交失败：' + err.message);
      }
    },
    download() {
      console.log('下载');
    },
    async batch() {
      if (explorer.zipFile || (this.path === '' && explorer.seperator === '\\')) return;
      if (!this.cg_ids) {
        common.notify('warning', '请填入要下载的作品ID，逗号分隔。');
        return;
      }
      let list = [];
      let arr = this.cg_ids.split(',');
      for (let i = 0; i < arr.length; i++) {
        if (!/^\d+$/.test(arr[i])) continue;
        list.push(arr[i]);
      }
      if (list.length === 0) {
        common.notify('warning', '请填入要下载的作品ID，逗号分隔。');
        return;
      }
      try {
        let res = await request.post('/api/common?_module=pixiv&_action=batch', {
          dir: explorer.getPath(),
          cgs: list
        });
        if (res.data.code !== 0) {
          common.notify('danger', '提交失败：' + res.data.msg);
        } else {
          common.notify('success', '提交成功');
        }
      } catch (err) {
        common.notify('danger', '提交失败：' + err.message);
      }
    },
    async cancel() {
      if (!this.busy) {
        common.notify('warning', '当前空闲');
        return;
      }
      try {
        await request.post('/api/common?_module=pixiv&_action=stop');
      } catch (err) { }
    }
  }
};
</script>