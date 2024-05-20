# cooper-vue-frontend
cooper 프론트엔드
현재 login 아무 이메일과 비밀번호 입력 후 접속,

실사용 시 
UserLogin.vue script부분

     <script>
     import { ref } from "vue";
     import { useRouter } from "vue-router";
     import axios from "axios";

     export default {
       name: "UserLogin",
       setup() {
          const email = ref("");
         const password = ref("");
         const errorMessage = ref("");
         const router = useRouter();

         const login = async () => {
           try {
             const response = await axios.post("/cooper-user/signin", {
               email: email.value,
               password: password.value,
             });
             localStorage.setItem("token", response.data.token);
             router.push("/cooper");
           } catch (error) {
             errorMessage.value =
               "로그인 실패: " +
                (error.response.data.message || "등록되지 않은 이메일입니다");
             console.error("Login failed:", error);
           }
         };

         return {
           email,
           password,
           errorMessage,
           login,
         };
       },
     };
     </script>

 


필요 모듈
 "dependencies": {
 
    "@stomp/stompjs": "^7.0.0",
    
    "core-js": "^3.8.3",
    
    "socket.io": "^4.7.5",
    
    "socket.io-client": "^4.7.5",
    
    "sockjs-client": "^1.6.1",
    
    "vue": "^3.2.13"
  },
  "devDependencies": {
  
    "@babel/core": "^7.12.16",
    
    "@babel/eslint-parser": "^7.12.16",
    
    "@types/sockjs-client": "^1.5.4",
    
    "@vue/cli-plugin-babel": "~5.0.0",
    
    "@vue/cli-plugin-eslint": "~5.0.0",
    
    "@vue/cli-service": "~5.0.0",
    
    "eslint": "^7.32.0",
    
    "eslint-plugin-vue": "^8.0.3"
    
 }
    
