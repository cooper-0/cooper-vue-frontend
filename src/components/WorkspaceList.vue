<template>
  <div>
    <div class="big-menu" @click="toggleMenu">Work space <span class="arrow-icon">▼</span></div>
    <div v-if="isMenuOpen" class="small-menu" ref="smallMenu">
      <ul>
        <li v-for="(workspace, index) in workspaces" :key="workspace.id" @click="selectWorkspace(workspace)">
          <span class="newWorkspaceName"
                :ref="'workspaceName' + index"
                @mouseover="showTooltip($event, workspace.name, index)"
                @mouseleave="hideTooltip">{{ workspace.name }}</span>
          <button @click.stop="deleteWorkspace(workspace.id)">🗑️</button>
        </li>
        <li>
          <button @click="openModal">추가</button>
        </li>
      </ul>
    </div>

    <div class="tooltip" v-if="workspaceNameTooltip" :style="tooltipStyle">
      {{ workspaceNameTooltip }}
    </div>

    <Modal :is-open="isModalOpen" @close="closeModal">
      <h2>새 워크스페이스 추가</h2>
      <input v-model="newWorkspaceName" placeholder="새 워크스페이스의 이름">
      <button @click="addWorkspace">추가</button>
    </Modal>
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
      isMenuOpen: false,
      isModalOpen: false,
      workspaceNameTooltip: '',
      tooltipStyle: {}
    };
  },
  methods: {
    selectWorkspace(workspace) {
      this.$emit('select-workspace', workspace);
      this.isDrawerOpen = false;
    },
    addWorkspace() {
      if (this.newWorkspaceName.trim() !== '') {
        this.$emit('add-workspace', this.newWorkspaceName);
        this.newWorkspaceName = '';
        this.closeModal();
      }
    },
    deleteWorkspace(id) {
      this.$emit('delete-workspace', id);
      this.isDrawerOpen = false;
    },
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
    openModal() {
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
    },
    showTooltip(event, workspaceName) {
  // 일정 시간을 기다린 후에 툴팁을 표시합니다.
  this.tooltipTimer = setTimeout(() => {
    const offsetX = event.clientX;
    const offsetY = event.clientY;
    this.tooltipStyle = {
      left: `${offsetX}px`,
      top: `${offsetY - 20}px`,
      zIndex: 9999
    };
    this.workspaceNameTooltip = workspaceName;
  }, 1000); // 1000 밀리초 = 1초
},

hideTooltip() {
  // 툴팁이 나타나기 전에 마우스가 벗어났다면 타이머를 해제합니다.
  clearTimeout(this.tooltipTimer);
  this.workspaceNameTooltip = '';
}
  }
};
</script>

<style scoped>
.big-menu {
  background-color: #dcdcdc;
  padding: 10px;
  cursor: pointer;
  border: 1px solid #ccc;
}

.big-menu:hover {
  background-color: #d0d0d0;
}

.small-menu {
  background-color: #e0e0e0;
  padding: 10px;
  border: 1px solid #ccc;
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
  padding: 5px 10px;
  cursor: pointer;
  border-bottom: 1px solid #ccc;
}

.small-menu ul li:hover {
  background-color: #d0d0d0;
}

.small-menu ul li input {
  width: calc(100% - 40px);
  padding: 5px 15px;
}

.small-menu ul li button {
  margin-left: 10px;
  padding: 5px;
}

.newWorkspaceName {
  overflow: hidden;
  white-space: nowrap;
  position: relative;
}

.tooltip {
  position: absolute;
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  left: 0;
  top: 0;
}
</style>
