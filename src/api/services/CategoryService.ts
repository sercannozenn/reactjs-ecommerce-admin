import api from '../api';

type AddDataType = {
    parent_category_id: string;
    slug: string;
    name: string;
    description: string;
    tags: any[];
    is_active: boolean;
    keywords: string;
    seo_description: string;
    author: string
};
export const CategoryService = {
    fetchById: async (id: string) => {
        try {
            const response = await api.get(`admin/category/${id}`);
            if (response.data.hasOwnProperty('data')){
                return response.data.data;
            }
            return response.data;
        }catch (error){
            console.error('Error fetching tag by id:', error);
            throw error;
        }
    },
    list: async (page = 1, limit = 10, search = '', sortStatus = { columnAccessor: 'id', direction: 'asc' }) => {
        try {
            const response = await api.get(`admin/category`, {
                params: {
                    page,
                    limit,
                    search,
                    sort_by: sortStatus.columnAccessor,
                    sort_order: sortStatus.direction,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching tag list:', error);
            throw error;
        }
    },
    create: async () => {
        try {
            const response = await api.get('/admin/category/create');
            return response.data;
        } catch (error) {
            console.error('Error fetch create data:', error);
            throw error;
        }
    },
    add: async (data: AddDataType) => {
        try {
            const response = await api.post(`admin/category`, data);
            return response.data;
        } catch (error) {
            console.error('Error fetching tag add:', error);
            throw error;
        }
    },
    update: async (id: string, data: AddDataType) => {
        try {
        const response = await api.put(`admin/category/${id}`, data);
        return response.data;
        } catch (error) {
            console.error('Error tag update:', error);
            throw error;
        }
    },
    delete: async (id: number) => {
        try {
            const response = await api.delete(`admin/category/${id}`);
            return response.data;
        } catch (error) {
            console.error('CategoryService delete Error:', error);
            throw error;
        }
    },
    changeStatus: async (id: number) => {
        try {
            const response = await api.put(`admin/category/${id}/change-status`);
            return response.data;
        } catch (error) {
            console.error('Error changing category status:', error);
            throw error;
        }
    }
};
