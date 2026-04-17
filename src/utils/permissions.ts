import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { IRootState } from '../store';

export const useCan = () => {
    const permissions = useSelector((s: IRootState) => s.auth.user?.permissions ?? []);
    return useCallback(
        (permission: string): boolean => permissions.includes(permission),
        [permissions]
    );
};
