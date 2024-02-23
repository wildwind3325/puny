<template>
  <div>Home</div>
  <Editor v-model="content" :init="options" />
</template>

<script>
import Editor from '@tinymce/tinymce-vue';
export default {
  name: 'Home',
  components: { Editor },
  data() {
    return {
      options: {
        language: 'zh-Hans',
        branding: false,
        menubar: false,
        resize: false
      },
      content: ''
    };
  }
};
</script>