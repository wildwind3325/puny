import { createApp } from 'vue';
import App from './App.vue';
import './util/enhance';
import ElementPlus from 'element-plus';
import zh from 'element-plus/dist/locale/zh-cn.mjs';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import './main.css';

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(ElementPlus, { locale: zh }).mount('#app');