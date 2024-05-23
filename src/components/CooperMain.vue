<template>
  <div id="main">
    <div class="site-title">
      COOPER
    </div>

    <WorkspaceList
      :workspaces="workspaces"
      @select-workspace="selectWorkspace"
      @add-workspace="addNewWorkspace"
      @delete-workspace="deleteWorkspace"
    />
    <DocumentList
      v-if="selectedWorkspace"
      :documents="selectedWorkspace.documents"
      :selectedDocumentId="selectedDocumentId"
      @select-document="openDocument"
      @add-document="addNewDocument"
      @delete-document="deleteDocument"
    />
    <DocumentEditor
      v-if="selectedDocumentId"
      :content="selectedDocumentContent"
      @update-content="updateDocumentContent"
      @save-content="saveDocumentContent"
    />

    <button v-if="selectedWorkspace" @click="toggleDrawer" class="drawer-toggle" :class="{ 'opened': isDrawerOpen }">
  <span class="arrow-icon" :class="{ 'reversed': !isDrawerOpen }">
    <span>▶</span>
  </span>
</button>


    <div :class="['drawer', { 'show': isDrawerOpen }]" v-if="selectedWorkspace">
      <div class="drawer-content">
        <ChatComponent
          :messages="selectedWorkspace.chatMessages"
          @new-message="addMessage"
        />
      </div>
    </div>
  </div>
  <div>
    <voice-chat></voice-chat>
  </div>
</template>

<script>
import WorkspaceList from './WorkspaceList.vue';
import DocumentList from './DocumentList.vue';
import DocumentEditor from './DocumentEditor.vue';
import ChatComponent from './ChatComponent.vue';
import { v4 as uuidv4 } from 'uuid';
import VoiceChat from './VoiceChat.vue';
 

export default {
  components: {
    WorkspaceList,
    DocumentList,
    DocumentEditor,
    ChatComponent,
    VoiceChat
  },
  data() {
    return {
      workspaces: [],
      selectedWorkspace: null,
      selectedDocumentId: null,
      selectedDocumentContent: '',
      isDrawerOpen: false,
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
      this.loadDocumentsFromLocalStorage(ws.id);
    },
    addNewWorkspace(newWorkspaceName) {
      if (newWorkspaceName.trim() !== '') {
        const newWorkspace = {
          id: uuidv4(),
          name: newWorkspaceName.trim(),
          documents: [],
          chatMessages: [],
        };
        this.workspaces.push(newWorkspace);
        this.saveWorkspacesToLocalStorage();
      }
    },
    deleteWorkspace(id) {
      this.workspaces = this.workspaces.filter(ws => ws.id !== id);
      if (this.selectedWorkspace && this.selectedWorkspace.id === id) {
        this.selectedWorkspace = null;
      }
      this.saveWorkspacesToLocalStorage();
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
    addMessage(message) {
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
  },
  mounted() {
    const data = localStorage.getItem('workspaces');
    if (data) {
      this.workspaces = JSON.parse(data);
    }
    window.addEventListener('beforeunload', this.saveWorkspacesToLocalStorage);
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.saveWorkspacesToLocalStorage);
  },
};
</script>

<style scoped>
#main {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 200px;
}

.site-title {
  width: 100%;
  text-align: center;
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 10px;
}

.drawer-toggle {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 101;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
}

.drawer-toggle .arrow-icon {
  display: inline-block;
  transition: transform 0.3s;
}

.drawer-toggle .arrow-icon {
  display: inline-block;
  transition: transform 0.3s;
}

.drawer-toggle .arrow-icon.reversed {
  transform: scaleX(-1);
}

.drawer {
  background-color: #333;
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 400px;
  background-color: #f8f9fa;
  border-left: 1px solid #ccc;
  z-index: 100;
  overflow: hidden;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.drawer.show {
  transform: translateX(0);
}

.drawer-content {
  padding: 50px;
}

</style>