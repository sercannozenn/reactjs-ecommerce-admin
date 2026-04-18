export type StockMovementType =
    | 'order_deduction'
    | 'order_cancellation'
    | 'manual_adjustment'
    | 'restock'
    | 'damage';

export type ProductSizeStockItem = {
    id: number;
    product_id: number;
    size: string;
    stock: number;
    stock_alert: number;
    low_stock_threshold: number;
    product?: {
        id: number;
        name: string;
        slug: string;
    };
};

export type StockMovementItem = {
    id: number;
    product_size_stock_id: number;
    type: StockMovementType;
    quantity: number;
    stock_before: number;
    stock_after: number;
    order_id: number | null;
    created_by_user_id: number | null;
    note: string | null;
    created_at: string;
    productSizeStock?: ProductSizeStockItem;
    createdBy?: { id: number; name: string } | null;
    order?: { id: number; order_number: string } | null;
};

export type StockReportSummary = {
    total_restock: number;
    total_deducted: number;
    total_restored: number;
    total_damage: number;
    manual_adjustment_count: number;
};

export type StockMovementListResponse = {
    data: StockMovementItem[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
};

export type LowStockListResponse = {
    data: ProductSizeStockItem[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
};

export type StockReportFilters = {
    date_from: string;
    date_to: string;
    type?: StockMovementType[];
    product_id?: number;
    variant_id?: number;
    created_by_user_id?: number;
};

export type StockReportResponse = {
    data: {
        movements: {
            data: StockMovementItem[];
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
        summary: StockReportSummary;
    };
};
