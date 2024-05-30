<template>
  <div>
    <button @click="openModal" class="add-button">Work space +</button>
    <div class="small-menu" ref="smallMenu" :class="{ 'scrollable': workspaces.length > 4 }">
      <ul>
        <li v-for="workspace in workspaces" :key="workspace.id" 
            @click="selectWorkspace(workspace)"
            @contextmenu.prevent="openContextMenu($event, workspace)">
          <span class="newWorkspaceName"
                @mouseover="showTooltip($event, workspace.name)"
                @mouseleave="hideTooltip">{{ workspace.name }}</span>
        </li>
      </ul>
    </div>

    <div class="tooltip" v-if="workspaceNameTooltip" :style="tooltipStyle">
      {{ workspaceNameTooltip }}
    </div>

    <Modal :is-open="isModalOpen" @close="closeModal">
      <h2>새 워크스페이스 추가</h2>
      <input v-model="newWorkspaceName" placeholder="새 워크스페이스의 이름" maxlength="20" class="modal-input" ref="newWorkspaceInput">

      <button @click="addWorkspace" class="modal-button">저장</button>
    </Modal>

    <Modal :is-open="isEditModalOpen" @close="closeEditModal">
      <h2>워크스페이스 이름 수정</h2>
      <input v-model="editedWorkspaceName" placeholder="새로운 워크스페이스 이름" maxlength="20" class="modal-input" ref="editedWorkspaceNameInput">

      <button @click="saveEditedWorkspaceName" class="modal-button">저장</button>
    </Modal>

    <div class="context-menu" v-if="contextMenuVisible" :style="contextMenuStyle">
      <ul>
        <li @click="editWorkspace(contextMenuWorkspace)" class="context-menu-item">수정</li>
        <li @click="deleteWorkspace(contextMenuWorkspace.id)" class="context-menu-item">삭제</li>
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
    workspaces: Array
  },
  data() {
    return {
      newWorkspaceName: '',
      editedWorkspaceName: '',
      isModalOpen: false,
      workspaceNameTooltip: '',
      tooltipStyle: {},
      contextMenuVisible: false,
      contextMenuStyle: {},
      contextMenuWorkspace: null,
      isEditModalOpen: false,
    };
  },
  methods: {
    selectWorkspace(workspace) {
      this.$emit('select-workspace', workspace);
    },

    addWorkspace() {
      if (this.newWorkspaceName.trim() !== '') {
        this.$emit('add-workspace', this.newWorkspaceName);
        this.newWorkspaceName = '';
        this.closeModal();
      } else {
        alert("워크스페이스 이름을 입력하세요.");
      }
    },

    deleteWorkspace(id) {
      this.$emit('delete-workspace', id);
      this.contextMenuVisible = false;
    },

    openModal() {
      this.isModalOpen = true;
      this.$nextTick(() => {
        this.$refs.newWorkspaceInput.focus();
      });
    },

    closeModal() {
      this.isModalOpen = false;
    },

    showTooltip(event, workspaceName) {
      this.hideTooltip();
      this.tooltipTimer = setTimeout(() => {
        const offsetX = event.clientX;
        const offsetY = event.clientY;
        this.tooltipStyle = {
          left: `${offsetX}px`,
          top: `${offsetY - 20}px`,
          zIndex: 9999
        };
        this.workspaceNameTooltip = workspaceName;
      }, 1000);
    },

    hideTooltip() {
      clearTimeout(this.tooltipTimer);
      this.workspaceNameTooltip = '';
    },

    openContextMenu(event, workspace) {
      this.contextMenuWorkspace = workspace;
      this.contextMenuStyle = {
        left: `${event.clientX}px`,
        top: `${event.clientY}px`
      };
      this.contextMenuVisible = true;
      document.addEventListener('click', this.closeContextMenu);
    },

    closeContextMenu() {
      this.contextMenuVisible = false;
      document.removeEventListener('click', this.closeContextMenu);
    },

    editWorkspace(workspace) {
      this.contextMenuWorkspace = workspace;
      this.editedWorkspaceName = workspace.name;
      this.isEditModalOpen = true;
      this.$nextTick(() => {
        this.$refs.editedWorkspaceNameInput.focus();
      });
    },

    closeEditModal() {
      this.isEditModalOpen = false;
    },

    saveEditedWorkspaceName() {
      this.contextMenuWorkspace.name = this.editedWorkspaceName;
      this.isEditModalOpen = false;
      this.editedWorkspaceName = '';
    },
  }
  };
</script>

<style scoped>
.small-menu {
  padding: 0;
  margin: 0;
  overflow-y: auto;
  max-height: calc(100vh - 500px);
  border: 1px solid #bcbcbc;
  border-radius: 8px;
}

.small-menu.scrollable {
  overflow-y: auto;
}

.small-menu ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.small-menu ul li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #ddd;
  border-radius: 8px;
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
}

.tooltip {
  position: absolute;
  background-color: #ffffff;
  color: #000000;
  border-radius: 4px;
  padding: 5px 10px;
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

.modal-button {
  background-color: #ffffff;
  color: rgb(0, 0, 0);
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 4px;
}

.modal-button:hover {
  background-color: #9d9d9d;
}

.add-button {
  background-color: #f0f0f0;
  color: rgb(0, 0, 0);
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 4px;
}

.add-button:hover {
  background-color: #cccccc;
}

.modal-input {
  width: calc(100% - 40px);
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
