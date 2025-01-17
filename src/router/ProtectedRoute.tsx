import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IRootState } from '../store';

interface ProtectedRouteProps {
    children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {

    const token = useSelector((state: IRootState) => state.auth.token);
    const localToken = token || localStorage.getItem('access_token');

    if (!localToken) {
        return <Navigate to="/giris-yap" replace />;
    }

    return children;
};

export default ProtectedRoute;
