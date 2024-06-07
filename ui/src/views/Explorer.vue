<template>
  <div class="container">
    <van-nav-bar :title="current ? current : '文件'" left-arrow @click-left="$router.back()" />
    <div style="height: 8px; flex-shrink: 0;"></div>
    <div style="padding: 0px 16px;">
      <van-space>
        <van-button type="default" size="small" @click="up">上一级</van-button>
        <van-button type="primary" size="small" @click="create">创建</van-button>
        <van-button type="success" size="small" @click="switchViewMode">{{ viewMode }}</van-button>
        <van-button type="warning" size="small" @click="showPanel = true">更多</van-button>
      </van-space>
      <van-popup v-model:show="showPanel" position="bottom">
        <div class="toolbar">
          <van-action-bar-icon icon="info-o" text="常用" />
          <van-action-bar-button type="primary" text="刷新" class="van-action-bar-button--first"
            @click="doAction('refresh')" />
          <van-action-bar-button type="warning" text="复制" @click="doAction('copy')" />
          <van-action-bar-button type="warning" text="剪切" @click="doAction('cut')" />
          <van-action-bar-button type="success" text="粘贴" class="van-action-bar-button--last"
            @click="doAction('paste')" />
        </div>
        <div class="toolbar">
          <van-action-bar-icon icon="fire-o" text="下载" />
          <van-action-bar-button type="primary" text="Pixiv" class="van-action-bar-button--first"
            @click="doAction('pixiv')" />
          <van-action-bar-button type="warning" text="Inkbunny" @click="doAction('inkbunny')" />
          <van-action-bar-button type="success" text="Exhentai" class="van-action-bar-button--last"
            @click="doAction('exhentai')" />
        </div>
      </van-popup>
    </div>
    <van-field label="路径" :label-width="40" v-model="path" readonly style="flex-shrink: 0;" />
    <div v-show="viewMode === '列表'" class="list-container">
      <div v-for="(item, index) in items" :key="index" class="list-item">
        <div style="height: 8px;"></div>
        <div class="list-item-name">{{ item.fsize ? item.name : '[' + item.name + ']' }}</div>
        <div style="height: 8px;"></div>
        <div>
          <van-button v-show="operatable()" type="default" size="small" :icon="item.checked ? 'success' : 'plus'"
            style="margin-right: 5px;" @click="item.checked = !item.checked"></van-button>
          <van-button type="success" size="small" @click="refresh(index)">打开</van-button>
          <van-button v-show="canPreview(item)" type="primary" size="small" style="margin-left: 5px;"
            @click="toPointer(item)">预览</van-button>
          <van-button v-show="canPlay(item)" type="primary" size="small" style="margin-left: 5px;"
            @click="play(item)">播放</van-button>
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
    <div v-show="viewMode === '预览'" style="padding: 0px 16px; position: relative;">
      <van-space>
        <van-button type="warning" size="small" @click="switchScaleMode">{{ scaleMode }}</van-button>
        <van-button type="success" size="small" icon="arrow-left" @click="toPrev"></van-button>
        <van-button type="default" size="small">{{ pointer + ' / ' + images.length }}</van-button>
        <van-button type="success" size="small" icon="arrow" @click="toNext"></van-button>
        <van-button type="danger" size="small" @click="removeImage">删除</van-button>
      </van-space>
      <div style="line-height: 32px; color: #969799; position: absolute; right: 16px; top: 0px; font-size: 12px;">
        <span>{{ current_size }}</span>
      </div>
    </div>
    <canvas ref="canvas" v-show="viewMode === '预览'" :width="canvasWidth" :height="canvasHeight" class="canvas"
      @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd" @mousedown="mouseStart"
      @mousemove="mouseMove" @mouseup="mouseEnd" @mouseout="mouseEnd"></canvas>
  </div>
  <Pixiv ref="pixiv" />
</template>

<script>
import common from '../components/common';
import request from '../util/request';
import explorer from '../api/explorer';
import Pixiv from './Pixiv.vue';
export default {
  name: 'Explorer',
  components: { Pixiv },
  data() {
    return {
      showPanel: false,
      viewMode: '列表',
      path: '',
      items: [],
      scaleMode: '正常',
      canvasWidth: 100,
      canvasHeight: 100,
      context: null,
      images: [],
      pointer: 0,
      current: '',
      current_size: '',
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
      window.addEventListener('resize', this.fixSize);
      this.context = this.$refs.canvas.getContext('2d');
      this.updateTimer = setInterval(this.update, 50);
      this.paintTimer = setInterval(this.paint, 50);
    } catch (err) {
      common.notify('danger', '初始化失败：' + err.message);
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.fixSize);
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
    fixSize() {
      let rect = this.$refs.canvas.getBoundingClientRect();
      if (this.viewMode === '预览' && rect.width > 0 && rect.height > 0) {
        this.canvasWidth = Math.floor(rect.width);
        this.canvasHeight = Math.floor(rect.height);
        explorer.dirty = true;
      }
    },
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
          if (this.viewMode === '预览') {
            this.switchViewMode();
          }
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
        this.images = [];
        this.pointer = 0;
        this.current = '';
        this.current_size = '';
        this.targetItem = '';
        for (let i = 0; i < explorer.files.length; i++) {
          this.items.push(explorer.files[i]);
          if (explorer.isImage(explorer.files[i].name) || explorer.isUgoira(explorer.files[i].name)) {
            this.images.push(explorer.files[i].name);
          }
        }
        explorer.clear(true);
      } catch (err) {
        common.notify('danger', '浏览失败：' + err.message);
      }
    },
    doAction(action) {
      switch (action) {
        case 'refresh':
          this.refresh();
          break;
        case 'copy':
          this.copy();
          break;
        case 'cut':
          this.cut();
          break;
        case 'paste':
          this.paste();
          break;
        case 'pixiv':
          this.$refs.pixiv.show();
          break;
        default:
          break;
      }
      this.showPanel = false;
    },
    async create() {
      if (!this.operatable()) return;
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
      return item.fsize && (explorer.isImage(item.name) || explorer.isUgoira(item.name));
    },
    canPlay(item) {
      return item.fsize && explorer.isMedia(item.name) && !explorer.zipFile;
    },
    play(item) {
      window.open('/#/player?file=' + explorer.getPath() + item.name, '_blank');
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
          for (let i = 0; i < this.images.length; i++) {
            if (this.images[i] === oldValue) {
              this.images[i] = newValue;
              break;
            }
          }
          if (this.current === oldValue) this.current = newValue;
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
          for (let i = 0; i < this.images.length; i++) {
            if (this.images[i] === this.items[index].name) {
              this.images.splice(i, 1);
              break;
            }
          }
          if (this.current === this.items[index].name) this.toPrev();
        }
        this.items.splice(index, 1);
      } catch (err) {
        common.notify('danger', '删除失败：' + err.message);
      }
    },
    switchViewMode() {
      if (this.viewMode === '列表') {
        this.viewMode = '预览';
        this.$nextTick(() => {
          this.fixSize();
        });
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
    toPrev() {
      if (this.pointer <= 0) return;
      this.pointer--;
      if (this.pointer === 0) {
        this.current = '';
        this.current_size = '';
        this.targetItem = '';
      } else {
        this.targetItem = this.images[this.pointer - 1];
      }
      explorer.clear(true);
    },
    toNext() {
      if (this.pointer >= this.images.length) return;
      this.pointer++;
      this.targetItem = this.images[this.pointer - 1];
      explorer.clear(true);
    },
    removeImage() {
      if (!this.operatable() || !this.current) return;
      for (let i = explorer.folders.length; i < this.items.length; i++) {
        if (this.items[i].name === this.current) {
          this.remove(i);
          break;
        }
      }
    },
    toPointer(item) {
      if (this.current === item.name) return;
      this.targetItem = item.name;
      for (let i = 0; i < this.images.length; i++) {
        if (this.images[i] === item.name) {
          this.pointer = i + 1;
          break;
        }
      }
      explorer.clear(true);
      this.switchViewMode();
    },
    touchStart(event) {
      if (!explorer.image || this.scaleMode === '自动1') return;
      explorer.x0 = event.touches[0].clientX;
      explorer.y0 = event.touches[0].clientY;
      explorer.moving = true;
    },
    touchMove(event) {
      event.preventDefault();
      if (!explorer.image || !explorer.moving || this.scaleMode === '自动1') return;
      explorer.x1 = event.touches[0].clientX;
      explorer.y1 = event.touches[0].clientY;
      explorer.dirty = true;
    },
    touchEnd(event) {
      if (!explorer.image || !explorer.moving || this.scaleMode === '自动1') return;
      let width = this.canvasWidth, height = this.canvasHeight;
      let rect = explorer.getPaintArea(this.scaleMode, width, height);
      explorer.ox = rect[0] > 0 ? 0 : rect[0];
      explorer.oy = rect[1] > 0 ? 0 : rect[1];
      explorer.x0 = 0;
      explorer.y0 = 0;
      explorer.x1 = 0;
      explorer.y1 = 0;
      explorer.moving = false;
    },
    mouseStart(event) {
      if (!explorer.image || this.scaleMode === '自动1') return;
      explorer.x0 = event.clientX;
      explorer.y0 = event.clientY;
      explorer.moving = true;
    },
    mouseMove(event) {
      if (!explorer.image || !explorer.moving || this.scaleMode === '自动1') return;
      explorer.x1 = event.clientX;
      explorer.y1 = event.clientY;
      explorer.dirty = true;
    },
    mouseEnd(event) {
      if (!explorer.image || !explorer.moving || this.scaleMode === '自动1') return;
      let width = this.canvasWidth, height = this.canvasHeight;
      let rect = explorer.getPaintArea(this.scaleMode, width, height);
      explorer.ox = rect[0] > 0 ? 0 : rect[0];
      explorer.oy = rect[1] > 0 ? 0 : rect[1];
      explorer.x0 = 0;
      explorer.y0 = 0;
      explorer.x1 = 0;
      explorer.y1 = 0;
      explorer.moving = false;
    },
    async update() {
      if (this.fetching || !this.targetItem) return;
      this.current = this.targetItem;
      for (let i = explorer.folders.length; i < this.items.length; i++) {
        if (this.items[i].name === this.current) {
          this.current_size = this.items[i].fsize;
          break;
        }
      }
      try {
        this.fetching = true;
        let res = await request.post('/api/common?_module=explorer&_action=image', {
          dirRoute: explorer.dirRoute,
          zipFile: explorer.zipFile,
          zipRoute: explorer.zipRoute,
          file: this.current
        });
        if (res.data.code === 0) {
          if (res.data.data.ugoira) {
            await explorer.setUgoira(res.data.data.ugoira);
          } else if (res.data.data.images) {
            await explorer.setAnime(res.data.data.images);
          } else {
            await explorer.setImage(res.data.data.image);
          }
          explorer.resetLocation();
        } else {
          explorer.clear(true);
        }
      } catch (err) {
        common.notify('danger', '获取图片失败：' + err.message);
      } finally {
        if (this.current == this.targetItem) this.targetItem = '';
        this.fetching = false;
      }
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
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

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
  overflow-x: hidden;
  overflow-y: scroll;
  flex-grow: 1;
}

.canvas {
  display: block;
  width: 100vw;
  flex-grow: 1;
}

.toolbar {
  display: flex;
  align-items: center;
  height: 50px;
}
</style>