import React, { useEffect, useMemo, useState } from 'react';
import Select, { MultiValue } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import makeAnimated from 'react-select/animated';
import Swal from 'sweetalert2';
import { useProductForm, VariantDraft } from '../ProductFormContext';
import { ProductAttributeService } from '../../../api/services/ProductAttributeService';
import type { ProductAttribute, ProductAttributeValue } from '../../../types/product';
import IconTrashLines from '../../Icon/IconTrashLines';
import { useCan } from '../../../utils/permissions';
import {
    fieldClass,
    getNestedFieldError,
    hasFieldError,
    hasNestedFieldError,
    hasRowError,
    getFieldError,
} from '../../../utils/formErrors';

interface SelectedAttribute {
    attributeId: number;
    valueIds: number[];
}

interface ValueOption {
    value: number;
    label: string;
}

const generateSku = () =>
    `AUTO-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')}`;

// Kartezyen çarpım
const cartesian = <T,>(arrays: T[][]): T[][] =>
    arrays.reduce<T[][]>((acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])), [[]]);

const StockVariantTab: React.FC = () => {
    const { form, updateField, errors, attributes, setAttributes } = useProductForm();
    const can = useCan();
    const canCreateAttributeValue = can('product_attribute.manage');
    const [selected, setSelected] = useState<SelectedAttribute[]>([]);
    const [customAttrOpen, setCustomAttrOpen] = useState(false);
    const [bulkPrice, setBulkPrice] = useState('');
    const [bulkStock, setBulkStock] = useState('');

    // Attribute katalogunu yükle
    useEffect(() => {
        if (attributes.length === 0) {
            ProductAttributeService.list().then(setAttributes).catch(() => {});
        }
    }, [attributes.length, setAttributes]);

    // Variant-scope attribute'lar
    const variantAttributes = useMemo(
        () => attributes.filter((a) => a.scope === 'variant'),
        [attributes]
    );

    // Mevcut variantlardan seçili attribute değerlerini derive et (ilk render)
    useEffect(() => {
        if (selected.length > 0 || form.variants.length === 0) return;
        const byAttr: Record<number, Set<number>> = {};
        form.variants.forEach((v) => {
            v.attribute_value_ids.forEach((vid) => {
                const attr = variantAttributes.find((a) => a.values.some((val) => val.id === vid));
                if (!attr) return;
                if (!byAttr[attr.id]) byAttr[attr.id] = new Set();
                byAttr[attr.id].add(vid);
            });
        });
        const derived: SelectedAttribute[] = Object.entries(byAttr).map(([aid, ids]) => ({
            attributeId: Number(aid),
            valueIds: Array.from(ids),
        }));
        if (derived.length > 0) setSelected(derived);
    }, [form.variants, variantAttributes, selected.length]);

    const getAttr = (id: number): ProductAttribute | undefined =>
        attributes.find((a) => a.id === id);

    const getValueLabel = (id: number): string => {
        for (const a of attributes) {
            const v = a.values.find((val) => val.id === id);
            if (v) return v.value;
        }
        return '';
    };

    const addAttribute = (attributeId: number) => {
        if (selected.some((s) => s.attributeId === attributeId)) return;
        setSelected([...selected, { attributeId, valueIds: [] }]);
    };

    // Creatable — yeni attribute (özellik) oluştur
    const handleCreateAttribute = async (name: string) => {
        if (!canCreateAttributeValue) {
            Swal.fire({
                icon: 'info',
                title: 'Yetki gerekli',
                text: 'Yeni özellik eklemek için Ürün Özelliği Yönetimi yetkin olmalı.',
            });
            return;
        }
        const confirm = await Swal.fire({
            icon: 'question',
            title: `"${name}" özelliğini oluştur?`,
            html: `Yeni bir ürün özelliği olarak eklenecek. Türü <strong>Seçim listesi</strong>, kapsamı <strong>Varyant</strong> olarak ayarlanır.<br><br><em>Daha gelişmiş ayarlar için "Ürün Özellikleri" sayfasını kullanın.</em>`,
            showCancelButton: true,
            confirmButtonText: 'Oluştur',
            cancelButtonText: 'Vazgeç',
        });
        if (!confirm.isConfirmed) return;
        try {
            const created = await ProductAttributeService.create({
                name,
                type: 'select',
                scope: 'variant',
                is_global: true,
            });
            setAttributes((prev) => [...prev, { ...created, values: created.values ?? [] }]);
            addAttribute(created.id);
            setCustomAttrOpen(false);
            Swal.fire({
                icon: 'success',
                title: 'Özellik eklendi',
                timer: 1200,
                showConfirmButton: false,
            });
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: err?.response?.data?.message || 'Özellik oluşturulamadı',
            });
        }
    };

    const removeAttribute = (attributeId: number) => {
        setSelected(selected.filter((s) => s.attributeId !== attributeId));
    };

    const setAttributeValues = (attributeId: number, valueIds: number[]) => {
        setSelected(
            selected.map((s) => (s.attributeId === attributeId ? { ...s, valueIds } : s))
        );
    };

    // Creatable — yeni attribute değeri oluştur
    const handleCreateAttributeValue = async (attributeId: number, inputValue: string) => {
        if (!canCreateAttributeValue) {
            Swal.fire({
                icon: 'info',
                title: 'Yetki gerekli',
                html: 'Yeni özellik değeri eklemek için <strong>Ürün Özelliği Yönetimi</strong> yetkin olmalı. ' +
                      'Yeni yüklendiyse oturumu kapatıp yeniden giriş yap veya "Ürün Özellikleri" sayfasından değer ekle.',
            });
            return;
        }
        const attr = getAttr(attributeId);
        if (!attr) return;

        const isColor = attr.slug === 'renk' || attr.slug === 'color' || attr.type === 'select' && (attr.meta?.color === true);

        let hex: string | null = null;
        if (isColor) {
            const { value: chosen } = await Swal.fire({
                title: `"${inputValue}" rengini ekle`,
                input: 'text',
                inputLabel: 'Hex kodu (opsiyonel, örn. #FF6600)',
                inputPlaceholder: '#RRGGBB',
                showCancelButton: true,
                confirmButtonText: 'Ekle',
                cancelButtonText: 'Vazgeç',
            });
            if (chosen === undefined) return;
            hex = chosen || null;
        } else {
            const confirm = await Swal.fire({
                icon: 'question',
                title: `"${inputValue}" ekle?`,
                text: `"${attr.name}" özelliğine yeni değer olarak eklenecek.`,
                showCancelButton: true,
                confirmButtonText: 'Ekle',
                cancelButtonText: 'Vazgeç',
            });
            if (!confirm.isConfirmed) return;
        }

        try {
            const meta: Record<string, any> | null = hex ? { hex } : null;
            const newValue = await ProductAttributeService.addValue(attributeId, {
                value: inputValue,
                meta,
            });
            // Katalogu güncelle
            setAttributes((prev) =>
                prev.map((a) =>
                    a.id === attributeId
                        ? { ...a, values: [...a.values, newValue] }
                        : a
                )
            );
            // Seçim listesine ekle
            const current = selected.find((s) => s.attributeId === attributeId);
            const nextValueIds = current
                ? [...current.valueIds, newValue.id]
                : [newValue.id];
            setAttributeValues(attributeId, nextValueIds);
            Swal.fire({ icon: 'success', title: 'Eklendi', timer: 1200, showConfirmButton: false });
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: err?.response?.data?.message || 'Değer eklenemedi',
            });
        }
    };

    // Kartezyen -> variant matrix rebuild
    const rebuildMatrix = () => {
        if (selected.length === 0 || selected.every((s) => s.valueIds.length === 0)) {
            // Varyantsız — tek default variant garanti et
            if (form.variants.length === 0) {
                updateField('variants', [
                    {
                        sku: generateSku(),
                        barcode: null,
                        price: form.base_price ?? 0,
                        price_discount: form.base_price_discount,
                        cost_price: form.base_cost_price,
                        stock: 0,
                        stock_alert_threshold: 5,
                        is_default: true,
                        sort_order: 0,
                        attribute_value_ids: [],
                        featured_image_id: null,
                    },
                ]);
            }
            return;
        }

        const valueArrays = selected
            .filter((s) => s.valueIds.length > 0)
            .map((s) => s.valueIds);
        const combos = cartesian(valueArrays);

        // Mevcut variantları key'e göre map et — fiyat/stok korumak için
        const keyOf = (ids: number[]) => [...ids].sort((a, b) => a - b).join('-');
        const existing = new Map<string, VariantDraft>();
        form.variants.forEach((v) => existing.set(keyOf(v.attribute_value_ids), v));

        const next: VariantDraft[] = combos.map((ids, idx) => {
            const key = keyOf(ids);
            const prev = existing.get(key);
            if (prev) {
                return { ...prev, attribute_value_ids: ids, sort_order: idx };
            }
            return {
                sku: generateSku(),
                barcode: null,
                price: form.base_price ?? 0,
                price_discount: form.base_price_discount,
                cost_price: form.base_cost_price,
                stock: 0,
                stock_alert_threshold: 5,
                is_default: idx === 0,
                sort_order: idx,
                attribute_value_ids: ids,
                featured_image_id: null,
            };
        });

        // En az bir default
        if (!next.some((v) => v.is_default) && next.length > 0) {
            next[0].is_default = true;
        }

        updateField('variants', next);
    };

    useEffect(() => {
        rebuildMatrix();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(selected)]);

    const updateVariant = <K extends keyof VariantDraft>(
        index: number,
        key: K,
        value: VariantDraft[K]
    ) => {
        const next = [...form.variants];
        next[index] = { ...next[index], [key]: value };
        if (key === 'is_default' && value === true) {
            next.forEach((v, i) => {
                if (i !== index) v.is_default = false;
            });
        }
        updateField('variants', next);
    };

    const handleDeleteVariant = async (idx: number) => {
        const v = form.variants[idx];
        const label =
            v.attribute_value_ids
                .map((id) => getValueLabel(id))
                .filter(Boolean)
                .join(' / ') || v.sku;
        const confirm = await Swal.fire({
            icon: 'warning',
            title: 'Varyantı sil?',
            text: `"${label}" varyantını silmek istediğinize emin misiniz?`,
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
        });
        if (!confirm.isConfirmed) return;

        const next = form.variants.filter((_, i) => i !== idx);
        // Silinen default'tu ise kalan ilk variant'ı default yap
        if (!next.some((nv) => nv.is_default) && next.length > 0) {
            next[0] = { ...next[0], is_default: true };
        }
        updateField('variants', next);
    };

    const applyBulk = () => {
        const price = bulkPrice ? parseFloat(bulkPrice) : null;
        const stock = bulkStock ? parseInt(bulkStock, 10) : null;
        const next = form.variants.map((v) => ({
            ...v,
            price: price !== null && !Number.isNaN(price) ? price : v.price,
            stock: stock !== null && !Number.isNaN(stock) ? stock : v.stock,
        }));
        updateField('variants', next);
        setBulkPrice('');
        setBulkStock('');
    };

    const attributeOptions = variantAttributes
        .filter((a) => !selected.some((s) => s.attributeId === a.id))
        .map((a) => ({ value: a.id, label: a.name }));

    return (
        <div>
            <details className="mb-5 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                <summary className="cursor-pointer select-none px-3 py-2 font-medium">
                    Stok & Varyant Nasıl Çalışır?
                </summary>
                <ul className="list-disc ml-8 mr-3 pb-3 space-y-1 text-xs">
                    <li>
                        Her ürünün <strong>en az bir varyantı</strong> vardır. Tek bedenli / tek
                        renkli ürünler için bile bir varyant otomatik oluşturulur.
                    </li>
                    <li>
                        <strong>Ürün Özellikleri:</strong> Renk, Beden, Hafıza gibi seçenekleri
                        ekle. <em>"+ Özellik Ekle"</em> butonuna tıklayıp açılan dropdown'da
                        <strong> mevcut olmayan bir özellik adı yazıp Enter'a</strong> basarsan
                        "<em>X adlı yeni özellik oluştur</em>" seçeneği çıkar (yetkin varsa).
                    </li>
                    <li>
                        <strong>Değer listesi:</strong> Her özelliğin değer dropdown'unda da aynı
                        şekilde yeni değer yazıp ekleyebilirsin (ör. sistemde olmayan bir renk).
                        Renk özelliği için hex kodu da isteyen bir pencere açılır.
                    </li>
                    <li>
                        <strong>Variant matrisi</strong> seçtiğin değerlerin tüm kombinasyonlarını
                        otomatik oluşturur (ör. 2 renk × 3 beden = 6 variant). Gereksiz satırları
                        çöp kutusu ile silebilirsin.
                    </li>
                    <li>
                        Her satırın <strong>SKU</strong> (benzersiz stok kodu), <strong>fiyat</strong>,{' '}
                        <strong>stok</strong> ve <strong>uyarı eşiği</strong> olmalı. Fiyat ve
                        maliyet, Fiyat sekmesinde girdiğin değerlerle otomatik doldurulur.
                    </li>
                    <li>
                        <strong>Uyarı eşiği</strong> stok o değerin altına düştüğünde admin
                        ekranında kırmızı gösterilmesini sağlar. Uyarı eşiği stoktan büyük olamaz.
                    </li>
                    <li>
                        <strong>Ana Varyant</strong> (radio): Ürün listesi, arama sonuçları ve
                        doğrudan ürün linkine gelen ziyaretçide ilk gösterilen varyanttır.
                        Kullanıcı bir varyanta özel linkle gelirse (<code>?v=123</code>) o varyant
                        seçili açılır, "Ana Varyant" sadece fallback'tir.
                    </li>
                    <li>
                        <strong>Hepsine Uygula</strong>: Birden çok variant varsa fiyat ve stoğu
                        toplu güncellemeye yarar.
                    </li>
                </ul>
            </details>

            {/* Özellik seçimi (renk, beden, hafıza vb.) */}
            <div className="panel mb-5">
                <h3 className="font-semibold mb-1">Ürün Özellikleri</h3>
                <p className="text-xs text-gray-500 mb-4">
                    Renk, beden, hafıza gibi ürünün seçenekleri. Her özellikten değer(ler)
                    seçersen bunların kombinasyonu varyantları oluşturur.
                </p>

                {selected.map((s) => {
                    const attr = getAttr(s.attributeId);
                    if (!attr) return null;
                    const valueOptions = attr.values.map((v: ProductAttributeValue) => ({
                        value: v.id,
                        label: v.value,
                    }));
                    const selectedValueOptions = valueOptions.filter((o) =>
                        s.valueIds.includes(o.value)
                    );
                    return (
                        <div key={s.attributeId} className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium">{attr.name}</label>
                                <button
                                    type="button"
                                    className="text-xs text-red-500 hover:text-red-700 underline"
                                    onClick={() => removeAttribute(s.attributeId)}
                                >
                                    Kaldır
                                </button>
                            </div>
                            <CreatableSelect<ValueOption, true>
                                isMulti
                                options={valueOptions}
                                value={selectedValueOptions}
                                components={makeAnimated()}
                                placeholder={
                                    canCreateAttributeValue
                                        ? 'Değer(ler) seç veya yeni yaz'
                                        : 'Değer(ler) seç'
                                }
                                formatCreateLabel={(input) => `"${input}" ekle (yeni değer)`}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                                onChange={(opts: MultiValue<ValueOption>) =>
                                    setAttributeValues(
                                        s.attributeId,
                                        opts.map((o) => o.value)
                                    )
                                }
                                onCreateOption={(input) =>
                                    handleCreateAttributeValue(s.attributeId, input)
                                }
                            />
                        </div>
                    );
                })}

                <div className="mt-3">
                    {customAttrOpen ? (
                        <div className="flex gap-2 items-start">
                            <div className="flex-1">
                                <CreatableSelect
                                    options={attributeOptions}
                                    placeholder="Mevcut özelliği seç veya yeni yaz..."
                                    formatCreateLabel={(input) =>
                                        `"${input}" adlı yeni özellik oluştur`
                                    }
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                                    onChange={(opt: any) => {
                                        if (opt && typeof opt.value === 'number') {
                                            addAttribute(opt.value);
                                            setCustomAttrOpen(false);
                                        }
                                    }}
                                    onCreateOption={(input) => handleCreateAttribute(input)}
                                />
                            </div>
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => setCustomAttrOpen(false)}
                            >
                                İptal
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setCustomAttrOpen(true)}
                        >
                            + Özellik Ekle
                        </button>
                    )}
                </div>
            </div>

            {/* Toplu uygula */}
            {form.variants.length > 1 && (
                <div className="panel mb-5">
                    <h3 className="font-semibold mb-2">Hepsine Uygula</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div>
                            <label className="block text-sm mb-1">Fiyat</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={bulkPrice}
                                onChange={(e) => setBulkPrice(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Stok</label>
                            <input
                                type="number"
                                className="form-input"
                                value={bulkStock}
                                onChange={(e) => setBulkStock(e.target.value)}
                            />
                        </div>
                        <div>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={applyBulk}
                            >
                                Uygula
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Variant Tablosu */}
            <div className="panel">
                <h3 className="font-semibold mb-3">
                    Varyantlar ({form.variants.length})
                    <span className="text-red-500 ml-1">*</span>
                </h3>
                {hasFieldError(errors, 'variants') && (
                    <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {getFieldError(errors, 'variants')}
                    </div>
                )}
                {form.variants.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                        Attribute değerleri seçildiğinde matris oluşturulacaktır. Varyantsız ürün
                        için bile default bir satır yaratılır.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-2 py-2 text-left">Varyant</th>
                                    <th className="px-2 py-2">SKU</th>
                                    <th className="px-2 py-2">Barkod</th>
                                    <th className="px-2 py-2">Fiyat</th>
                                    <th className="px-2 py-2">İnd. Fiyat</th>
                                    <th className="px-2 py-2">Stok</th>
                                    <th className="px-2 py-2">Uyarı</th>
                                    <th
                                        className="px-2 py-2"
                                        title="Ürün listesi, arama sonuçları ve doğrudan ürün linki ile gelen ziyaretçide ilk gösterilen varyant"
                                    >
                                        Ana Varyant
                                    </th>
                                    <th className="px-2 py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {form.variants.map((v, idx) => {
                                    const label =
                                        v.attribute_value_ids
                                            .map((id) => getValueLabel(id))
                                            .filter(Boolean)
                                            .join(' / ') || 'Varsayılan';
                                    const stockWarn = v.stock_alert_threshold > v.stock;
                                    const rowHasError = hasRowError(errors, 'variants', idx);
                                    const skuErr = getNestedFieldError(errors, 'variants', idx, 'sku');
                                    const priceErr = getNestedFieldError(errors, 'variants', idx, 'price');
                                    const priceDiscErr = getNestedFieldError(errors, 'variants', idx, 'price_discount');
                                    const stockErr = getNestedFieldError(errors, 'variants', idx, 'stock');
                                    const alertErr = getNestedFieldError(errors, 'variants', idx, 'stock_alert_threshold');
                                    return (
                                        <tr
                                            key={idx}
                                            className={`border-b ${
                                                rowHasError ? 'border-l-4 border-l-red-500 bg-red-50/40' : ''
                                            }`}
                                        >
                                            <td className="px-2 py-1 font-medium">{label}</td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    className={fieldClass('form-input', !!skuErr)}
                                                    value={v.sku}
                                                    onChange={(e) =>
                                                        updateVariant(idx, 'sku', e.target.value)
                                                    }
                                                />
                                                {skuErr && (
                                                    <p className="text-red-500 text-[11px] mt-1">{skuErr}</p>
                                                )}
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="text"
                                                    className={fieldClass('form-input', hasNestedFieldError(errors, 'variants', idx, 'barcode'))}
                                                    value={v.barcode ?? ''}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            idx,
                                                            'barcode',
                                                            e.target.value || null
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className={fieldClass('form-input', !!priceErr)}
                                                    value={v.price}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            idx,
                                                            'price',
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                />
                                                {priceErr && (
                                                    <p className="text-red-500 text-[11px] mt-1">{priceErr}</p>
                                                )}
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className={fieldClass('form-input', !!priceDiscErr)}
                                                    value={v.price_discount ?? ''}
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value === ''
                                                                ? null
                                                                : parseFloat(e.target.value);
                                                        updateVariant(idx, 'price_discount', val);
                                                    }}
                                                />
                                                {priceDiscErr && (
                                                    <p className="text-red-500 text-[11px] mt-1">{priceDiscErr}</p>
                                                )}
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="number"
                                                    className={fieldClass(
                                                        `form-input ${stockWarn ? 'border-orange-400' : ''}`,
                                                        !!stockErr
                                                    )}
                                                    value={v.stock}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            idx,
                                                            'stock',
                                                            parseInt(e.target.value, 10) || 0
                                                        )
                                                    }
                                                />
                                                {stockErr && (
                                                    <p className="text-red-500 text-[11px] mt-1">{stockErr}</p>
                                                )}
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="number"
                                                    className={fieldClass('form-input', !!alertErr)}
                                                    value={v.stock_alert_threshold}
                                                    onChange={(e) =>
                                                        updateVariant(
                                                            idx,
                                                            'stock_alert_threshold',
                                                            parseInt(e.target.value, 10) || 0
                                                        )
                                                    }
                                                />
                                                {alertErr && (
                                                    <p className="text-red-500 text-[11px] mt-1">{alertErr}</p>
                                                )}
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <input
                                                    type="radio"
                                                    name="default_variant"
                                                    checked={v.is_default}
                                                    onChange={() =>
                                                        updateVariant(idx, 'is_default', true)
                                                    }
                                                />
                                            </td>
                                            <td className="px-2 py-1 text-center">
                                                <button
                                                    type="button"
                                                    className="p-1 text-red-500 hover:text-red-700"
                                                    title="Varyantı sil"
                                                    onClick={() => handleDeleteVariant(idx)}
                                                >
                                                    <IconTrashLines />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {errors.variants && (
                    <p className="text-red-500 text-xs mt-2">{errors.variants[0]}</p>
                )}
            </div>
        </div>
    );
};

export default StockVariantTab;
