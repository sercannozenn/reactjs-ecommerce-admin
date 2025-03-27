import api from '../api';

type ImageType = {
    id: string; // Yüklenen dosya için unique ID veya veritabanından gelen ID
    file?: File; // Sadece yeni yüklenen dosyalar için
    image_path: string; // Hem yeni hem de var olan görsellerin yolunu saklar
    isNew: boolean; // Yeni eklenmiş mi yoksa önceden var olan mı
};

type AddDataType = {
    path: null|ImageType,
    row_1_text: string,
    row_1_color: string,
    row_1_css: string,
    row_2_text: string,
    row_2_color: string,
    row_2_css: string,
    button_text: string,
    button_url: string,
    button_target: string,
    button_color: string,
    button_css: string,
    is_active: boolean;
};
export const SliderService = {
    fetchById: async (id: string) => {
        try {
            const response = await api.get(`admin/slider/${id}`);
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
            const response = await api.get(`admin/slider`, {
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
            const response = await api.post(`admin/slider`, data);
            return response.data;
        } catch (error) {
            console.error('Error fetching tag add:', error);
            throw error;
        }
    },
    update: async (id: string, data: AddDataType) => {
        try {
        const response = await api.put(`admin/slider/${id}`, data);
        return response.data;
        } catch (error) {
            console.error('Error tag update:', error);
            throw error;
        }
    },
    delete: async (id: number) => {
        try {
            const response = await api.delete(`admin/slider/${id}`);
            return response.data;
        } catch (error) {
            console.error('SliderService delete Error:', error);
            throw error;
        }
    },
    changeStatus: async (id: number) => {
        try {
            const response = await api.put(`admin/slider/${id}/change-status`);
            return response.data;
        } catch (error) {
            console.error('Error changing slider status:', error);
            throw error;
        }
    }
};
