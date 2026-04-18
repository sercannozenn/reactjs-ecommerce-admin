export type OrderStatus =
    | 'pending_payment'
    | 'confirmed'
    | 'preparing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
    id: number;
    product_id: number | null;
    product_name: string;
    variant_name: string | null;
    sku: string | null;
    featured_image_url: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
}

export interface OrderStatusHistory {
    id: number;
    from_status: OrderStatus | null;
    to_status: OrderStatus;
    changed_by_type: string;
    note: string | null;
    created_at: string;
}

export interface OrderCustomer {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    total_order_count: number;
    lifetime_value: number;
}

export interface OrderCouponUsage {
    coupon_code: string;
    discount_amount: number;
}

export interface OrderListItem {
    id: number;
    order_number: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    total: number;
    item_count: number;
    tracking_number: string | null;
    customer_name: string | null;
    customer_email: string;
    created_at: string;
}

export interface OrderDetail {
    id: number;
    order_number: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: string;
    payment_reference: string | null;
    subtotal: number;
    discount_amount: number;
    shipping_cost: number;
    total: number;
    coupon_code: string | null;
    shipping_method: string;
    tracking_number: string | null;
    customer_note: string | null;
    admin_note: string | null;
    shipping_address: Record<string, any>;
    billing_address: Record<string, any>;
    customer_email: string;
    customer_phone: string;
    confirmed_at: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    items: OrderItem[];
    status_history: OrderStatusHistory[];
    customer: OrderCustomer | null;
    coupon_usage: OrderCouponUsage | null;
    stock_movements: Array<{
        id: number;
        type: string;
        quantity: number;
        note: string | null;
        created_at: string;
    }>;
}

export interface OrderFilterData {
    search?: string;
    status?: string[];
    payment_status?: string[];
    date_from?: string;
    date_to?: string;
    min_total?: string;
    max_total?: string;
    has_tracking_number?: boolean;
}

export interface OrderListResponse {
    data: OrderListItem[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface TimelineEvent {
    icon: string;
    title: string;
    description: string | null;
    actor: string;
    at: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    pending_payment: 'Ödeme Bekleniyor',
    confirmed:       'Onaylandı',
    preparing:       'Hazırlanıyor',
    shipped:         'Kargoda',
    delivered:       'Teslim Edildi',
    cancelled:       'İptal Edildi',
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
    pending_payment: 'badge bg-warning',
    confirmed:       'badge bg-info',
    preparing:       'badge bg-primary',
    shipped:         'badge bg-secondary',
    delivered:       'badge bg-success',
    cancelled:       'badge bg-danger',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    pending:  'Bekliyor',
    paid:     'Ödendi',
    failed:   'Başarısız',
    refunded: 'İade Edildi',
};

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
    pending:  'badge bg-warning',
    paid:     'badge bg-success',
    failed:   'badge bg-danger',
    refunded: 'badge bg-secondary',
};

export const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
    confirmed: ['preparing', 'cancelled'],
    preparing: ['shipped', 'cancelled'],
    shipped:   ['delivered', 'cancelled'],
};
