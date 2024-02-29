<template>
  <van-nav-bar title="文件" left-arrow @click-left="$router.back()" />
  <div style="height: 8px;"></div>
  <div style="padding: 0px 16px;">
    <van-space>
      <van-button type="primary" size="small">上一级</van-button>
      <van-button type="warning" size="small" @click="switchViewMode">{{ viewMode }}</van-button>
    </van-space>
  </div>
  <van-field label="路径" :label-width="40" v-model="path" readonly />
  <div v-show="viewMode === '列表'" class="list-container">
  </div>
  <div v-show="viewMode === '预览'">
    <div style="padding: 0px 16px;">
      <van-space>
        <van-button type="warning" size="small">{{ scaleMode }}</van-button>
        <van-button type="success" size="small">上一张</van-button>
        <van-button type="default" size="small">0 / 0</van-button>
        <van-button type="success" size="small">下一张</van-button>
      </van-space>
    </div>
    <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight" class="canvas" @mousedown="startMove"
      @mousemove="doMove" @mouseup="stopMove" @mouseout="stopMove"></canvas>
  </div>
</template>

<script>
import common from '../components/common';
import request from '../util/request';
import explorer from '../api/explorer';
export default {
  name: 'Explorer',
  data() {
    return {
      viewMode: '列表',
      path: '',
      dirs: [],
      files: [],
      scaleMode: '正常',
      canvasWidth: 100,
      canvasHeight: 100,
      context: null
    };
  },
  mounted() {
    this.canvasWidth = Math.floor(document.body.getBoundingClientRect().width);
    this.canvasHeight = Math.floor(document.body.getBoundingClientRect().height) - 162;
  },
  methods: {
    switchViewMode() {
      if (this.viewMode === '列表') {
        this.viewMode = '预览';
      } else {
        this.viewMode = '列表';
      }
    }
  }
};
</script>

<style scoped>
.list-container {
  height: calc(100vh - 130px);
  overflow-x: hidden;
  overflow-y: scroll;
}

.canvas {
  width: 100vw;
  height: calc(100vh - 162px);
  display: block;
}
</style>