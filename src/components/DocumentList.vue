<template>
  <div>
    <div class="document-list-wrapper">
      <button @click="openModal" class="add-button">Document + </button>
      <div class="document-list">
        <ul>
          <li v-for="(document, index) in documents" :key="document.doc.id" @contextmenu.prevent="openDocumentContextMenu($event, document.doc)">
            <span class="newDocumentName"
                  :ref="'documentName' + index"
                  @mouseover="startTooltipTimer($event, document.doc.name, index)"
                  @mouseleave="hideTooltip"
                  @click="openDocument(document.doc)">
              {{ document.doc.name }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <Modal :is-open="isModalOpen" @close="closeModal">
      <h2>새 문서 추가</h2>
      <input v-model="newDocumentName" placeholder="새 문서의 이름" maxlength="20" class="modal-input" ref="newDocumentInput">
      <button @click="addDocument" class="modal-save-button">저장</button>
    </Modal>

    <div class="tooltip" v-if="documentNameTooltip" :style="tooltipStyle">
      {{ documentNameTooltip }}
    </div>

    <div class="context-menu" v-if="contextMenuVisible" :style="contextMenuStyle">
      <ul>
        <li @click="deleteDocument(contextMenuDocument.id)">삭제</li>
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
    documents: Array,
  },

  data() {
    return {
      isModalOpen: false,
      documentNameTooltip: '',
      tooltipStyle: {},
      newDocumentName: '',
      contextMenuVisible: false,
      contextMenuStyle: {},
      contextMenuDocument: null,
      tooltipTimer: null
    };
  },

  mounted() {
    document.addEventListener('click', this.handleOutsideClick);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick);
  },

  methods: {
    openDocument(document) {
      this.$emit('select-document', document);
    },

    addDocument() {
      if (this.newDocumentName.trim() !== '') {
        this.$emit('add-document', this.newDocumentName);
        this.newDocumentName = '';
        this.closeModal();
      } else {
        alert("문서 이름을 입력하세요.");
      }
    },

    deleteDocument(id) {
      this.$emit('delete-document', id);
      this.closeContextMenu();
    },

    openModal() {
      this.isModalOpen = true;
      this.$nextTick(() => {
        this.$refs.newDocumentInput.focus();
      });
    },

    closeModal() {
      this.isModalOpen = false;
    },

    startTooltipTimer(event, documentName) {
      if (this.tooltipTimer) {
        clearTimeout(this.tooltipTimer);
      }
      this.tooltipTimer = setTimeout(() => {
        const offsetX = event.clientX;
        const offsetY = event.clientY;
        this.tooltipStyle = {
          left: `${offsetX}px`,
          top: `${offsetY - 20}px`,
          zIndex: 9999
        };
        this.documentNameTooltip = documentName;
      }, 1000);
    },

    hideTooltip() {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = null;
      this.documentNameTooltip = '';
    },

    openDocumentContextMenu(event, document) {
      this.contextMenuDocument = document;
      this.contextMenuStyle = {
        left: `${event.pageX}px`,
        top: `${event.pageY}px`
      };
      this.contextMenuVisible = true;
    },

    closeContextMenu() {
      this.contextMenuVisible = false;
    },

    handleOutsideClick(event) {
      if (this.contextMenuVisible && !this.$el.contains(event.target)) {
        this.closeContextMenu();
      }
    },
  }
};
</script>

<style scoped>
.document-list-wrapper {
  margin-top: 20px;
  max-height: 200px;
  overflow-y: auto;
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

.document-list ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ccc;
}
.document-list ul li {
  display: flex;
  justify-content :   space-between;
  align-items: center;
  padding: 5px 10px;
  cursor: pointer;
  border-bottom: 1px solid #ccc;
}
.document-list ul li:hover {
  background-color: #d0d0d0;
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
</style>