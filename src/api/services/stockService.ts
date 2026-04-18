import api from '../api';
import {
    LowStockListResponse,
    StockMovementListResponse,
    StockReportFilters,
    StockReportResponse,
} from '../../types/stock';

export const stockService = {
    getLowStock: async (page = 1, perPage = 20): Promise<LowStockListResponse> => {
        try {
            const response = await api.get('/admin/products/low-stock', {
                params: { page, per_page: perPage },
            });
            return response.data?.data ?? response.data;
        } catch (error) {
            console.error('stockService getLowStock error:', error);
            throw error;
        }
    },

    getProductMovements: async (productId: number, page = 1, perPage = 20): Promise<StockMovementListResponse> => {
        try {
            const response = await api.get(`/admin/products/${productId}/stock-movements`, {
                params: { page, per_page: perPage },
            });
            return response.data?.data ?? response.data;
        } catch (error) {
            console.error('stockService getProductMovements error:', error);
            throw error;
        }
    },

    getSizeStockMovements: async (
        sizeStockId: number,
        type?: string,
        page = 1,
        perPage = 20
    ): Promise<StockMovementListResponse> => {
        try {
            const params: Record<string, any> = { page, per_page: perPage };
            if (type) params.type = type;
            const response = await api.get(`/admin/size-stocks/${sizeStockId}/stock-movements`, { params });
            return response.data?.data ?? response.data;
        } catch (error) {
            console.error('stockService getSizeStockMovements error:', error);
            throw error;
        }
    },

    adjust: async (sizeStockId: number, newStock: number, note: string): Promise<void> => {
        try {
            await api.post(`/admin/size-stocks/${sizeStockId}/adjust`, {
                new_stock: newStock,
                note,
            });
        } catch (error) {
            console.error('stockService adjust error:', error);
            throw error;
        }
    },

    restock: async (sizeStockId: number, quantity: number, note?: string): Promise<void> => {
        try {
            await api.post(`/admin/size-stocks/${sizeStockId}/restock`, {
                quantity,
                note: note || undefined,
            });
        } catch (error) {
            console.error('stockService restock error:', error);
            throw error;
        }
    },

    damage: async (sizeStockId: number, quantity: number, note: string): Promise<void> => {
        try {
            await api.post(`/admin/size-stocks/${sizeStockId}/damage`, {
                quantity,
                note,
            });
        } catch (error) {
            console.error('stockService damage error:', error);
            throw error;
        }
    },

    getReport: async (filters: StockReportFilters, page = 1, perPage = 50): Promise<StockReportResponse> => {
        try {
            const params: Record<string, any> = {
                date_from: filters.date_from,
                date_to: filters.date_to,
                page,
                per_page: perPage,
            };
            if (filters.type?.length) params['type[]'] = filters.type;
            if (filters.product_id) params.product_id = filters.product_id;
            if (filters.variant_id) params.variant_id = filters.variant_id;
            if (filters.created_by_user_id) params.created_by_user_id = filters.created_by_user_id;
            const response = await api.get('/admin/reports/stock-movements', { params });
            return response.data;
        } catch (error) {
            console.error('stockService getReport error:', error);
            throw error;
        }
    },
};
