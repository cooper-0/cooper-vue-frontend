<template>
  <div class="chat-component">
    <div class="header-container">
      <div class="workspace-content">
        #{{workspaceName}}
      </div>
    </div>
    <div class="body-container">
      <div class="body-top">

      </div>
      <div class="body-middle">
        <div class="messages">
          <div v-for="(message, index) in messages" :key="index" class="message">
            <div class="sender">{{ message.senderID }}</div>
            <div class="message-content">{{ message.message }}</div>
          </div>
        </div>

      </div>
      <div class="body-bottom">
        <div class="input-container">
          <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="메시지 입력" />
          <button @click="sendMessage">전송</button>
        </div>
      </div>
    </div>
    <div class="footer-container">

    </div>
  </div>
</template>

<script>
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

export default {
  props: ['workspaceName'],
  data() {
    return {
      newMessage: '',
      messages: []
    };
  },
  methods: {
    //워크스페이스 선택할 때마다 구독
    connect(workspaceName) {
      const socket = new SockJS('http://localhost:8080/cooper-chat');
      this.stompClient = Stomp.over(socket);

      this.stompClient.connect({}, () => {
        this.stompClient.subscribe(`/topic/${workspaceName}`, message => {
          if (message.body) {
            this.messages.push(JSON.parse(message.body));
          }
        });
      }, error => {
        console.error('Stomp connection error:', error);
      });
    },
    //엔드포인트로 이전 채팅 불러오기
    loadMessage(workspaceName) {
      axios.get(`http://localhost:8080/cooper-chat/previous/${workspaceName}`)
          .then(response => {
            this.messages = response.data;
          })
          .catch(error => {
            console.error('채팅 불러오기 실패:', error);
          });
    },
    //엔드포인트로 채팅 전송
    sendMessage() {
      if (this.newMessage.trim() !== '') {
        const messageData = {
          messageType: 'TALK',
          roomId: this.workspaceName,
          senderID: 'User',
          senderEmail: 'user@example.com',
          message: this.newMessage
        };
        axios.post(`http://localhost:8080/cooper-chat/message?collectionName=${this.workspaceName}`, messageData)
            .then(() => {
              console.log(messageData.senderID,': ', messageData.message);
            })
            .catch(error => {
              console.error('전송 실패:', error);
            });
        // 채팅 입력시 화면에 표시
        this.messages.push({
          senderID: 'User',
          message: this.newMessage
        });

        this.newMessage = '';
      }
    },
  },

  watch: {
    workspaceName(newWorkspaceName) {
      if (newWorkspaceName) {
        this.connect(newWorkspaceName);
        this.loadMessage(newWorkspaceName);
      }
    }
  },

  mounted() {
    if (this.workspaceName) {
      this.connect(this.workspaceName);
      this.loadMessage(this.workspaceName);
    }
  }
};
</script>
<style scoped>
.chat-component {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.header-container {
  height: 10%;
  border-bottom: 1px solid black;
  text-align: center;
  align-content: center;
}
.body-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden; /* body-container의 오버플로우 숨김 */
}
.body-top {
  height: 0;
  flex-shrink: 0; /* 고정된 높이를 유지 */
}
.body-middle {
  flex: 1; /* 남은 공간을 차지 */
  overflow-y: auto; /* 스크롤 생김 */
  padding: 10px;
}
.messages {
  height: 100%; /* messages 요소가 body-middle 전체를 차지하도록 설정 */
  padding: 10px;
}

.body-bottom {
  height: 60px; /* 고정된 높이로 설정 */
  flex-shrink: 0; /* 고정된 높이를 유지 */
  padding: 5px;
  display: flex;
  align-items: center;
  border-top: 1px solid #ccc; /* 상단에 경계선 추가 */
}
.footer-container {
  height: 15%;
  flex-shrink: 0; /* 고정된 높이를 유지 */
}
.message {
  margin-bottom: 10px;
  padding: 5px 10px;
  border-radius: 5px;
  width: 30%;
}
.sender {
  font-weight: bold;
  margin-bottom: 5px;
}
.message-content {
  background-color: #f1f0f0;
  padding: 10px;
  border-radius: 5px;
  display: inline-block;
}

.input-container {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}
.input-container input {
  flex-grow: 1;
  border: 1px solid #ccc;
  margin: 4px;
  padding: 5px;
  border-radius: 4px;
  outline: none;
  height: 60%;
}

.input-container button {
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  background-color: darkblue;
  color: white;
  border-radius: 30px;
}

.input-container input:focus, .input-container button:focus {
  outline: none;
}
</style>