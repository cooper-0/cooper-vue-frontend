import UserLogin from '../components/UserLogin.vue';
import UserSignup from '../components/UserSignup.vue';
import CooperMain from '../components/CooperMain.vue';
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'UserLogin', component: UserLogin },
  { path: '/signup', name: 'UserSignup', component: UserSignup },
  { 
    path: '/cooper', 
    name: 'Cooper', 
    component: CooperMain,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 네비게이션 가드 추가
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const token = localStorage.getItem('token');
    if (!token) {
      next({ path: '/' });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
