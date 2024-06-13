<template>
  <div class="user-icons">
      <ul>
        <li v-for="user in users.slice(0, 5)" :key="user.id" class="user-icon" :style="{ backgroundColor: user.color }">
          {{ user.name.slice(-2) }}
        </li>
        <li v-if="users.length > 5" 
          class="extra-users"
          @mouseover="showTooltip=true" @mouseleave="showTooltip=false"
          :style="{ backgroundColor: '#6A5ACD'}">
          +{{ users.length - 5 }}명
          <!-- 툴팁 내용 -->
          <div v-if="showTooltip" class="tooltip">
            <ul>
              <li v-for="user in extraUsers" :key="user.id" class="tooltip-item" :style="{ backgroundColor: user.color }">
                <div class="user-info">
                  <div class="user-icon"></div>
                    <span class="inside-icon-name">{{ user.name.slice(-2) }}</span> <!-- 아이콘 내부 이름 -->
                </div>
                <span class="beside-icon-name">{{ user.name }}</span> <!-- 아이콘 옆 이름 -->
              </li>
            </ul>
          </div>
        </li>
      </ul>
  </div>
</template>

<script>
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';

export default {
  data() {
    return {
      // UI 테스트용 users 배열
      users: [
        { id: 1, name: "김은서"},
        { id: 2, name: "윤석규"},
        { id: 3, name: "이준"},
        { id: 4, name: "최대현"},
        { id: 5, name: "박민진"},
        { id: 6, name: "박세민"},
        { id: 7, name: "박상훈"},
        { id: 8, name: "김창화"},
        { id: 9, name: "김은서"}
      ], // UI 테스트용
      currentUsers: [],
      selectedWorkspace: {},
      showTooltip: false,
      stompClient: null,
    };
  },
  methods: {
    connectWebSocket() {
      const socket = new SockJS('/ws/workspace');
      this.stompClient = Stomp.over(socket);
      this.stompClient.connect({}, () => {
        this.stompClient.subscribe(`/sub/workspace/${this.selectedWorkspace.name}`, (message) => {
          const data = JSON.parse(message.body);
          this.handleUserChanges(data);
        });
      }, error => {
        console.error('Error connecting to web socket', error);
      });
    },
    handleUserChanges(data) {
      // 입장 또는 퇴장 데이터에 따라 현재 유저 목록 업데이트
      if (data.message.includes("들어왔습니다")) {
        this.currentUsers.push({
          id: data.user.id,
          name: data.user.name,
          color: this.randomColor()
        });
      } else if (data.message.includes("나갔습니다")) {
        this.currentUsers = this.currentUsers.filter(user => user.id !== data.user.id);
      }
    },
    randomColor() {
      // 16진수 색상 코드 생성
      return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    },
    disconnectWebSocket() {
      if (this.stompClient && this.stompClient.connected) {
        this.stompClient.disconnect();
      }
    },
  },
  mounted() {
    // 테스트 사용자 배열에 색상 할당
    this.users.forEach(user => {
      if (!user.color) {
        user.color = this.randomColor();
      }
    });
    this.connectWebSocket();
  },
  beforeUnmount() {
    this.disconnectWebSocket();
  },
  computed: {
    extraUsers() {
      return this.users.slice(5).map(user => ({
        ...user,
        color: this.randomColor() || this.randomColor() // 색상이 없을 경우에만 새 색상 할당
      }));
    }
  },
}
</script>

<style scoped>
.user-display {
  display: flex;
  align-items: center;
}
.user-icons {
  position: absolute;
  float: right; /* 아이콘 리스트를 오른쪽으로 정렬 */
  margin-left: 53%;
  margin-top: 7px;
  list-style-type: none;
  z-index: 5;
}

.user-icons ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.user-list ul {
  list-style: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-right: 5px;
}
.user-list li {
  margin-left: 10px;
}
.user-icons li {
  margin-left: 3px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 13px;
  font-weight: 500;

  border: 3px solid rgba(224, 224, 224, 0.877);
  position: relative;
}

.tooltip {
  position: absolute;
  top: 50px;
  right: 0px;
  width: 110px;
  max-height: 300px;
  background-color: #f4f4f4;
  color: white;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  display: none; /* 기본적으로 숨김 */
  z-index: 100;
  transition: opacity 0.5s;
}
.tooltip ul {
  padding: 0;
  margin-left: 2px;
  flex-direction: column;
  align-items: flex-start;
}
.tooltip li {
  width: 30px;
  height: 30px;
  color: white;
  border-radius: 50%;
  align-items: flex-start;
  border: 3px solid rgba(202, 202, 202, 0.877);
}
.tooltip-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  justify-content: flex-start;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.user-name {
  color: #FFFFFF;
  font-size: 12px; 
  display: block;
}
.beside-icon-name {
  margin-left: 100px; /* 아이콘과 이름 사이 간격 */
  margin-top: 5px;
  color: rgb(31, 31, 31);
  font-size: 14px;
  white-space: nowrap;
}
.inside-icon-name {
  position: absolute;  /* 절대 위치를 사용하여 아이콘 중앙에 이름 표시 */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);  /* 중앙 정렬 */
  font-size: 13px;  /* 아이콘 크기에 맞춰 폰트 크기 조정 */
  color: white;
  white-space: nowrap;
}

.extra-users:hover .tooltip {
  display: block; /* 마우스 오버 시 표시 */
}
</style>
