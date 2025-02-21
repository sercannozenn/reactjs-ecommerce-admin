import api from '../api';
import { string } from 'yup';
type ImageType = {
    id: string; // Yüklenen dosya için unique ID veya veritabanından gelen ID
    file?: File; // Sadece yeni yüklenen dosyalar için
    image_path: string; // Hem yeni hem de var olan görsellerin yolunu saklar
    isNew: boolean; // Yeni eklenmiş mi yoksa önceden var olan mı
};

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
    images: ImageType[];
    existing_images: string[];
    featured_image: string;
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
    list: async (page = 1, limit = 10, sortStatus = { columnAccessor: 'id', direction: 'asc' }, filterData:Record<string, any>) => {
        console.log(JSON.stringify(filterData));
        console.log(filterData);
        try {
            const response = await api.get(`admin/product`, {
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
    create: async () => {
        try {
            const response = await api.get('/admin/product/create');
            return response.data;
        } catch (error) {
            console.error('Error fetch create data:', error);
            throw error;
        }
    },
    getFiltersData: async () => {
        try {
            const response = await api.get('/admin/product/filters-data');
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
                    if (image.file !== undefined){
                        formData.append('images[]', image.file);
                        formData.append('image_ids[]', image.id);
                    }
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
            const formData = new FormData();
            let imageIds:string[] = [];
            formData.append('_method', 'put'); // PUT veya PATCH olduğunda eklenmeli

            // Normal form verilerini ekle
            (Object.keys(data) as Array<keyof AddDataType>).forEach(key => {
                if (key !== 'images') {
                    const value = data[key];
                    if (key === 'category_ids' || key === 'tag_ids' || key === 'existing_images') {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });
            console.log(data);
            console.log(data.images);
            // Görselleri ekle
            if (data.images?.length) {
                // Yeni yüklenen görseller için
                const newImages = data.images.filter(img => img.isNew && img.file);
                newImages.forEach((image) => {
                    formData.append('images[]', image.file as File);
                    // formData.append('image_ids[]', image.id);
                    imageIds.push(image.id);
                });
            }

            if (data.existing_images?.length) {
                const existingImages = data.existing_images;
                existingImages.forEach((id) => {
                    // formData.append('image_ids[]', id);
                    imageIds.push(id.toString());
                });
            }
            formData.append('image_ids', JSON.stringify(imageIds));



            const response = await api.post(`admin/product/${id}`, formData, {
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
            const response = await api.put(`admin/product/${id}/change-status`);
            return response.data;
        } catch (error) {
            console.error('Error changing product status:', error);
            throw error;
        }
    }
};
