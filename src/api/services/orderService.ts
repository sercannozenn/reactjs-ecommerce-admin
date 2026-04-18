import api from '../api';
import { OrderFilterData, OrderListResponse, OrderDetail, TimelineEvent } from '../../types/order';

export const orderService = {
    list: async (filters: OrderFilterData = {}, sortBy = 'created_at', sortDir: 'asc' | 'desc' = 'desc', page = 1, limit = 20): Promise<OrderListResponse> => {
        const params: Record<string, any> = { page, limit, sort_by: sortBy, sort_dir: sortDir };

        if (filters.search)          params.search = filters.search;
        if (filters.status?.length)  params['status[]'] = filters.status;
        if (filters.payment_status?.length) params['payment_status[]'] = filters.payment_status;
        if (filters.date_from)       params.date_from = filters.date_from;
        if (filters.date_to)         params.date_to = filters.date_to;
        if (filters.min_total)       params.min_total = filters.min_total;
        if (filters.max_total)       params.max_total = filters.max_total;
        if (filters.has_tracking_number !== undefined) params.has_tracking_number = filters.has_tracking_number ? 1 : 0;

        const response = await api.get('/admin/orders', { params });
        return response.data;
    },

    show: async (id: number): Promise<{ order: OrderDetail }> => {
        const response = await api.get(`/admin/orders/${id}`);
        return response.data?.data ?? response.data;
    },

    updateStatus: async (id: number, status: string, note?: string): Promise<{ order: OrderDetail }> => {
        const response = await api.put(`/admin/orders/${id}/status`, { status, note });
        return response.data?.data ?? response.data;
    },

    updateTracking: async (id: number, trackingNumber: string, shippingMethod?: string): Promise<{ order: OrderDetail }> => {
        const response = await api.put(`/admin/orders/${id}/tracking`, {
            tracking_number: trackingNumber,
            shipping_method: shippingMethod,
        });
        return response.data?.data ?? response.data;
    },

    updateAdminNote: async (id: number, adminNote: string | null): Promise<void> => {
        await api.put(`/admin/orders/${id}/admin-note`, { admin_note: adminNote });
    },

    cancel: async (id: number, reason: string, refundPayment: boolean): Promise<{ order: OrderDetail }> => {
        const response = await api.post(`/admin/orders/${id}/cancel`, { reason, refund_payment: refundPayment });
        return response.data?.data ?? response.data;
    },

    timeline: async (id: number): Promise<TimelineEvent[]> => {
        const response = await api.get(`/admin/orders/${id}/timeline`);
        return response.data?.data?.timeline ?? [];
    },

    export: async (filters: OrderFilterData = {}): Promise<Blob> => {
        const response = await api.post('/admin/orders/export', filters, { responseType: 'blob' });
        return response.data;
    },
};
