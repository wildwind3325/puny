<template>
  <el-config-provider :locale="locale">
    <router-view v-loading.fullscreen.lock="loading" />
  </el-config-provider>
</template>

<script>
import { ElConfigProvider } from 'element-plus';
import zh from 'element-plus/es/locale/lang/zh-cn';
export default {
  name: 'App',
  components: {
    ElConfigProvider
  },
  data() {
    return {
      locale: zh,
      loading: false
    };
  },
  mounted() {
    window.$spin = {
      show: () => { this.loading = true; },
      hide: () => { this.loading = false; }
    };
  }
};
</script>