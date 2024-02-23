import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';
import './util/enhance';
import Vant from 'vant';
import 'vant/lib/index.css';
import './main.css';

const app = createApp(App);

app.use(router).use(Vant).mount('#app');