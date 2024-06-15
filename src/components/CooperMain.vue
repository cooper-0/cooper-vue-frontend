<template>
  <div id="main">
    <SiteLayout
        :workspaces="workspaces"
        :selectedWorkspace="selectedWorkspace"
        :selectedDocumentId="selectedDocumentId"
        @select-workspace="selectWorkspace"
        @add-workspace="addNewWorkspace"
        @delete-workspace="deleteWorkspace"
        @select-document="openDocument"
        @add-document="addNewDocument"
        @delete-document="deleteDocument"
    />

    <div class="content-area">
      <HeadComponent v-if="selectedWorkspace"
                     :selectedWorkspace="selectedWorkspace"
                     @add-message="handleAddMessage"/>

      <DocumentEditor
          v-if="selectedDocumentId"
          :content="selectedDocumentContent"
          @update-content="updateDocumentContent"
          @save-content="saveDocumentContent"
      />

      <DocumentTitle
          v-if="selectedDocumentId"
          :initialTitle="selectedDocumentTitle"
          @title-updated="handleTitleUpdated"
      />
    </div>
  </div>
</template>

<script>
import SiteLayout from './SiteLayout.vue';
import DocumentEditor from './DocumentEditor.vue';
//import ChatComponent from './ChatComponent.vue';
import { v4 as uuidv4 } from 'uuid';
import DocumentTitle from './DocumentTitle.vue';
//import UserList from './UserList.vue';
import HeadComponent from './HeadComponent.vue';
import axios from "axios";

export default {
  components: {
    SiteLayout,
    DocumentEditor,
    //ChatComponent,
    DocumentTitle,
    //UserList,
    HeadComponent,
  },
  data() {
    return {
      workspaces: [],
      selectedWorkspace: null,
      selectedDocumentId: null,
      selectedDocumentContent: '',
      isDrawerOpen: false,
      selectedDocumentTitle: '',
    };
  },
  methods: {
    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen;
    },
    selectWorkspace(ws) {
      this.selectedWorkspace = ws;
      this.selectedDocumentId = null;
      this.selectedDocumentContent = '';
      this.selectedDocumentTitle = '';
      this.loadDocumentsFromLocalStorage(ws.id);
    },
    addNewWorkspace(newWorkspaceName) {
      if (newWorkspaceName.trim() !== '') {
        const newWorkspace = {
          id: uuidv4(),
          name: newWorkspaceName.trim(),
        };

        // 채팅 컬렉션 생성 요청
        axios.post(`/cooper-chat/create`, null, { params: { roomId: newWorkspace.id } })
            .then(response => {
              // 채팅 컬렉션 생성 후 처리
              const chatResult = response.data;
              console.log('채팅 컬렉션이 생성되었습니다.');

              // this.workspaces 업데이트
              this.workspaces = chatResult;

              // 이벤트 발생 및 초기화
              this.$emit('add-workspace', newWorkspace);
              this.newWorkspaceName = '';
            })
            .catch(error => {
              console.error('채팅 컬렉션 생성 실패:', error);
            });


      }
    },
    // 워크스페이스 삭제
    deleteWorkspace(id) {
      console.log('삭제 요청 ID:', id);  // 디버깅 메시지 추가

      // 삭제하려는 워크스페이스가 현재 선택되어있는 워크스페이스라면 이 부분이 실행
      if (this.selectedWorkspace && this.selectedWorkspace.id === id) {
        // this.disconnectWs(); // 삭제하기 전, 워크스페이스에 대한 구독 해제
        this.selectedWorkspace = null;
        this.selectedDocument = null;
        this.selectedDocumentTitle = '';
      }

      // 채팅 서버 몽고DB 컬렉션 삭제
      axios.delete(`http://localhost:8080/cooper-chat/deleteRoom/${id}`)
          .then(response => {
            console.log('채팅 컬렉션이 삭제되었습니다:', response.data);
            // 삭제된 워크스페이스 ID를 부모 컴포넌트에 전달
            this.$emit('delete-workspace', id);
            this.contextMenuVisible = false;
          })
          .catch(error => {
            console.error('채팅 컬렉션 삭제 실패:', error);
          });
    },
    addNewDocument(newDocumentName) {
      if (this.selectedWorkspace && newDocumentName.trim() !== '') {
        const newDocument = {
          id: uuidv4(),
          name: newDocumentName.trim(),
          content: '',
        };
        this.selectedWorkspace.documents.push(newDocument);
        this.saveWorkspaceToLocalStorage(this.selectedWorkspace);
      }
    },
    deleteDocument(documentId) {
      if (this.selectedWorkspace) {
        this.selectedWorkspace.documents = this.selectedWorkspace.documents.filter(doc => doc.id !== documentId);
        this.saveWorkspaceToLocalStorage(this.selectedWorkspace);
      }
    },
    openDocument(documentId) {
      const document = this.selectedWorkspace.documents.find(doc => doc.id === documentId);
      if (document) {
        this.selectedDocumentContent = document.content;
        this.selectedDocumentId = documentId;
        this.selectedDocumentTitle = document.name;
      }
    },
    updateDocumentContent(content) {
      this.selectedDocumentContent = content;
    },
    saveDocumentContent() {
      if (this.selectedWorkspace && this.selectedDocumentId !== null) {
        const document = this.selectedWorkspace.documents.find(doc => doc.id === this.selectedDocumentId);
        if (document) {
          document.content = this.selectedDocumentContent;
          this.saveWorkspaceToLocalStorage(this.selectedWorkspace);
        }
      }
    },
    handleTitleUpdated(newTitle) {
      if (this.selectedWorkspace && this.selectedDocumentId !== null) {
        const document = this.selectedWorkspace.documents.find(doc => doc.id === this.selectedDocumentId);
        if (document) {
          document.name = newTitle;
          this.saveWorkspaceToLocalStorage(this.selectedWorkspace);
        }
      }
    },
    handleAddMessage(message) {
      if (this.selectedWorkspace) {
        this.selectedWorkspace.chatMessages.push(message);
        this.saveWorkspaceToLocalStorage(this.selectedWorkspace);
      }
    },
    loadDocumentsFromLocalStorage(workspaceId) {
      const data = localStorage.getItem(`workspace-${workspaceId}`);
      if (data) {
        const workspace = this.workspaces.find(ws => ws.id === workspaceId);
        if (workspace) {
          const storedData = JSON.parse(data);
          workspace.documents = storedData.documents || [];
          workspace.chatMessages = storedData.chatMessages || [];
        }
      }
    },
    saveWorkspaceToLocalStorage(workspace) {
      localStorage.setItem(`workspace-${workspace.id}`, JSON.stringify(workspace));
    },
    saveWorkspacesToLocalStorage() {
      localStorage.setItem('workspaces', JSON.stringify(this.workspaces));
    },
    loadWorkspacesFromLocalStorage() {
      const data = localStorage.getItem('workspaces');
      if (data) {
        this.workspaces = JSON.parse(data);
      }
    }
  },
  mounted() {
    this.loadWorkspacesFromLocalStorage();
    window.addEventListener('beforeunload', this.saveWorkspacesToLocalStorage);
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.saveWorkspacesToLocalStorage);
  }
};
</script>

<style scoped>
#main {
  display: flex;
  flex-direction: row;
}

.content-area {
  display: flex;
  flex-direction: column;
  height: 100vh;
  flex-grow: 1;
}
</style>
