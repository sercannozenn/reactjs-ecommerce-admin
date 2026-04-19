import api from '../api';
import type {
    ProductAttribute,
    ProductAttributeValue,
    ProductAttributeType,
    ProductAttributeScope,
} from '../../types/product';

export interface AttributeCreatePayload {
    name: string;
    slug?: string | null;
    type: ProductAttributeType;
    scope: ProductAttributeScope;
    is_global?: boolean;
    meta?: Record<string, any> | null;
}

export interface AttributeValueCreatePayload {
    value: string;
    meta?: Record<string, any> | null;
}

export const ProductAttributeService = {
    list: async (categoryId?: number): Promise<ProductAttribute[]> => {
        const response = await api.get('admin/product-attributes', {
            params: categoryId ? { category_id: categoryId } : {},
        });
        return response.data?.data ?? response.data;
    },

    fetchById: async (id: number | string): Promise<ProductAttribute> => {
        const response = await api.get(`admin/product-attributes/${id}`);
        return response.data?.data ?? response.data;
    },

    create: async (payload: AttributeCreatePayload): Promise<ProductAttribute> => {
        const response = await api.post('admin/product-attributes', payload);
        return response.data?.data ?? response.data;
    },

    update: async (
        id: number | string,
        payload: Partial<AttributeCreatePayload>
    ): Promise<ProductAttribute> => {
        const response = await api.put(`admin/product-attributes/${id}`, payload);
        return response.data?.data ?? response.data;
    },

    delete: async (id: number | string) => {
        const response = await api.delete(`admin/product-attributes/${id}`);
        return response.data;
    },

    addValue: async (
        attributeId: number | string,
        payload: AttributeValueCreatePayload
    ): Promise<ProductAttributeValue> => {
        const response = await api.post(
            `admin/product-attributes/${attributeId}/values`,
            payload
        );
        return response.data?.data ?? response.data;
    },

    updateValue: async (
        attributeId: number | string,
        valueId: number | string,
        payload: Partial<AttributeValueCreatePayload> & { sort_order?: number | null }
    ): Promise<ProductAttributeValue> => {
        const response = await api.patch(
            `admin/product-attributes/${attributeId}/values/${valueId}`,
            payload
        );
        return response.data?.data ?? response.data;
    },

    deleteValue: async (
        attributeId: number | string,
        valueId: number | string
    ) => {
        const response = await api.delete(
            `admin/product-attributes/${attributeId}/values/${valueId}`
        );
        return response.data;
    },

    reorderValues: async (
        attributeId: number | string,
        order: Record<number, number>
    ): Promise<ProductAttribute> => {
        const response = await api.patch(
            `admin/product-attributes/${attributeId}/values/reorder`,
            { order }
        );
        return response.data?.data ?? response.data;
    },

    listTrashed: async (): Promise<ProductAttribute[]> => {
        const response = await api.get('admin/product-attributes/trash');
        return response.data?.data ?? response.data;
    },

    restore: async (id: number | string): Promise<ProductAttribute> => {
        const response = await api.post(`admin/product-attributes/${id}/restore`);
        return response.data?.data ?? response.data;
    },
};
