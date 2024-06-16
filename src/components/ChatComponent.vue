<template>
  <div class="chat-component">
    <div class="header-container">
      <div class="workspace-content">
      </div>
    </div>
    <div class="body-container">
      <div class="body-top"></div>
      <div class="body-middle">
        <div class="messages">
          <div
              v-for="(message, index) in messages"
              :key="index"
              :class="['message', message.senderID === email ? 'my-message' : 'other-message']"
              @contextmenu.prevent="message.senderID === email ? openContextMenu($event, message) : null"
          >
            <div v-if="message.senderID !== email" class="sender">{{ message.senderID }}</div>
            <div class="message-container" id="chatting">
              <div :class="['timestamp', message.senderID === email ? 'my-timestamp' : 'other-timestamp']"></div>
              <div v-if="message.senderID === email" class="my-message">
                <div class="my-stamp">{{ message.timestamp }}</div>
                <div class="my-messageText">
                  {{ message.message }}
                </div>
              </div>
              <div v-else class="other-message">
                <div class="sender"></div>
                <div class="other-messageContainer">
                  <div class="other-messageText">{{ message.message }}</div>
                  <div class="other-stamp">{{ message.timestamp }}</div>
                </div>
              </div>
            </div>
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
    <div class="footer-container"></div>
  </div>
</template>

<script>
import axios from "../axios";
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";


export default {
  props: ["workspaceId"],
  data() {
    return {
      newMessage: "",
      messages: [],
      stompClient: null,
      email: localStorage.getItem("user-email"),
      contextMenuVisible: false,
      contextMenuStyle: {},
      contextMenuMessage: null
    };
  },
  methods: {

    connect(workspaceId) {
      const socket = new SockJS("http://221.144.190.76:8000/chat");
      this.stompClient = Stomp.over(socket);

      this.stompClient.connect(
          {},
          frame => {
            console.log("Chat Connected: " + frame);

            this.subscriptionStateWs = this.stompClient.subscribe(`/topic/${workspaceId}`, message => {
              if (message.body) {
                const receivedMessage = JSON.parse(message.body);
                receivedMessage.timestamp = this.formatTimestamp(receivedMessage.timestamp);
                this.messages = [...this.messages, receivedMessage];
                this.scrollToBottom();
              }
            });
          },
          error => {
            console.error("STOMP connection error:", error);
          }
      );
    },


    loadMessage(workspaceId) {
      axios
          .get(`/cooper-chat/previous/${workspaceId}`)
          .then(response => {
            console.log("Received messages:", response.data);
            this.messages = response.data.map(message => {
              return {
                senderID: message.senderID,
                message: message.message,
                timestamp: this.formatTimestamp(message.sendDate)
              };
            });
            this.scrollToBottom();
          })
          .catch(error => {
            console.error("채팅 불러오기 실패:", error);
          });
    },
    formatTimestamp(dateString) {

      const date = new Date(dateString);
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstDate = new Date(date.getTime() + kstOffset);
      const hour = kstDate.getUTCHours();
      const minute = kstDate.getUTCMinutes();
      const period = hour >= 12 ? "오후" : "오전";
      const formattedHour = hour % 12 || 12;
      const formattedMinute = minute.toString().padStart(2, "0");
      return `${period} ${formattedHour}시 ${formattedMinute}분`;
    },
    sendMessage() {
      if (this.newMessage.trim() !== "") {
        const currentTime = new Date();
        const formattedTime = this.formatTimestamp(currentTime);

        const messageData = {
          messageType: "TALK",
          roomId: this.workspaceId, // WorkspaceId를 사용
          senderID: this.email, // 회원가입 한 이름
          senderEmail: "user@example.com", // 회원가입 한 이메일
          message: this.newMessage,
          timestamp: currentTime
        };
        console.log("Sending message data:", messageData);
        console.log(this.workspaceId)
        axios
            .post(`/cooper-chat/message?collectionName=${this.workspaceId}`, messageData)
            .then(response => {
              console.log("Message sent successfully:", response.data);
              console.log(messageData.senderID, ": ", messageData.message);
              this.scrollToBottom(); // 스크롤 조정 추가
            })
            .catch(error => {
              console.error("전송 실패:", error);
            });

        this.messages.push({
          senderID: this.email, // 회원가입 한 이름
          message: this.newMessage,
          timestamp: formattedTime
        });

        this.newMessage = "";
      }
    },
    openContextMenu(event, message) {
      this.contextMenuMessage = message;
      this.contextMenuStyle = {
        left: `${event.clientX}px`,
        top: `${event.clientY}px`
      };
      this.contextMenuVisible = true;
      document.addEventListener("click", this.closeContextMenu);
    },
    closeContextMenu() {
      this.contextMenuVisible = false;
      document.removeEventListener("click", this.closeContextMenu);
    },
    deleteChat(message) {
      if (message && message.senderID === this.email) {
        const messageId = message._id;
        axios
            .delete(`/cooper-chat/deleteChat`, {
              params: {
                messageId: messageId,
                collectionName: this.workspaceId
              }
            })
            .then(response => {
              console.log("메시지 삭제 성공:", response.data);
              this.messages = this.messages.filter(m => m._id !== messageId);
            })
            .catch(error => {
              console.error("메시지 삭제 실패:", error);
            });
      }

      this.contextMenuVisible = false;
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$el.querySelector(".body-middle");
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  },
  watch: {
    workspaceId(newWorkspaceId) {
      if (newWorkspaceId) {
        this.connect(newWorkspaceId);
        this.loadMessage(newWorkspaceId);
      }
    }
  },
  mounted() {
    if (this.workspaceId) {
      this.connect(this.workspaceId);
      this.loadMessage(this.workspaceId);
    }
    this.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
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
  border-bottom: 1px solid #ccc;
  text-align: center;
  align-content: center;
}

.body-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.body-top {
  height: 0;
  flex-shrink: 0;
}

.body-middle {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.messages {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-size: 13px;
}

.body-bottom {
  height: 60px;
  flex-shrink: 0;
  padding: 5px;
  display: flex;
  align-items: center;
  border-top: 1px solid #ccc;
}

.footer-container {
  height: 15%;
  flex-shrink: 0;
}

.message {

  padding: 5px 10px;
  border-radius: 5px;
  position: relative;
}

.sender {
  font-weight: bold;
  margin-bottom: 3px;
  font-size: 13px;
}

.message-container {
  display: flex;
}
.my-stamp {
  font-size: 10px;
  color: #999;
  bottom: 0;
  margin-right: 5px;
}
.other-stamp {
  font-size: 10px;
  color: #999;
  bottom: 0;
  margin-left: 5px;
}
.my-message {
  align-self: flex-end; /* 사용자 메시지를 오른쪽에 정렬 */
  border-radius: 5px;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: flex-end;

}

.my-messageText {
  background-color: #d1e7dd; /* 사용자 메시지의 배경색 */
  padding: 10px;
  border-radius: 5px;
  position: relative;
  align-self: flex-end; /* 메시지 컨텐츠를 오른쪽에 정렬 */
}


.other-messageContainer {
  align-self: flex-start; /* 다른 사용자 메시지를 왼쪽에 정렬 */
  flex-direction: row;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.other-messageText {
  background-color: #f9e3e4; /* 다른 사용자 메시지의 배경색 */
  padding: 10px;
  border-radius: 5px;
  position: relative;
  align-self: flex-start; /* 메시지 컨텐츠를 왼쪽에 정렬 */
}

.other-message .timestamp {
  left: 5px; /* 다른 사용자 메시지의 시간을 왼쪽에 정렬 */
  text-align: right; /* 왼쪽 정렬로 설정 */
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

.input-container input:focus {
  outline: none;
}

.input-container button:focus {
  outline: none;
}
</style>
