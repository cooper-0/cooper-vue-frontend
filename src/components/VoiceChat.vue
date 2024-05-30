<template>
    <div class="voice-chat-panel">
      <!-- 음성 채팅 제어 섹션 -->
      <div class="voice-chat-header">
        <h3>{{ workspaceName }} Voice Channel</h3>
      </div>

      <!-- 참여자 리스트 -->
      <div class="participants-list">
        <ul>
          <li v-if="callActive">
            {{ user.name }}  <!-- 유저  -->
          </li>
          <li v-for="otherUser in userList" :key="otherUser.id">
              테스트
          </li>
          
          <!-- WebRTC에 연결된 Audio들이 추가되는 Div  -->
          <div id="remoteStreamDiv"></div>

          <!-- <li v-for="participant in participants" :key="participant.id">
            {{ participant.name }}
          </li> -->
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
          {{ callActive ? '연결 종료' : '연결 시작' }}
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import Stomp from "webstomp-client";
  import SockJS from 'sockjs-client'
  
  export default {
    name: "VoiceChat",
    props: ['workspaceId', 'workspaceName'],
    data() {
      const temp = Math.random().toString(36).substring(2, 11);

      return {
        socket: null,
        stompClient: null, // STOMP 클라이언트 인스턴스

        workspace : { name: '테스트 워크스페이스', id: 1 },  // 일단 테스트용으로 고정
        user : { name: `사람${temp}`, id: `사람${temp}` }, // 나중에 로그인한 정보로 변경

        callActive: false,
        stream: null,              // 로컬 오디오 스트림
        userList : [],
        pcListMap : new Map(),
        candidateQueue: new Map(), // 원격 설명이 설정될 때까지 ICE 후보자를 버퍼링
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' } // 구글의 공개 STUN 서버
          ]
        },

        isChannelsOpen: false,       // 채널 목록이 열려 있는지 상태를 나타내는 불리언 값
        participants: [],
        micMuted: true,
        cameraMuted: true,
      };
    },
    
    methods: {
      async connectToCall() {
        console.log("connectToCall");

        if (!this.callActive && this.workspace != null) {
          await this.startAudio();

          if (this.stream != null) {
            await this.startCall();
          }
        }
      },

      async startAudio() {
        this.callActive = true;

        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          
          console.log("Stream found " + this.stream);
          
          // this.stream.getAudioTracks()[0].enabled = true;

          // const audioElement = this.$refs.myAudio;
          // audioElement.srcObject = this.stream;
          // audioElement.play();
        } catch(error) {
            console.error("Error accessing media devices:", error);
            this.callActive = false;
            this.stream = null;

            alert("마이크가 없습니다. 마이크를 연결해주세요");
        }
      },

      async connectToSignalingServer() {
        // 소켓 연결 로직 여기에      
        this.socket = new SockJS("http://221.144.190.76:8000/signaling"); // 웹소켓 엔드포인트
        this.stompClient = Stomp.over(this.socket);

        this.stompClient.connect({}, frame => {
            console.log("Connected to WebRTC server: ", frame);

            // iceCandidate peer 교환을 위한 subscribe
            this.stompClient.subscribe(`/topic/peer/iceCandidate/${this.user.id}/${this.workspace.id}`, candidate => {
                const key = JSON.parse(candidate.body).key;
                const message = JSON.parse(candidate.body).body;

                console.log("iceCandidate ", key, message);

                // 해당 key에 해당되는 peer 에 받은 정보를 addIceCandidate 해준다.

                const pc = this.pcListMap.get(key);

                if (pc.remoteDescription && pc.remoteDescription.type) {
                  // 원격 설명이 설정되었으므로 후보자를 추가
                  pc.addIceCandidate(new RTCIceCandidate({
                    candidate: message.candidate,
                    sdpMLineIndex: message.sdpMLineIndex,
                    sdpMid: message.sdpMid,
                  }));
                } else {
                  // 원격 설명이 설정되지 않았으므로 후보자를 버퍼링

                  if (!this.candidateQueue.has(key)) {
                    this.candidateQueue.set(key, []);
                  }

                  this.candidateQueue.get(key).push(new RTCIceCandidate({
                    candidate: message.candidate,
                    sdpMLineIndex: message.sdpMLineIndex,
                    sdpMid: message.sdpMid,
                  }));
                }
              }
            );

            // offer peer 교환을 위한 subscribe
            this.stompClient.subscribe(`/topic/peer/offer/${this.user.id}/${this.workspace.id}`, async offer => {
                const key = JSON.parse(offer.body).key;
                const message = JSON.parse(offer.body).body;

                console.log("offer ", key, message);

                // 해당 key에 새로운 peerConnection 를 생성해준후 pcListMap 에 저장해준다.
                this.pcListMap.set(key, this.createPeerConnection(key));

                // 생성한 peer 에 offer정보를 setRemoteDescription 해준다.
                await this.setRemoteDescription(key, message);

                //sendAnswer 함수를 호출해준다.
                this.sendAnswer(this.pcListMap.get(key), key);
              }
            );

            // answer peer 교환을 위한 subscribe
            this.stompClient.subscribe(`/topic/peer/answer/${this.user.id}/${this.workspace.id}`, async answer =>  {
                console.log("answer ", answer);
              
                const key = JSON.parse(answer.body).key;
                const message = JSON.parse(answer.body).body;

                console.log("answer ", key, message);

                // 해당 key에 해당되는 Peer 에 받은 정보를 setRemoteDescription 해준다.
                await this.setRemoteDescription(key, message);
              }
            );

            // key를 보내라는 신호를 받은 subscribe
            this.stompClient.subscribe(`/topic/call/key`, message => {
                console.log("call key ", message);
                //자신의 key를 보내는 send

                if (this.stream === null || !this.callActive) return;

                this.stompClient.send(`/app/send/key`, JSON.stringify(this.user.id), {});
            });

            // 상대방의 key를 받는 subscribe
            this.stompClient.subscribe(`/topic/send/key`, message => {
                console.log("send key ", message);
                const key = JSON.parse(message.body);

                console.log("send key ", key);

                // 만약 중복되는 키가 ohterKeyList에 있는지 확인하고 없다면 추가해준다.
                if (this.user.id != key && this.userList.find((mapKey) => mapKey === key ) === undefined) {
                  this.userList.push(key);
                }
              }
            );
          }, (error) => {
            console.error("WebRTC server connection failed: ", error);
          }
        );
      },

      async startCall() {
        console.log("startCall");

        // 다른 웹 key들 웹소켓을 가져 온뒤에 offer -> answer -> iceCandidate 통신
        // peer 커넥션은 pcListMap 으로 저장
        this.stompClient.send(`/app/call/key`, {}, {});

        setTimeout(() => {
          this.userList.map((key) => {
            if (!this.pcListMap.has(key)) {
              this.pcListMap.set(key, this.createPeerConnection(key));
              this.sendOffer(this.pcListMap.get(key), key);
            }
          });
        }, 1000);
      },

      async setRemoteDescription(key, message) {
        const pc = this.pcListMap.get(key);

        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: message.type, sdp: message.sdp }));
          console.log("Remote description set for", key);

          if (this.candidateQueue.has(key)) {
            this.candidateQueue.get(key).forEach(candidate => {
              pc.addIceCandidate(candidate);
            });

            this.candidateQueue.delete(key);
          }
        }
      },

      onIceCandidate(event, key) {
        console.log("onIceCandidate", event, key);

        if (event.candidate) {
          this.stompClient.send(`/app/peer/iceCandidate/${key}/${this.workspace.id}`, JSON.stringify({ key: this.user.id, body: event.candidate }, {}));
        }
      },

      onTrack(event, key) {
        console.log("onTrack", event, key);

        if (document.getElementById(`audio${key}`) === null) {
          const audio = document.createElement("audio");

          console.log("audio stream", event.streams[0]);
          console.log("audio local", this.stream);

          audio.srcObject = event.streams[0];
          audio.autoplay = true;
          audio.id = `audio${key}`;

          document.getElementById("remoteStreamDiv").appendChild(audio);
        }
      },

      createPeerConnection(key) {
        const pc = new RTCPeerConnection(); // this.config 

        try {
          pc.ontrack = (event) => this.onTrack(event, key);
          pc.onicecandidate = (event) => this.onIceCandidate(event, key);

          this.stream.getTracks().forEach(track => pc.addTrack(track, this.stream));

          console.log('PeerConnection created');
        } catch (error) {
          console.error("Error setting oniceconnectionstatechange: ", error);
        }

        return pc;
      },

      sendOffer(pc, key) {
        if (this.stream === null || !this.callActive) return;

        pc.createOffer()
          .then(offer => {
            this.setLocalAndSendMessage(pc, offer);
            this.stompClient.send(`/app/peer/offer/${key}/${this.workspace.id}`, JSON.stringify({ key: this.user.id, body: offer }, {}));
          })
          .catch(error => console.error("Error creating offer: ", error));
      },

      sendAnswer(pc, key) {
        if (this.stream === null || !this.callActive) return;

        pc.createAnswer()
          .then(answer => {
            this.setLocalAndSendMessage(pc, answer);
            this.stompClient.send(`/app/peer/answer/${key}/${this.workspace.id}`, JSON.stringify({ key: this.user.id, body: answer }), {});
          })
          .catch(error => console.error("Error creating answer: ", error));
      },

      setLocalAndSendMessage(pc, sessionDescription) {
        pc.setLocalDescription(sessionDescription);
      },

      stopStream() {
        console.log("Disconnecting stream and peers.");

        // 모든 Peer Connections 종료
        this.pcListMap.forEach((pc, key) => {
          pc.close(); // 각 Peer Connection을 닫음
          console.log(`Closed connection with ${key}`);
        });
        this.pcListMap.clear(); // Peer Connections Map 초기화

        this.callActive = false; // 스트림 상태 업데이트
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
        if (this.callActive) {
          this.stopStream();
        } else {
          this.connectToCall();
        }
      },
    },
    mounted() {
      this.connectToSignalingServer();
    },
  }
  </script>
  
  <style scoped>
  .connected-users {
    position: fixed;
    top: 0;          /* 페이지 최상단 */
    left: 50%;       /* 페이지 중앙 */
    transform: translateX(-50%); /* 중앙 정렬 보정 */
    z-index: 1500;   /* 다른 요소들 위에 표시되도록 높은 z-index */
    
    display: flex;
    flex-direction: row; /* 비디오를 가로로 나열 */
    align-items: center;
    gap: 10px;
  }

  .voice-chat-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 245px;
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
  border: 1px solid #ccc;
  border-radius: 0;
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
  border: 1px solid #ccc;
  border-radius: 0;
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
  border: 1px solid #bbb;
}

.camera-off {
  background-color: #f8f8f8;
  border: 1px solid #bbb;

}
  </style>  