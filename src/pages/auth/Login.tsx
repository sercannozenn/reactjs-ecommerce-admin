import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconMail from '../../components/Icon/IconMail';
import IconLockDots from '../../components/Icon/IconLockDots';
import api from '../../api/api';
import { setToken, setUser } from '../../store/slices/auth/authSlice';
import { AxiosError } from 'axios';
import { useRouteNavigator } from '../../utils/RouteHelper';
import store from '../../store';


const Login = () => {
    const navigateToRoute = useRouteNavigator();

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Login Boxed'));
    });
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/login', { email, password });
            console.log('response');
            console.log(response);
            if (response.data?.token) {
                const token = response.data.token;
                console.log('response.data.user');
                console.log(response.data.user);
                dispatch(setToken(token));
                dispatch(setUser(response.data.user));
                navigateToRoute('Index');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
            // navigate('/');

        } catch (err) {
            const error = err as AxiosError;
            if (error.response?.data) {
                setError((error.response.data as { message?: string }).message || 'Giriş başarısız.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
            </div>

            <div
                className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <img src="/assets/images/auth/coming-soon-object1.png" alt="image"
                     className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
                <img src="/assets/images/auth/coming-soon-object2.png" alt="image"
                     className="absolute left-24 top-0 h-40 md:left-[30%]" />
                <img src="/assets/images/auth/coming-soon-object3.png" alt="image"
                     className="absolute right-0 top-0 h-[300px]" />
                <img src="/assets/images/auth/polygon-object.svg" alt="image" className="absolute bottom-0 end-[28%]" />
                <div
                    className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    <div
                        className="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 lg:min-h-[758px] py-20">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">KERMES
                                    PANEL GİRİŞİ</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">E-posta adresinizi ve
                                    parolanızı girin.</p>
                            </div>
                            <form className="space-y-5 dark:text-white" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="Email">E-posta</label>
                                    <div className="relative text-white-dark">
                                        <input id="Email"
                                               type="email"
                                               placeholder="E-posta"
                                               className="form-input ps-10 placeholder:text-white-dark"
                                               value={email}
                                               onChange={(e) => setEmail(e.target.value)}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconMail fill={true} />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="Password">Parola</label>
                                    <div className="relative text-white-dark">
                                        <input id="Password" type="password" placeholder="Parola"
                                               className="form-input ps-10 placeholder:text-white-dark"
                                               onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconLockDots fill={true} />
                                        </span>
                                    </div>
                                </div>
                                {error && (
                                    <div className="flex items-center p-3.5 rounded text-white bg-amber-500 dark:bg-amber-500">
                                        <span className="ltr:pr-2 rtl:pl-2">
                                            <strong className="ltr:mr-1 rtl:ml-1">{ error }</strong>
                                        </span>
                                    </div>
                                    )}
                                <button type="submit"
                                        className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]">
                                    {isLoading ? 'Yükleniyor...' : 'GİRİŞ YAP'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
