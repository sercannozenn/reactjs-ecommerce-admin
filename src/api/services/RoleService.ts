import api from '../api';

export type PermissionItem = {
    name: string;
    description: string;
};

export type PermissionGroup = {
    module: string;
    permissions: PermissionItem[];
};

export type RoleItem = {
    id: number;
    name: string;
    permissions: PermissionItem[];
};

export type RoleDetail = {
    id: number;
    name: string;
    permissions: string[];
};

export type UserItem = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    roles: string[];
    direct_permissions: string[];
};

export type UserListParams = {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
};

export type PaginatedUsers = {
    data: UserItem[];
    meta: { total: number; per_page: number; current_page: number; last_page: number };
};

export const RoleService = {
    permissions: async (): Promise<PermissionGroup[]> => {
        const response = await api.get('admin/permissions');
        return response.data.data;
    },

    roles: async (): Promise<RoleItem[]> => {
        const response = await api.get('admin/roles');
        return response.data.data;
    },

    updateRolePermissions: async (roleId: number, permissions: string[]) => {
        const response = await api.put(`admin/roles/${roleId}/permissions`, { permissions });
        return response.data;
    },

    users: async (): Promise<UserItem[]> => {
        const response = await api.get('admin/users');
        return response.data.data;
    },

    fetchUsers: async (params: UserListParams = {}): Promise<PaginatedUsers> => {
        const response = await api.get('admin/users', { params });
        return response.data.data;
    },

    getUser: async (id: number): Promise<UserItem> => {
        const response = await api.get(`admin/users/${id}`);
        return response.data.data;
    },

    getRole: async (id: number): Promise<RoleDetail> => {
        const response = await api.get(`admin/roles/${id}`);
        return response.data.data;
    },

    createRole: async (name: string, permissions: string[] = []): Promise<{ id: number; name: string }> => {
        const response = await api.post('admin/roles', { name, permissions });
        return response.data.data;
    },

    deleteRole: async (id: number): Promise<void> => {
        await api.delete(`admin/roles/${id}`);
    },

    assignRole: async (userId: number, role: string) => {
        const response = await api.put(`admin/users/${userId}/role`, { role });
        return response.data;
    },

    assignPermissions: async (userId: number, permissions: string[]) => {
        const response = await api.put(`admin/users/${userId}/permissions`, { permissions });
        return response.data;
    },

    changeStatus: async (userId: number) => {
        const response = await api.put(`admin/users/${userId}/change-status`);
        return response.data;
    },

    forceLogout: async (userId: number) => {
        const response = await api.post(`admin/users/${userId}/force-logout`);
        return response.data;
    },
};
