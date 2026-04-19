import React, { useState } from 'react';
import { useDropzone, Accept, FileRejection, DropEvent } from 'react-dropzone';
import Select from 'react-select';
import Swal from 'sweetalert2';
import { useProductForm, ImageDraft } from '../ProductFormContext';
import { fieldClass, getFieldError, hasFieldError } from '../../../utils/formErrors';
import { ProductService } from '../../../api/services/ProductService';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const accept: Accept = { 'image/*': [] };

const MediaTab: React.FC = () => {
    const { form, updateField, errors, setForm } = useProductForm();
    const [uploading, setUploading] = useState(false);

    const variantOptions = form.variants.map((v, i) => ({
        value: v.id ?? -(i + 1), // negative sentinel for unsaved
        label: v.attribute_label || v.sku || `Varyant ${i + 1}`,
    }));

    const onDrop = async (
        acceptedFiles: File[],
        _rejected: FileRejection[],
        _event: DropEvent
    ) => {
        if (acceptedFiles.length === 0) return;

        // Taslak yoksa önce kullanıcıyı yönlendir — upload için productId zorunlu.
        if (!form.productId) {
            Swal.fire({
                icon: 'info',
                title: 'Önce Taslak Kaydet',
                text: 'Görsel yüklemeden önce "Taslak Kaydet" butonuna basarak ürünü oluşturun.',
            });
            return;
        }

        setUploading(true);
        try {
            const uploaded = await ProductService.uploadImages(
                form.productId,
                acceptedFiles
            );
            const newDrafts: ImageDraft[] = uploaded.map((img: any) => ({
                id: img.id,
                image_path: img.image_url ?? img.image_path,
                isNew: false,
                is_featured: !!img.is_featured,
                sort_order: img.sort_order ?? 0,
                variant_id: img.variant_id ?? null,
            }));
            setForm((prev) => ({
                ...prev,
                images: [...prev.images, ...newDrafts].sort(
                    (a, b) => a.sort_order - b.sort_order
                ),
            }));
            Swal.fire({
                icon: 'success',
                title: `${acceptedFiles.length} görsel yüklendi`,
                timer: 1200,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
            });
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Yükleme başarısız',
                text: err?.response?.data?.message || 'Görseller yüklenemedi',
            });
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept,
        multiple: true,
        maxFiles: 20,
        maxSize: MAX_FILE_SIZE,
        onDropRejected: (rejected) => {
            const messages = rejected.map(({ file, errors }) => {
                if (errors[0]?.code === 'file-too-large') {
                    return `${file.name}: 2MB'tan büyük olamaz`;
                }
                if (errors[0]?.code === 'file-invalid-type') {
                    return `${file.name}: Sadece görsel kabul edilir`;
                }
                return `${file.name}: reddedildi`;
            });
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                html: messages.join('<br>'),
            });
        },
    });

    const setFeatured = async (id: number | string) => {
        if (typeof id !== 'number' || !form.productId) return;
        // Optimistic
        updateField(
            'images',
            form.images.map((img) => ({ ...img, is_featured: img.id === id }))
        );
        try {
            await ProductService.updateImage(form.productId, id, { is_featured: true });
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Hata', text: err?.response?.data?.message || 'Öne çıkarma başarısız' });
        }
    };

    const removeImage = async (id: number | string) => {
        if (typeof id !== 'number' || !form.productId) return;
        const confirm = await Swal.fire({
            icon: 'warning',
            title: 'Görseli sil?',
            showCancelButton: true,
            confirmButtonText: 'Sil',
            cancelButtonText: 'Vazgeç',
        });
        if (!confirm.isConfirmed) return;
        try {
            await ProductService.deleteImage(form.productId, id);
            const next = form.images.filter((i) => i.id !== id);
            updateField('images', next);
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Hata', text: err?.response?.data?.message || 'Silme başarısız' });
        }
    };

    const moveImage = async (id: number | string, dir: -1 | 1) => {
        if (typeof id !== 'number' || !form.productId) return;
        const idx = form.images.findIndex((i) => i.id === id);
        if (idx < 0) return;
        const next = [...form.images];
        const target = idx + dir;
        if (target < 0 || target >= next.length) return;
        [next[idx], next[target]] = [next[target], next[idx]];
        next.forEach((img, i) => (img.sort_order = i));
        updateField('images', next);
        // Sırayı backend'e de yansıt — paralel
        try {
            await Promise.all(
                next
                    .filter((i) => typeof i.id === 'number')
                    .map((img) =>
                        ProductService.updateImage(form.productId!, img.id as number, {
                            sort_order: img.sort_order,
                        })
                    )
            );
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Sıralama kaydedilemedi',
                text: err?.response?.data?.message || 'Tekrar deneyin',
            });
        }
    };

    const setVariant = async (id: number | string, variantId: number | null) => {
        if (typeof id !== 'number' || !form.productId) return;
        updateField(
            'images',
            form.images.map((img) =>
                img.id === id ? { ...img, variant_id: variantId } : img
            )
        );
        try {
            await ProductService.updateImage(form.productId, id, { variant_id: variantId });
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Hata', text: err?.response?.data?.message || 'Kaydedilemedi' });
        }
    };

    return (
        <div>
            {/* Açıklama akordiyonu — görsel yönetim mantığı */}
            <details className="mb-5 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                <summary className="cursor-pointer select-none px-3 py-2 font-medium">
                    Görseller Nasıl Çalışır?
                </summary>
                <ul className="list-disc ml-8 mr-3 pb-3 space-y-1 text-xs">
                    <li>
                        <strong>Öne çıkan görsel</strong> ürün listesi, arama sonuçları ve sosyal
                        medya paylaşımlarında ürünün kartı olarak görünür (tek görsel seçilir).
                    </li>
                    <li>
                        Her görseli bir <strong>varyanta bağlayabilirsin</strong>. Müşteri o
                        varyantı seçince sadece o varyanta ait görseller gösterilir.
                        "Tüm varyantlar" seçeneği görsel tüm varyantlarda görünür.
                    </li>
                    <li>
                        Aşağıdaki <strong>"Varyant Kapak Görselleri"</strong> bölümünden her
                        varyantın detay sayfasında ilk gösterilecek kapak görselini seçebilirsin.
                        Seçmezsen ürünün genel öne çıkan görseli kullanılır.
                    </li>
                    <li>
                        <strong>Sıralama:</strong> Görseller yüklediğin sırayla listelenir.
                        Ok tuşları ile sırayı değiştirebilirsin. Detay sayfasında bir varyant
                        seçilince o varyantın görselleri aynı genel sırayla süzülür.
                    </li>
                </ul>
            </details>

            <div className="mb-5">
                <label className="block text-sm font-medium mb-1">Video URL</label>
                <input
                    type="url"
                    className={fieldClass('form-input', hasFieldError(errors, 'video_url'))}
                    placeholder="https://youtube.com/..."
                    value={form.video_url ?? ''}
                    onChange={(e) => updateField('video_url', e.target.value || null)}
                />
                {hasFieldError(errors, 'video_url') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'video_url')}</p>
                )}
            </div>

            <label className="block text-sm font-medium mb-1">
                Ürün Görselleri <span className="text-red-500">*</span>
            </label>
            <div
                {...getRootProps()}
                className={`border-dashed border-2 p-6 rounded-md cursor-pointer text-center ${
                    hasFieldError(errors, 'images') ? 'border-red-500 bg-red-50' : 'border-gray-400'
                } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
            >
                <input {...getInputProps()} />
                {uploading ? (
                    <p className="text-primary">Yükleniyor...</p>
                ) : (
                    <p>Görselleri sürükle-bırak ya da tıkla (max 2MB, 20 adet)</p>
                )}
                {!form.productId && (
                    <p className="text-xs text-orange-600 mt-2">
                        Görsel yüklemek için önce taslak kaydedin.
                    </p>
                )}
            </div>

            {hasFieldError(errors, 'images') && (
                <p className="text-red-500 text-xs mt-2">{getFieldError(errors, 'images')}</p>
            )}

            {/* Varyant Kapak Görselleri — her varyant için hangi görselin öne çıkacağı */}
            {form.variants.length > 0 && form.images.length > 0 && (
                <div className="panel mt-5 mb-5">
                    <h3 className="font-semibold mb-2">Varyant Kapak Görselleri</h3>
                    <p className="text-xs text-gray-500 mb-3">
                        Her varyantın storefront'ta gösterileceği kapak görselini seç.
                        Seçilmezse ürünün genel öne çıkan görseli kullanılır.
                    </p>
                    <div className="space-y-2">
                        {form.variants.map((v, vIdx) => {
                            const label =
                                v.attribute_label ||
                                v.sku ||
                                `Varyant ${vIdx + 1}`;
                            const currentImg = form.images.find(
                                (i) => typeof i.id === 'number' && i.id === v.featured_image_id
                            );
                            return (
                                <div
                                    key={vIdx}
                                    className="flex items-center gap-3 p-2 border rounded"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                            {label}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            SKU: {v.sku}
                                        </div>
                                    </div>
                                    {currentImg && (
                                        <img
                                            src={currentImg.image_path}
                                            alt=""
                                            className="w-10 h-10 object-contain border rounded"
                                        />
                                    )}
                                    <select
                                        className="form-select w-full md:min-w-[310px] md:max-w-[450px]"
                                        value={v.featured_image_id ?? ''}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                            const nextVariants = form.variants.map((vv, i) =>
                                                i === vIdx ? { ...vv, featured_image_id: val } : vv
                                            );
                                            updateField('variants', nextVariants);
                                        }}
                                    >
                                        <option value="">— Ürün kapak görseli kullanılsın —</option>
                                        {form.images
                                            .filter((i) => typeof i.id === 'number')
                                            .map((img, idx) => (
                                                <option key={img.id} value={img.id as number}>
                                                    #{idx + 1} Görsel
                                                    {img.is_featured ? ' (ürün kapağı)' : ''}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                    {form.images.some((i) => typeof i.id !== 'number') && (
                        <p className="text-xs text-orange-600 mt-2">
                            Yeni yüklenen görseller taslak kaydedildikten sonra bu listede görünür.
                        </p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                {form.images.map((img, idx) => (
                    <div key={img.id} className="border rounded p-2 relative">
                        {/* Görsel numarası — varyant kapak seçerken referans için */}
                        <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow">
                            #{idx + 1}
                        </span>
                        <img
                            src={img.image_path}
                            alt=""
                            className="w-full h-32 object-contain"
                        />
                        {img.is_featured && (
                            <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                                Öne Çıkan
                            </span>
                        )}

                        <div className="mt-2 flex gap-1 justify-between">
                            <button
                                type="button"
                                className="btn btn-xs btn-outline-primary"
                                onClick={() => moveImage(img.id, -1)}
                                disabled={idx === 0}
                            >
                                ←
                            </button>
                            <button
                                type="button"
                                className="btn btn-xs btn-outline-primary"
                                onClick={() => moveImage(img.id, 1)}
                                disabled={idx === form.images.length - 1}
                            >
                                →
                            </button>
                        </div>

                        <div className="mt-2 flex gap-1">
                            <button
                                type="button"
                                className={`btn btn-xs flex-1 ${
                                    img.is_featured
                                        ? 'btn-success'
                                        : 'btn-outline-success'
                                }`}
                                onClick={() => setFeatured(img.id)}
                            >
                                {img.is_featured ? '★' : 'Öne Çıkar'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-xs btn-danger"
                                onClick={() => removeImage(img.id)}
                            >
                                Sil
                            </button>
                        </div>

                        {variantOptions.length > 0 && (
                            <div className="mt-2">
                                <label className="block text-[11px] text-gray-500 mb-1">
                                    Bu görsel hangi varyanta ait?
                                </label>
                                <Select
                                    classNamePrefix="select"
                                    placeholder="Tüm varyantlar (ortak görsel)"
                                    isClearable
                                    options={variantOptions}
                                    value={
                                        variantOptions.find(
                                            (o) => o.value === img.variant_id
                                        ) ?? null
                                    }
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (b) => ({ ...b, zIndex: 9999 }),
                                    }}
                                    onChange={(opt: any) =>
                                        setVariant(
                                            img.id,
                                            opt && opt.value > 0 ? opt.value : null
                                        )
                                    }
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MediaTab;
