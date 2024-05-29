<template>
  <div class="signup">
    <h1 class="page-title">Sign Up</h1>
    <form @submit.prevent="signup" class="signup-form">
      <div class="form-group">
        <label for="email">Email:</label>
        <input
          v-model="email"
          type="email"
          id="email"
          placeholder="Email"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input
          v-model="password"
          type="password"
          id="password"
          placeholder="Password"
          required
          minlength="8"
        />
      </div>
      <div class="form-group">
        <label for="checkedPassword">Checked Password:</label>
        <input
          v-model="checkedPassword"
          type="password"
          id="checkedPassword"
          placeholder="Confirm Password"
          required
          minlength="8"
        />
      </div>
      <div class="form-group">
        <label for="name">Name:</label>
        <input
          v-model="name"
          type="text"
          id="name"
          placeholder="Name"
          required
        />
      </div>
      <div class="button-container">
        <button type="submit">Sign Up</button>
      </div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    </form>
  </div>
</template>

<script>
import { ref } from "vue";
import axios from "../node_modules/axios"; // 경로에 맞게 수정
import { useRouter } from "vue-router";

export default {
  name: "UserSignup",
  setup() {
    const email = ref("");
    const password = ref("");
    const checkedPassword = ref("");
    const name = ref("");
    const errorMessage = ref("");
    const router = useRouter();

    const signup = async () => {
      if (password.value.length < 8){
        errorMessage.value = "비밀번호를 8자 이상으로 입력해주세요";
        return;
      }
      if (password.value !== checkedPassword.value) {
        errorMessage.value = "비밀번호가 맞지 않습니다.";
        return;
      }

      try {
        const response = await axios.post("http://localhost:8000/cooper-user/signup", {
          email: email.value,
          password: password.value,
          checkedPassword: checkedPassword.value,
          name: name.value,
        });
        console.log("회원가입 완료:", response.data);
        router.push("/");
      } catch (error) {
        console.error("회원가입 실패:", error);
        if (error.response && error.response.data) {
          errorMessage.value = error.response.data.message;
        } else {
          errorMessage.value = "회원가입 중 오류가 발생했습니다.";
        }
      }
    };

    return {
      email,
      password,
      checkedPassword,
      name,
      errorMessage,
      signup,
    };
  },
};
</script>

<style scoped>
.page-title {
  color: black;
  background-color: white;
  text-align: center;
  padding: 20px 0;
}

.signup {
  text-align: center;
}

.signup-form {
  max-width: 300px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input[type="email"],
input[type="password"],
input[type="text"] {
  width: 90%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.button-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

button {
  padding: 10px;
  width: 98%;
  background-color: rgb(177, 177, 177);
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: rgb(191, 191, 191);
}

.error-message {
  color: red;
}
</style>
