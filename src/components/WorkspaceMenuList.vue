<template>
  <div @click="closeAllContextMenus">
    <button @click="openWorkspaceModal" class="add-button">Work space +</button>
    <div class="workspace-container">
      <div class="small-menu" ref="smallMenu" :class="{ 'scrollable': workspaces.length > 4 }">
        <ul>
          <li v-for="workspace in workspaces" :key="workspace.id" 
          @click="selectWorkspace(workspace)"
              @contextmenu.prevent="openWorkspaceContextMenu($event, workspace)"
              :class="{ 'selected': workspace === selectedWorkspace }">
              <div class="workspace-header">
                <span class="newWorkspaceName element"
                      @mouseover="showWorkspaceTooltip($event, workspace.name)"
                      @mouseleave="hideTooltip">{{ workspace.name }}</span>
                      <button v-if="selectedWorkspaceId === workspace.id" @click="openDocumentModal" class="add-button">+</button>
              </div>
              <ul v-if="workspace.id === selectedWorkspaceId" class="document-list">
      <li v-for="(document, index) in workspace.documents" 
          :key="document.id"
          @click.stop="selectDocument(document.id)" 
          @mouseenter="showDocumentHoverEffect($event, document)"
          @mouseleave="unhoverDocument"
          @contextmenu.prevent.stop="openDocumentContextMenu($event, document)"
          :class="{ 'selected': document.id === selectedDocumentId, 'hovered': hoveredDocumentId === document.id }"
          :style="{ backgroundColor: documentBackgroundColor(document) }">
                  <span class="newDocumentName"
                        :ref="'documentName' + index"
                        @mouseenter="showDocumentTooltip($event, document.name)"
                        @mouseleave="hideTooltip">{{ document.name }}</span>
                <div class="tooltip" v-if="hoveredDocumentId === document.id">
                  {{ document.name }}
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <Modal :is-open="isWorkspaceModalOpen" @close="closeWorkspaceModal">
      <h2>새 워크스페이스 추가</h2>
      <input v-model="newWorkspaceName" placeholder="새 워크스페이스의 이름" maxlength="30" class="modal-input" ref="newWorkspaceInput">
      <button @click="addWorkspace" class="modal-button">저장</button>
    </Modal>

    <Modal :is-open="isEditWorkspaceModalOpen" @close="closeEditWorkspaceModal">
      <h2>워크스페이스 이름 수정</h2>
      <input v-model="editedWorkspaceName" placeholder="새로운 워크스페이스 이름" maxlength="30" class="modal-input" ref="editedWorkspaceNameInput">
      <button @click="saveEditedWorkspaceName" class="modal-button">저장</button>
    </Modal>

    <Modal :is-open="isDocumentModalOpen" @close="closeDocumentModal">
      <h2>새 문서 추가</h2>
      <input v-model="newDocumentName" placeholder="새 문서의 이름" maxlength="30" class="modal-input" ref="newDocumentInput">
      <button @click="addDocument" class="modal-button">저장</button>
    </Modal>

    <div class="tooltip" v-if="tooltipText" :style="tooltipStyle">
      {{ tooltipText }}
    </div>

    <div class="context-menu" v-if="workspaceContextMenuVisible" :style="workspaceContextMenuStyle">
      <ul>
        <li @click="editWorkspace(workspaceContextMenuWorkspace)" class="context-menu-item">수정</li>
        <li @click="deleteWorkspace(workspaceContextMenuWorkspace.id)" class="context-menu-item">삭제</li>
      </ul>
    </div>

    <div class="context-menu" v-if="documentContextMenuVisible" :style="documentContextMenuStyle">
      <ul>
        <li @click="deleteDocument(documentContextMenuDocument.id)">삭제</li>
      </ul>
    </div>
  </div>
</template>

<script>
import Modal from '@/components/Modal.vue';

export default {
  components: {
    Modal
  },
  props: {
    workspaces: Array,
    selectedWorkspace: Object,
    documents: Array,
    selectedDocumentId: String
  },
  data() {
    return {
      newWorkspaceName: '',
      editedWorkspaceName: '',
      isWorkspaceModalOpen: false,
      tooltipText: '',
      tooltipStyle: {},
      workspaceContextMenuVisible: false,
      workspaceContextMenuStyle: {},
      workspaceContextMenuWorkspace: null,
      isEditWorkspaceModalOpen: false,
      newDocumentName: '',
      isDocumentModalOpen: false,
      documentContextMenuVisible: false,
      documentContextMenuStyle: {},
      tooltipTimer: null,
      selectedWorkspaceId: null,
      hoveredDocumentId: null
    };
  },
  methods: {
    documentBackgroundColor(document) {
      return this.hoveredDocumentId === document.id ? '#d1d1d1' : '';
    },
    showDocumentHoverEffect(event, document) {
      this.hoveredDocumentId = document.id;
      this.showDocumentTooltip(event, document.name);
    },
    unhoverDocument() {
      if (this.selectedDocumentId !== null) {
        this.hoveredDocumentId = this.selectedDocumentId;
      } else {
        this.hoveredDocumentId = null;
      }
    },
    selectWorkspace(workspace) {
    this.selectedWorkspaceId = workspace.id;
    if (!this.selectedWorkspace || workspace !== this.selectedWorkspace) {
      this.$emit('select-workspace', workspace);
    }
  },
    isWorkspaceSelected(workspace) {
      return this.selectedWorkspace === workspace;
    },
    addWorkspace() {
      if (this.newWorkspaceName.trim() !== '') {
        this.$emit('add-workspace', this.newWorkspaceName);
        this.newWorkspaceName = '';
        this.closeWorkspaceModal();
      }
    },
    deleteWorkspace(id) {
      this.$emit('delete-workspace', id);
      this.workspaceContextMenuVisible = false;
    },
    openWorkspaceModal() {
      this.isWorkspaceModalOpen = true;
      this.$nextTick(() => {
        this.$refs.newWorkspaceInput.focus();
      });
    },
    closeWorkspaceModal() {
      this.isWorkspaceModalOpen = false;
    },
    showWorkspaceTooltip(event, workspaceName) {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = setTimeout(() => {
        this.tooltipStyle = {
          left: `${event.clientX}px`,
          top: `${event.clientY - 20}px`,
          zIndex: 9999
        };
        this.tooltipText = workspaceName;
      }, 500);
    },
    showDocumentTooltip(event, documentName) {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = setTimeout(() => {
        this.tooltipStyle = {
          left: `${event.clientX}px`,
          top: `${event.clientY - 20}px`,
          zIndex: 9999
        };
        this.tooltipText = documentName;
      }, 500);
    },
    hideTooltip() {
      clearTimeout(this.tooltipTimer);
      this.tooltipText = '';
    },
    openWorkspaceContextMenu(event, workspace) {
      this.closeDocumentContextMenu();
      this.workspaceContextMenuWorkspace = workspace;
      this.workspaceContextMenuStyle = {
        left: `${event.clientX}px`,
        top: `${event.clientY}px`
      };
      this.workspaceContextMenuVisible = true;
      window.addEventListener('click', this.closeWorkspaceContextMenu);
    },
    closeWorkspaceContextMenu() {
      this.workspaceContextMenuVisible = false;
      window.removeEventListener('click', this.closeWorkspaceContextMenu);
    },
    editWorkspace(workspace) {
      this.workspaceContextMenuWorkspace = workspace;
      this.editedWorkspaceName = workspace.name;
      this.isEditWorkspaceModalOpen = true;
      this.$nextTick(() => {
        this.$refs.editedWorkspaceNameInput.focus();
      });
    },
    closeEditWorkspaceModal() {
      this.isEditWorkspaceModalOpen = false;
    },
    saveEditedWorkspaceName() {
      this.workspaceContextMenuWorkspace.name = this.editedWorkspaceName;
      this.isEditWorkspaceModalOpen = false;
      this.editedWorkspaceName = '';
    },
    selectDocument(id) {
      this.$emit('select-document', id);
    },
    addDocument() {
      if (this.newDocumentName.trim() !== '') {
        this.$emit('add-document', this.newDocumentName);
        this.newDocumentName = '';
        this.closeDocumentModal();
      }
    },
    deleteDocument(id) {
      this.$emit('delete-document', id);
      this.closeDocumentContextMenu();
    },
    openDocumentModal() {
      this.isDocumentModalOpen = true;
      this.$nextTick(() => {
        if (this.$refs.newDocumentInput) {
          this.$refs.newDocumentInput.focus();
        }
      });
    },
    closeDocumentModal() {
      this.isDocumentModalOpen = false;
    },
    openDocumentContextMenu(event, document) {
      this.closeWorkspaceContextMenu();
      this.documentContextMenuDocument = document;
      this.documentContextMenuStyle = {
        left: `${event.clientX}px`,
        top: `${event.clientY}px`
      };
      this.documentContextMenuVisible = true;
      window.addEventListener('click', this.closeDocumentContextMenu);
    },
    closeDocumentContextMenu() {
      this.documentContextMenuVisible = false;
      window.removeEventListener('click', this.closeDocumentContextMenu);
    },
    closeAllContextMenus() {
      this.closeWorkspaceContextMenu();
      this.closeDocumentContextMenu();
    },
  }
};
</script>

<style scoped>
.small-menu {
  padding: 0;
  margin: 0;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 400px;
  border-radius: 8px;
width: 100%;
scrollbar-width: none;
}

.small-menu::-webkit-scrollbar {
  width: 5px;
}

.small-menu::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 10px;
}

.small-menu::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}
.small-menu ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.small-menu ul li {
  padding: 2px;
  cursor: pointer;
  border-radius: 8px;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 98.5%;
}

.small-menu ul li:last-child {
  border-bottom: none;
}

.small-menu ul li:hover {
  background-color: #e2e2e2;
}

.small-menu ul li .newWorkspaceName {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
  white-space: nowrap;
  width: 100%;
}

.workspace-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.document-list {
  list-style-type: none;
  padding: 0;
  position: relative;
  left: 20px;
  width: 200px;
  z-index: 1;
  width: calc(100% - 20px);
}
.document-list button {
  margin-left: auto;
}
.document-list li {
  padding: 8px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: calc(100% - 16px);
}

.document-list li:hover {
  background-color: #f0f0f0;
}

.tooltip {
  position: absolute;
  background-color: #ffffff;
  color: #000000;
  border-radius: 4px;
  padding: 5px 10px;
  border: 1px solid #ccc;
}

.context-menu {
  position: absolute;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 9999;
}

.context-menu ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.context-menu ul li {
  padding: 8px 12px;
  cursor: pointer;
}

.context-menu ul li:hover {
  background-color: #f0f0f0;
}

.modal-button, .add-button {
  background-color: transparent;
  color: rgb(0, 0, 0);
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 4px;
  margin-left: 10px;
}
.add-document-button {
  background-color: #f0f0f0;
  color: rgb(0, 0, 0);
  border: none;
  padding: 5px 15px;
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
}

.add-document-button:hover {
  background-color: #cccccc;
}

.modal-button:hover, .add-button:hover {
  background-color: #cccccc;
}

.modal-input {
  width: calc(100% - 40px);
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.element {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.document-list-wrapper {
  margin-top: 20px;
  max-height: 200px;
  overflow-y: auto;
}

.document-list ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  border-radius: 8px;
}


.document-list ul li {
  padding: 5px 10px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}


.document-list ul li input {
  width: calc(100% - 40px);
  padding: 5px 10px;
}

.document-list ul li button {
  margin-left: 10px;
  padding: 5px;
}

.newDocumentName {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.tooltip {
  position: absolute;
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 9999;
}

.context-menu {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  z-index: 10000;
  width: 150px;
}

.context-menu ul {
  list-style-type: none;
  padding: 5px 0;
  margin: 0;
}

.context-menu ul li {
  padding: 8px 12px;
  cursor: pointer;
}

.context-menu ul li:hover {
  background-color: #f7f7f7;
}

.modal-save-button {
  background-color: #ffffff;  
  color: #000000;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 4px;
}

.modal-save-button:hover {
  background-color: #9d9d9d;
}

.modal-input {
  width: calc(100% - 40px);
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.workspace-container {
  display: flex;
  flex-direction: column;
}

.workspace-documents {
  margin-top: 20px;
}

.workspace-documents h3 {
  margin-bottom: 10px;
}

.workspace-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 10px;
  width: 100%;
}
.newWorkspaceName {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
  white-space: nowrap;
  width: 100%;
}
.small-menu ul li.selected {
  background-color: #e2e2e2;
}
.document-list ul li:hover {
  background-color: #f0f0f0;
}

.document-list ul li.selected {
  background-color: #f0f0f0;
}
</style>