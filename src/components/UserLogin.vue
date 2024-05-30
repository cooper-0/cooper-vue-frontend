<template>
  <div class="login">
    <h1 class="page-title">Login</h1>
    <form @submit.prevent="login" class="login-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          v-model="email"
          type="email"
          id="email"
          placeholder="Email"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input
          v-model="password"
          type="password"
          id="password"
          placeholder="Password"
          required
        />
      </div>
      <div class="button-container">
        <button type="submit">Login</button>
        <button type="button" @click="$router.push('/signup')">Sign up</button>
      </div>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "../axios";

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
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;
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

<style scoped>
.page-title {
  color: black;
  background-color: white;
  text-align: center;
  padding: 20px 0;
}

.login {
  text-align: center;
}

.login-form {
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
input[type="password"] {
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
  width: 48%;
  background-color: #f0f0f0;
  color: #000;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: rgb(165, 165, 165);
}

.error-message {
  color: red;
}
</style>
