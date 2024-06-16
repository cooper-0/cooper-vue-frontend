<template>
  <div class="voice-chat-panel">
    <!-- 음성 채팅 제어 섹션 -->
    <div class="voice-chat-header">
      <h3>{{ workspaceName }} Voice Channel</h3>
    </div>

    <!-- 참여자 리스트 -->
    <div class="participants-list">
      <ul>
        <li v-for="participant in participants" :key="participant.id">
          {{ participant.name }}
        </li>
      </ul>
    </div>

    <!-- 버튼 컨테이너 -->
    <div class="buttons-container">
      <button @click="toggleMic" class="mic-button" :class="{ 'mic-off': micMuted }">
        {{ micMuted ? '마이크 on' : '마이크 off' }}
      </button>
      <button @click="toggleCamera" class="camera-button" :class="{ 'camera-off': cameraMuted }">
          {{ cameraMuted ? '캠 on' : '캠 off' }}
      </button>
      <button @click="toggleStream" class="start-button">
        {{ streamStarted ? '연결 종료' : '연결 시작' }}
      </button>
    </div>
  </div>
</template>

<script>
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client'

export default {
  name: "VoiceChat",
  props: ['workspaceId', 'workspaceName'],
  data() {
    return {
      localStream: null,
      myKey: Math.random().toString(36).substring(2, 11),
      pcListMap: new Map(),
      //roomId: null,
      otherKeyList: [],
      stompClient: null,
      videos: [],
      peerConnections: new Map(),  // WebRTC 연결을 관리할 Map 객체
      isChannelsOpen: false,       // 채널 목록이 열려 있는지 상태를 나타내는 불리언 값
      streamStarted: false,        // 스트림이 시작되었는지 나타내는 불리언 값
      channels: [],   // 채널 목록을 관리할 배열
      participants: [],
      micMuted: true,
      cameraMuted: true,
    };
  },
  
  methods: {
    async startCam() {
      if (navigator.mediaDevices !== undefined) {
        console.log("Media devices are available.");

        const initialConstraints = {
          audio: true,
          video: true
        };

        try {
          const stream = await navigator.mediaDevices.getUserMedia(initialConstraints);
          console.log("Stream found");
          this.localStream = stream;
          // Disable the microphone by default
          stream.getAudioTracks()[0].enabled = true;
          this.$refs.localVideo.srcObject = this.localStream;
        } catch (error) {
          console.error("Error accessing media devices:", error);
        }
      }
      else {
        console.log("Media devices are not available.");
      }
    },

    async connectSocket() {
      const socket = new SockJS("/cooper-media/signaling");
      this.stompClient = Stomp.over(socket);
      this.stompClient.debug = null;

      this.stompClient.connect({}, () => {
        console.log("Connected to WebRTC server");

        // iceCandidate peer 교환
        this.stompClient.subscribe(`/topic/peer/iceCandidate/${this.myKey}/${this.workspaceId}`, (candidate) => {
          const { key, body: message } = JSON.parse(candidate.body);
          this.pcListMap.get(key).addIceCandidate(new RTCIceCandidate({
            candidate: message.candidate,
            sdpMLineIndex: message.sdpMLineIndex,
            sdpMid: message.sdpMid,
          }));
        });

        // offer peer 교환
        this.stompClient.subscribe(`/topic/peer/offer/${this.myKey}/${this.workspaceId}`, (offer) => {
          const { key, body: message } = JSON.parse(offer.body);
          this.pcListMap.set(key, this.createPeerConnection(key));
          this.pcListMap.get(key).setRemoteDescription(new RTCSessionDescription({ type: message.type, sdp: message.sdp }));
          this.sendAnswer(this.pcListMap.get(key), key);
        });

        // answer peer 교환
        this.stompClient.subscribe(`/topic/peer/answer/${this.myKey}/${this.workspaceId}`, (answer) => {
          const { key, body: message } = JSON.parse(answer.body);
          this.pcListMap.get(key).setRemoteDescription(new RTCSessionDescription(message));
        });

        // 자신의 key를 보내는 신호 수신
        this.stompClient.subscribe(`/topic/call/key`, () => {
          this.stompClient.send(`/app/send/key`, {}, JSON.stringify(this.myKey));
        });

        // 상대방의 key 수신
        this.stompClient.subscribe(`/topic/send/key`, (message) => {
          const key = JSON.parse(message.body);
          if (this.myKey !== key && !this.otherKeyList.includes(key)) {
            this.otherKeyList.push(key);
          }
        });

         // 참여자 추가 이벤트에 대한 구독
        this.stompClient.subscribe('/topic/addParticipant', (message) => {
          const participant = JSON.parse(message.body);
          this.participants.push(participant);
        });
        // 참여자 제거 이벤트에 대한 구독
        this.stompClient.subscribe('/topic/removeParticipant', (message) => {
          const participantId = JSON.parse(message.body).id;
          this.participants = this.participants.filter(p => p.id !== participantId);
        });
      });
    },

    onTrack(event, otherKey) {
      if (!this.videos.some(video => video.id === otherKey)) {
        this.videos.push({
          id: otherKey,
          stream: event.streams[0]
        });
      }
    },

    createPeerConnection(otherKey) {
      const pc = new RTCPeerConnection();
      pc.onicecandidate = event => this.onIceCandidate(event, otherKey);
      pc.ontrack = event => this.onTrack(event, otherKey);
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
      }
      return pc;
    },

    onIceCandidate(event, otherKey) {
      if (event.candidate) {
        console.log("ICE candidate");
        this.stompClient.send(`/app/peer/iceCandidate/${otherKey}/${this.workspaceId}`, {}, JSON.stringify({
          key: this.myKey,
          body: event.candidate
        }));
      }
    },

    sendOffer(pc, otherKey) {
      pc.createOffer().then(offer => {
        this.setLocalAndSendMessage(pc, offer);
        this.stompClient.send(
          `/app/peer/offer/${otherKey}/${this.workspaceId}`,
          {},
          JSON.stringify({
            key: this.myKey,
            body: offer,
          })
        );
        console.log("Send offer");
      });
    },

    sendAnswer(pc, otherKey) {
      pc.createAnswer().then(answer => {
        this.setLocalAndSendMessage(pc, answer);
        this.stompClient.send(
          `/app/peer/answer/${otherKey}/${this.workspaceId}`,
          {},
          JSON.stringify({
            key: this.myKey,
            body: answer,
          })
        );
        console.log("Send answer");
      });
    },

    setLocalAndSendMessage(pc, sessionDescription) {
      pc.setLocalDescription(sessionDescription);
    },

    async channelClick(event) {
      this.roomId = event.currentTarget.getAttribute("data-channel-id");
      console.log("Clicked Channel ID: " + this.workspaceId);

      // 웹캠 시작
      await this.startCam();

      if (this.localStream !== undefined) {
        this.$refs.localVideo.style.display = 'block';
        this.$refs.startStreamBtn.style.display = '';
      }

      // 소켓 연결 시작
      await this.connectSocket();
    },

    async startStream() {
      if (this.stompClient) {
        await this.stompClient.send(`/app/call/key`, {}, {});
        setTimeout(() => {
          this.otherKeyList.forEach(key => {
            if (!this.pcListMap.has(key)) {
              const pc = this.createPeerConnection(key);
              this.pcListMap.set(key, pc);
              this.sendOffer(pc, key);
            }
          });
        }, 1000);
      } else {
        console.error("WebSocket connection is not established.");
      }
    },
    stopStream() {
      console.log("Disconnecting stream and peers.");

      // 모든 Peer Connections 종료
      this.pcListMap.forEach((pc, key) => {
        pc.close(); // 각 Peer Connection을 닫음
        console.log(`Closed connection with ${key}`);
      });
      this.pcListMap.clear(); // Peer Connections Map 초기화

      // 로컬 스트림의 트랙을 모두 정지
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          track.stop();
        });
        this.localStream = null; // 로컬 스트림 참조 제거
      }

      // WebSocket 연결 해제
      if (this.stompClient) {
        this.stompClient.disconnect(() => {
          console.log("Disconnected from WebSocket server.");
        }, {});
      }

      this.streamStarted = false; // 스트림 상태 업데이트
    },

    toggleMic() {
      this.micMuted = !this.micMuted;
      if (this.localStream && this.localStream.getAudioTracks().length > 0) {
      this.localStream.getAudioTracks()[0].enabled = !this.micMuted;
      }
    },
    toggleCamera() {
      this.cameraMuted = !this.cameraMuted;
      if (this.localStream && this.localStream.getVideoTracks().length > 0) {
          this.localStream.getVideoTracks()[0].enabled = !this.cameraMuted;
      }
    },
    toggleStream() {
      if (this.streamStarted) {
        this.stopStream();
      } else {
        this.startStream();
      }
    },
  }
}
</script>

<style scoped>
.connected-users {
position: fixed;
top: 0;          /* 페이지 최상단 */
left: 50%;       /* 페이지 중앙 */
transform: translateX(-50%); /* 중앙 정렬 보정 */
 /* 다른 요소들 위에 표시되도록 높은 z-index */

display: flex;
flex-direction: row; /* 비디오를 가로로 나열 */
align-items: center;
gap: 10px;
}

.voice-chat-panel {
position: absolute;
bottom: 0;
left: 0;
width: 246px;
max-height: 300px;
overflow: hidden;
background-color: #fff;
border: 1px solid #ccc; /* 테두리 추가 */
/*box-shadow: 0 2px 6px rgba(0,0,0,0.1);*/
flex-direction: column; /* 자식 요소를 세로로 정렬 */
z-index: 99;
}

.voice-chat-header {
padding: 10px;
background-color: #f0f0f0;
text-align: center;
}

.voice-chat-list {
overflow-y: auto;
padding: 10px;
}

.channel {
display: flex;
align-items: center;
padding: 8px;
background-color: #e0e0e0;
border-radius: 4px;
margin-bottom: 5px;
}

.voice-chat-controls {
display: flex;
justify-content: space-around;
padding: 10px;
background-color: #f0f0f0;
}

.start-button {
padding: 8px 15px;
font-size: 14px;
color: white;
background-color: #888;
border: none;
border-radius: 5px;
cursor: pointer;
}

.buttons-container {
display: flex;
justify-content: space-around;
padding: 10px;
}

.participants-list {
flex-grow: 1;
overflow-y: auto;
margin: 10px 0;
}

.participants-list ul {
list-style: none;
margin: 0;
padding: 0;
}

.participants-list li {
display: flex;
justify-content: space-between;
align-items: center;
padding: 5px;
border-bottom: 1px solid #ccc;
}

.mic-button {
padding: 3px 5px;
font-size: 11px;
color: black;
background-color: #fff;
border: 1px solid #ccc; /* 테두리 추가 */
cursor: pointer;
width: 50px;
height: 50px;
display: flex;
align-items: center;
justify-content: center;
border-radius: 5px;
}

.camera-button {
padding: 5px 20px;
font-size: 11px;
color: black;
background-color: #fff;
border: 1px solid #ccc; /* 테두리 추가 */
cursor: pointer;
width: 50px;
height: 50px;
display: flex;
align-items: center;
justify-content: center;
border-radius: 5px;
}

.mic-off {
background-color: #f8f8f8;
border: 1px solid #bbb; /* 테두리 추가 */
}

.camera-off {
background-color: #f8f8f8;
border: 1px solid #bbb; /* 테두리 추가 */
}

</style>  