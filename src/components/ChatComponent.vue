<template>
  <div class="chat-container">
    <!-- 메시지 표시 영역 -->
    <div class="messages" ref="messages">
      <div v-for="(message, index) in messages" :key="index" class="message">
        {{ message }}
      </div>
    </div>

    <!-- 메시지 입력 필드 -->
    <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="메시지를 입력하세요" />
  </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      messages: [],
      newMessage: '',
    };
  },
  mounted() {
    // Socket.io 클라이언트 생성 및 서버와의 연결
    const socket = io('서버의_URL');

    // 새로운 메시지 이벤트 리스너 등록
    socket.on('newMessage', (message) => {
      this.messages.push(message);
      // 스크롤을 아래로 이동하여 최신 메시지를 보여줌
      this.$refs.messages.scrollTop = this.$refs.messages.scrollHeight;
    });
  },
  methods: {
    sendMessage() {
      // 메시지를 서버로 보냄. 연결할 서버를 입력.
      // 예: socket.emit('sendMessage', this.newMessage);
      this.newMessage = ''; // 입력 필드 초기화
    },
  },
};
</script>
<style scoped>
.chat-container {
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
</style>
