import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCan } from '../utils/permissions';

interface PermissionRouteProps {
    permission: string;
    children: React.ReactElement;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({ permission, children }) => {
    const can = useCan();

    if (!can(permission)) {
        return <Navigate to="/403" replace />;
    }

    return children;
};

export default PermissionRoute;
