<template>
  <div id="main">
    <div class="left-layout" :class="{ 'left-layout-open': !isDrawerOpen }">
      <div class="site-layout">
        <div class="site-title">
          COOPER
        </div>
        
        <WorkspaceList
          :workspaces="workspaces"
          @select-workspace="toggleDocumentList"
          @add-workspace="addNewWorkspace"
          @delete-workspace="deleteWorkspace"
        />
        
        <DocumentList
          v-if="isDocumentListVisible && selectedWorkspace"
          :documents="selectedWorkspace.documents"
          :selectedDocumentId="selectedDocumentId"
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
    
    <div class="right-layout" :class="{ 'right-layout-open': isDrawerOpen }">
      <DocumentTitle v-if="isDrawerOpen && selectedDocumentId" />
      <DocumentEditor v-if="isDrawerOpen && selectedDocumentId" />
    </div>
    
    <VoiceChat v-if="isChatVisible && selectedWorkspace" />
  </div>
</template>

<script>
import WorkspaceList from './WorkspaceList.vue';
import DocumentList from './DocumentList.vue';
import VoiceChat from './VoiceChat.vue';
import DocumentTitle from './DocumentTitle.vue';
import DocumentEditor from './DocumentEditor.vue';

export default {
  components: {
    WorkspaceList,
    DocumentList,
    VoiceChat,
    DocumentTitle,
    DocumentEditor
  },
  props: {
    workspaces: Array,
    selectedWorkspace: Object,
    selectedDocumentId: String
  },
  data() {
    return {
      isDrawerOpen: true,
      isDocumentListVisible: false,
      isChatVisible: false
    };
  },
  methods: {
    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen;
      if (!this.isDrawerOpen) {
        this.isChatVisible = false; // 드로어가 닫힐 때 채팅을 숨김
      }
    },
    toggleDocumentList(ws) {
      if (this.selectedWorkspace && this.selectedWorkspace.id === ws.id) {
        this.isDocumentListVisible = !this.isDocumentListVisible;
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
  height: 100vh; /* height를 100vh로 설정하여 화면에 맞춤 */
}

.left-layout {
  display: flex;
  flex-direction: column;
  width: 240px;
  background-color: #f0f0f0;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden; /* 요소가 사라질 때 내용도 함께 사라지도록 설정 */
}

.left-layout-open {
  width: 0 !important; /* !important를 사용하여 스타일 우선순위 높임 */
}

.site-layout {
  flex: 1;
  overflow-y: auto;
}

.site-title {
  width: 100%;
  text-align: center;
  font-size: 30px;
  font-weight: bold;
  margin: 20px 0;
  color: #333;
}

.drawer-toggle {
  position: absolute; /* position을 fixed에서 absolute로 변경하여 부모 요소에 상대적으로 위치 조정 */
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

.right-layout {
  flex: 1;
  background-color: #fff;
  transition: margin-left 0.3s ease;
  margin-left: -240px; /* 기본 마진을 240px로 설정하여 왼쪽 레이아웃의 너비와 맞춤 */
}

.right-layout-open {
  margin-left: 0; /* 드로어가 열렸을 때 마진을 0으로 설정하여 드로어가 보이도록 함 */
}
</style>