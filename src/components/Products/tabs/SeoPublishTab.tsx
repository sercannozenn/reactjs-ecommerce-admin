import React from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { useProductForm } from '../ProductFormContext';
import type { ProductStatus } from '../../../types/product';
import { useCan } from '../../../utils/permissions';
import { fieldClass, getFieldError, hasFieldError } from '../../../utils/formErrors';

const STATUS_LABELS: Record<ProductStatus, string> = {
    draft: 'Taslak',
    pending_review: 'İncelemede',
    published: 'Yayında',
    scheduled: 'Planlanmış',
    archived: 'Arşivli',
};

const SeoPublishTab: React.FC = () => {
    const { form, updateField, errors } = useProductForm();
    const can = useCan();

    const keywordsArr = (form.keywords ?? '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

    const addKeyword = (kw: string) => {
        const clean = kw.trim();
        if (!clean) return;
        if (keywordsArr.includes(clean)) return;
        updateField('keywords', [...keywordsArr, clean].join(', '));
    };
    const removeKeyword = (idx: number) => {
        const next = [...keywordsArr];
        next.splice(idx, 1);
        updateField('keywords', next.join(', '));
    };

    const availableStatuses: ProductStatus[] = (() => {
        const all: ProductStatus[] = [
            'draft',
            'pending_review',
            'published',
            'scheduled',
            'archived',
        ];
        if (!can('product.publish')) {
            return all.filter((s) => s !== 'published' && s !== 'scheduled');
        }
        return all;
    })();

    const seoLen = (form.seo_description ?? '').length;

    return (
        <>
            <details className="mb-5 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                <summary className="cursor-pointer select-none px-3 py-2 font-medium">
                    SEO & Yayın Nasıl Çalışır?
                </summary>
                <ul className="list-disc ml-8 mr-3 pb-3 space-y-1 text-xs">
                    <li>
                        <strong>Anahtar kelimeler, SEO açıklaması ve meta etiketleri</strong> Google
                        gibi arama motorlarının ürünü nasıl göstereceğini etkiler. Aşağıdaki canlı
                        önizleme gerçek bir Google sonucunda nasıl görüneceğini gösterir.
                    </li>
                    <li>
                        <strong>SEO Açıklama</strong> arama sonucunda başlığın altında çıkan 160
                        karakterlik kısa özet. Meta açıklama boşsa onun yerine kullanılır.
                    </li>
                    <li>
                        <strong>OG Görsel URL</strong> bağlantı Facebook/Twitter/WhatsApp gibi
                        platformlarda paylaşıldığında gösterilecek kapak görseli. Boş bırakılırsa
                        ürünün öne çıkan görseli kullanılır.
                    </li>
                    <li>
                        <strong>Durum:</strong>
                        <br />• <em>Taslak</em> — sadece adminde görünür, storefront'ta yok.
                        <br />• <em>İncelemede</em> — editör onayı bekliyor.
                        <br />• <em>Yayında</em> — storefront'ta canlı.
                        <br />• <em>Zamanlanmış</em> — yayın tarihi geldiğinde otomatik yayına alınır (cron).
                        <br />• <em>Arşivlenmiş</em> — satıştan kaldırıldı, URL'den erişim yok.
                    </li>
                    <li>
                        <strong>Yayın Zamanı</strong> ileri bir tarih seçersen ürün o zaman
                        otomatik yayına alınır (durum "Zamanlanmış" olmalı).{' '}
                        <strong>Yayından kaldırma</strong> geldiğinde ürün otomatik arşivlenir.
                    </li>
                </ul>
            </details>

        <div className="grid xl:grid-cols-2 gap-6 grid-cols-1">
            <div className="mb-5 col-span-2">
                <label className="block text-sm font-medium mb-1">Anahtar Kelimeler</label>
                <div className="flex gap-2 flex-wrap mb-2">
                    {keywordsArr.map((kw, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                            {kw}
                            <button
                                type="button"
                                className="text-red-500"
                                onClick={() => removeKeyword(idx)}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Kelime yazıp Enter'a basın"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addKeyword((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                        }
                    }}
                />
            </div>

            <div className="mb-5 col-span-2">
                <label className="block text-sm font-medium mb-1">
                    SEO Açıklama
                    <span
                        className={`ml-2 text-xs ${
                            seoLen > 160 ? 'text-red-500' : 'text-gray-400'
                        }`}
                    >
                        {seoLen}/160
                    </span>
                </label>
                <textarea
                    className={fieldClass('form-textarea', hasFieldError(errors, 'seo_description'))}
                    rows={3}
                    maxLength={320}
                    value={form.seo_description ?? ''}
                    onChange={(e) => updateField('seo_description', e.target.value)}
                />
                {hasFieldError(errors, 'seo_description') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'seo_description')}</p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">Meta Başlık</label>
                <input
                    type="text"
                    className={fieldClass('form-input', hasFieldError(errors, 'meta_title'))}
                    maxLength={160}
                    value={form.meta_title ?? ''}
                    onChange={(e) => updateField('meta_title', e.target.value)}
                />
                {hasFieldError(errors, 'meta_title') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'meta_title')}</p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">OG Görsel URL</label>
                <input
                    type="url"
                    className={fieldClass('form-input', hasFieldError(errors, 'og_image_url'))}
                    value={form.og_image_url ?? ''}
                    onChange={(e) => updateField('og_image_url', e.target.value || null)}
                />
                {hasFieldError(errors, 'og_image_url') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'og_image_url')}</p>
                )}
            </div>

            <div className="mb-5 col-span-2">
                <label className="block text-sm font-medium mb-1">Meta Açıklama</label>
                <textarea
                    className={fieldClass('form-textarea', hasFieldError(errors, 'meta_description'))}
                    rows={2}
                    maxLength={320}
                    value={form.meta_description ?? ''}
                    onChange={(e) => updateField('meta_description', e.target.value)}
                />
                {hasFieldError(errors, 'meta_description') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'meta_description')}</p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">Yazar</label>
                <input
                    type="text"
                    className={fieldClass('form-input', hasFieldError(errors, 'author'))}
                    value={form.author ?? ''}
                    onChange={(e) => updateField('author', e.target.value || null)}
                />
                {hasFieldError(errors, 'author') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'author')}</p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">
                    Durum <span className="text-red-500">*</span>
                </label>
                <select
                    className={fieldClass('form-select', hasFieldError(errors, 'status'))}
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value as ProductStatus)}
                >
                    {availableStatuses.map((s) => (
                        <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                        </option>
                    ))}
                </select>
                {hasFieldError(errors, 'status') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'status')}</p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">Yayın Zamanı</label>
                <Flatpickr
                    className={fieldClass('form-input', hasFieldError(errors, 'publish_at'))}
                    value={form.publish_at ?? undefined}
                    options={{ enableTime: true, dateFormat: 'Y-m-d H:i' }}
                    onChange={(dates) => {
                        const d = dates[0];
                        updateField(
                            'publish_at',
                            d ? d.toISOString().slice(0, 19).replace('T', ' ') : null
                        );
                    }}
                />
                {hasFieldError(errors, 'publish_at') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'publish_at')}</p>
                )}
            </div>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">Yayından Kaldırma</label>
                <Flatpickr
                    className={fieldClass('form-input', hasFieldError(errors, 'unpublish_at'))}
                    value={form.unpublish_at ?? undefined}
                    options={{ enableTime: true, dateFormat: 'Y-m-d H:i' }}
                    onChange={(dates) => {
                        const d = dates[0];
                        updateField(
                            'unpublish_at',
                            d ? d.toISOString().slice(0, 19).replace('T', ' ') : null
                        );
                    }}
                />
                {hasFieldError(errors, 'unpublish_at') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'unpublish_at')}</p>
                )}
            </div>

            {/* SERP preview */}
            <div className="col-span-2 mt-2 p-4 border border-gray-200 rounded bg-white">
                <p className="text-xs text-gray-400 mb-2">Google Önizleme</p>
                <p className="text-blue-700 text-base font-medium truncate">
                    {form.meta_title || (form.name ? `${form.name} | Kermes` : 'Ürün Adı')}
                </p>
                <p className="text-green-700 text-xs mb-1">
                    kermes.com › urun › {form.slug || 'urun-slug'}
                </p>
                <p className="text-gray-600 text-sm line-clamp-2">
                    {form.meta_description ||
                        form.seo_description ||
                        (form.short_description || '').replace(/<[^>]+>/g, '') ||
                        'Meta açıklama girilmemiş.'}
                </p>
            </div>
        </div>
        </>
    );
};

export default SeoPublishTab;
