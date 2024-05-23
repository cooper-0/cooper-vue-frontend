<template>
  <div class="chat-component">
    <h2>Chat</h2>
    <div class="messages">
      <div v-for="(message, index) in messages" :key="index">
        {{ message }}
      </div>
    </div>
    <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="메시지 입력" />
    <button @click="sendMessage">전송</button>
  </div>
</template>

<script>
export default {
  props: ['messages'],
  data() {
    return {
      newMessage: '',
    };
  },
  methods: {
    sendMessage() {
      this.$emit('new-message', this.newMessage);
      this.newMessage = '';
    },
  },
};
</script>

<style scoped>
.chat-container {
  margin-top: 20px;
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
</style>