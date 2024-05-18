
import UserLogin from '../components/UserLogin.vue';
import UserSignup from '../components/UserSignup.vue';
import CooperMain from '../components/CooperMain.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'UserLogin', component: UserLogin },
    { path: '/signup', name: 'UserSignup', component: UserSignup },
    { path: '/cooper', name: 'Cooper', component: CooperMain }
  ]
});
export default router;