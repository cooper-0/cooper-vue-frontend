import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://221.144.190.76:8000', // Spring Boot 서버 주소
  withCredentials: true, // 자격 증명 포함
});

export default instance;
