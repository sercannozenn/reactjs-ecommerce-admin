import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';

import { setPageTitle } from '../../store/themeConfigSlice';
import { ProductService } from '../../api/services/ProductService';
import { BrandService } from '../../api/services/BrandService';
import { CategoryService } from '../../api/services/CategoryService';
import { TagService } from '../../api/services/TagService';
import { useCan } from '../../utils/permissions';
import { route } from '../../utils/RouteHelper';

import {
    ProductFormProvider,
    useProductForm,
    TabKey,
    mapResourceToForm,
    firstErrorTab,
} from '../../components/Products/ProductFormContext';
import { humanizeFieldKey } from '../../utils/formErrors';
import GeneralTab from '../../components/Products/tabs/GeneralTab';
import StockVariantTab from '../../components/Products/tabs/StockVariantTab';
import PriceTab from '../../components/Products/tabs/PriceTab';
import MediaTab from '../../components/Products/tabs/MediaTab';
import SeoPublishTab from '../../components/Products/tabs/SeoPublishTab';
import { useProductAutosave } from '../../hooks/useProductAutosave';
import type {
    ProductDraftPayload,
    ProductUpdatePayload,
} from '../../types/product';

interface Option {
    value: number;
    label: string;
}
interface StrOption {
    value: string;
    label: string;
}

const TABS: Array<{ key: TabKey; label: string }> = [
    { key: 'general', label: 'Genel' },
    { key: 'price', label: 'Fiyat' },
    { key: 'stock', label: 'Stok & Varyant' },
    { key: 'media', label: 'Medya' },
    { key: 'seo', label: 'SEO & Yayın' },
];

const buildDraftPayload = (form: ReturnType<typeof useProductForm>['form']): ProductDraftPayload => ({
    name: form.name,
    slug: form.slug,
    product_type: form.product_type,
    brand_id: form.brand_id,
    gender: form.gender,
    short_description: form.short_description,
    long_description: form.long_description,
    is_featured: form.is_featured,
    tax_rate: form.tax_rate,
    price_includes_tax: form.price_includes_tax,
    mpn: form.mpn,
    cost_price: form.cost_price,
    video_url: form.video_url,
    categories: form.categories,
    tags: form.tags,
    attributes: form.attributes,
    keywords: form.keywords,
    seo_description: form.seo_description,
    meta_title: form.meta_title,
    meta_description: form.meta_description,
    og_image_url: form.og_image_url,
    author: form.author,
    publish_at: form.publish_at,
    unpublish_at: form.unpublish_at,
    status: form.status,
});

const buildUpdatePayload = (
    form: ReturnType<typeof useProductForm>['form']
): ProductUpdatePayload => {
    const draft = buildDraftPayload(form);
    return {
        ...draft,
        name: form.name,
        slug: form.slug,
        product_type: form.product_type,
        tax_rate: form.tax_rate,
        price_includes_tax: form.price_includes_tax,
        categories: form.categories,
        tags: form.tags,
        attributes: form.attributes,
        variants: form.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            barcode: v.barcode ?? null,
            price: v.price,
            price_discount:
                v.price_discount === null || (v.price_discount as any) === ''
                    ? null
                    : v.price_discount,
            cost_price: v.cost_price ?? null,
            stock: v.stock,
            stock_alert_threshold: v.stock_alert_threshold,
            is_default: v.is_default,
            sort_order: v.sort_order,
            attribute_value_ids: v.attribute_value_ids,
            featured_image_id: v.featured_image_id ?? null,
        })),
        images: form.images.map((i) => ({
            id: typeof i.id === 'number' ? i.id : undefined,
            is_featured: i.is_featured,
            sort_order: i.sort_order,
        })),
    };
};

// Inner form — context içinde çalışır
interface InnerProps {
    brands: Option[];
    categories: Option[];
    tags: Option[];
    genders: StrOption[];
}

const ProductFormInner: React.FC<InnerProps> = ({ brands, categories, tags, genders }) => {
    const {
        form,
        setForm,
        errors,
        setErrors,
        dirty,
        setDirty,
        activeTab,
        setActiveTab,
        tabErrorCount,
        isEdit,
    } = useProductForm();
    const navigate = useNavigate();
    const can = useCan();

    const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
        'idle'
    );
    const [submitting, setSubmitting] = useState(false);

    // beforeunload guard
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (dirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    // Autosave — sadece kayıtlı ürün için
    const draftPayload = useMemo(() => buildDraftPayload(form), [form]);
    useProductAutosave({
        productId: form.productId,
        enabled: !!form.productId && dirty,
        payload: draftPayload,
        onSuccess: () => {
            setAutosaveStatus('saved');
            setDirty(false);
            window.setTimeout(() => setAutosaveStatus('idle'), 1500);
        },
        onError: () => {
            setAutosaveStatus('error');
            Swal.fire({
                icon: 'error',
                title: 'Taslak kaydedilemedi',
                timer: 5000,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
            });
        },
    });

    const handleDraftSave = async () => {
        setSubmitting(true);
        setAutosaveStatus('saving');
        try {
            if (form.productId) {
                await ProductService.updateDraft(form.productId, draftPayload);
            } else {
                const created = await ProductService.createDraft(draftPayload);
                setForm((prev) => ({ ...prev, productId: created.id }));
                navigate(`/urunler/${created.id}/duzenle`, { replace: true });
            }
            setDirty(false);
            setAutosaveStatus('saved');
            Swal.fire({
                icon: 'success',
                title: 'Taslak kaydedildi',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (err: any) {
            if (err?.response?.status === 422 && err.response.data?.errors) {
                const apiErrors = err.response.data.errors;
                const isValidationFormat =
                    apiErrors && typeof apiErrors === 'object' &&
                    Object.values(apiErrors).every((v) => Array.isArray(v));

                setAutosaveStatus('error');
                if (isValidationFormat) {
                    setErrors(apiErrors);
                    const tab = firstErrorTab(apiErrors);
                    if (tab) setActiveTab(tab);
                    const count = Object.keys(apiErrors).length;
                    const topErrors = Object.entries(apiErrors)
                        .slice(0, 3)
                        .map(
                            ([key, msgs]) =>
                                `• ${humanizeFieldKey(key)}: ${(msgs as string[])[0]}`
                        )
                        .join('\n');
                    const moreText = count > 3 ? `\n\nVe ${count - 3} hata daha...` : '';
                    Swal.fire({
                        icon: 'error',
                        title: `${count} alan hatalı`,
                        html: `<div style="text-align:left;font-size:0.875rem;white-space:pre-line;">${topErrors}${moreText}</div>`,
                        confirmButtonText: 'Tamam',
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'İşlem başarısız',
                        text:
                            (apiErrors.message as string) ||
                            err?.response?.data?.message ||
                            'Taslak kaydedilemedi',
                    });
                }
            } else {
                setAutosaveStatus('error');
                Swal.fire({
                    icon: 'error',
                    title: 'Hata',
                    text: err?.response?.data?.message || 'Taslak kaydedilemedi',
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handlePublish = async () => {
        if (!form.productId) {
            // Önce taslak aç, sonra publish
            await handleDraftSave();
        }
        setSubmitting(true);
        try {
            const payload = buildUpdatePayload(form);
            const id = form.productId!;
            // Publish endpoint hem updateDraft hem status=published yapar — tek çağrı yeterli.
            await ProductService.publish(id, payload);
            setDirty(false);
            Swal.fire({
                icon: 'success',
                title: 'Yayınlandı!',
                text: 'Ürün başarıyla yayına alındı.',
            });
            navigate(route('ProductList'));
        } catch (err: any) {
            if (err?.response?.status === 422 && err.response.data?.errors) {
                const apiErrors = err.response.data.errors;
                // Validation error formatı: {field: [msgs...]} — her value array olmalı.
                const isValidationFormat =
                    apiErrors && typeof apiErrors === 'object' &&
                    Object.values(apiErrors).every((v) => Array.isArray(v));

                if (isValidationFormat) {
                    setErrors(apiErrors);
                    const tab = firstErrorTab(apiErrors);
                    if (tab) setActiveTab(tab);
                    const count = Object.keys(apiErrors).length;
                    const topErrors = Object.entries(apiErrors)
                        .slice(0, 3)
                        .map(
                            ([key, msgs]) =>
                                `• ${humanizeFieldKey(key)}: ${(msgs as string[])[0]}`
                        )
                        .join('\n');
                    const moreText = count > 3 ? `\n\nVe ${count - 3} hata daha...` : '';
                    Swal.fire({
                        icon: 'error',
                        title: `${count} alan hatalı`,
                        html: `<div style="text-align:left;font-size:0.875rem;white-space:pre-line;">${topErrors}${moreText}</div>`,
                        confirmButtonText: 'Tamam',
                    });
                } else {
                    // Business logic / domain hatası (örn. InvalidStatusTransition) — flat obj.
                    Swal.fire({
                        icon: 'error',
                        title: 'İşlem başarısız',
                        text:
                            (apiErrors.message as string) ||
                            err?.response?.data?.message ||
                            'Yayınlama başarısız',
                    });
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata',
                    text: err?.response?.data?.message || 'Yayınlama başarısız',
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDuplicate = async () => {
        if (!form.productId) return;
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Ürünü kopyala?',
            text: 'Tüm görsel, varyant ve attribute bilgileri yeni ürüne kopyalanacak.',
            showCancelButton: true,
            confirmButtonText: 'Kopyala',
            cancelButtonText: 'Vazgeç',
        });
        if (!confirm.isConfirmed) return;
        try {
            const dup = await ProductService.duplicate(form.productId);
            Swal.fire({ icon: 'success', title: 'Kopyalandı!', timer: 1500 });
            navigate(`/urunler/${dup.id}/duzenle`);
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Hata', text: err?.message || 'Kopya başarısız' });
        }
    };

    const canPublish = can('product.publish');
    const canDuplicate = can('product.duplicate');
    const canDraft = can('product.draft') || can('products.create') || can('products.update');

    return (
        <div className="panel">
            {/* TabBar */}
            <div className="flex items-center justify-between mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">
                    {isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'}
                </h5>
                <div className="text-xs">
                    {autosaveStatus === 'saving' && (
                        <span className="text-gray-500">Kaydediliyor...</span>
                    )}
                    {autosaveStatus === 'saved' && (
                        <span className="text-green-600">Kaydedildi</span>
                    )}
                    {autosaveStatus === 'error' && (
                        <span className="text-red-500">Kaydedilemedi</span>
                    )}
                </div>
            </div>

            <div className="flex gap-1 border-b mb-5 overflow-x-auto">
                {TABS.map((tab) => {
                    const errCount = tabErrorCount[tab.key];
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 border-b-2 text-sm whitespace-nowrap transition-colors ${
                                activeTab === tab.key
                                    ? 'border-primary text-primary font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-primary'
                            }`}
                        >
                            {tab.label}
                            {errCount > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-red-500 text-white rounded-full">
                                    {errCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Active Panel */}
            <div>
                {activeTab === 'general' && (
                    <GeneralTab
                        brands={brands}
                        categories={categories}
                        tags={tags}
                        genders={genders}
                    />
                )}
                {activeTab === 'stock' && <StockVariantTab />}
                {activeTab === 'price' && <PriceTab />}
                {activeTab === 'media' && <MediaTab />}
                {activeTab === 'seo' && <SeoPublishTab />}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t flex flex-wrap items-center justify-end gap-3">
                {isEdit && canDuplicate && (
                    <button
                        type="button"
                        className="btn btn-outline-info"
                        onClick={handleDuplicate}
                        disabled={submitting}
                    >
                        Kopyala
                    </button>
                )}
                {canDraft && (
                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={handleDraftSave}
                        disabled={submitting}
                    >
                        Taslağı Kaydet
                    </button>
                )}
                {canPublish && (
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handlePublish}
                        disabled={submitting}
                    >
                        {isEdit ? 'Güncelle & Yayınla' : 'Yayınla'}
                    </button>
                )}
            </div>
        </div>
    );
};

const ProductAdd: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const [brands, setBrands] = useState<Option[]>([]);
    const [categories, setCategories] = useState<Option[]>([]);
    const [tags, setTags] = useState<Option[]>([]);
    // Backend App\Enums\Gender ile bire bir eşleşen değerler (Türkçe slug).
    const [genders] = useState<StrOption[]>([
        { value: 'kadin', label: 'Kadın' },
        { value: 'erkek', label: 'Erkek' },
        { value: 'unisex', label: 'Unisex' },
        { value: 'kiz-cocuk', label: 'Kız Çocuk' },
        { value: 'erkek-cocuk', label: 'Erkek Çocuk' },
        { value: 'unisex-cocuk', label: 'Unisex Çocuk' },
    ]);
    const [initialForm, setInitialForm] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const isEdit = !!id;

    useEffect(() => {
        dispatch(setPageTitle(isEdit ? 'Ürün Düzenleme' : 'Ürün Ekleme'));
    }, [dispatch, isEdit]);

    // İlgili referans verilerini paralel çek
    useEffect(() => {
        const loadRefs = async () => {
            try {
                const sort = { columnAccessor: 'name', direction: 'asc' as const };
                const [b, c, t] = await Promise.all([
                    (BrandService as any).list?.(1, 500, '', sort),
                    (CategoryService as any).list?.(1, 500, '', sort, {}),
                    (TagService as any).fetchTags?.(1, 500, '', sort),
                ]);
                const mapOpt = (arr: any[]): Option[] =>
                    (arr ?? []).map((r) => ({ value: r.id, label: r.name }));
                const extract = (resp: any) =>
                    Array.isArray(resp?.data) ? resp.data : resp?.data?.data ?? [];
                setBrands(mapOpt(extract(b)));
                setCategories(mapOpt(extract(c)));
                setTags(mapOpt(extract(t)));
            } catch (err) {
                console.error('Reference data load failed', err);
            }
        };
        loadRefs();
    }, []);

    // Edit modu: mevcut ürünü yükle
    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        ProductService.fetchById(id)
            .then((product) => {
                setInitialForm(mapResourceToForm(product));
            })
            .catch((err) => {
                console.error(err);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata',
                    text: 'Ürün yüklenemedi',
                });
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="panel">
                <p>Yükleniyor...</p>
            </div>
        );
    }

    return (
        <ProductFormProvider initial={initialForm ?? undefined} isEdit={isEdit}>
            <ProductFormInner
                brands={brands}
                categories={categories}
                tags={tags}
                genders={genders}
            />
        </ProductFormProvider>
    );
};

export default ProductAdd;
