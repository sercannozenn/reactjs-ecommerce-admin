import api from '../api';

type AddDataType = {
    category_ids: number[];
    tag_ids: number[];
    slug: string;
    name: string;
    short_description: string;
    long_description: string;
    stock: number;
    stock_alert_limit: number;
    is_active: boolean;
    keywords: string;
    seo_description: string;
    author: string,
    images: File[];
    featured_image: string | null;
};

export const ProductService = {
    fetchById: async (id: string) => {
        try {
            const response = await api.get(`admin/product/${id}`);
            if (response.data.hasOwnProperty('data')) {
                return response.data.data;
            }
            return response.data;
        } catch (error) {
            console.error('Error fetching tag by id:', error);
            throw error;
        }
    },
    list: async (page = 1, limit = 10, search = '', sortStatus = { columnAccessor: 'id', direction: 'asc' }) => {
        try {
            const response = await api.get(`admin/product`, {
                params: {
                    page,
                    limit,
                    search,
                    sort_by: sortStatus.columnAccessor,
                    sort_order: sortStatus.direction
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching tag list:', error);
            throw error;
        }
    },
    create: async () => {
        try {
            const response = await api.get('/admin/product/create');
            return response.data;
        } catch (error) {
            console.error('Error fetch create data:', error);
            throw error;
        }
    },
    add: async (data: AddDataType) => {
        try {
            const formData = new FormData();

            // Normal form verilerini ekle
            (Object.keys(data) as Array<keyof AddDataType>).forEach(key => {
                if (key !== 'images') {
                    const value = data[key];
                    if (key === 'category_ids' || key === 'tag_ids') {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });

            // Görselleri ekle
            if (data.images?.length) {
                data.images.forEach((image) => {
                    formData.append('images[]', image);
                });
            }

            const response = await api.post(`admin/product`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching tag add:', error);
            throw error;
        }
    },
    update: async (id: string, data: AddDataType) => {
        try {
            const response = await api.put(`admin/product/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error tag update:', error);
            throw error;
        }
    },
    delete: async (id: number) => {
        try {
            const response = await api.delete(`admin/product/${id}`);
            return response.data;
        } catch (error) {
            console.error('CategoryService delete Error:', error);
            throw error;
        }
    },
    changeStatus: async (id: number) => {
        try {
            const response = await api.put(`admin/product/${id}/change-status`);
            return response.data;
        } catch (error) {
            console.error('Error changing product status:', error);
            throw error;
        }
    }
};
