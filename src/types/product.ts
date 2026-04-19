// Sprint 32.2 — Product domain types
// Variant-first model + attribute sistemi + status lifecycle

export type ProductType = 'physical' | 'digital';

export type ProductStatus =
    | 'draft'
    | 'pending_review'
    | 'published'
    | 'scheduled'
    | 'archived';

export type ProductAttributeType =
    | 'select'
    | 'multiselect'
    | 'text'
    | 'number'
    | 'boolean';

export type ProductAttributeScope = 'product' | 'variant';

export interface ProductAttributeValue {
    id: number;
    value: string;
    attribute_id?: number;
    attribute_name?: string;
    attribute_slug?: string;
    meta?: Record<string, any> | null;
    sort_order?: number;
}

export interface ProductAttribute {
    id: number;
    name: string;
    slug: string;
    type: ProductAttributeType;
    scope: ProductAttributeScope;
    is_global: boolean;
    meta: Record<string, any> | null;
    sort_order?: number;
    deleted_at?: string | null;
    values: ProductAttributeValue[];
}

export interface ProductImage {
    id: number | string;
    image_path: string;
    image_url?: string;
    is_featured: boolean;
    sort_order: number;
    variant_id?: number | null;
}

export interface ProductVariant {
    id: number;
    sku: string;
    barcode: string | null;
    price: number;
    price_discount: number | null;
    final_price: number;
    cost_price: number | null;
    stock: number;
    stock_alert_threshold: number;
    is_default: boolean;
    sort_order: number;
    attribute_label: string; // "Siyah / M"
    attribute_values: ProductAttributeValue[];
    featured_image: ProductImage | null;
}

export interface BrandRef {
    id: number;
    name: string;
    slug: string;
}

export interface CategoryRef {
    id: number;
    name: string;
    slug: string;
}

export interface TagRef {
    id: number;
    name: string;
    slug: string;
}

export interface ProductAdminResource {
    id: number;
    name: string;
    slug: string;
    short_description: string | null;
    long_description: string | null;
    gender: string | null;
    brand: BrandRef | null;
    categories: CategoryRef[];
    tags: TagRef[];
    images: ProductImage[];
    attribute_groups: Record<string, string[]>;
    attribute_values: ProductAttributeValue[];
    default_variant: ProductVariant | null;
    variants: ProductVariant[];
    // Sektör standardı
    mpn: string | null;
    cost_price: number | null;
    tax_rate: number;
    price_includes_tax: boolean;
    is_featured: boolean;
    video_url: string | null;
    product_type: ProductType;
    status: ProductStatus;
    publish_at: string | null;
    unpublish_at: string | null;
    // SEO
    keywords: string | null;
    seo_description: string | null;
    author: string | null;
    meta_title: string | null;
    meta_description: string | null;
    og_image_url: string | null;
    // Computed
    is_active: boolean;
    average_rating: number | null;
    reviews_count: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

// Liste endpoint row tipi (ProductList.tsx için)
export interface ProductListItem {
    id: number;
    name: string;
    slug: string;
    short_description: string | null;
    long_description: string | null;
    brand: BrandRef | null;
    categories: CategoryRef[];
    tags: TagRef[];
    status: ProductStatus;
    is_active: boolean;
    is_featured: boolean;
    product_type: ProductType;
    default_variant: ProductVariant | null;
    variants_count?: number;
    total_stock?: number;
    average_rating?: number | null;
    reviews_count?: number;
    created_at: string;
    formatted_created_at?: string;
}

// Form payload'ları
export interface ProductDraftPayload {
    name?: string;
    slug?: string;
    product_type?: ProductType;
    brand_id?: number | null;
    gender?: string | null;
    short_description?: string | null;
    long_description?: string | null;
    tax_rate?: number;
    price_includes_tax?: boolean;
    is_featured?: boolean;
    video_url?: string | null;
    mpn?: string | null;
    cost_price?: number | null;
    categories?: number[];
    tags?: number[];
    attributes?: number[];
    keywords?: string | null;
    seo_description?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    og_image_url?: string | null;
    author?: string | null;
    publish_at?: string | null;
    unpublish_at?: string | null;
    status?: ProductStatus;
}

export interface VariantInputPayload {
    id?: number;
    sku: string;
    barcode?: string | null;
    price: number;
    price_discount?: number | null;
    cost_price?: number | null;
    stock: number;
    stock_alert_threshold: number;
    is_default: boolean;
    sort_order: number;
    attribute_value_ids: number[];
}

export interface ProductUpdatePayload extends ProductDraftPayload {
    name: string;
    slug: string;
    product_type: ProductType;
    tax_rate: number;
    price_includes_tax: boolean;
    categories: number[];
    tags: number[];
    attributes: number[];
    variants: VariantInputPayload[];
    images: Array<{ id?: number | string; is_featured: boolean; sort_order: number }>;
}

export interface BulkPriceUpdatePayload {
    product_ids: number[];
    percent: number;
}

export interface DeleteInfoResponse {
    orders_count: number;
    stock_movements_count: number;
}

export interface SlugCheckResponse {
    available: boolean;
}
