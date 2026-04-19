import React, { useEffect, useRef, useState } from 'react';
import Select, { MultiValue, SingleValue } from 'react-select';
import makeAnimated from 'react-select/animated';
import { useProductForm } from '../ProductFormContext';
import { JoditEditorComponent } from '../../Editors/JoditEditor';
import { SlugHelper } from '../../../helpers/helpers';
import { ProductService } from '../../../api/services/ProductService';
import {
    fieldClass,
    getFieldError,
    hasFieldError,
    reactSelectErrorStyles,
} from '../../../utils/formErrors';

interface Option {
    value: number;
    label: string;
}
interface StrOption {
    value: string;
    label: string;
}

interface Props {
    brands: Option[];
    categories: Option[];
    tags: Option[];
    genders: StrOption[];
}

const GeneralTab: React.FC<Props> = ({ brands, categories, tags, genders }) => {
    const { form, updateField, errors } = useProductForm();
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>(
        'idle'
    );
    const slugTimerRef = useRef<number | null>(null);
    const slugManuallyEdited = useRef(false);

    // Auto-slug while typing name (unless manually edited)
    useEffect(() => {
        if (!slugManuallyEdited.current && form.name) {
            const nextSlug = SlugHelper.generate(form.name ?? '');
            if (nextSlug !== form.slug) {
                updateField('slug', nextSlug);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.name]);

    // Slug availability debounce
    useEffect(() => {
        if (!form.slug) {
            setSlugStatus('idle');
            return;
        }
        if (slugTimerRef.current) window.clearTimeout(slugTimerRef.current);
        setSlugStatus('checking');
        slugTimerRef.current = window.setTimeout(async () => {
            try {
                const res = await ProductService.slugCheck(
                    form.slug,
                    form.productId ?? undefined
                );
                setSlugStatus(res.available ? 'available' : 'taken');
            } catch {
                setSlugStatus('idle');
            }
        }, 500);
        return () => {
            if (slugTimerRef.current) window.clearTimeout(slugTimerRef.current);
        };
    }, [form.slug, form.productId]);

    return (
        <>
            <details className="mb-5 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                <summary className="cursor-pointer select-none px-3 py-2 font-medium">
                    Genel Bilgiler Nasıl Çalışır?
                </summary>
                <ul className="list-disc ml-8 mr-3 pb-3 space-y-1 text-xs">
                    <li>
                        <strong>Ürün Adı</strong> müşterinin ilk gördüğü etikettir; arama ve SEO
                        için en önemli alan.
                    </li>
                    <li>
                        <strong>Slug</strong> URL'de görünen kısa tanımlayıcıdır
                        (örn. kermes.com/urun/<em>siyah-nike-tshirt</em>). Ürün adından otomatik
                        türetilir; istersen manuel değiştirebilirsin. Slug başka ürünlerde
                        kullanılamaz.
                    </li>
                    <li>
                        <strong>Kategori ve etiketler</strong> listeleme, filtreleme ve menülerde
                        kullanılır. Birden fazla seçilebilir.
                    </li>
                    <li>
                        <strong>Marka</strong> ürün kartlarında ve filtrelemede gösterilir.
                        <strong> Cinsiyet</strong> opsiyoneldir — cinsiyetsiz ürün için boş bırak.
                    </li>
                    <li>
                        <strong>Kısa açıklama</strong> listelerde görünür; <strong>uzun açıklama</strong>
                        ürün detay sayfasında.
                    </li>
                    <li>
                        <strong>Ürün tipi:</strong> Fiziksel ürün kargo ile gönderilir; dijital ürün
                        (e-book, lisans vb.) için kargo/boyut bilgisi gerekmez.
                    </li>
                    <li>
                        <strong>Öne çıkan ürün</strong> işareti, anasayfa "Öne Çıkanlar" bölümünde
                        listelenmesini sağlar.
                    </li>
                </ul>
            </details>
        <div className="grid xl:grid-cols-2 gap-6 grid-cols-1">
            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">
                    Ürün Adı <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    className={fieldClass('form-input', hasFieldError(errors, 'name'))}
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                />
                {hasFieldError(errors, 'name') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'name')}</p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">
                    Slug <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    className={fieldClass('form-input', hasFieldError(errors, 'slug'))}
                    value={form.slug}
                    onChange={(e) => {
                        slugManuallyEdited.current = true;
                        updateField('slug', SlugHelper.generate(e.target.value));
                    }}
                />
                <div className="text-xs mt-1">
                    {slugStatus === 'checking' && (
                        <span className="text-gray-500">Kontrol ediliyor...</span>
                    )}
                    {slugStatus === 'available' && (
                        <span className="text-green-600">Slug uygun</span>
                    )}
                    {slugStatus === 'taken' && (
                        <span className="text-red-500">Bu slug başka bir üründe kullanılıyor</span>
                    )}
                </div>
                {hasFieldError(errors, 'slug') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'slug')}</p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">
                    Ürün Tipi <span className="text-red-500">*</span>
                </label>
                <div
                    className={
                        hasFieldError(errors, 'product_type')
                            ? 'flex gap-4 p-2 rounded border border-red-500'
                            : 'flex gap-4'
                    }
                >
                    {(['physical', 'digital'] as const).map((t) => (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                className="form-radio"
                                checked={form.product_type === t}
                                onChange={() => updateField('product_type', t)}
                            />
                            <span>{t === 'physical' ? 'Fiziksel' : 'Dijital'}</span>
                        </label>
                    ))}
                </div>
                {hasFieldError(errors, 'product_type') && (
                    <p className="text-red-500 text-xs mt-1">
                        {getFieldError(errors, 'product_type')}
                    </p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">Marka</label>
                <Select<Option, false>
                    value={brands.find((b) => b.value === form.brand_id) ?? null}
                    options={brands}
                    components={makeAnimated()}
                    placeholder="Marka Seçiniz"
                    classNamePrefix="select"
                    isClearable
                    menuPortalTarget={document.body}
                    styles={reactSelectErrorStyles(hasFieldError(errors, 'brand_id'))}
                    onChange={(opt: SingleValue<Option>) =>
                        updateField('brand_id', opt?.value ?? null)
                    }
                />
                {hasFieldError(errors, 'brand_id') && (
                    <p className="text-red-500 text-xs mt-1">
                        {getFieldError(errors, 'brand_id')}
                    </p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">Cinsiyet</label>
                <Select<StrOption, false>
                    value={genders.find((g) => g.value === form.gender) ?? null}
                    options={genders}
                    components={makeAnimated()}
                    placeholder="Cinsiyet seçilmedi (opsiyonel)"
                    classNamePrefix="select"
                    isClearable={true}
                    menuPortalTarget={document.body}
                    styles={reactSelectErrorStyles(hasFieldError(errors, 'gender'))}
                    onChange={(opt: SingleValue<StrOption>) =>
                        updateField('gender', opt?.value ?? null)
                    }
                />
                {hasFieldError(errors, 'gender') && (
                    <p className="text-red-500 text-xs mt-1">
                        {getFieldError(errors, 'gender')}
                    </p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">Kategoriler</label>
                <Select<Option, true>
                    isMulti
                    value={categories.filter((c) => form.categories.includes(c.value))}
                    options={categories}
                    components={makeAnimated()}
                    classNamePrefix="select"
                    menuPortalTarget={document.body}
                    styles={reactSelectErrorStyles(hasFieldError(errors, 'categories'))}
                    onChange={(opts: MultiValue<Option>) =>
                        updateField(
                            'categories',
                            opts.map((o) => o.value)
                        )
                    }
                />
                {hasFieldError(errors, 'categories') && (
                    <p className="text-red-500 text-xs mt-1">
                        {getFieldError(errors, 'categories')}
                    </p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">Etiketler</label>
                <Select<Option, true>
                    isMulti
                    value={tags.filter((t) => form.tags.includes(t.value))}
                    options={tags}
                    components={makeAnimated()}
                    classNamePrefix="select"
                    menuPortalTarget={document.body}
                    styles={reactSelectErrorStyles(hasFieldError(errors, 'tags'))}
                    onChange={(opts: MultiValue<Option>) =>
                        updateField(
                            'tags',
                            opts.map((o) => o.value)
                        )
                    }
                />
                {hasFieldError(errors, 'tags') && (
                    <p className="text-red-500 text-xs mt-1">
                        {getFieldError(errors, 'tags')}
                    </p>
                )}
            </div>

            <div className="mb-5 flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={form.is_featured}
                        onChange={(e) => updateField('is_featured', e.target.checked)}
                    />
                    <span>Öne Çıkan Ürün</span>
                </label>
                {hasFieldError(errors, 'is_featured') && (
                    <p className="text-red-500 text-xs ml-3">
                        {getFieldError(errors, 'is_featured')}
                    </p>
                )}
            </div>

            <div className="mb-5 col-span-2">
                <label className="block text-sm font-medium mb-1">Kısa Açıklama</label>
                <div
                    className={
                        hasFieldError(errors, 'short_description')
                            ? 'ring-1 ring-red-500 rounded'
                            : ''
                    }
                >
                    <JoditEditorComponent
                        value={form.short_description ?? ''}
                        onChange={(value) => updateField('short_description', value)}
                    />
                </div>
                {hasFieldError(errors, 'short_description') && (
                    <p className="text-red-500 text-xs mt-1">
                        {getFieldError(errors, 'short_description')}
                    </p>
                )}
            </div>

            <div className="mb-5 col-span-2">
                <label className="block text-sm font-medium mb-1">Uzun Açıklama</label>
                <div
                    className={
                        hasFieldError(errors, 'long_description')
                            ? 'ring-1 ring-red-500 rounded'
                            : ''
                    }
                >
                    <JoditEditorComponent
                        value={form.long_description ?? ''}
                        onChange={(value) => updateField('long_description', value)}
                    />
                </div>
                {hasFieldError(errors, 'long_description') && (
                    <p className="text-red-500 text-xs mt-1">
                        {getFieldError(errors, 'long_description')}
                    </p>
                )}
            </div>
        </div>
        </>
    );
};

export default GeneralTab;
