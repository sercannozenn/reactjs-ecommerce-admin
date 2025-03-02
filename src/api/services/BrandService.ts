import api from '../api';

type AddDataType = {
    slug: string;
    name: string;
    is_active: boolean;
    keywords: string;
    seo_description: string;
    author: string
};
export const BrandService = {
    fetchById: async (id: string) => {
        try {
            const response = await api.get(`admin/brand/${id}`);
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
            const response = await api.get(`admin/brand`, {
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
    add: async (data: AddDataType) => {
        try {
            const response = await api.post(`admin/brand`, data);
            return response.data;
        } catch (error) {
            console.error('Error fetching tag add:', error);
            throw error;
        }
    },
    update: async (id: string, data: AddDataType) => {
        try {
        const response = await api.put(`admin/brand/${id}`, data);
        return response.data;
        } catch (error) {
            console.error('Error tag update:', error);
            throw error;
        }
    },
    delete: async (id: number) => {
        try {
            const response = await api.delete(`admin/brand/${id}`);
            return response.data;
        } catch (error) {
            console.error('brandService delete Error:', error);
            throw error;
        }
    },
    changeStatus: async (id: number) => {
        try {
            const response = await api.put(`admin/brand/${id}/change-status`);
            return response.data;
        } catch (error) {
            console.error('Error changing brand status:', error);
            throw error;
        }
    }
};
