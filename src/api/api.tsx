import axios from 'axios';
import { clearToken } from '../store/slices/auth/authSlice';
import store from '../store';
import { useRouteNavigator } from '../utils/RouteHelper';

const api = axios.create({
    baseURL: 'http://kermes.test/api'
});

// Request Interceptor
api.interceptors.request.use((config) => {
        if (config.url === '/login') {
            return config;
        }

        const token = store.getState().auth.token; // Redux store'dan token alınıyor.

        const navigateToRoute = useRouteNavigator();

        if (!token) {
            // Token yoksa giriş sayfasına yönlendir
            navigateToRoute('Login');
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
            // const dispatch = useDispatch();
            store.dispatch(clearToken());

            const navigateToRoute = useRouteNavigator();

            // Token'ı temizle
            // dispatch(clearToken());

            // Kullanıcıyı yönlendir
            navigateToRoute('Login');
        }

        return Promise.reject(error);
    }
);

export default api;
