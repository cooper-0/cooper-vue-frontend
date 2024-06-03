<template>
  <div class="chat-component">
    <div class="header-container">
      <div class="workspace-content">
        #{{ workspaceName }}
      </div>
    </div>
    <div class="body-container">
      <div class="body-top"></div>
      <div class="body-middle">
        <div class="messages"> // User 부분 senderID로 변경해야 함
          <div
              v-for="(message, index) in messages"
              :key="index"
              :class="['message', message.senderID === 'User' ? 'my-message' : 'other-message']"
          >
            <div v-if="message.senderID !== 'User'" class="sender">{{ message.senderID }}</div>
            <div class="message-container" id="chatting">
              <div
                  :class="['timestamp', message.senderID === 'User' ? 'my-timestamp' : 'other-timestamp']"
              >
              </div>
              <div v-if="message.senderID === 'User'" class="my-message">
                <div class="my-stamp">{{ message.timestamp }}</div>
                <div class="my-messageText">{{ message.message }}</div>
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
import axios from "axios";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

export default {
  props: ["workspaceName", "email"],
  data() {
    return {
      newMessage: "",
      messages: [],
      stompClient: null
    };
  },
  methods: {
    connect(workspaceName) {
      const socket = new SockJS("http://192.168.0.17:8080/cooper-chat");
      this.stompClient = Stomp.over(socket);

      this.stompClient.connect(
          {},
          frame => {
            console.log("Connected: " + frame);
            this.stompClient.subscribe(`/topic/${workspaceName}`, message => {
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
    loadMessage(workspaceName) {
      axios
          .get(`http://192.168.0.17:8080/cooper-chat/previous/${workspaceName}`)
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
          roomId: this.workspaceName,
          senderID: "User", // 회원가입 한 이름
          senderEmail: "user@example.com", // 회원가입 한 이메일
          message: this.newMessage,
          timestamp: currentTime
        };

        axios
            .post(`http://192.168.0.17:8080/cooper-chat/message?collectionName=${this.workspaceName}`, messageData)
            .then(() => {
              console.log(messageData.senderID, ": ", messageData.message);
              // 메시지를 전송한 후에 스크롤을 조정합니다.
              this.scrollToBottom(); // 스크롤 조정 추가
            })
            .catch(error => {
              console.error("전송 실패:", error);
            });

        this.messages.push({
          senderID: "User", // 회원가입 한 이름
          message: this.newMessage,
          timestamp: formattedTime
        });

        this.newMessage = "";
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$el.querySelector(".body-middle");
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
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
  padding: 10px;
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
  margin-bottom: 10px;
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
  padding: 10px;
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
