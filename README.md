# cooper-vue-frontend
/

이메일, 비밀번호를 입력 받아 로그인합니다. 

/signup

이메일, 비밀번호, 비밀번호 확인, 이름을 입력 받아 회원가입 합니다.


https://github.com/cooper-0/cooper-vue-frontend/assets/151529191/e5ed8e53-720e-486f-8103-1c6cfe62d4b2


/cooper

워크 스페이스, 실시간 공유 수정 문서, 채팅방, 음성 채팅의 UI가 구현되어 있습니다.


https://github.com/cooper-0/cooper-vue-frontend/assets/151529191/9d8c478b-acf4-468b-9b2d-1f7a6c5a6bc7


https://github.com/cooper-0/cooper-vue-frontend/assets/151529191/db439139-1013-43b1-93eb-5035d98a2f0d



https://github.com/cooper-0/cooper-vue-frontend/assets/151529191/2c5d805a-e903-4a53-9e14-6068fe58f1f0



테스트 시 LoginUser.vue 파일의 script 부분을

```
<script>

export default {
  name: "UserLogin",
  data() {
    return {
      email: "",
      password: "",
      errorMessage: "",
    };
  },
  methods: {
    async login() {
      localStorage.setItem("token", "dummy-token"); // 토큰을 임의로 설정
      this.$router.push("/cooper"); // 다음 페이지로 이동
    },
  },
};
</script>
```

으로 변경해주세요

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


현재는 유저리스트가 왼쪽 사이드바에 의해 움직이는데, 헤더 파일 추가할 때 상단에 위치 고정
헤더 파일은 왼쪽 사이드 바 버튼, 페이지 이름, 워크스페이스 / 문서 경로, 유저 리스트, 오른쪽 사이드바 버튼 순서로 정렬
