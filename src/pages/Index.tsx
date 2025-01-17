import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
// import axios from 'axios';
// axios.defaults.withCredentials = true;
// axios.defaults.withXSRFToken = true;
import api from '../api/api';

const Index = () => {
    const navigate = useNavigate();
    useEffect(() => {
        const checkToken = async () => {
            // try {
            //     const response = await api.get('/');
            //     console.log(response.data);
            //
            //     // const response = await axios.get('https://kermes.test/api');
            //     // console.log(response);
            // } catch (error) {
            //     console.error('Token doğrulama hatası:', error);
            //     navigate('/giris-yap');
            // }
        };

        checkToken();
    }, [navigate]);    return (
        <div>
            <h1>starter page</h1>
        </div>
    );
};

export default Index;
