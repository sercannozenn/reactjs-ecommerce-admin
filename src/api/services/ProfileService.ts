import api from '../api';

export type ProfileData = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    roles: string[];
    permissions: string[];
};

export type ProfileUpdatePayload = {
    name: string;
    email: string;
};

export type ChangePasswordPayload = {
    current_password: string;
    password: string;
    password_confirmation: string;
};

export type SessionItem = {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string | null;
    is_current: boolean;
};

export const ProfileService = {
    fetch: async (): Promise<ProfileData> => {
        const response = await api.get('/admin/profile');
        if (response.data && Object.prototype.hasOwnProperty.call(response.data, 'data')) {
            return response.data.data as ProfileData;
        }
        return response.data as ProfileData;
    },

    update: async (data: ProfileUpdatePayload) => {
        const response = await api.put('/admin/profile', data);
        return response.data;
    },

    changePassword: async (data: ChangePasswordPayload) => {
        const response = await api.post('/admin/profile/change-password', data);
        return response.data;
    },

    listSessions: async (): Promise<SessionItem[]> => {
        const response = await api.get('/admin/profile/sessions');
        if (response.data && Object.prototype.hasOwnProperty.call(response.data, 'data')) {
            return response.data.data as SessionItem[];
        }
        return response.data as SessionItem[];
    },

    deleteSession: async (tokenId: number) => {
        const response = await api.delete(`/admin/profile/sessions/${tokenId}`);
        return response.data;
    },

    deleteOtherSessions: async () => {
        const response = await api.delete('/admin/profile/sessions');
        return response.data;
    },
};
