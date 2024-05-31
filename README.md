# cooper-vue-frontend

/

https://github.com/cooper-0/cooper-vue-frontend/assets/151529191/1e6b564a-8398-4052-82d9-ff625f2c171e



/cooper
https://github.com/cooper-0/cooper-vue-frontend/assets/151529191/f5dd9861-aaa5-47a1-ace5-679071433f17

https://github.com/cooper-0/cooper-vue-frontend/assets/151529191/ae227335-124a-44f2-ae1f-b9ca1337f222


https://github.com/cooper-0/cooper-vue-frontend/assets/151529191/c31ae721-e159-4add-ab79-55f2bef1f4b4



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
