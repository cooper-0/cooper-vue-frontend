import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from './axios';

const app = createApp(App);

app.config.globalProperties.$axios = axios;
axios.defaults.headers.post['Content-Type'] = 'application/json';

app.use(router);
app.mount('#app');
