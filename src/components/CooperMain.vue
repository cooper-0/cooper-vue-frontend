<template>
  <div id="main">
    <SiteLayout
      :workspaces="workspaces"
      :documents="documents"
      :selectedWorkspace="selectedWorkspace"
      :selectedDocument="selectedDocument"
      :connectionStateWs="connectionStateWs"
      :connectionStateDoc="connectionStateDoc"
      @select-workspace="selectWorkspace"
      @add-workspace="addNewWorkspace"
      @delete-workspace="deleteWorkspace"
      @select-document="openDocument"
      @add-document="addNewDocument"
      @delete-document="deleteDocument"
    />

    <div class="content-area">
      <DocumentEditor
        v-if="selectedDocument"
        ref="documentEditor"
        :lines="lines"
        @handle-input="handleInput"
        @handle-keydown="handleKeyDown"
      />

      <DocumentTitle
        v-if="selectedDocument"
        :initialTitle="selectedDocumentTitle"
        @title-updated="handleTitleUpdated"
      />

      <UserList v-if="selectedWorkspace"
        :users="users"
        :subscribers="subscribers"
      />

      <button v-if="selectedWorkspace" @click="toggleDrawer" class="drawer-toggle" :class="{ 'opened': isDrawerOpen }">
        <span v-if="isDrawerOpen" class="arrow-icon">💬</span>
        <span v-else class="arrow-icon">🗨️</span>
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
  </div>
</template>

<script>
import SiteLayout from './SiteLayout.vue';
import DocumentEditor from './DocumentEditor.vue';
import ChatComponent from './ChatComponent.vue';
import {v4 as uuidv4} from 'uuid';
import DocumentTitle from './DocumentTitle.vue';
import Stomp from 'webstomp-client'
import SockJS from 'sockjs-client'
import UserList from './UserList.vue';
import axios from '../axios';

export default {
  components: {
    SiteLayout,
    DocumentEditor,
    ChatComponent,
    DocumentTitle,
    UserList,
  },
  data() {
    return {
      workspaces: [],
      documents: [],
      lines: [],
      users: [],
      connectionStateWs: null,
      subscriptionStateWs: null,
      connectionStateDoc: null,
      subscribers: [],
      selectedWorkspace: null,
      selectedDocument: null,
      isDrawerOpen: false,
      selectedDocumentTitle: ''
    };
  },
  methods: {
    connect() {
      // 임시 userId 설정
      this.userId = uuidv4();

      const serverURL = 'http://221.144.190.76:8000/ws/workspace';
      let socket = new SockJS(serverURL);
      this.stompClient = Stomp.over(socket);

      // 콘솔창에 웹소켓 디버그 메시지 찍히는거 비활성화함
      // this.stompClient.debug = () => {};

      // 모든 접속자들은 기본적으로 '/sub/workspace' 경로를 구독함
      this.stompClient.connect({}, () => {
        this.connectionStateWs = this.stompClient.subscribe(`/sub/workspace`, (res) => {
          let content = JSON.parse(res.body);
          let type = content.type;
          let senderId = content.userId;

          // 메시지를 보낸 사람을 제외하고 적용
          if (senderId !== this.userId) {
            // 워크스페이스의 생성 또는 삭제가 일어난 경우는 이 부분이 실행
            if (type === "workspace") {
              this.workspaces = content.workspaces;
              if (this.selectedWorkspace && this.selectedWorkspace.id === content.workspaceId) {
                this.documents = []
              }
            }
            // 문서의 생성 또는 삭제가 일어난 경우는 이 부분이 실행
            else if (type === "document") {
              if (this.selectedWorkspace && this.selectedWorkspace.id === content.workspaceId) {
                this.documents = content.documents;
                if (this.selectedDocument && this.selectedDocument.id === content.documentId) {
                  this.selectedDocument = null;
                }
              }
            }

          }
        });
      });
    },

    doc_connect(wsId, docId) {
      this.connectionStateDoc = this.stompClient.subscribe(`/sub/workspace/${wsId}/document/${docId}`, (res) => {
        let content = JSON.parse(res.body);
        let senderId = content.userId;
        let type = content.type;
        let index = content.position;

        // 메시지를 보낸 사람을 제외하고 적용
        if (senderId !== this.userId) {

          // 블록을 추가하는 것이라면 lines 배열에 새 블록 추가
          if (type === "new") {
            this.lines.splice(index, 0, content.block);
          }

          // 기존 블록의 텍스트를 갱신하는 것이라면 lines 배열 내 블록 값 갱신
          if (type === "old") {
            this.lines[index].text = content.block.text;
          }

          // 기존 블록을 삭제하는 것이라면 lines 배열 내 해당 블록 삭제
          if (type === "del") {
            this.lines.splice(index, 1);
          }
        }
      });
    },

    // 연결된 워크스페이스 구독 해제
    disconnectWs() {
      if (this.selectedWorkspace != null) {
        this.subscriptionStateWs.unsubscribe({
          userEmail: localStorage.getItem("user-email"),
          destination: `/sub/workspace/${this.selectedWorkspace.id}/subscribers`
        });
        // 구독 해제한 뒤에 아직 남아있는 접속자들에게 변경 정보를 알려주기 위한 웹소켓 메시지 전송
        this.stompClient.send(`/pub/workspace/${this.selectedWorkspace.id}/subscribers`);
      }
    },

    // 연결된 기존 문서 웹소켓 구독 해제
    disconnectDoc() {
      if (this.connectionStateDoc) {
        this.connectionStateDoc.unsubscribe();
      }
    },

    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen;
    },

    // 워크스페이스 선택
    selectWorkspace(ws) {
      // 워크스페이스가 변경되면 문서에 대한 웹소켓 구독 해제
      if (this.selectedDocument != null) {
        this.disconnectDoc();
      }

      this.disconnectWs(); // 기존에 선택한 워크스페이스가 있다면 구독 해제
      this.subscriptionStateWs = this.stompClient.subscribe(`/sub/workspace/${ws.id}/subscribers`, (res) => {
        this.subscribers = JSON.parse(res.body);
      }, {
        userEmail: localStorage.getItem("user-email")
      });

      // 변경사항 갱신을 위해 웹소켓 메시지 전송
      this.stompClient.send(`/pub/workspace/${ws.id}/subscribers`);

      this.selectedWorkspace = ws;
      this.selectedDocument = null;
      this.selectedDocumentTitle = '';
      this.loadDocuments(ws.id);
    },

    // 워크스페이스 추가
    addNewWorkspace(newWorkspaceName) {
      if (newWorkspaceName.trim() !== '') {
        const newWorkspace = {
          id: uuidv4(), // v4: 랜덤 값에 기반하여 id(32개의 16진수, 36개의 문자[8개-4개-4개-12개]) 생성
          name: newWorkspaceName.trim(), // 문자열 양쪽 끝의 공백 제거: ex) '  workspace 1  ' => 'workspace 1'
        };

        // MySQL 연동
        const fd = new FormData();
        fd.append('name', newWorkspace.name);

        axios.post(`/cooper-docs/workspace/${newWorkspace.id}`, fd).then(result => {
          this.workspaces = result.data;
          // 전체 접속자들에게 워크스페이스 생성 메시지 전송
          this.stompClient.send(`/pub/workspace`, JSON.stringify({type: "workspace", userId: this.userId, workspaces: result.data, workspaceId: newWorkspace.id}), {});
        });
      }
    },

    // 워크스페이스 삭제
    deleteWorkspace(id) {
      // 삭제하려는 워크스페이스가 현재 선택되어있는 워크스페이스라면 이 부분이 실행
      if (this.selectedWorkspace && this.selectedWorkspace.id === id) {
        this.disconnectWs(); // 삭제하기 전, 워크스페이스에 대한 구독 해제
        this.selectedWorkspace = null;
        this.selectedDocument = null;
        this.selectedDocumentTitle = '';
      }

      // MySQL 연동
      axios.delete(`/cooper-docs/workspace/${id}`).then(result => {
        this.workspaces = result.data;
        // 전체 접속자들에게 워크스페이스 삭제 메시지 전송
        this.stompClient.send(`/pub/workspace`, JSON.stringify({type: "workspace", userId: this.userId, workspaces: result.data, workspaceId: id}), {});
      });
    },

    // 문서 추가
    addNewDocument(newDocumentName) {
      if (this.selectedWorkspace && newDocumentName.trim() !== '') {
        const newDocument = {
          id: uuidv4(),
          name: newDocumentName.trim(),
        };
        // MySQL 연동
        const fd = new FormData();
        fd.append('doc_name', newDocument.name);
        axios.post(`/cooper-docs/workspace/${this.selectedWorkspace.id}/document/${newDocument.id}`, fd).then(result => {
          this.documents = result.data;
          // 전체 접속자들에게 문서 생성 메시지 전송
          this.stompClient.send(`/pub/workspace`, JSON.stringify({type: "document", userId: this.userId, documents: result.data, workspaceId: this.selectedWorkspace.id}), {});
        });
      }
    },

    // 문서 선택(열기)
    openDocument(document) {
      // 만약 선택된 문서와 현재 문서가 같으면 닫기
      if (this.selectedDocument != null && this.selectedDocument.id === document.id) {
        this.selectedDocument = null;
      } else {
        // 아니라면 문서 열고 기존 연결 해제
        if (this.selectedDocument != null) {
          this.disconnectDoc();
        }
        this.selectedDocument = document;

        this.selectedDocumentTitle = document.name;

        // 각 문서에 대한 웹소켓 연결
        this.doc_connect(this.selectedWorkspace.id, document.id);

        axios.get(`/cooper-docs/workspace/${this.selectedWorkspace.id}/document/${document.id}`).then(result => {
          // 빈 문서라면(=블록이 하나도 없다면) 기본 블록 추가
          if (result.data.length === 0) {
            this.lines = [];
            this.addNewLine(-1, "");
          } else {
            this.lines = result.data;
          }
        });
      }
    },

    // 문서 삭제
    deleteDocument(documentId) {
      // 삭제하는 문서가 작업중이던 문서라면 문서 편집기를 닫음
      if (this.selectedDocument.id === documentId) {
        this.selectedDocument = null;
      }

      // MySQL 연동
      axios.delete(`/cooper-docs/workspace/${this.selectedWorkspace.id}/document/${documentId}`).then(result => {
        this.documents = result.data;
        // 워크스페이스 웹소켓 구독자들에게 문서 삭제 메시지 전송
        this.stompClient.send(`/pub/workspace`, JSON.stringify({type: "document", userId: this.userId, documents: result.data, workspaceId: this.selectedWorkspace.id, documentId: documentId}), {});
      });
    },

    handleTitleUpdated(newTitle) {
      if (this.selectedWorkspace && this.selectedDocument.id !== null) {
        const document = this.selectedWorkspace.documents.find(doc => doc.id === this.selectedDocument.id);
        if (document) {
          document.name = newTitle;
        }
      }
    },

    addMessage(message) {
      if (this.selectedWorkspace) {
        this.selectedWorkspace.chatMessages.push(message);
      }
    },

    // MySQL에서 저장된 워크스페이스를 불러오는 함수
    loadWorkspaces() {
      console.log(this.axios);

      axios.get(`/cooper-docs/workspace`).then(result => {
        this.workspaces = result.data;
      })
    },

    // MySQL에서 워크스페이스의 문서 목록을 불러오는 함수
    loadDocuments(workspaceId) {
      axios.get(`/cooper-docs/workspace/${workspaceId}/document`).then(result => {
        this.documents = result.data;
      });
    },



    // 블록 최대 텍스트 초과하면 자르고 다음 블록 만드는 함수
    handleInput(index, event) {
      const text = event.target.textContent;
      if (text.length > 1000000) { // 블록당 글자수 제한을 일단은 1,000,000으로 해놓음으로써 사실상 비활성화 함
        // event.target.textContent = text.slice(0, 100);
        // this.addNewLine(index, text.slice(100));
      } else {
        this.lines[index].text = text;
        const block = {
          id: event.target.id,
          text: text
        };
        // MySQL 연동
        this.stompClient.send(`/pub/workspace/${this.selectedWorkspace.id}/document/${this.selectedDocument.id}`, JSON.stringify({type: "old", userId: this.userId, block: block, position: index}), {});
      }
    },

    handleKeyDown(index, event) {
      const text = event.target.textContent;
      if (text.length >= 1000000 && !this.isAllowedKey(event.keyCode)) {
        event.preventDefault();
        if (!event.ctrlKey && !event.shiftKey) {
          this.addNewLine(index, "");
        }
      }
      if (event.keyCode === 13) { // 엔터키
        event.preventDefault();
        if (!event.ctrlKey && !event.shiftKey) {
          const cursorPosition = this.getCursorPosition(event.target);
          const beforeText = text.slice(0, cursorPosition);
          const afterText = text.slice(cursorPosition);

          // 문장의 중간에 커서를 두고 엔터를 눌렀다면 커서 이후의 텍스트는 기존 블락에서는 사라지고 아래의 새로운 블락에 추가되어야 함
          if (afterText !== '') {
            this.stompClient.send(`/pub/workspace/${this.selectedWorkspace.id}/document/${this.selectedDocument.id}`, JSON.stringify({type: "old", userId: this.userId, block: {id: event.target.id, text: beforeText}, position: index}), {});
          }
          this.lines[index].text = beforeText;
          this.addNewLine(index, afterText, true);
        }
      }

      if ((event.keyCode === 8 || event.keyCode === 46) && text.length === 0) { // 백스페이스, Delete
        event.preventDefault();
        this.removeLine(index);
      }
      if (
          event.keyCode === 37 && // 왼쪽
          this.getCursorPosition(event.target) === 0 &&
          index > 0
      ) {
        event.preventDefault();
        this.focusLine(this.$refs.documentEditor.$refs[`line-${index - 1}`][0], false);
      }
      if (
          event.keyCode === 39 && // 오른쪽
          this.getCursorPosition(event.target) === text.length &&
          index < this.lines.length - 1
      ) {
        event.preventDefault();
        this.focusLine(this.$refs.documentEditor.$refs[`line-${index + 1}`][0], true);
      }
      if (event.keyCode === 38 && index > 0) { // 위
        event.preventDefault();
        this.$refs.documentEditor.$refs[`line-${index - 1}`][0].focus();
      }
      if (event.keyCode === 40 && index < this.lines.length - 1) { // 아래
        event.preventDefault();
        this.$refs.documentEditor.$refs[`line-${index + 1}`][0].focus();
      }
    },

    // 새 블록 만드는 함수
    addNewLine(index, remainingText, focusStart = false) {
      const newLine = {
        id: uuidv4(),
        text: remainingText,
      };
      this.lines.splice(index + 1, 0, newLine);

      // MySQL 연동
      this.stompClient.send(`/pub/workspace/${this.selectedWorkspace.id}/document/${this.selectedDocument.id}`, JSON.stringify({type: "new", userId: this.userId, block: newLine, position: index+1}), {});

      this.$nextTick(() => {
        const newIndex = index + 1;
        const newLineElement = this.$refs.documentEditor.$refs[`line-${newIndex}`][0];
        this.focusLine(newLineElement, focusStart);
      });
    },

    // 허용 키 목록
    isAllowedKey(keyCode) {
      const allowedKeys = [8, 37, 38, 39, 40, 46];
      return allowedKeys.includes(keyCode);
    },

    // 빈 블록 삭제 함수
    removeLine(index) {
      if (this.lines.length > 1) {
        const delLine = {
          id: this.lines[index].id,
          text: this.lines[index].text,
        };
        // MySQL에서 먼저 삭제
        this.stompClient.send(`/pub/workspace/${this.selectedWorkspace.id}/document/${this.selectedDocument.id}`, JSON.stringify({type: "del", userId: this.userId, block: delLine, position: index}), {});

        this.lines.splice(index, 1);

        this.$nextTick(() => {
          const focusIndex = index > 0 ? index - 1 : 0;
          const prevLine = this.$refs.documentEditor.$refs[`line-${focusIndex}`][0];
          this.focusLine(prevLine);
        });
      }
    },

    focusLine(line, focusStart = false) {
      if (line) {
        line.focus();
        const range = document.createRange();
        range.selectNodeContents(line);
        if (focusStart) {
          range.collapse(true); // 커서를 맨 앞으로 이동
        } else {
          range.collapse(false); // 커서를 맨 뒤로 이동
        }
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    },

    getCursorPosition(element) {
      let caretOffset = 0;
      const doc = element.ownerDocument || element.document;
      const win = doc.defaultView || doc.parentWindow;
      const sel = win.getSelection();
      if (sel.rangeCount > 0) {
        const range = win.getSelection().getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
      }
      return caretOffset;
    },

  },
  mounted() {
    this.connect();
    this.loadWorkspaces();

    // 새로고침, 탭 닫기 등을 하게 되면 웹소켓 구독을 모두 해제
    window.addEventListener('beforeunload', () => {
      this.disconnectWs();
    });

    // 최초 화면이 로드될 때 전체 유저 목록을 cooper-user 서버에 요청해서 저장함
    axios.get(`/cooper-user/user`).then((res) => {
      this.users = res.data;
    });
  },

  beforeUnmount() {
  },
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
.arrow-icon {
  font-size: 18px;
  transform: scaleX(-1); /* 좌우 반전 */
}

</style>
