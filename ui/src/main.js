import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';
import './util/enhance';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import JsonEditorVue from 'json-editor-vue';
import './main.css';

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
app.use(JsonEditorVue);

app.use(router).use(ElementPlus).mount('#app');