<template>
  <van-nav-bar title="文件" left-arrow @click-left="$router.back()" />
  <div style="height: 8px;"></div>
  <div style="padding: 0px 16px;">
    <van-space>
      <van-button type="primary" size="small" @click="up">上一级</van-button>
      <van-button type="primary" size="small" @click="create">创建</van-button>
      <van-button type="success" size="small" @click="copy">复制</van-button>
      <van-button type="warning" size="small" @click="cut">剪切</van-button>
      <van-button type="primary" size="small" @click="paste">粘贴</van-button>
      <van-button type="success" size="small" @click="refresh">刷新</van-button>
      <van-button type="warning" size="small" @click="switchViewMode">{{ viewMode }}</van-button>
    </van-space>
  </div>
  <van-field label="路径" :label-width="40" v-model="path" readonly />
  <div v-show="viewMode === '列表'" class="list-container">
    <div v-for="(item, index) in items" :key="index" class="list-item">
      <div style="height: 8px;"></div>
      <div class="list-item-name">{{ item.fsize ? item.name : '[' + item.name + ']' }}</div>
      <div style="height: 8px;"></div>
      <div>
        <van-button v-show="operatable()" type="default" size="small" :icon="item.checked ? 'success' : 'plus'"
          @click="item.checked = !item.checked" style="margin-right: 5px;"></van-button>
        <van-button type="success" size="small" @click="refresh(index)">打开</van-button>
        <van-button v-show="canPreview(item)" type="primary" size="small" style="margin-left: 5px;">预览</van-button>
        <van-button v-show="canPlay(item)" type="primary" size="small" style="margin-left: 5px;">播放</van-button>
        <van-button v-show="operatable()" type="warning" size="small" style="margin-left: 5px;"
          @click="rename(index)">重命名</van-button>
        <van-button v-show="operatable()" type="danger" size="small" style="margin-left: 5px;"
          @click="remove(index)">删除</van-button>
      </div>
      <div v-show="item.fsize" style="height: 8px;"></div>
      <div v-show="item.fsize" style="display: flex;">
        <div class="list-item-info" style="flex-grow: 1;">{{ item.fsize }}</div>
        <div class="list-item-info">{{ item.ctime }}</div>
      </div>
      <div style="height: 8px; border-bottom: 1px solid #ebedf0;"></div>
    </div>
  </div>
  <div v-show="viewMode === '预览'">
    <div style="padding: 0px 16px;">
      <van-space>
        <van-button type="warning" size="small" @click="switchScaleMode">{{ scaleMode }}</van-button>
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
      canvasWidth: 100,
      canvasHeight: 100,
      context: null,
      targetItem: '',
      fetching: false,
      updateTimer: null,
      paintTimer: null
    };
  },
  async mounted() {
    try {
      let res = await request.post('/api/common?_module=explorer&_action=init');
      if (res.data.code !== 0) {
        common.notify('danger', '初始化失败：' + res.data.msg);
        return;
      }
      explorer.seperator = res.data.data;
      this.updatePath();
      await this.refresh();
      this.canvasWidth = Math.floor(document.body.getBoundingClientRect().width);
      this.canvasHeight = Math.floor(document.body.getBoundingClientRect().height) - 162;
      this.context = this.$refs.canvas.getContext('2d');
      explorer.dirty = true;
      this.updateTimer = setInterval(this.update, 50);
      this.paintTimer = setInterval(this.paint, 50);
    } catch (err) {
      common.notify('danger', '初始化失败：' + err.message);
    }
  },
  beforeDestroy() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    if (this.paintTimer) {
      clearInterval(this.paintTimer);
      this.paintTimer = null;
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
            newZipRoute.push(item.name);
          } else { return; }
        } else {
          if (target < explorer.folders.length) {
            newDirRoute = explorer.dirRoute.slice(0);
            newDirRoute.push(item.name);
          } else if (explorer.isZip(item.name)) {
            try {
              let res = await request.post('/api/common?_module=explorer&_action=zip_open', {
                file: this.path + item.name
              });
              if (res.data.code !== 0) {
                common.notify('danger', '打开压缩包失败：' + res.data.msg);
                return;
              }
            } catch (err) {
              common.notify('danger', '打开压缩包失败：' + err.message);
              return;
            }
            newZipFile = item.name;
          } else {
            let file = explorer.getPath() + item.name;
            try {
              let res = await request.post('/api/common?_module=explorer&_action=exec', { file: file });
              if (res.data.code !== 0) {
                common.notify('danger', '打开文件失败：' + res.data.msg);
              }
            } catch (err) {
              common.notify('danger', '打开文件失败：' + err.message);
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
            name: explorer.folders[i],
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
    async create() {
      if (explorer.zipFile || (this.path === '' && explorer.seperator === '\\')) return;
      let name = window.prompt('请输入名称：');
      if (!name) return;
      try {
        let res = await request.post('/api/common?_module=explorer&_action=create', { dir: explorer.getPath() + name });
        if (res.data.code !== 0) {
          common.notify('danger', '创建失败：' + res.data.msg);
          return;
        }
        explorer.folders.push(name);
        this.items.splice(explorer.folders.length - 1, 0, {
          name: name,
          size: 0,
          fsize: '',
          ctime: ''
        });
      } catch (err) {
        common.notify('danger', '创建失败：' + err.message);
      }
    },
    setClipData(action) {
      if (!this.operatable()) return;
      let data = {
        action: action,
        dir: explorer.getPath(),
        list: []
      };
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].checked) {
          data.list.push({
            type: this.items[i].fsize ? 'file' : 'folder',
            name: this.items[i].name
          });
        }
      }
      if (data.list.length === 0) {
        common.notify('warning', '未选择任何项目');
        return;
      }
      localStorage.setItem('clipData', JSON.stringify(data));
    },
    copy() {
      this.setClipData('copy');
    },
    cut() {
      this.setClipData('cut');
    },
    async paste() {
      if (!this.operatable()) return;
      let clipData = localStorage.getItem('clipData');
      if (!clipData) {
        common.notify('warning', '剪贴板为空');
        return;
      }
      let data = JSON.parse(clipData);
      if (!data.action || data.list.length === 0) {
        common.notify('warning', '剪贴板为空');
        return;
      }
      if (explorer.getPath() === data.dir) {
        common.notify('warning', '源路径和目标路径相同');
        return;
      }
      data.target = explorer.getPath();
      try {
        let res = await request.post('/api/common?_module=explorer&_action=clipboard', data);
        if (res.data.code !== 0) {
          common.notify('danger', '粘贴失败：' + res.data.msg);
          return;
        }
        common.notify('success', '粘贴完成');
        localStorage.removeItem('clipData');
      } catch (err) {
        common.notify('danger', '粘贴失败：' + err.message);
      }
    },
    up() {
      this.refresh('..');
    },
    operatable() {
      return !explorer.zipFile && !(this.path === '' && explorer.seperator === '\\');
    },
    canPreview(item) {
      return item.fsize && explorer.isImage(item.name);
    },
    canPlay(item) {
      return item.fsize && explorer.isMedia(item.name);
    },
    async rename(index) {
      if (!this.operatable()) return;
      let oldValue = this.items[index].name;
      let newValue = window.prompt('请输入名称：', oldValue);
      if (!newValue) return;
      try {
        let res = await request.post('/api/common?_module=explorer&_action=rename', {
          dir: explorer.getPath(),
          oldValue: oldValue,
          newValue: newValue
        });
        if (res.data.code !== 0) {
          common.notify('danger', '重命名失败：' + res.data.msg);
          return;
        }
        if (index < explorer.folders.length) {
          explorer.folders[index] = newValue;
        } else {
          explorer.files[index - explorer.folders.length].name = newValue;
        }
        this.items[index].name = newValue;
        let item = this.items[index];
        this.items.splice(index, 1, JSON.parse(JSON.stringify(item)));
      } catch (err) {
        common.notify('danger', '重命名失败：' + err.message);
      }
    },
    async remove(index) {
      if (!this.operatable()) return;
      let result = await common.confirm('确认', '是否删除该项目？');
      if (!result) return;
      try {
        let res = await request.post('/api/common?_module=explorer&_action=remove', {
          path: explorer.getPath() + this.items[index].name
        });
        if (res.data.code !== 0) {
          common.notify('danger', '删除失败：' + res.data.msg);
          return;
        }
        if (index < explorer.folders.length) {
          explorer.folders.splice(index, 1);
        } else {
          explorer.files.splice(index - explorer.folders.length, 1);
        }
        this.items.splice(index, 1);
      } catch (err) {
        common.notify('danger', '删除失败：' + err.message);
      }
    },
    switchViewMode() {
      if (this.viewMode === '列表') {
        this.viewMode = '预览';
      } else {
        this.viewMode = '列表';
      }
    },
    switchScaleMode() {
      if (this.scaleMode === '正常') {
        this.scaleMode = '自动1';
      } else if (this.scaleMode === '自动1') {
        this.scaleMode = '自动2';
      } else {
        this.scaleMode = '正常';
        explorer.scale = 100;
      }
      if (explorer.image) explorer.dirty = true;
    },
    update() {
    },
    paint() {
      explorer.update(50);
      if (!explorer.dirty) return;
      explorer.dirty = false;
      if (!explorer.image) {
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        return;
      }
      let image = explorer.image;
      let width = this.canvasWidth, height = this.canvasHeight;
      let rect = explorer.getPaintArea(this.scaleMode, width, height);
      this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.context.drawImage(image, 0, 0, image.width, image.height, ...rect);
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