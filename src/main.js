import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';

const token = localStorage.getItem('token');

if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
axios.defaults.baseURL = 'http://localhost:8000';
createApp(App).use(router).mount('#app');
