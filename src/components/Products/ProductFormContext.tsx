import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import type {
    ProductAdminResource,
    ProductStatus,
    ProductType,
    ProductImage,
    ProductVariant,
    ProductAttribute,
} from '../../types/product';

export type TabKey = 'general' | 'stock' | 'price' | 'media' | 'seo';

export interface VariantDraft {
    id?: number;
    sku: string;
    barcode: string | null;
    price: number;
    price_discount: number | null;
    cost_price: number | null;
    stock: number;
    stock_alert_threshold: number;
    is_default: boolean;
    sort_order: number;
    attribute_value_ids: number[];
    attribute_label?: string;
    /** Varyant kapak görseli — product_images FK'si (null ise ürün kapak görseli kullanılır). */
    featured_image_id: number | null;
}

export interface ImageDraft {
    id: number | string;
    file?: File;
    image_path: string;
    isNew: boolean;
    is_featured: boolean;
    sort_order: number;
    variant_id?: number | null;
}

export interface ProductFormState {
    productId: number | null;
    name: string;
    slug: string;
    product_type: ProductType;
    brand_id: number | null;
    gender: string | null;
    categories: number[];
    tags: number[];
    short_description: string;
    long_description: string;
    is_featured: boolean;

    // Fiyat
    tax_rate: number;
    price_includes_tax: boolean;

    // Base fiyat değerleri (yeni variant oluştururken prefill, toplu uygula için)
    base_price: number;
    base_price_discount: number | null;
    base_cost_price: number | null;

    // Extra
    mpn: string | null;
    cost_price: number | null;
    video_url: string | null;

    // Variant & attribute
    attributes: number[]; // product-scope attribute value IDs
    variants: VariantDraft[];

    // Media
    images: ImageDraft[];

    // SEO
    keywords: string | null;
    seo_description: string | null;
    meta_title: string | null;
    meta_description: string | null;
    og_image_url: string | null;
    author: string | null;
    status: ProductStatus;
    publish_at: string | null;
    unpublish_at: string | null;
}

export const initialProductFormState: ProductFormState = {
    productId: null,
    name: '',
    slug: '',
    product_type: 'physical',
    brand_id: null,
    gender: null,
    categories: [],
    tags: [],
    short_description: '',
    long_description: '',
    is_featured: false,
    tax_rate: 20,
    price_includes_tax: true,
    base_price: 0,
    base_price_discount: null,
    base_cost_price: null,
    mpn: null,
    cost_price: null,
    video_url: null,
    attributes: [],
    variants: [],
    images: [],
    keywords: null,
    seo_description: null,
    meta_title: null,
    meta_description: null,
    og_image_url: null,
    author: null,
    status: 'draft',
    publish_at: null,
    unpublish_at: null,
};

export type FormErrors = Record<string, string[]>;

interface ProductFormContextValue {
    form: ProductFormState;
    setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
    updateField: <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => void;
    errors: FormErrors;
    setErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
    clearFieldError: (field: string) => void;
    dirty: boolean;
    setDirty: React.Dispatch<React.SetStateAction<boolean>>;
    activeTab: TabKey;
    setActiveTab: React.Dispatch<React.SetStateAction<TabKey>>;
    attributes: ProductAttribute[]; // katalog
    setAttributes: React.Dispatch<React.SetStateAction<ProductAttribute[]>>;
    isEdit: boolean;
    mode: 'create' | 'edit';
    // Errors per tab count
    tabErrorCount: Record<TabKey, number>;
}

const ProductFormContext = createContext<ProductFormContextValue | null>(null);

// Tab'a ait alan prefix'leri — validation hata key'lerini tab'a map etmek için.
const TAB_FIELD_PREFIXES: Record<TabKey, string[]> = {
    general: [
        'name',
        'slug',
        'brand_id',
        'gender',
        'categories',
        'tags',
        'product_type',
        'short_description',
        'long_description',
        'is_featured',
    ],
    stock: ['variants', 'attributes'],
    price: ['tax_rate', 'price_includes_tax', 'cost_price', 'base_price', 'base_price_discount', 'base_cost_price'],
    media: ['images', 'video_url'],
    seo: [
        'keywords',
        'seo_description',
        'meta_title',
        'meta_description',
        'og_image_url',
        'author',
        'status',
        'publish_at',
        'unpublish_at',
    ],
};

export const resolveTabForField = (field: string): TabKey => {
    const root = field.split('.')[0];
    for (const [tab, prefixes] of Object.entries(TAB_FIELD_PREFIXES) as [TabKey, string[]][]) {
        if (prefixes.includes(root)) {
            return tab;
        }
    }
    return 'general';
};

/**
 * Validation error seti içindeki ilk hatalı alanın tab'ını döner.
 * Tab sıralamasına (general → stock → price → media → seo) göre öncelik verilir.
 */
export const firstErrorTab = (errors: FormErrors): TabKey | null => {
    const keys = Object.keys(errors);
    if (keys.length === 0) return null;
    const order: TabKey[] = ['general', 'price', 'stock', 'media', 'seo'];
    const tabsWithError = new Set<TabKey>(keys.map(resolveTabForField));
    for (const t of order) {
        if (tabsWithError.has(t)) return t;
    }
    return resolveTabForField(keys[0]);
};

export const mapResourceToForm = (p: ProductAdminResource): ProductFormState => {
    const images: ImageDraft[] = (p.images ?? []).map((img: ProductImage) => ({
        id: img.id,
        image_path: img.image_url ?? img.image_path,
        isNew: false,
        is_featured: !!img.is_featured,
        sort_order: img.sort_order ?? 0,
        variant_id: img.variant_id ?? null,
    }));

    const variants: VariantDraft[] = (p.variants ?? []).map((v: ProductVariant) => ({
        id: v.id,
        sku: v.sku,
        barcode: v.barcode,
        price: Number(v.price ?? 0),
        price_discount: v.price_discount !== null ? Number(v.price_discount) : null,
        cost_price: v.cost_price !== null ? Number(v.cost_price) : null,
        stock: Number(v.stock ?? 0),
        stock_alert_threshold: Number(v.stock_alert_threshold ?? 0),
        is_default: !!v.is_default,
        sort_order: v.sort_order ?? 0,
        attribute_value_ids: (v.attribute_values ?? []).map((av) => av.id),
        attribute_label: v.attribute_label,
        featured_image_id: v.featured_image?.id != null ? Number(v.featured_image.id) : null,
    }));

    return {
        productId: p.id,
        name: p.name ?? '',
        slug: p.slug ?? '',
        product_type: p.product_type ?? 'physical',
        brand_id: p.brand?.id ?? null,
        gender: p.gender ?? null,
        categories: (p.categories ?? []).map((c) => c.id),
        tags: (p.tags ?? []).map((t) => t.id),
        short_description: p.short_description ?? '',
        long_description: p.long_description ?? '',
        is_featured: !!p.is_featured,
        tax_rate: Number(p.tax_rate ?? 20),
        price_includes_tax: p.price_includes_tax ?? true,
        base_price: Number(
            p.default_variant?.price ?? (variants[0]?.price ?? 0)
        ),
        base_price_discount:
            p.default_variant?.price_discount !== null && p.default_variant?.price_discount !== undefined
                ? Number(p.default_variant.price_discount)
                : (variants[0]?.price_discount ?? null),
        base_cost_price:
            p.default_variant?.cost_price !== null && p.default_variant?.cost_price !== undefined
                ? Number(p.default_variant.cost_price)
                : (p.cost_price !== null ? Number(p.cost_price) : null),
        mpn: p.mpn ?? null,
        cost_price: p.cost_price !== null ? Number(p.cost_price) : null,
        video_url: p.video_url ?? null,
        attributes: (p.attribute_values ?? []).map((av) => av.id),
        variants,
        images,
        keywords: p.keywords ?? null,
        seo_description: p.seo_description ?? null,
        meta_title: p.meta_title ?? null,
        meta_description: p.meta_description ?? null,
        og_image_url: p.og_image_url ?? null,
        author: p.author ?? null,
        status: p.status ?? 'draft',
        publish_at: p.publish_at ?? null,
        unpublish_at: p.unpublish_at ?? null,
    };
};

interface ProviderProps {
    initial?: Partial<ProductFormState>;
    isEdit?: boolean;
    children: React.ReactNode;
}

export const ProductFormProvider: React.FC<ProviderProps> = ({
    initial,
    isEdit = false,
    children,
}) => {
    const [form, setForm] = useState<ProductFormState>({
        ...initialProductFormState,
        ...(initial ?? {}),
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [dirty, setDirty] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('general');
    const [attributes, setAttributes] = useState<ProductAttribute[]>([]);

    const updateField = useCallback(
        <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
            setForm((prev) => ({ ...prev, [key]: value }));
            setDirty(true);
            setErrors((prev) => {
                if (!prev[key as string]) return prev;
                const next = { ...prev };
                delete next[key as string];
                return next;
            });
        },
        []
    );

    const clearFieldError = useCallback((field: string) => {
        setErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    const tabErrorCount = useMemo(() => {
        const counts: Record<TabKey, number> = {
            general: 0,
            stock: 0,
            price: 0,
            media: 0,
            seo: 0,
        };
        Object.keys(errors).forEach((field) => {
            const tab = resolveTabForField(field);
            counts[tab] += 1;
        });
        return counts;
    }, [errors]);

    const value: ProductFormContextValue = {
        form,
        setForm,
        updateField,
        errors,
        setErrors,
        clearFieldError,
        dirty,
        setDirty,
        activeTab,
        setActiveTab,
        attributes,
        setAttributes,
        isEdit,
        mode: isEdit ? 'edit' : 'create',
        tabErrorCount,
    };

    return (
        <ProductFormContext.Provider value={value}>{children}</ProductFormContext.Provider>
    );
};

export const useProductForm = () => {
    const ctx = useContext(ProductFormContext);
    if (!ctx) {
        throw new Error('useProductForm must be used within ProductFormProvider');
    }
    return ctx;
};
