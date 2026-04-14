import axios from 'axios';
import { clearToken } from '../store/slices/auth/authSlice';
import store from '../store';

const api = axios.create({
    baseURL: 'http://kermes.test/api'
});

// Request Interceptor
api.interceptors.request.use((config) => {
        if (config.url === '/login') {
            return config;
        }

        const token = store.getState().auth.token;

        if (!token) {
            window.location.href = '/login';
            throw new Error('Token bulunamadı. Kullanıcı giriş yapmalıdır.');
        }

        config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use((response) => response, (error) =>
    {
        if (error.response && error.response.status === 401) {
            store.dispatch(clearToken());
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;
