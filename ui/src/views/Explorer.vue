<template>
  <van-nav-bar title="文件" left-arrow @click-left="$router.back()" />
  <div style="height: 8px;"></div>
  <div style="padding: 0px 16px;">
    <van-space>
      <van-button type="primary" size="small" @click="up">上一级</van-button>
      <van-button type="primary" size="small" @click="refresh">刷新</van-button>
      <van-button type="warning" size="small" @click="switchViewMode">{{ viewMode }}</van-button>
    </van-space>
  </div>
  <van-field label="路径" :label-width="40" v-model="path" readonly />
  <div v-show="viewMode === '列表'" class="list-container">
    <div v-for="(item, index) in items" :key="index" class="list-item">
      <div style="height: 8px;"></div>
      <div class="list-item-name">{{ item.name }}</div>
      <div style="height: 8px;"></div>
      <div>
        <van-button type="success" size="small" @click="refresh(index)">打开</van-button>
        <van-button type="primary" size="small" style="margin-left: 5px;">预览</van-button>
      </div>
      <div style="height: 8px;"></div>
      <div style="display: flex;">
        <div class="list-item-info" style="flex-grow: 1;">{{ item.fsize }}</div>
        <div class="list-item-info">{{ item.ctime }}</div>
      </div>
      <div style="height: 8px; border-bottom: 1px solid #ebedf0;"></div>
    </div>
    <van-card v-for="(item, index) in items" :key="index" :title="item.name">
      <template #desc>
        <div style="padding-top: 10px;">
          <van-button type="success" size="small" @click="refresh(index)">打开</van-button>
          <van-button type="primary" size="small" style="margin-left: 5px;">预览</van-button>
        </div>
      </template>
      <template #price>
        <div>{{ item.fsize }}</div>
      </template>
      <template #num>
        <div>{{ item.ctime }}</div>
      </template>
    </van-card>
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
      items: [],
      scaleMode: '正常',
      timer: null,
      canvasWidth: 100,
      canvasHeight: 100,
      context: null
    };
  },
  async mounted() {
    this.canvasWidth = Math.floor(document.body.getBoundingClientRect().width);
    this.canvasHeight = Math.floor(document.body.getBoundingClientRect().height) - 162;
    try {
      let res = await request.post('/api/common?_module=explorer&_action=init');
      if (res.data.code !== 0) {
        common.notify('danger', '初始化失败：' + res.data.msg);
        return;
      }
      explorer.seperator = res.data.data;
      await this.refresh();
    } catch (err) {
      common.notify('danger', '初始化失败：' + err.message);
    }
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  methods: {
    updatePath() {
      this.path = explorer.getPath() + explorer.getZipPath();
    },
    async refresh(target) {
      let newDirRoute = explorer.dirRoute, newZipFile = explorer.zipFile, newZipRoute = explorer.zipRoute;
      if (target === '..') {
        if (explorer.zipFile) {
          if (explorer.zipRoute.length > 0) {
            newZipRoute = explorer.zipRoute.slice(0, explorer.zipRoute.length - 1);
          } else {
            newZipFile = '';
            try {
              await request.post('/api/common?_module=explorer&_action=zip_close');
            } catch (err) { }
          }
        } else {
          if (explorer.dirRoute.length > 1) {
            newDirRoute = explorer.dirRoute.slice(0, explorer.dirRoute.length - 1);
          } else { return; }
        }
      } else if (Number.isInteger(target)) {
        let item = this.items[target];
        if (explorer.zipFile) {
          if (target < explorer.folders.length) {
            newZipRoute = explorer.zipRoute.slice(0);
            newZipRoute.push(explorer.folders[target]);
          } else { return; }
        } else {
          if (target < explorer.folders.length) {
            newDirRoute = explorer.dirRoute.slice(0);
            newDirRoute.push(explorer.folders[target]);
          } else if (explorer.isZip(item.name)) {
            try {
              let zipRes = await request.post('/api/common?_module=explorer&_action=zip_open', {
                file: this.path + item.name
              });
              if (zipRes.data.code !== 0) {
                common.notify('danger', '打开压缩包失败：' + zipRes.data.msg);
                return;
              }
            } catch (err) {
              common.notify('danger', '打开压缩包失败：' + err.message);
              return;
            }
            newZipFile = item.name;
          } else {
            let file = explorer.getPath() + item.name;
            if (explorer.isMedia(item.name)) {
              // 播放视频
            } else {
              try {
                await request.post('/api/common?_module=explorer&_action=exec', { file: file });
              } catch (err) { }
            }
            return;
          }
        }
      }
      try {
        let res = await request.post('/api/common?_module=explorer&_action=refresh', {
          dirRoute: newDirRoute,
          zipFile: newZipFile,
          zipRoute: newZipRoute
        });
        if (res.data.code !== 0) {
          common.notify('danger', '浏览失败：' + res.data.msg);
          if (target === '..') {
            explorer.dirRoute = newDirRoute;
            explorer.zipFile = newZipFile;
            explorer.zipRoute = newZipRoute;
            explorer.folders = [];
            explorer.files = [];
            this.updatePath();
            this.items = [];
          }
          return;
        }
        if (target === '..' || Number.isInteger(target)) {
          explorer.dirRoute = newDirRoute;
          explorer.zipFile = newZipFile;
          explorer.zipRoute = newZipRoute;
          this.updatePath();
        }
        explorer.folders = res.data.data.folders;
        explorer.files = res.data.data.files;
        this.items = [];
        for (let i = 0; i < explorer.folders.length; i++) {
          this.items.push({
            name: '[' + explorer.folders[i] + ']',
            size: 0,
            fsize: '',
            ctime: ''
          });
        }
        for (let i = 0; i < explorer.files.length; i++) {
          this.items.push(explorer.files[i]);
        }
        explorer.clear(true);
      } catch (err) {
        common.notify('danger', '浏览失败：' + err.message);
      }
    },
    up() {
      this.refresh('..');
    },
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
.list-item {
  padding: 0px 16px;
}

.list-item-name {
  line-height: 16px;
  font-size: 12px;
  font-weight: bold;
  color: #323233;
}

.list-item-info {
  line-height: 16px;
  font-size: 12px;
  color: #969799;
}

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