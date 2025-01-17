import axios from 'axios';

const api = axios.create({
    baseURL: 'http://kermes.test/api',
});

export default api;
