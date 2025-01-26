import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const Index = () => {
    const navigate = useNavigate();
    useEffect(() => {
        const checkToken = async () => {

        };

        checkToken();
    }, [navigate]);    return (
        <div>
            <h1>starter page</h1>
        </div>
    );
};

export default Index;
