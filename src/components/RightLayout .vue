<template>
    <div :class="{ 'right-layout-open': isDrawerOpen }" class="right-layout">
      <DocumentTitle :title="documentTitle" />
      <DocumentEditor />
    </div>
  </template>
  
  <script>
  import DocumentTitle from './DocumentTitle.vue';
  import DocumentEditor from './DocumentEditor.vue'; 
  
  export default {
    components: {
      DocumentTitle,
      DocumentEditor
    },
    props: {
      documentTitle: String,
      isDrawerOpen: Boolean
    },
    computed: {
      rightLayoutStyle() {
        return {
          marginLeft: this.isDrawerOpen ? '240px' : '0'
        };
      }
    }
  };
  </script>
  
  <style scoped>
  .right-layout {
    flex: 1;
    padding: 20px;
    background-color: #ffffff;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    transition: margin-left 0.3s ease;
  }
  
  .right-layout-open {
    margin-left: 240px;
  }
  </style>
  