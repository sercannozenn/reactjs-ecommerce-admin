import api from '../api';
import type {
    ProductAdminResource,
    ProductDraftPayload,
    ProductUpdatePayload,
    BulkPriceUpdatePayload,
    DeleteInfoResponse,
    SlugCheckResponse,
    VariantInputPayload,
} from '../../types/product';

// Sprint 32.2 — variant-first product service
// Eski endpoint'ler (change-status, price-history, admin/product/create) kaldırıldı.

export const ProductService = {
    // --- LIST / DETAIL ---
    list: async (
        page = 1,
        limit = 10,
        sortStatus: { columnAccessor: string; direction: string } = {
            columnAccessor: 'id',
            direction: 'asc',
        },
        filterData: Record<string, any> = {}
    ) => {
        const response = await api.get('admin/products', {
            params: {
                page,
                limit,
                sort_by: sortStatus.columnAccessor,
                sort_order: sortStatus.direction,
                ...filterData,
            },
        });
        return response.data;
    },

    fetchById: async (id: string | number): Promise<ProductAdminResource> => {
        const response = await api.get(`admin/products/${id}`);
        return response.data?.data ?? response.data;
    },

    // --- DRAFT LIFECYCLE ---
    createDraft: async (data: ProductDraftPayload): Promise<ProductAdminResource> => {
        const response = await api.post('admin/products/draft', data);
        return response.data?.data ?? response.data;
    },

    updateDraft: async (
        id: number | string,
        data: Partial<ProductDraftPayload>
    ): Promise<ProductAdminResource> => {
        const response = await api.patch(`admin/products/${id}/draft`, data);
        return response.data?.data ?? response.data;
    },

    update: async (
        id: number | string,
        data: ProductUpdatePayload
    ): Promise<ProductAdminResource> => {
        const response = await api.put(`admin/products/${id}`, data);
        return response.data?.data ?? response.data;
    },

    publish: async (
        id: number | string,
        data: ProductUpdatePayload
    ): Promise<ProductAdminResource> => {
        // Backend PublishProductRequest full validation ister; publish tek adımda
        // güncel payload'u kaydeder ve status=published'a geçirir.
        const response = await api.post(`admin/products/${id}/publish`, data);
        return response.data?.data ?? response.data;
    },

    duplicate: async (id: number | string): Promise<ProductAdminResource> => {
        const response = await api.post(`admin/products/${id}/duplicate`);
        return response.data?.data ?? response.data;
    },

    // --- IMAGE UPLOAD / META / DELETE ---
    uploadImages: async (
        productId: number | string,
        files: File[],
        variantId: number | null = null
    ): Promise<any[]> => {
        const fd = new FormData();
        files.forEach((f) => fd.append('files[]', f));
        if (variantId) fd.append('variant_id', String(variantId));
        const response = await api.post(
            `admin/products/${productId}/images`,
            fd,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data?.data?.data ?? response.data?.data ?? response.data;
    },

    updateImage: async (
        productId: number | string,
        imageId: number,
        data: { is_featured?: boolean; sort_order?: number; variant_id?: number | null }
    ): Promise<any> => {
        const response = await api.patch(
            `admin/products/${productId}/images/${imageId}`,
            data
        );
        return response.data?.data ?? response.data;
    },

    deleteImage: async (
        productId: number | string,
        imageId: number
    ): Promise<void> => {
        await api.delete(`admin/products/${productId}/images/${imageId}`);
    },

    delete: async (id: number | string) => {
        const response = await api.delete(`admin/products/${id}`);
        return response.data;
    },

    deleteInfo: async (id: number | string): Promise<DeleteInfoResponse> => {
        const response = await api.get(`admin/products/${id}/delete-info`);
        return response.data?.data ?? response.data;
    },

    // --- SLUG / HELPERS ---
    slugCheck: async (slug: string, productId?: number | string): Promise<SlugCheckResponse> => {
        const response = await api.get('admin/products/slug-check', {
            params: { slug, ...(productId ? { product_id: productId } : {}) },
        });
        return response.data?.data ?? response.data;
    },

    // --- VARIANTS ---
    syncVariants: async (
        productId: number | string,
        variants: VariantInputPayload[]
    ): Promise<{ data: any }> => {
        const response = await api.post(`admin/products/${productId}/variants`, { variants });
        return response.data;
    },

    destroyVariant: async (
        productId: number | string,
        variantId: number | string,
        forceArchive = false
    ) => {
        const response = await api.delete(`admin/products/${productId}/variants/${variantId}`, {
            params: forceArchive ? { force_archive: true } : {},
        });
        return response.data;
    },

    // --- LEGACY (ProductDiscountHistory sayfası için korunuyor — Sprint 32.2 dışı) ---
    getPriceHistory: async (id: number): Promise<any[]> => {
        try {
            const response = await api.get<{ data: any[] }>(
                `/admin/product/${id}/price-history`
            );
            return response.data.data;
        } catch (error) {
            console.error('Error fetching price history:', error);
            throw error;
        }
    },

    // --- BULK ---
    bulkPriceUpdate: async (payload: BulkPriceUpdatePayload): Promise<{ count: number }> => {
        const response = await api.post('admin/products/bulk-price-update', payload);
        return response.data?.data ?? response.data;
    },
};
