/**
 * Laravel validation error helper'ları.
 * errors: Record<string, string[]> şeklinde gelir.
 */
export type FormErrors = Record<string, string[]>;

export const getFieldError = (
    errors: FormErrors,
    key: string
): string | undefined => errors[key]?.[0];

export const hasFieldError = (
    errors: FormErrors,
    key: string
): boolean => !!errors[key]?.length;

/** `variants.0.sku` gibi nested key'ler için */
export const getNestedFieldError = (
    errors: FormErrors,
    prefix: string,
    idx: number,
    key: string
): string | undefined => errors[`${prefix}.${idx}.${key}`]?.[0];

export const hasNestedFieldError = (
    errors: FormErrors,
    prefix: string,
    idx: number,
    key: string
): boolean => !!errors[`${prefix}.${idx}.${key}`]?.length;

/** Bir prefix+idx için herhangi bir hata var mı? (row-level için) */
export const hasRowError = (
    errors: FormErrors,
    prefix: string,
    idx: number
): boolean => {
    const needle = `${prefix}.${idx}.`;
    return Object.keys(errors).some((k) => k.startsWith(needle));
};

/** Input className — hata varsa kırmızı ring/border */
export const fieldClass = (
    base: string,
    hasError: boolean
): string => `${base}${hasError ? ' border-red-500 ring-1 ring-red-200 focus:ring-red-300' : ''}`;

/** react-select borderColor stili — hata durumunda kırmızı */
export const reactSelectErrorStyles = (hasError: boolean) => ({
    control: (base: any, state: any) => ({
        ...base,
        borderColor: hasError ? '#ef4444' : base.borderColor,
        boxShadow: hasError
            ? '0 0 0 1px rgba(239, 68, 68, 0.3)'
            : state.isFocused
                ? base.boxShadow
                : base.boxShadow,
        '&:hover': {
            borderColor: hasError ? '#ef4444' : base.borderColor,
        },
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
});

/** Field key etiketleri — Türkçe insan okunabilir */
const FIELD_LABELS: Record<string, string> = {
    name: 'Ürün adı',
    slug: 'URL slug',
    product_type: 'Ürün tipi',
    brand_id: 'Marka',
    gender: 'Cinsiyet',
    categories: 'Kategoriler',
    tags: 'Etiketler',
    short_description: 'Kısa açıklama',
    long_description: 'Uzun açıklama',
    is_featured: 'Öne çıkan',
    tax_rate: 'KDV oranı',
    price_includes_tax: 'KDV modeli',
    cost_price: 'Maliyet',
    base_price: 'Base satış fiyatı',
    base_price_discount: 'Base indirimli fiyat',
    base_cost_price: 'Base maliyet',
    variants: 'Varyantlar',
    attributes: 'Özellikler',
    images: 'Görseller',
    video_url: 'Video URL',
    keywords: 'Anahtar kelimeler',
    seo_description: 'SEO açıklama',
    meta_title: 'Meta başlık',
    meta_description: 'Meta açıklama',
    og_image_url: 'OG görsel URL',
    author: 'Yazar',
    status: 'Durum',
    publish_at: 'Yayın tarihi',
    unpublish_at: 'Yayından kaldırma',
    sku: 'SKU',
    barcode: 'Barkod',
    price: 'Fiyat',
    stock: 'Stok',
    stock_alert_threshold: 'Stok uyarı eşiği',
    price_discount: 'İndirimli fiyat',
    is_default: 'Varsayılan',
    is_featured_image: 'Öne çıkan görsel',
};

/** `variants.0.sku` → `1. varyant — SKU` */
export const humanizeFieldKey = (key: string): string => {
    const parts = key.split('.');
    if (parts[0] === 'variants' && parts.length === 3) {
        const idx = parseInt(parts[1], 10);
        const sub = FIELD_LABELS[parts[2]] ?? parts[2];
        return `${idx + 1}. varyant — ${sub}`;
    }
    if (parts[0] === 'images' && parts.length >= 2) {
        const idx = parseInt(parts[1], 10);
        if (!Number.isNaN(idx)) {
            if (parts.length === 3) {
                const sub = FIELD_LABELS[parts[2]] ?? parts[2];
                return `${idx + 1}. görsel — ${sub}`;
            }
            return `${idx + 1}. görsel`;
        }
    }
    return FIELD_LABELS[parts[0]] ?? parts[0];
};

/**
 * Axios hata nesnesinden kullanıcıya gösterilecek ilk anlamlı mesajı çıkarır.
 * - Laravel validation: ilk field'ın ilk mesajı
 * - Domain hatası (errors.message): doğrudan o string
 * - Genel mesaj (response.data.message)
 * - Fallback
 */
export const firstApiErrorMessage = (err: any, fallback = 'Bir hata oluştu'): string => {
    const data = err?.response?.data;
    if (!data) return fallback;
    const errors = data.errors;
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
        if (typeof errors.message === 'string' && errors.message.trim()) return errors.message;
        const firstKey = Object.keys(errors)[0];
        if (firstKey) {
            const val = errors[firstKey];
            if (Array.isArray(val) && val.length) return String(val[0]);
            if (typeof val === 'string' && val.trim()) return val;
        }
    }
    if (typeof data.message === 'string' && data.message.trim()) return data.message;
    return fallback;
};

/** Hata özeti — kısa toast cümlesi */
export const buildErrorSummary = (errors: FormErrors): string => {
    const count = Object.keys(errors).length;
    if (count === 0) return '';
    const first = Object.values(errors)
        .slice(0, 3)
        .map((e) => e[0])
        .join(' · ');
    return count <= 3 ? first : `${first} (+${count - 3} hata daha)`;
};
