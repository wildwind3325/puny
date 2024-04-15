<template>
  <van-popup v-model:show="visible" round>
    <div style="width: 80vw; padding: 8px 12px;">
      <div>
        <van-space>
          <van-button type="primary" size="small" @click="update">更新</van-button>
          <van-button type="success" size="small" @click="download">下载</van-button>
          <van-switch v-model="busy" disabled />
          <van-button type="warning" size="small">{{ status }}</van-button>
          <van-button type="danger" size="small" :disabled="!busy" @click="cancel">停止</van-button>
        </van-space>
      </div>
      <van-field v-model="cg_ids" center clearable label="作品ID" style="margin-top: 10px;">
        <template #button>
          <van-button size="small" type="primary" @click="batch">批量下载</van-button>
        </template>
      </van-field>
    </div>
  </van-popup>
</template>

<script>
import common from '../components/common';
import request from '../util/request';
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
    batch() {
      console.log('批量');
    },
    cancel() {
      console.log('停止');
    }
  }
};
</script>