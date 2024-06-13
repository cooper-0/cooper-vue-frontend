<template>
    <div class="main-layout">
    </div>
    </template>
    
    <script>
  export default {
    name: 'MainLayout'
  };
    </script>
    
    <style>
    #main {
      display: flex;
    }
    
    .sidebar {
      width: 240px;
      background-color: #333;
      color: white;
    }
    
    .content-area {
      flex: 1; 
      gap: 1px;
      position: relative;
    }
    
    .user-list {
      position: sticky;
      top: 0;
      width: 100%;
      z-index: 100;
      height: 50px;
      border-bottom: 1px solid #ccc;
      background-color: #f3f3f3; 
    }
    
    .document-title {
      margin-top: 60px; 
    }
    
    .document-editor {
      flex: 1;
    }
    
    .drawer {
      top: 10px;
      right: 0;
      width: 350px;
    }
  
  </style>