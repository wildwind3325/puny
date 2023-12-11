class Explorer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.i_exts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    this.m_exts = ['.mp3', '.mp4', '.webm', '.ogg', '.wav'];
  }

  dirRoute = [''];
  seperator = '/';
  folders = [];
  files = [];
  zipFile = '';
  zipRoute = [];

  loading = false;
  dirty = false;
  /** @type {Image} */
  image = null;
  /** @type {HTMLCanvasElement} */
  canvas = null;
  /** @type {CanvasRenderingContext2D} */
  ctx = null;
  playing = true;
  forward = true;
  total = 0;
  current = 0;
  images = [];
  delays = [];
  timer = 0;

  scale = 100;
  ox = 0;
  oy = 0;
  x0 = 0;
  y0 = 0;
  x1 = 0;
  y1 = 0;
  moving = false;

  getPath() {
    let str = '';
    for (let i = 0; i < this.dirRoute.length; i++) {
      if (this.seperator === '\\' && i === 0) continue;
      str += this.dirRoute[i] + this.seperator;
    }
    return str;
  }

  getZipPath() {
    let str = '';
    if (this.zipFile) {
      str += this.zipFile + this.seperator;
      for (let i = 0; i < this.zipRoute.length; i++) {
        str += this.zipRoute[i] + this.seperator;
      }
    }
    return str;
  }

  isZip(name) {
    if (name.lastIndexOf('.') < 0) return false;
    let ext = name.substr(name.lastIndexOf('.')).toLowerCase();
    return ext === '.zip';
  }

  isImage(name) {
    if (name.lastIndexOf('.') < 0) return false;
    let ext = name.substr(name.lastIndexOf('.')).toLowerCase();
    if (this.i_exts.indexOf(ext) < 0) return false;
    return true;
  }

  isUgoira(name) {
    if (name.lastIndexOf('.') < 0) return false;
    let ext = name.substr(name.lastIndexOf('.')).toLowerCase();
    return ext === '.frames';
  }

  isMedia(name) {
    if (name.lastIndexOf('.') < 0) return false;
    let ext = name.substr(name.lastIndexOf('.')).toLowerCase();
    if (this.m_exts.indexOf(ext) < 0) return false;
    return true;
  }

  setImage(data) {
    return new Promise((resolve, reject) => {
      let image = new Image();
      image.onload = () => {
        if (image.width === 0 || image.height === 0) {
          this.image = null;
          this.dirty = true;
          resolve(false);
        } else {
          this.image = image;
          this.dirty = true;
          resolve(true);
        }
      };
      image.onerror = () => {
        this.image = null;
        this.dirty = true;
        resolve(false);
      };
      image.src = data;
    });
  }

  setAnime(list) {
    return new Promise((resolve, reject) => {
      this.loading = true;
      let done = 0;
      this.total = list.length;
      this.current = 0;
      this.timer = 0;
      for (let i = 0; i < this.total; i++) {
        let data = Buffer.from(list[i].data, 'base64');
        this.canvas.width = list[i].width;
        this.canvas.height = list[i].height;
        this.ctx.putImageData(new ImageData(Uint8ClampedArray.from(data), list[i].width, list[i].height), 0, 0);
        let image = new Image();
        image.index = i;
        this.images.push(image);
        this.delays.push(list[i].delay);
        image.onload = () => {
          done++;
          if (done === this.total) {
            this.selectFrame();
            this.loading = false;
            resolve();
          }
        };
        image.onerror = () => {
          done++;
          this.images[image.index] = null;
          if (done === this.total) {
            this.selectFrame();
            this.loading = false;
            resolve();
          }
        };
        image.src = this.canvas.toDataURL();
      }
    });
  }

  setUgoira(ugoira) {
    return new Promise((resolve, reject) => {
      this.loading = true;
      let done = 0;
      this.total = ugoira.images.length;
      this.current = 0;
      this.delays = ugoira.delays;
      this.timer = 0;
      for (let i = 0; i < this.total; i++) {
        let image = new Image();
        image.index = i;
        this.images.push(image);
        image.onload = () => {
          done++;
          if (done === this.total) {
            this.selectFrame();
            this.loading = false;
            resolve();
          }
        };
        image.onerror = () => {
          done++;
          this.images[image.index] = null;
          if (done === this.total) {
            this.selectFrame();
            this.loading = false;
            resolve();
          }
        };
        image.src = ugoira.images[i];
      }
    });
  }

  clear(redraw) {
    this.total = 0;
    this.current = 0;
    this.images = [];
    this.delays = [];
    this.timer = 0;
    if (this.image !== null) {
      this.image = null;
      this.dirty = redraw;
    }
  }

  update(ms) {
    if (this.images.length === 0 || !this.playing || this.loading) return;
    this.timer += ms;
    if (this.timer >= this.delays[this.current]) {
      this.dirty = true;
    }
    while (this.timer >= this.delays[this.current]) {
      this.timer -= this.delays[this.current];
      if (this.forward) {
        this.current++;
        if (this.current === this.total) {
          this.current = 0;
        }
      } else {
        this.current--;
        if (this.current < 0) {
          this.current = this.total - 1;
        }
      }
    }
    if (this.dirty) this.selectFrame();
  }

  selectFrame() {
    this.dirty = true;
    this.playing = true;
    for (let i = 0; i < this.images.length; i++) {
      let index = (this.current + i) % this.total;
      if (this.images[index]) {
        this.image = this.images[index];
        return;
      }
    }
    this.image = null;
  }

  getPaintArea(mode, width, height) {
    let x = 0, y = 0, w = this.image.width, h = this.image.height;
    let iw = this.image.width, ih = this.image.height;
    if (mode === 'auto1') {
      if (iw > width || ih > height) {
        if (width * ih > height * iw) {
          w = Math.floor(iw * height / ih);
          h = height;
        }
        else {
          w = width;
          h = Math.floor(ih * width / iw);
        }
      }
      if (width > w) {
        x = Math.floor((width - w) / 2);
      }
      if (height > h) {
        y = Math.floor((height - h) / 2);
      }
    } else if (mode === 'auto2') {
      if (iw > width) {
        w = width;
        h = Math.floor(ih * width / iw);
      } else {
        x = Math.floor((width - w) / 2);
      }
      if (h > height) {
        let dy = this.y1 - this.y0 + this.oy;
        if (dy > 0) dy = 0;
        if (dy < height - h) dy = height - h;
        y = dy;
      } else {
        y = Math.floor((height - h) / 2);
      }
    } else {
      w = Math.floor(iw * this.scale / 100);
      h = Math.floor(ih * this.scale / 100);
      if (w > width) {
        let dx = this.x1 - this.x0 + this.ox;
        if (dx > 0) dx = 0;
        if (dx < width - w) dx = width - w;
        x = dx;
      } else {
        x = Math.floor((width - w) / 2);
      }
      if (h > height) {
        let dy = this.y1 - this.y0 + this.oy;
        if (dy > 0) dy = 0;
        if (dy < height - h) dy = height - h;
        y = dy;
      } else {
        y = Math.floor((height - h) / 2);
      }
    }
    return [x, y, w, h];
  }

  resetLocation() {
    this.ox = 0;
    this.oy = 0;
    this.x0 = 0;
    this.y0 = 0;
  }
}

export default new Explorer();