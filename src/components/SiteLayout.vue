<template>
  <div id="main">
    <div class="left-layout" :class="{ 'left-layout-open': !isDrawerOpen }">
      <div class="site-layout">
        <div class="site-title">
          COOPER
        </div>
        <WorkspaceMenuList
          :workspaces="workspaces"
          :selectedWorkspace="selectedWorkspace"
          :documents="selectedWorkspace ? selectedWorkspace.documents : []"
          :selectedDocumentId="selectedDocumentId"
          @select-workspace="toggleDocumentList"
          @add-workspace="addNewWorkspace"
          @delete-workspace="deleteWorkspace"
          @select-document="openDocument"
          @add-document="addNewDocument"
          @delete-document="deleteDocument"
        />
      </div>
      <div class="drawer-toggle" @click="toggleDrawer">
        <span v-if="isDrawerOpen">❮</span>
        <span v-else>❯</span>
      </div>
    </div>     
    <div class="voice-chat">
      <VoiceChat v-if="isChatVisible && isDrawerOpen" />
    </div>
  </div>
</template>

<script>
import WorkspaceMenuList from '@/components/WorkspaceMenuList.vue';
import VoiceChat from './VoiceChat.vue';



export default {
  components: {
    WorkspaceMenuList,
    VoiceChat,


  },
  props: {
    workspaces: Array,
    selectedWorkspace: Object,
    selectedDocumentId: String
  },
  data() {
    return {
      isDrawerOpen: true,
      isChatVisible: false
    };
  },
  methods: {
    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen;
      if (!this.isDrawerOpen) {
        return;
      }
    },
    toggleDocumentList(ws) {
      if (this.selectedWorkspace && this.selectedWorkspace.id === ws.id) {
        this.isDocumentListVisible = true;
      } else {
        this.isDocumentListVisible = true;
        this.$emit('select-workspace', ws);
      }
      this.isChatVisible = this.isDocumentListVisible;
    },
    addNewWorkspace(newWorkspaceName) {
      this.$emit('add-workspace', newWorkspaceName);
    },
    deleteWorkspace(id) {
      this.$emit('delete-workspace', id);
    },
    openDocument(documentId) {
      this.$emit('select-document', documentId);
    },
    addNewDocument(newDocumentName) {
      this.$emit('add-document', newDocumentName);
    },
    deleteDocument(documentId) {
      this.$emit('delete-document', documentId);
    }
  }
};
</script>

<style scoped>
#main {
  display: flex;
  height: 97.6vh;
  overflow: hidden;
}

.left-layout {
  display: flex;
  flex-direction: column;
  width: 240px;
  background-color: #f0f0f0;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  height: 100%; 
}

.left-layout-open {
  width: 0 !important;
}

.left-layout-closed {
  width: 0;
  overflow: hidden;
}
.site-layout {

  overflow: hidden; 
}

.site-title {
  width: 100%;
  text-align: center;
  font-size: 30px;
  font-weight: bold;
  margin: 20px 0;
  color: #333;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.drawer-toggle {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #ddd;
  padding: 10px;
  cursor: pointer;
  z-index: 999;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.drawer-toggle span {
  font-size: 24px;
}

.voice-chat {
  z-index: 5;
}

.right-content {
  flex: 1;
  overflow: auto;
  transition: margin-left 0.3s ease;
}

</style>