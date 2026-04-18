export type CouponType = 'percentage' | 'fixed';

/**
 * Liste (index) response'unda dönen hafif kupon objesi.
 * GET /api/admin/coupons → data[].
 */
export type CouponItem = {
    id: number;
    code: string;
    description: string | null;
    type: CouponType;
    value: number;
    max_discount_amount: number | null;
    min_cart_amount: number | null;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
    is_expired: boolean;
    is_not_started: boolean;
    usage_limit: number | null;
    per_user_limit: number | null;
    total_usage_count: number;
    remaining_usage: number | null;
    created_by: number | null;
    created_at: string;
    updated_at: string;
};

/**
 * Show (detay) response'u liste ile aynı alanları döner (backend CouponAdminResource).
 * Ayrı tip olarak tanımlandı; ileride detayda ek alan eklenmek istenirse burası genişletilir.
 */
export type CouponDetail = CouponItem;

export type CouponUsage = {
    id: number;
    coupon_id: number;
    customer_id: number | null;
    customer_name: string | null;
    order_id: number | null;
    order_number: string | null;
    discount_amount: number;
    used_at: string;
};

export type CouponStats = {
    total_usage_count: number;
    total_discount_amount: number;
    average_discount_amount: number;
};

export type CouponShowResponse = {
    coupon: CouponDetail;
    usages: CouponUsage[];
    stats: CouponStats;
};

export type CouponFormData = {
    code: string;
    description: string;
    type: CouponType;
    value: number | '';
    max_discount_amount: number | '' | null;
    min_cart_amount: number | '' | null;
    usage_limit: number | '' | null;
    per_user_limit: number | '' | null;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
};

export type CouponPayload = {
    code: string;
    description?: string | null;
    type: CouponType;
    value: number;
    max_discount_amount?: number | null;
    min_cart_amount?: number | null;
    usage_limit?: number | null;
    per_user_limit?: number | null;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active?: boolean;
};

export type CouponFilterData = {
    code?: string;
    is_active?: string;
    status?: 'active' | 'expired' | 'scheduled' | '';
    starts_from?: string;
    ends_to?: string;
};

export type CouponListResponse = {
    data: CouponItem[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    // Backend pagination helper bazen meta yerine kök seviyede de dönebilir:
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
};
