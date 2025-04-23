import api from '../api';

type AddDataType = {
    title: string;
    type: 'announcement' | 'event';
    date: string;
    short_description?: string;
    description?: string;
    is_active: boolean;
};

export const AnnouncementService = {
    fetchById: async (id: Number) => {
        try {
            const response = await api.get(`admin/announcement/${id}`);
            if (response.data.hasOwnProperty('data')) {
                return response.data.data;
            }
            return response.data;
        } catch (error) {
            console.error('Error fetching announcement by id:', error);
            throw error;
        }
    },

    list: async (page = 1, limit = 10, sortStatus = { columnAccessor: 'id', direction: 'desc' }, filterData: Record<string, any>) => {
        try {
            const response = await api.get(`admin/announcement`, {
                params: {
                    page,
                    limit,
                    filter: filterData,
                    sort_by: sortStatus.columnAccessor,
                    sort_order: sortStatus.direction,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching announcement list:', error);
            throw error;
        }
    },

    add: async (data: AddDataType | FormData) => {
        try {
            const response = await api.post(`admin/announcement`, data);
            return response.data;
        } catch (error) {
            console.error('Error adding announcement:', error);
            throw error;
        }
    },

    update: async (id: Number, data: AddDataType | FormData) => {
        try {
            const response = await api.post(`admin/announcement/${id}?_method=PUT`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating announcement:', error);
            throw error;
        }
    },

    delete: async (id: number) => {
        try {
            const response = await api.delete(`admin/announcement/${id}`);
            return response.data;
        } catch (error) {
            console.error('announcementService delete Error:', error);
            throw error;
        }
    },

    changeStatus: async (id: number) => {
        try {
            const response = await api.put(`admin/announcement/${id}/change-status`);
            return response.data;
        } catch (error) {
            console.error('Error changing announcement status:', error);
            throw error;
        }
    },
};
