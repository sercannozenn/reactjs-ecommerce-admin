import axios, { InternalAxiosRequestConfig } from 'axios';
import { logout, loginSuccess } from '../store/slices/auth/authSlice';
import store from '../store';

interface RetryableRequest extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

interface QueueEntry {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}

// Eş zamanlı birden fazla istek 401 alırsa hepsini bekletip tek refresh ile çözülür.
// refresh başarısız olursa tüm bekleyenler reddedilip logout tetiklenir.
let isRefreshing = false;
let failedQueue: QueueEntry[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(token!);
    });
    failedQueue = [];
};

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
            window.location.href = '/giris-yap';
            throw new Error('Token bulunamadı. Kullanıcı giriş yapmalıdır.');
        }

        config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as RetryableRequest;

        const is401 = error.response?.status === 401;
        const isRefreshEndpoint = originalRequest.url === '/admin/refresh';

        if (is401 && !originalRequest._retry && !isRefreshEndpoint) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers!.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await api.post('/admin/refresh');
                store.dispatch(loginSuccess({
                    token: data.token,
                    user: data.user,
                }));
                processQueue(null, data.token);
                originalRequest.headers!.Authorization = `Bearer ${data.token}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                store.dispatch(logout());
                window.location.href = '/giris-yap';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
