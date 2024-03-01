<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" :key="$route.name" v-if="$route.meta.keepAlive" />
    </keep-alive>
    <component :is="Component" :key="$route.name" v-if="!$route.meta.keepAlive" />
  </router-view>
  <div v-show="loading" class="overlay"></div>
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