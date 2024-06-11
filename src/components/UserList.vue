<template>
    <div class="user-icons">
        <ul>
          <li v-for="user in users.slice(0, 5)" :key="user.email" class="user-icon" :style="{ backgroundColor: user.color }">
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
  export default {
    props: {
      users: Array,
      subscribers: Array,
    },
    data() {
      return {
        showTooltip: false,
        stompClient: null,
      };
    },
    methods: {
      setColor(userEmail) {
        let opacity = 0.2;
        this.subscribers.some((subscriber) => {
          if (subscriber === userEmail) {
            opacity = 1.0;
            return true;
          } else {
            return false;
          }
        });

        // RGBA 색상 코드 생성(접속 여부에 따라 투명도 조절)
        return `rgba(0, 0, 0, ${opacity}`;
      },
      updateUserColors() {
        this.users.forEach(user => {
          user.color = this.setColor(user.email);
        });
      },
    },
    mounted() {
      this.updateUserColors();
    },
    computed: {
      extraUsers() {
        return this.users.slice(5).map(user => ({
          ...user,
          color: this.setColor() || this.setColor() // 색상이 없을 경우에만 새 색상 할당
        }));
      }
    },
    watch: {
      subscribers() {
        this.updateUserColors();
      }
    }
  };
  </script>
  
  <style scoped>
  .user-display {
    display: flex;
    align-items: center;
    margin-right: 10px; /* 채팅 버튼과의 간격 */
  }
  .user-icons {
    float: right; /* 아이콘 리스트를 오른쪽으로 정렬 */
    margin-right: 80px; /* 채팅 버튼과의 간격 */
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
  