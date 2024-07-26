<template>
  <van-popup v-model:show="visible" round>
    <div style="width: 80vw; padding: 8px 12px;">
      <div>
        <van-space>
          <input v-model="from" type="number" style="width: 60px;" /> - <input v-model="to" type="number"
            style="width: 60px;" />
          <van-button type="success" size="small" :disabled="busy" @click="download">下载</van-button>
        </van-space>
      </div>
      <div style="margin-top: 10px;">
        <van-space>
          <van-switch v-model="busy" disabled />
          <van-button type="warning" size="small">{{ status }}</van-button>
          <van-button type="danger" size="small" :disabled="!busy" @click="cancel">停止</van-button>
        </van-space>
      </div>
      <van-field v-model="gallery" label="链接" style="margin-top: 10px;" />
      <van-cell center title="追加编号">
        <template #right-icon>
          <van-switch v-model="indexing" />
        </template>
      </van-cell>
      <van-cell center title="中等尺寸">
        <template #right-icon>
          <van-switch v-model="medium" />
        </template>
      </van-cell>
    </div>
  </van-popup>
</template>

<script>
import common from '../components/common';
import request from '../util/request';
import explorer from '../api/explorer';
export default {
  name: 'EH',
  data() {
    return {
      visible: false,
      from: '',
      to: '',
      indexing: false,
      medium: false,
      gallery: '',
      busy: false,
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
        let res = await request.post('/api/common?_module=eh&_action=info');
        if (res.data.code === 0) {
          this.busy = res.data.data.busy;
          this.status = res.data.data.msg;
        }
      } catch (err) { }
    },
    async download() {
      if (explorer.zipFile || (explorer.getPath() === '' && explorer.seperator === '\\')) return;
      try {
        let res = await request.post('/api/common?_module=eh&_action=download', {
          from: this.from,
          to: this.to,
          indexing: this.indexing,
          medium: this.medium,
          dir: explorer.getPath(),
          gallery: this.gallery
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
      try {
        await request.post('/api/common?_module=eh&_action=stop');
      } catch (err) { }
    }
  }
};
</script>