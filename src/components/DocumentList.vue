<template>
  <div>
    <div class="document-list">
      <ul>
        <li v-for="(document, index) in documents" :key="document.id" @click="selectDocument(document.id)">
          <span class="newDocumentName"
                :ref="'documentName' + index"
                @mouseover="showTooltip($event, document.name, index)"
                @mouseleave="hideTooltip">{{ document.name }}</span>
          <button @click.stop="deleteDocument(document.id)">🗑️</button>
        </li>
        <li>
          <button @click="openModal">추가</button>
        </li>
      </ul>
    </div>
    <Modal :isOpen="isModalOpen" @close="closeModal">
      <h2>새 문서 추가</h2>
      <input v-model="newDocumentName" placeholder="새 문서의 이름">
      <button @click="addDocument">추가</button>
    </Modal>
    <div class="tooltip" v-if="documentNameTooltip" :style="tooltipStyle">
      {{ documentNameTooltip }}
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
      newDocumentName: ''
    };
  },
  methods: {
    selectDocument(id) {
      this.$emit('select-document', id);
    },
    addDocument() {
      if (this.newDocumentName.trim() !== '') {
        this.$emit('add-document', this.newDocumentName);
        this.newDocumentName = '';
        this.closeModal();
      }
    },
    deleteDocument(id) {
      this.$emit('delete-document', id);
    },
    openModal() {
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
    },
    showTooltip(event, documentName) {
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
      this.documentNameTooltip = '';
    }
  }
};
</script>

<style scoped>
.document-list ul {
  background-color: #e7e7e7;
  list-style-type: none;
  padding: 0;
  margin: 0;
  border: 1px solid #ccc;
}
.document-list ul li {
  display: flex;
  justify-content: space-between;
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
</style>
