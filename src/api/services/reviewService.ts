import api from '../api';
import { ReviewFilterData, ReviewListResponse, Review } from '../../types/review';

export const reviewService = {
    list: async (
        filters: ReviewFilterData = {},
        page = 1,
        limit = 20,
    ): Promise<ReviewListResponse> => {
        const params: Record<string, any> = { page, limit };

        if (filters.status)      params.status      = filters.status;
        if (filters.product_id)  params.product_id  = filters.product_id;
        if (filters.customer_id) params.customer_id = filters.customer_id;
        if (filters.date_from)   params.date_from   = filters.date_from;
        if (filters.date_to)     params.date_to     = filters.date_to;

        const response = await api.get('/admin/reviews', { params });
        return response.data;
    },

    approve: async (id: number): Promise<{ review: Review }> => {
        const response = await api.post(`/admin/reviews/${id}/approve`);
        return response.data;
    },

    reject: async (id: number, rejectionReason: string): Promise<{ review: Review }> => {
        const response = await api.post(`/admin/reviews/${id}/reject`, {
            rejection_reason: rejectionReason,
        });
        return response.data;
    },
};
