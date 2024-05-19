<template>
    <div class="voice-chat-panel">
      <!-- 음성 채팅 제어 섹션 -->
      <div class="voice-chat-header">
        <h3>음성 채널</h3>
      </div>
      <!-- 연결된 웹캠 스트림 목록 -->
      <div class="connected-users">
        <video v-for="(stream, id) in peerConnections" :key="id" ref="remoteVideos" :srcObject="stream" autoplay playsinline controls></video>
      </div>
  
      <!-- 동적으로 채널 목록을 렌더링
      <div v-if="isChannelsOpen" class="collapse show">
        <ul class="list-unstyled fw-normal pb-1 small">
          <li v-for="channel in channels" :key="channel.id" class="link-dark rounded"
              @click="selectChannel(channel)">
            {{ channel.name }}
          </li>
        </ul>
      </div> -->
  
      <!-- 스트림 시작 제어 -->
      <div>
        <button v-if="!streamStarted" @click="startStream" class="start-button">음성채팅 시작</button>
        <video v-if="localStream" ref="localVideo" autoplay playsinline controls></video>
        <div ref="remoteVideos" class="remote-videos"></div>
      </div>
    </div>
  </template>
  
  <script>
  import { Stomp } from '@stomp/stompjs';
  import SockJS from 'sockjs-client'
  
  export default {
    name: "VoiceChat",
    data() {
      return {
        localStream: null,
        myKey: Math.random().toString(36).substring(2, 11),
        pcListMap: new Map(),
        roomId: null,
        otherKeyList: [],
        stompClient: null,
        videos: [],
        peerConnections: new Map(),  // WebRTC 연결을 관리할 Map 객체
        isChannelsOpen: false,       // 채널 목록이 열려 있는지 상태를 나타내는 불리언 값
        streamStarted: false,        // 스트림이 시작되었는지 나타내는 불리언 값
        channels: [],   // 채널 목록을 관리할 배열
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
        } else {
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
          this.stompClient.subscribe(`/topic/peer/iceCandidate/${this.myKey}/${this.roomId}`, (candidate) => {
            const { key, body: message } = JSON.parse(candidate.body);
            this.pcListMap.get(key).addIceCandidate(new RTCIceCandidate({
              candidate: message.candidate,
              sdpMLineIndex: message.sdpMLineIndex,
              sdpMid: message.sdpMid,
            }));
          });
  
          // offer peer 교환
          this.stompClient.subscribe(`/topic/peer/offer/${this.myKey}/${this.roomId}`, (offer) => {
            const { key, body: message } = JSON.parse(offer.body);
            this.pcListMap.set(key, this.createPeerConnection(key));
            this.pcListMap.get(key).setRemoteDescription(new RTCSessionDescription({ type: message.type, sdp: message.sdp }));
            this.sendAnswer(this.pcListMap.get(key), key);
          });
  
          // answer peer 교환
          this.stompClient.subscribe(`/topic/peer/answer/${this.myKey}/${this.roomId}`, (answer) => {
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
          this.stompClient.send(`/app/peer/iceCandidate/${otherKey}/${this.roomId}`, {}, JSON.stringify({
            key: this.myKey,
            body: event.candidate
          }));
        }
      },
  
      sendOffer(pc, otherKey) {
        pc.createOffer().then(offer => {
          this.setLocalAndSendMessage(pc, offer);
          this.stompClient.send(
            `/app/peer/offer/${otherKey}/${this.roomId}`,
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
            `/app/peer/answer/${otherKey}/${this.roomId}`,
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
        console.log("Clicked Channel ID: " + this.roomId);
  
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
    }
  }
  </script>
  
  <style scoped>
  .voice-chat-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 200px;
    max-height: 300px;
    overflow: hidden;
    background-color: #fff;
    border: 1px solid #ccc;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    z-index: 1000;
    flex-direction: column; /* 자식 요소를 세로로 정렬 */
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
  
  .active-dot,
  .inactive-dot {
    height: 10px;
    width: 10px;
    border-radius: 50%;
    margin-right: 10px;
  }
  
  .active-dot {
    background-color: green;
  }
  
  .inactive-dot {
    background-color: red;
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
    background-color: #007bff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  </style>  