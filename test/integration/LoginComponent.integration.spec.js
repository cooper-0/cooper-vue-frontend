import { shallowMount } from '@vue/test-utils';
import AxiosMockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import LoginComponent from '@/components/UserLogin.vue';

describe('LoginComponent Integration', () => {
    it('processes a successful login', async () => {
        const mock = new AxiosMockAdapter(axios);
        const email = 'test@example.com';
        const password = 'password';
        mock.onPost('/api/login').reply(200, { user: { email } });

        const wrapper = shallowMount(LoginComponent);
        await wrapper.setData({ email, password });
        wrapper.find('form').trigger('submit.prevent');

        await wrapper.vm.$nextTick(); // Wait until the DOM updates after the API call
        expect(wrapper.vm.$data.userLoggedIn).toBe(true);
    });
});
