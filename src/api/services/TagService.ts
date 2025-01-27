import api from '../api';

export const TagService = {
    fetchTagById: async (id: string) => {
        try {
            const response = await api.get(`admin/tag/${id}`);
            if (response.data.hasOwnProperty('data')){
                return response.data.data;
            }
            return response.data;
        }catch (error){
            console.error('Error fetching tag by id:', error);
            throw error;
        }
    },
    fetchTags: async (page = 1, limit = 10, search = '', sortStatus = { columnAccessor: 'id', direction: 'asc' }) => {
        try {
            const response = await api.get(`admin/tag`, {
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
    addTag: async (data: {name: string, slug: string}) => {
        try {
            const response = await api.post(`admin/tag`, data);
            return response.data;
        } catch (error) {
            console.error('Error fetching tag add:', error);
            throw error;
        }
    },
    updateTag: async (id: string, data: { name: string; slug: string }) => {
        try {
        const response = await api.put(`admin/tag/${id}`, data);
        return response.data;
        } catch (error) {
            console.error('Error tag update:', error);
            throw error;
        }
    },
    deleteTag: async (id: number) => {
        try {
            const response = await api.delete(`/tags/${id}`);
            return response.data;
        } catch (error) {
            console.error('TagService deleteTag Error:', error);
            throw error;
        }
    },
    editTag: async (id: number, payload: any) => {
        try {
            const response = await api.put(`/tags/${id}`, payload);
            return response.data;
        } catch (error) {
            console.error('TagService editTag Error:', error);
            throw error;
        }
    },
};
