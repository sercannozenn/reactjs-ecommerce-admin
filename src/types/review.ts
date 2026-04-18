export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewCustomer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

export interface ReviewProduct {
    id: number;
    name: string;
    slug: string;
}

export interface Review {
    id: number;
    customer: ReviewCustomer | null;
    product: ReviewProduct | null;
    order_id: number;
    rating: number;
    title: string | null;
    body: string;
    status: ReviewStatus;
    rejection_reason: string | null;
    moderated_at: string | null;
    helpful_count: number;
    created_at: string;
}

export interface ReviewListResponse {
    data: Review[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface ReviewFilterData {
    status?: ReviewStatus | '';
    product_id?: number | '';
    customer_id?: number | '';
    date_from?: string;
    date_to?: string;
}

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
    pending:  'Onay Bekliyor',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
};

export const REVIEW_STATUS_BADGE: Record<ReviewStatus, string> = {
    pending:  'badge-outline-warning',
    approved: 'badge-outline-success',
    rejected: 'badge-outline-danger',
};
