<template>
  <div id="menu">
    <!-- 사이트 제목 -->
    <div class="site-title">
      NAME
    </div>

    <!-- 큰 메뉴 (드롭다운 버튼) -->
    <div @click="toggleMenu" class="big-menu dropdown-toggle">
      Work space <span class="arrow-icon">▼</span>
    </div>

    <!-- 작은 메뉴 (드롭다운 목록) -->
    <div v-if="isMenuOpen" class="small-menu dropdown-menu">
      <ul>
        <!-- 워크스페이스 목록 -->
        <li v-for="(ws, index) in workspaces" :key="index" @click="selectWorkspace(ws)" :class="{ selected: ws.id === selectedWorkspace?.id }">
          {{ ws.name }}
          <!-- 워크스페이스 삭제 버튼 -->
          <button @click.stop="deleteWorkspace(ws.id)">🗑️</button>
        </li>
        <!-- 워크스페이스 추가 버튼 -->
        <li>
          <div class="form-group">
            <button @click="toggleNewWorkspaceInput" class="btn btn-primary">+</button>
            <input v-if="isNewWorkspaceInputVisible" v-model="newWorkspaceName" type="text" class="form-control" placeholder="새로운 워크스페이스 이름 입력" />
            <button v-if="isNewWorkspaceInputVisible" @click="addNewWorkspace" class="btn btn-primary">추가</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- 문서 목록 -->
    <div v-if="selectedWorkspace" class="documents-list dropdown-menu">
      <ul>
        <li v-for="(doc, index) in selectedWorkspace.documents" :key="index" @click="openDocument({ workspaceId: selectedWorkspace.id, documentId: doc.id })" :style="{ backgroundColor: doc.id === selectedDocumentId ? '#f0f0f0' : 'transparent' }">
          {{ doc.name }}
          <!-- 문서 삭제 버튼 -->
          <button @click.stop="deleteDocument(selectedWorkspace.id, doc.id)">🗑️</button>
        </li>
      </ul>
      <!-- 문서 추가 버튼 -->
      <div class="form-group">
        <button @click="toggleNewDocumentInput" class="btn btn-primary">+</button>
        <input v-if="isNewDocumentInputVisible" v-model="newDocumentName" type="text" class="form-control" placeholder="문서 이름 입력" />
        <button v-if="isNewDocumentInputVisible" @click="addNewDocument(selectedWorkspace.id)" class="btn btn-primary">추가</button>
      </div>
    </div>

<!-- 문서 편집기 -->
<div v-if="selectedDocumentId !== null" class="editor-container">
    <textarea v-model="selectedDocumentContent" @input="checkBlock" @keydown.enter.prevent="addNewBlock" class="form-control" placeholder="문서 내용을 입력하세요"></textarea>
    <button @click="saveDocumentContent" class="btn btn-primary">저장</button>
  </div>

    <!-- 에디터 컨테이너 -->
    <div v-if="selectedWorkspace && selectedWorkspace.currentEditor" class="editor-container">
      <DocumentEditor
        :workspace="selectedWorkspace"
        :document="selectedWorkspace.currentEditor"
        @save="saveDocument"
        @close="closeEditor"
      />
    </div>

    <!-- 추가할 워크스페이스 입력 모달 -->
    <div class="modal" v-if="isAddWorkspaceModalOpen">
      <div class="modal-content">
        <span class="close" @click="hideAddWorkspaceModal">&times;</span>
        <input v-model="newWorkspaceName" type="text" class="form-control" placeholder="새로운 워크스페이스 이름 입력" />
        <button @click="addNewWorkspace" class="btn btn-primary">추가</button>
      </div>
    </div>

    <!-- 드로어 토글 버튼 -->
    <button v-if="selectedWorkspace" @click="toggleDrawer" class="drawer-toggle" :class="{ 'opened': isDrawerOpen }">
      <span class="arrow-icon">
        <span v-if="!isDrawerOpen">◀</span>
        <span v-else>▶</span>
      </span>
    </button>

    <!-- 드로어 컴포넌트 -->
    <div v-if="isDrawerOpen && selectedWorkspace" class="drawer show">
      <div class="drawer-content">
        <!-- 채팅 컴포넌트 추가 -->
        <ChatComponent :messages="selectedWorkspace.chatMessages" @new-message="addMessage" />
      </div>
    </div>
  </div>
</template>

<script>
import DocumentEditor from './Editor.vue';
import ChatComponent from './ChatComponent.vue';
import { v4 as uuidv4 } from 'uuid';

export default {
  data() {
    return {
      isMenuOpen: false,
      isDrawerOpen: false,
      messages: [],
      isAddWorkspaceModalOpen: false,
      workspaces: [],
      selectedWorkspace: null,
      selectedDocumentId: null,
      selectedDocumentContent: '',
      newDocumentName: '',
      newWorkspaceName: '',
      isNewWorkspaceInputVisible: false,
      isNewDocumentInputVisible: false,
    };
  },

  created() {
    this.loadWorkspacesFromLocalStorage();
    window.addEventListener('beforeunload', this.saveWorkspacesToLocalStorage);
  },

  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },

    toggleNewWorkspaceInput() {
      this.isNewWorkspaceInputVisible = !this.isNewWorkspaceInputVisible;
      if (!this.isNewWorkspaceInputVisible) {
        this.newWorkspaceName = ''; // 입력 필드 숨김시 초기화
      }
    },

    toggleNewDocumentInput() {
      this.isNewDocumentInputVisible = !this.isNewDocumentInputVisible;
      if (!this.isNewDocumentInputVisible) {
        this.newDocumentName = ''; // 입력 필드 숨김시 초기화
      }
    },

    addNewWorkspace() {
      if (this.newWorkspaceName.trim() !== '') {
        const newWorkspace = {
          id: uuidv4(),
          name: this.newWorkspaceName.trim(),
          documents: [],
          currentEditor: null,
          chatMessages: [], // 채팅 메시지를 저장할 배열 추가
        };
        this.workspaces.push(newWorkspace);
        this.saveWorkspacesToLocalStorage();
        this.newWorkspaceName = '';
      }
    },

    selectWorkspace(ws) {
      if (this.selectedWorkspace && this.selectedWorkspace.id === ws.id) {
        this.selectedWorkspace = null;
        this.isDrawerOpen = false; // 워크스페이스 변경 시 드로어 닫기
        return;
      }

      this.selectedWorkspace = ws;
      this.selectedDocumentId = null;
      this.selectedDocumentContent = '';
      this.loadDocumentsFromLocalStorage(ws.id);
      this.isDrawerOpen = false; // 워크스페이스 변경 시 드로어 닫기
    },

    addNewDocument() {
      if (this.selectedWorkspace && this.newDocumentName.trim() !== '') {
        const newDocument = {
          id: uuidv4(),
          name: this.newDocumentName.trim(),
          content: '',
        };
        this.selectedWorkspace.documents.push(newDocument);
        this.saveWorkspaceToLocalStorage(this.selectedWorkspace);
        this.newDocumentName = '';
      }
    },

    deleteWorkspace(id) {
      this.workspaces = this.workspaces.filter(ws => ws.id !== id);
      if (this.selectedWorkspace && this.selectedWorkspace.id === id) {
        this.selectedWorkspace = null;
        this.isDrawerOpen = false; // 워크스페이스 삭제 시 드로어 닫기
      }
      this.saveWorkspacesToLocalStorage();
    },

    deleteDocument(workspaceId, documentId) {
      const workspace = this.workspaces.find(ws => ws.id === workspaceId);
      if (workspace) {
        workspace.documents = workspace.documents.filter(doc => doc.id !== documentId);
        this.saveWorkspaceToLocalStorage(workspace);
      }
    },

    openDocument({ workspaceId, documentId }) {
      const workspace = this.workspaces.find(ws => ws.id === workspaceId);
      if (workspace) {
        const document = workspace.documents.find(doc => doc.id === documentId);
        if (document) {
          // 만약 선택된 문서와 현재 문서가 같으면 닫기
          if (this.selectedDocumentId === documentId) {
            this.selectedDocumentId = null;
            this.selectedDocumentContent = '';
          } else {
            // 아니면 문서 열기
            this.selectedDocumentContent = document.content;
            this.selectedDocumentId = documentId;
          }
        }
      }
    },

    saveDocumentContent() {
      if (this.selectedWorkspace && this.selectedDocumentId !== null) {
        const workspace = this.workspaces.find(ws => ws.id === this.selectedWorkspace.id);
        if (workspace) {
          const document = workspace.documents.find(doc => doc.id === this.selectedDocumentId);
          if (document) {
            document.content = this.selectedDocumentContent;
            this.saveWorkspaceToLocalStorage(workspace);
          }
        }
      }
    },

    saveWorkspaceToLocalStorage(workspace) {
      localStorage.setItem(`workspace_${workspace.id}`, JSON.stringify(workspace));
    },

    loadDocumentsFromLocalStorage(workspaceId) {
      const savedWorkspace = localStorage.getItem(`workspace_${workspaceId}`);
      if (savedWorkspace) {
        this.selectedWorkspace = JSON.parse(savedWorkspace);
        this.selectedDocumentId = null;
        this.selectedDocumentContent = '';
      }
    },

    saveWorkspacesToLocalStorage() {
      localStorage.setItem('workspaces', JSON.stringify(this.workspaces));
    },

    loadWorkspacesFromLocalStorage() {
      const savedWorkspaces = localStorage.getItem('workspaces');
      if (savedWorkspaces) {
        this.workspaces = JSON.parse(savedWorkspaces);
      }
    },

    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen;
    },

    addMessage(message) {
      if (this.selectedWorkspace) {
        this.selectedWorkspace.chatMessages.push(message); // 현재 선택된 워크스페이스에 메시지 추가
      }
      this.messages.push(message);
    },

    addNewBlock(event) {
      // 엔터 키 입력 방지 및 블록 추가 로직
      event.preventDefault(); // 엔터 키 기본 동작 방지
      const cursorPosition = event.target.selectionStart; // 커서 위치
      const beforeText = this.selectedDocumentContent.substring(0, cursorPosition); // 커서 위치 이전의 텍스트
      const afterText = this.selectedDocumentContent.substring(cursorPosition); // 커서 위치 이후의 텍스트
      const newBlock = '\n'; // 새로운 블록
      this.selectedDocumentContent = beforeText + newBlock + afterText; // 새로운 블록 추가
      console.log('블록 추가'); // 콘솔에 메시지 출력
    },
    
    checkBlock() {
  // 입력된 텍스트 길이가 5의 배수인지 확인하고 블록 추가
  const textLength = this.selectedDocumentContent.length;
  if (textLength % 5 === 0 && textLength !== 0) {
    // 텍스트 길이가 5의 배수이면 엔터 키 입력 없이 블록을 추가
    const beforeText = this.selectedDocumentContent; // 커서 위치 이전의 텍스트
    const newBlock = ''; // 새로운 블록
    this.selectedDocumentContent = beforeText + newBlock; // 새로운 블록 추가
    console.log('블록 추가'); // 콘솔에 메시지 출력
  }
}
},
  components: {
    DocumentEditor,
    ChatComponent
  },
};
</script>





<style>
#menu {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 200px;
}

.site-title {
  width: 100%; /* 폭을 100%로 설정 */
  text-align: center;
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 10px;
}

.big-menu {
  background-color: #f0f0f0;
  padding: 10px;
  cursor: pointer;
}

.big-menu:hover {
  background-color: #d0d0d0;
}

.small-menu {
  position: relative; /* 원래 위치로 변경 */
  background-color: #e0e0e0;
  padding: 10px;
  border: 1px solid #ccc;
  z-index: 100;
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
  width: calc(100% - 40px); /* 버튼 공간을 제외한 남은 공간을 차지하도록 */
  padding: 5px 10px; /* 내부 패딩 조정 */
}

.small-menu ul li button {
  margin-left: 10px; /* 입력과 버튼 사이에 일정한 간격 추가 */
  padding: 5px; /* 버튼 패딩 조정 */
}


.documents-list {
  position: relative; /* 원래 위치로 변경 */
  background-color: #e0e0e0;
  padding: 10px;
  border: 1px solid #ccc;
  z-index: 100;
}

.documents-list ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.documents-list ul li {
  padding: 5px 10px;
  cursor: pointer;
  border-bottom: 1px solid #ccc;
}

.documents-list ul li:hover {
  background-color: #d0d0d0;
}

.editor-container {
  margin-top: 200px;
  margin-right: 1000px;
  position: fixed;
  top: 0;
  left: 17%;
  width: 40%;
  height: 50%;
  background-color: transparent;
  border: none;
  z-index: 100;
  padding: 10px;
}

.new-document-button {
  position: absolute;
  top: 535px; /* 상단으로부터의 거리를 조정 */
  left: 650px; /* 왼쪽으로부터의 거리를 조정 */
  z-index: 100;
}

textarea {
  width: 800px; /* 너비를 100%로 설정 */
  height: 300px; /* 높이를 원하는 크기로 설정 */
  padding: 10px; /* 내부 패딩 */
  box-sizing: border-box; /* 패딩이 전체 크기에 포함되도록 */
  resize: none;
}

/* 드로어 토글 버튼 스타일 */
.drawer-toggle {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 101; /* 다른 요소 위에 배치 */
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
}

.drawer-toggle .arrow-icon {
  display: inline-block;
  transition: transform 0.3s; /* 변화를 부드럽게 만듦 */
}

.drawer-toggle.opened .arrow-icon {
  transform: rotate(238deg); /* 드로어가 열린 경우 회전 */
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
  z-index: 100; /* 다른 요소 위에 배치 */
  display: block; /* 드로어가 열려 있을 때 보여주기 */
}

.drawer.show {
  display: block; /* 드로어가 열려 있을 때 보여주기 */
}

/* 드로어가 열려 있을 때의 위치 */
.drawer-content {
  padding: 50px;
}

.chat-container {
  margin-top: 550px;
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.message {
  margin-bottom: 5px;
  background-color: #f0f0f0;
  padding: 5px 10px;
  border-radius: 5px;
}

input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-top: 10px;
}
.add-button {
  position: absolute;
  right: 10px;
  top: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 50%;
  cursor: pointer;
}

.modal {
  display: none; /* 숨김 상태로 초기화 */
  position: fixed; /* 고정 위치 */
  z-index: 101; /* 다른 요소 위에 배치 */
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.4); /* 배경색과 투명도 */
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto; /* 중앙 정렬 */
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}
</style>