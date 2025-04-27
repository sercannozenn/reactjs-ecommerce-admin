import api from '../api';
import { ProductDiscountPayload } from '../../types/discount';


export const ProductDiscountService = {
    create: async () => {
        try {
            const response = await api.get('/admin/product-discount/create');
            return response.data;
        } catch (error) {
            console.error('Error fetch create data:', error);
            throw error;
        }
    },
    add: async (data: ProductDiscountPayload) => {
        try {
            const formData = new FormData();

            (Object.keys(data) as Array<keyof ProductDiscountPayload>).forEach(key => {
                const value = data[key];

                if (value !== null && value !== undefined) {
                    if (key === 'category_ids' || key === 'tag_ids' || key === 'brand_ids' || key === 'targets') {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });

            const response = await api.post(`/admin/product-discount`, formData, {
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
    searchTargets: async (type: string, query: string) => {
        const response = await api.get('/admin/product-discount/search-targets', {
            params: {
                type,
                q: query,
            },
        });

        return response.data;
    },
    fetchById: async (id: string) => {
        try {
            const response = await api.get(`admin/product-discount/${id}`);
            if (response.data.hasOwnProperty('data')) {
                return response.data.data;
            }
            return response.data;
        } catch (error) {
            console.error('Error fetching tag by id:', error);
            throw error;
        }
    },
    list: async (page = 1, limit = 10, sortStatus = { columnAccessor: 'id', direction: 'asc' }, filterData:Record<string, any> = {}) => {
        console.log(JSON.stringify(filterData));
        console.log(filterData);
        try {
            const response = await api.get(`admin/product-discount`, {
                params: {
                    page,
                    limit,
                    sort_by: sortStatus.columnAccessor,
                    sort_order: sortStatus.direction,
                    filter: filterData
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching tag list:', error);
            throw error;
        }
    },
    update: async (id: string, data: ProductDiscountPayload) => {
        try {
            const formData = new FormData();
            formData.append('_method', 'put'); // PUT veya PATCH olduğunda eklenmeli

            // Normal form verilerini ekle
            (Object.keys(data) as Array<keyof ProductDiscountPayload>).forEach(key => {
                const value = data[key];
                if (value !== null && value !== undefined) {
                    if (key === 'category_ids' || key === 'tag_ids' || key === 'brand_ids' || key === 'targets') {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });
            const response = await api.post(`admin/product-discount/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
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
            console.error('ProductService delete Error:', error);
            throw error;
        }
    },
    changeStatus: async (id: number) => {
        try {
            const response = await api.put(
                `/admin/product-discount/${id}/change-status`
            );
            return response.data.data;
        } catch (error: any) {
            console.error('Error changing discount status:', error);
            // 422 gibi validation hatalarında error.response.data.errors.discount[0]
            const msg = error.response?.data?.errors?.discount?.[0] || 'Durum değiştirilemedi.';
            throw new Error(msg);
        }
    },
};
