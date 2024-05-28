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
    
    <div class="webcam-container">
      <div v-if="isChatVisible && selectedWorkspace" class="connected-users">
        <!-- 로컬 스트림을 첫 번째로 표시 -->
        <video v-if="localStream" :srcObject="localStream" autoplay playsinline controls></video>
        <!-- 원격 스트림 표시 -->
        <video v-for="(stream, id) in peerConnections" :key="id" ref="remoteVideos" :srcObject="stream" autoplay playsinline controls></video>

        <!-- 웹캠 리스트 뷰에 어떻게 나오는지 보려고 테스트--> 
        <video ref="localVideo" autoplay playsinline controls></video>
        <video autoplay playsinline controls></video>
        <video autoplay playsinline controls></video>
        <video autoplay playsinline controls></video>
      </div>
    </div>     

    <div class="right-layout" :class="{ 'right-layout-open': isDrawerOpen }">
      <DocumentTitle v-if="isDrawerOpen && selectedDocumentId" />
      <DocumentEditor v-if="isDrawerOpen && selectedDocumentId" />
    </div>
    <div class="voice-chat">
    <VoiceChat v-if="isChatVisible && selectedWorkspace" />
    </div>
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
  margin-top: 300px; /* 웹캠 컨테이너 높이에 맞춰 상단 마진 조정 */
}

.right-layout-open {
  margin-left: 0; /* 드로어가 열렸을 때 마진을 0으로 설정하여 드로어가 보이도록 함 */
}

.webcam-container {
  position: absolute; /* 절대 위치 지정 */
  top: 80px; /* 헤더 아래 적절한 위치에 배치, 필요에 따라 조정 */
  left: 255px;
  right: 0;
  height: 22%; /* 웹캠 스트림 영역의 높이 */
  overflow-y: hidden; /* 스크롤 방지 */
  background-color: #ffffff;
}
.connected-users {
  position: absolute;
  top: 0;          /* 페이지 최상단 */
  left: 0;
  right:0;

  display: flex;
  flex-direction: row; /* 비디오를 가로로 나열 */
  align-items: center;
  gap: 10px;
  background-color: #f0f0f0;
}
.voice-chat {
  z-index: 500;
}
</style>