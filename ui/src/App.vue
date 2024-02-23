<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" :key="$route.name" v-if="$route.meta.keepAlive" />
    </keep-alive>
    <component :is="Component" :key="$route.name" v-if="!$route.meta.keepAlive" />
  </router-view>
  <van-overlay :show="loading">
    <div class="div-center" style="height: 100%;" @click.stop>
      <van-loading type="spinner" size="30px" vertical>加载中...</van-loading>
    </div>
  </van-overlay>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
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