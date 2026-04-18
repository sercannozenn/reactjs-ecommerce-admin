import api from '../api';
import {
    CouponFilterData,
    CouponPayload,
    CouponShowResponse,
    CouponListResponse,
    CouponItem,
} from '../../types/coupon';

export type CouponSortKey = 'id' | 'code' | 'value' | 'starts_at' | 'ends_at' | 'created_at';

export const couponService = {
    list: async (
        filters: CouponFilterData = {},
        sortBy: CouponSortKey = 'id',
        sortOrder: 'asc' | 'desc' = 'desc',
        page = 1,
        limit = 10
    ): Promise<CouponListResponse> => {
        try {
            const params: Record<string, any> = {
                page,
                limit,
                sort_by: sortBy,
                sort_order: sortOrder,
            };

            if (filters.code) params.code = filters.code;
            if (filters.is_active !== undefined && filters.is_active !== '') params.is_active = filters.is_active;
            if (filters.status) params.status = filters.status;
            if (filters.starts_from) params.starts_from = filters.starts_from;
            if (filters.ends_to) params.ends_to = filters.ends_to;

            const response = await api.get('/admin/coupons', { params });
            return response.data;
        } catch (error) {
            console.error('couponService list error:', error);
            throw error;
        }
    },

    create: async (data: CouponPayload): Promise<CouponItem> => {
        try {
            const response = await api.post('/admin/coupons', data);
            return response.data?.data ?? response.data;
        } catch (error) {
            console.error('couponService create error:', error);
            throw error;
        }
    },

    show: async (id: number | string): Promise<CouponShowResponse> => {
        try {
            const response = await api.get(`/admin/coupons/${id}`);
            return response.data?.data ?? response.data;
        } catch (error) {
            console.error('couponService show error:', error);
            throw error;
        }
    },

    update: async (id: number | string, data: CouponPayload): Promise<CouponItem> => {
        try {
            const response = await api.put(`/admin/coupons/${id}`, data);
            return response.data?.data ?? response.data;
        } catch (error) {
            console.error('couponService update error:', error);
            throw error;
        }
    },

    destroy: async (id: number | string): Promise<void> => {
        try {
            await api.delete(`/admin/coupons/${id}`);
        } catch (error) {
            console.error('couponService destroy error:', error);
            throw error;
        }
    },

    changeStatus: async (id: number | string): Promise<CouponItem> => {
        try {
            const response = await api.put(`/admin/coupons/${id}/change-status`);
            return response.data?.data ?? response.data;
        } catch (error) {
            console.error('couponService changeStatus error:', error);
            throw error;
        }
    },
};
