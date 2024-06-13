<template>
    <div class="menu-layout">
    </div>
  </template>
  
  <script>
  export default {
    name: 'MenuLayout'
  };
  </script>
  
  <style>
  .workspace-container {
    display: grid;
    flex-direction: column;
  }
  .workspace-header {
    display: flex;
    align-items: center;
    width: 100%;
  }
  .workspace-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 10px;
    width: 100%;
    border-bottom: 1px solid #ccc; 
  }
  .document-list {
    display: grid;
  }
  </style>