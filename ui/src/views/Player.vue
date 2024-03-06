<template>
  <div class="div-center" style="height: 100vh;">
    <video autoplay controls>
      <source :src="src">
    </video>
  </div>
</template>

<script>
export default {
  name: 'Player',
  data() {
    return {
      src: ''
    };
  },
  mounted() {
    this.src = '/api/download?_module=explorer&_action=play&file=' + this.$route.query.file;
  }
};
</script>