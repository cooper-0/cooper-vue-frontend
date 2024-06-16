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
      <div class="user-list" v-if="selectedWorkspace">
        <UserList />
      </div>

      <div class="document-title" v-if="selectedDocumentId">
        <DocumentTitle
          :initialTitle="selectedDocumentTitle"
          @title-updated="handleTitleUpdated"
        />
      </div>

      <div class="document-editor" v-if="selectedDocumentId">
        <DocumentEditor
          :content="selectedDocumentContent"
          @update-content="updateDocumentContent"
          @save-content="saveDocumentContent"
        />
      </div>

      <div class="drawer-toggle-area" v-if="selectedWorkspace">
        <button @click="toggleDrawer" class="drawer-toggle" :class="{ 'opened': isDrawerOpen }">
          <span v-if="isDrawerOpen" class="arrow-icon">💬</span>
          <span v-else class="arrow-icon">🗨️</span>
        </button>
      </div>

      <div :class="['drawer', { 'show': isDrawerOpen }]" v-if="selectedWorkspace">
        <div class="drawer-content">
          <ChatComponent
            :messages="selectedWorkspace.chatMessages"
            @new-message="addMessage"
          />
        </div>
      </div>
    <div class="main-layout">
        <MainLayout></MainLayout>
      </div>
  </div>
</div>

</template>

<script>
import SiteLayout from './SiteLayout.vue';
import DocumentEditor from './DocumentEditor.vue';
import ChatComponent from './ChatComponent.vue';
import { v4 as uuidv4 } from 'uuid';
import DocumentTitle from './DocumentTitle.vue';
import UserList from './UserList.vue';
import MainLayout from '../Layout/MainLayout.vue';

export default {
components: {
  MainLayout,
  SiteLayout,
  DocumentEditor,
  ChatComponent,
  DocumentTitle,
  UserList,
},
data() {
  return {
    workspaces: [],
    selectedWorkspace: null,
    selectedDocumentId: null,
    selectedDocumentContent: '',
    isDrawerOpen: false,
    selectedDocumentTitle: ''
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
      this.selectedDocumentId = null;
      this.selectedDocumentContent = '';
      this.selectedDocumentTitle = '';
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
}

.content-area {
display: flex;
flex-direction: column;
height: 97.7vh;
flex-grow: 1;
}

.drawer-toggle {
position: fixed;
top: 10px;
right: 10px;
z-index: 101;
background-color: #787878;
color: white;
border: none;
padding: 10px;
cursor: pointer;
}

.drawer-toggle .arrow-icon {
  font-size: 18px;
}

.drawer-toggle .arrow-icon.reversed {
  transform: scaleX(-1);
}

.drawer {
background-color: #333;
position: fixed;
height: 100vh;
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
.arrow-icon {
font-size: 18px;
}
</style>
