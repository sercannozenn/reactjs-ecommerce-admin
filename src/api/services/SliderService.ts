import api from '../api';

export const SliderService = {
    list: async (page = 1, limit = 10, search = '', sortStatus = { columnAccessor: 'id', direction: 'asc' }) => {
        try {
            const response = await api.get('admin/slider', {
                params: {
                    page,
                    limit,
                    filter: { search },
                    sort_by: sortStatus.columnAccessor,
                    sort_order: sortStatus.direction
                }
            });
            return response.data;
        } catch (error) {
            console.error('SliderService list error:', error);
            throw error;
        }
    },

    delete: async (id: number) => {
        try {
            const response = await api.delete(`admin/slider/${id}`);
            return response.data;
        } catch (error) {
            console.error('SliderService delete error:', error);
            throw error;
        }
    },

    changeStatus: async (id: number) => {
        try {
            const response = await api.put(`admin/slider/${id}/change-status`);
            return response.data;
        } catch (error) {
            console.error('SliderService status change error:', error);
            throw error;
        }
    },

    fetchById: async (id: number) => {
        try {
            const response = await api.get(`admin/slider/${id}`);
            return response.data;
        } catch (error) {
            console.error('SliderService fetchById error:', error);
            throw error;
        }
    },

    create: async (formData: FormData) => {
        try {
            const response = await api.post('admin/slider', formData);
            return response.data;
        } catch (error) {
            console.error('SliderService create error:', error);
            throw error;
        }
    },

    update: async (id: number, formData: FormData) => {
        try {
            const response = await api.post(`admin/slider/${id}?_method=PUT`, formData);
            return response.data;
        } catch (error) {
            console.error('SliderService update error:', error);
            throw error;
        }
    }
};
