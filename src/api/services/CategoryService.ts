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
    author: string;
    sort_order?: string | number | null;
    image?: File | null;
};

// Yardımcı: AddDataType -> FormData (image dahil multipart)
function buildCategoryFormData(data: AddDataType, removeImage: boolean = false): FormData {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (key === 'tags' && Array.isArray(value)) {
            // Backend `tags.*.value => exists:tags,id` bekliyor → object array form
            value.forEach((tag: any, idx: number) => {
                const tagId = typeof tag === 'object' ? tag.value ?? tag.id : tag;
                if (tagId !== undefined && tagId !== null) {
                    formData.append(`tags[${idx}][value]`, String(tagId));
                }
            });
            return;
        }

        if (key === 'is_active') {
            formData.append(key, value ? '1' : '0');
            return;
        }

        if (key === 'image') {
            if (value instanceof File) {
                formData.append('image', value);
            }
            return;
        }

        if (key === 'sort_order') {
            // boş string'i göndermeyelim — backend nullable bekliyor
            if (value === '' ) return;
            formData.append('sort_order', String(value));
            return;
        }

        formData.append(key, value as string | Blob);
    });

    // Sprint 17: "Görseli Kaldır" flag'i (sadece true ise gönder)
    if (removeImage) {
        formData.append('remove_image', '1');
    }

    return formData;
}

export const CategoryService = {
    fetchById: async (id: string) => {
        try {
            const response = await api.get(`admin/category/${id}`);
            // Sprint 18: response.data.data artık { category, breadcrumb } döner
            const payload = response.data.hasOwnProperty('data') ? response.data.data : response.data;

            // Yeni format: { category: {...}, breadcrumb: [...] }
            if (payload && typeof payload === 'object' && 'category' in payload) {
                const cat = payload.category ?? {};
                return { ...cat, breadcrumb: payload.breadcrumb ?? [] };
            }

            // Eski format (geri uyumluluk)
            return payload;
        } catch (error) {
            console.error('Error fetching category by id:', error);
            throw error;
        }
    },
    list: async (page = 1, limit = 10, search = '', sortStatus = { columnAccessor: 'id', direction: 'asc' }, filters: { tags?: number[]; parent_category_id?: number | null; is_active?: number | null; name?: string; slug?: string; description?: string; start_date?: string; end_date?: string; show_deleted?: boolean } = {}) => {
        try {
            const response = await api.get(`admin/category`, {
                params: {
                    page,
                    limit,
                    search,
                    sort_by: sortStatus.columnAccessor,
                    sort_order: sortStatus.direction,
                    ...filters,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching category list:', error);
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
            const formData = buildCategoryFormData(data);
            const response = await api.post(`admin/category`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error category add:', error);
            throw error;
        }
    },
    update: async (id: string, data: AddDataType, removeImage: boolean = false) => {
        try {
            const formData = buildCategoryFormData(data, removeImage);
            // Laravel multipart + PUT: _method spoofing
            const response = await api.post(`admin/category/${id}?_method=PUT`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error category update:', error);
            throw error;
        }
    },
    deleteInfo: async (id: number) => {
        try {
            const response = await api.get(`admin/category/${id}/delete-info`);
            return response.data.data;
        } catch (error) {
            console.error('CategoryService deleteInfo Error:', error);
            throw error;
        }
    },
    delete: async (id: number, params?: { target_category_id?: number; force?: boolean }) => {
        try {
            const response = await api.delete(`admin/category/${id}`, { data: params });
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
    },
    restore: async (id: number) => {
        try {
            const response = await api.post(`admin/category/${id}/restore`);
            return response.data;
        } catch (error) {
            console.error('CategoryService restore Error:', error);
            throw error;
        }
    }
};
