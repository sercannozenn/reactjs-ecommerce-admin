import api from '../api';

export type SettingType = {
    id?: number;
    key: string;
    value: string | null;
    created_at?: string;
    formatted_created_at?: string;
};

export const SettingsService = {
    async list(params: {
        page?: number;
        limit?: number;
        search?: string;
        sort_by?: string;
        sort_order?: string;
    }) {
        const response = await api.get('/admin/settings', { params });
        return response.data.data; // Laravel 'success' response -> { data, debug? }
    },

    async fetchById(id: number): Promise<SettingType> {
        const response = await api.get(`/admin/settings/${id}`);
        return response.data.data;
    },

    async add(data: SettingType | FormData) {
        const payload = data instanceof FormData ? data : toFormData(data);
        const response = await api.post('/admin/settings', payload);
        return response.data.data;
    },

    async update(id: number, data: Partial<SettingType> | FormData) {
        const payload = data instanceof FormData ? data : toFormData(data);
        const response = await api.post(`/admin/settings/${id}?_method=PUT`, payload);
        return response.data.data;
    },

    async delete(id: number) {
        const response = await api.delete(`/admin/settings/${id}`);
        return response.data;
    }
};

// Yardımcı: JS objesini FormData'ya dönüştür
function toFormData(obj: Record<string, any>): FormData {
    const formData = new FormData();
    Object.entries(obj).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, value);
        }
    });
    return formData;
}
