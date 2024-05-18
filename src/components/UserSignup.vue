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
        <label for="checkedPassword">Confirm Password:</label>
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
    </form>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "UserSignup",
  data() {
    return {
      email: "",
      password: "",
      checkedPassword: "",
      name: "",
    };
  },
  methods: {
    async signup() {
      if (this.password !== this.checkedPassword) {
        this.errorMessage = "비밀번호가 맞지 않습니다.";
        return;
      }
      try {
        const response = await axios.post("/cooper-user/signup", {
          email: this.email,
          password: this.password,
          checkedPassword: this.checkedPassword,
          name: this.name,
        });
        console.log("회원가입 완료:", response.data);
        this.$router.push("/");
      } catch (error) {
        console.error("회원가입 실패:", error);
      }
    },
  },
};
</script>

<style>
.page-title {
  color: red;
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
  background-color: #07f;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: blue;
}

.error-message {
  color: red;
}
</style>
