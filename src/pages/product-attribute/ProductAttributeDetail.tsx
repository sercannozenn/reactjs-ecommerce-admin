import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ReactSortable } from 'react-sortablejs';
import Swal from 'sweetalert2';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ProductAttributeService } from '../../api/services/ProductAttributeService';
import type {
    ProductAttribute,
    ProductAttributeScope,
    ProductAttributeType,
} from '../../types/product';
import IconPlus from '../../components/Icon/IconPlus';
import IconPencil from '../../components/Icon/IconPencil';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import { useCan } from '../../utils/permissions';
import { firstApiErrorMessage } from '../../utils/formErrors';

const TYPE_LABELS: Record<ProductAttributeType, string> = {
    select: 'Seçim Listesi',
    multiselect: 'Çoklu Seçim',
    text: 'Metin',
    number: 'Sayı',
    boolean: 'Evet / Hayır',
};

const TYPE_HINTS: Record<ProductAttributeType, string> = {
    select: 'Kullanıcı tek bir değer seçer. Örn: Renk (Siyah, Beyaz, Kırmızı).',
    multiselect: 'Kullanıcı birden fazla değer seçebilir. Örn: Özellikler (Su Geçirmez, Nefes Alan).',
    text: 'Serbest metin girilir. Örn: Üretici Notu.',
    number: 'Sayısal değer girilir. Örn: Ağırlık (gram).',
    boolean: 'Sadece iki seçenek: Evet veya Hayır. Örn: Organik mi?',
};

const ProductAttributeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const can = useCan();
    const canManage = can('product_attribute.manage');

    const [attr, setAttr] = useState<ProductAttribute | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<ProductAttributeType>('select');
    const [scope, setScope] = useState<ProductAttributeScope>('variant');
    const [isGlobal, setIsGlobal] = useState(false);
    const [colorFlag, setColorFlag] = useState(false);
    const [metaJson, setMetaJson] = useState('');

    const [newValue, setNewValue] = useState('');
    const [newHex, setNewHex] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('Özellik Düzenleme'));
    }, [dispatch]);

    const load = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await ProductAttributeService.fetchById(id);
            setAttr(data);
            setName(data.name);
            setType(data.type);
            setScope(data.scope);
            setIsGlobal(!!data.is_global);
            const loadedMeta = data.meta ?? null;
            setColorFlag(!!(loadedMeta && (loadedMeta as any).color === true));
            const extras = loadedMeta ? { ...(loadedMeta as Record<string, any>) } : {};
            delete extras.color;
            setMetaJson(Object.keys(extras).length ? JSON.stringify(extras, null, 2) : '');
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: 'error', title: 'Yüklenemedi' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSave = async () => {
        if (!attr) return;
        if (!name.trim()) {
            Swal.fire({ icon: 'warning', title: 'Ad boş olamaz' });
            return;
        }
        let extras: Record<string, any> = {};
        if (metaJson.trim()) {
            try {
                const parsed = JSON.parse(metaJson);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    extras = parsed;
                } else {
                    Swal.fire({ icon: 'error', title: 'Geçersiz JSON', text: 'Meta bir nesne (obje) olmalı.' });
                    return;
                }
            } catch {
                Swal.fire({ icon: 'error', title: 'Geçersiz JSON', text: 'Meta alanı geçerli JSON olmalı.' });
                return;
            }
        }
        const composed: Record<string, any> = { ...extras };
        if (colorFlag) composed.color = true;
        else delete composed.color;
        const meta: Record<string, any> | null = Object.keys(composed).length ? composed : null;
        setSaving(true);
        try {
            await ProductAttributeService.update(attr.id, {
                name: name.trim(),
                type,
                scope,
                is_global: isGlobal,
                meta,
            });
            Swal.fire({ icon: 'success', title: 'Kaydedildi', timer: 1200, showConfirmButton: false });
            await load();
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: firstApiErrorMessage(err, 'Kaydedilemedi'),
            });
        } finally {
            setSaving(false);
        }
    };

    const isColorAttribute =
        attr?.slug === 'renk' || attr?.slug === 'color' || colorFlag;

    const handleAddValue = async () => {
        if (!attr) return;
        if (!newValue.trim()) {
            Swal.fire({ icon: 'warning', title: 'Değer boş olamaz' });
            return;
        }
        try {
            const meta: Record<string, any> | null = newHex ? { hex: newHex } : null;
            await ProductAttributeService.addValue(attr.id, {
                value: newValue.trim(),
                meta,
            });
            setNewValue('');
            setNewHex('');
            await load();
            Swal.fire({ icon: 'success', title: 'Değer eklendi', timer: 1200, showConfirmButton: false });
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: firstApiErrorMessage(err, 'Eklenemedi'),
            });
        }
    };

    const [sortedValues, setSortedValues] = useState<Array<ProductAttribute['values'][number]>>([]);
    const sortedValuesRef = useRef<Array<ProductAttribute['values'][number]>>([]);

    const applySortedValues = (list: Array<ProductAttribute['values'][number]>) => {
        sortedValuesRef.current = list;
        setSortedValues(list);
    };

    useEffect(() => {
        const next = [...(attr?.values ?? [])].sort((a, b) => {
            const sa = a.sort_order ?? 0;
            const sb = b.sort_order ?? 0;
            if (sa !== sb) return sa - sb;
            return a.id - b.id;
        });
        applySortedValues(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attr?.values]);

    const persistOrder = async (list: Array<ProductAttribute['values'][number]>) => {
        if (!attr) return;
        const orderMap: Record<number, number> = {};
        list.forEach((v, i) => {
            orderMap[v.id] = i + 1;
        });
        try {
            await ProductAttributeService.reorderValues(attr.id, orderMap);
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Sıralanamadı',
                text: firstApiErrorMessage(err, 'Bir hata oluştu'),
            });
            await load();
        }
    };

    const handleReorder = async (valueId: number, direction: 'up' | 'down') => {
        if (!attr) return;
        const current = sortedValuesRef.current;
        const idx = current.findIndex((v) => v.id === valueId);
        if (idx === -1) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= current.length) return;

        const reordered = [...current];
        [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
        applySortedValues(reordered);
        await persistOrder(reordered);
    };

    const handleDragEnd = async (oldIndex?: number, newIndex?: number) => {
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
        await persistOrder(sortedValuesRef.current);
    };

    const handleEditValue = async (valueId: number) => {
        if (!attr) return;
        const current = sortedValues.find((v) => v.id === valueId);
        if (!current) return;
        const currentHex = (current.meta as any)?.hex ?? '';

        const { value: formValues } = await Swal.fire({
            title: 'Değeri Düzenle',
            html: isColorAttribute
                ? `
                    <label style="display:block;text-align:left;font-size:12px;margin-bottom:4px">Değer</label>
                    <input id="swal-value" class="swal2-input" style="margin:0 0 8px" value="${current.value.replace(/"/g, '&quot;')}" />
                    <label style="display:block;text-align:left;font-size:12px;margin-bottom:4px">Renk Kodu (Hex)</label>
                    <input id="swal-hex" class="swal2-input" style="margin:0" placeholder="#000000" value="${currentHex}" />
                `
                : `
                    <label style="display:block;text-align:left;font-size:12px;margin-bottom:4px">Değer</label>
                    <input id="swal-value" class="swal2-input" style="margin:0" value="${current.value.replace(/"/g, '&quot;')}" />
                `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Kaydet',
            cancelButtonText: 'İptal',
            preConfirm: () => {
                const v = (document.getElementById('swal-value') as HTMLInputElement)?.value?.trim();
                if (!v) {
                    Swal.showValidationMessage('Değer boş olamaz');
                    return false;
                }
                const hex = isColorAttribute
                    ? (document.getElementById('swal-hex') as HTMLInputElement)?.value?.trim() || ''
                    : '';
                return { value: v, hex };
            },
        });

        if (!formValues) return;

        try {
            const meta: Record<string, any> | null = formValues.hex ? { hex: formValues.hex } : null;
            await ProductAttributeService.updateValue(attr.id, valueId, {
                value: formValues.value,
                meta,
            });
            await load();
            Swal.fire({ icon: 'success', title: 'Güncellendi', timer: 1200, showConfirmButton: false });
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Kaydedilemedi',
                text: firstApiErrorMessage(err, 'Bir hata oluştu'),
            });
        }
    };

    const handleDeleteValue = async (valueId: number) => {
        if (!attr) return;
        const target = sortedValues.find((v) => v.id === valueId);
        if (!target) return;

        const confirm = await Swal.fire({
            icon: 'warning',
            title: `"${target.value}" değeri silinsin mi?`,
            text: 'Bu değeri kullanan ürün/varyant varsa silinemez.',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
        });
        if (!confirm.isConfirmed) return;

        try {
            await ProductAttributeService.deleteValue(attr.id, valueId);
            await load();
            Swal.fire({ icon: 'success', title: 'Silindi', timer: 1200, showConfirmButton: false });
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Silinemedi',
                text: firstApiErrorMessage(
                    err,
                    'Silinemedi — bu değer ürün/varyant bağlantısında kullanılıyor olabilir.'
                ),
            });
        }
    };

    if (loading) {
        return (
            <div className="panel">
                <p>Yükleniyor...</p>
            </div>
        );
    }

    if (!attr) {
        return (
            <div className="panel">
                <p>Özellik bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="panel">
                <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-lg">Özellik: {attr.name}</h5>
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate('/urun-attribute')}
                    >
                        Geri
                    </button>
                </div>

                <details className="mb-5 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                    <summary className="cursor-pointer select-none px-3 py-2 font-medium">
                        Bu Sayfa Nasıl Çalışır?
                    </summary>
                    <ul className="list-disc ml-8 mr-3 pb-3 space-y-1 text-xs">
                        <li>
                            Bu sayfada bir özelliğin <strong>ayarlarını</strong> (ad, tip, kapsam)
                            ve <strong>değerlerini</strong> yönetirsin. <em>Özellik</em>:{' '}
                            <em>Renk</em>, <em>Beden</em> gibi sıfat. <em>Değer</em>: sıfatın
                            alabileceği seçenekler (<em>Siyah</em>, <em>Beyaz</em>; <em>S</em>, <em>M</em>, <em>L</em>).
                        </li>
                        <li>
                            <strong>Tip</strong> değerin nasıl girileceğini belirler
                            (seçim listesi, çoklu seçim, metin, sayı, evet/hayır).
                        </li>
                        <li>
                            <strong>Kapsam — Varyant:</strong> Her varyant farklı değer alır
                            (stok/fiyat ayrılır). <strong>Ürün:</strong> Tüm varyantlar aynı
                            değeri paylaşır.
                        </li>
                        <li>
                            <strong>Global</strong> işaretliyse tüm kategorilerde otomatik
                            kullanılır; değilse kategori-özellik eşlemesi gerekir.
                        </li>
                        <li>
                            <strong>Slug</strong> teknik tanımlayıcıdır (URL/API için). Özellik
                            adından otomatik üretilir; değiştirilemez.
                        </li>
                        <li>
                            <strong>Renk özelliği mi?</strong> kutusu işaretliyse her değere bir Hex (renk kodu)
                            alanı açılır; müşteri tarafında renk küresi olarak gösterilir. (Slug "renk" ise
                            zaten otomatik açıktır.)
                        </li>
                        <li>
                            <strong>Gelişmiş → Ham Meta JSON</strong> yalnızca ileride tanımlanacak ekstra
                            anahtarlar için. Şu an sadece <code className="bg-blue-100 px-1 rounded">color</code>{' '}
                            anahtarı davranış değiştirir ve bunu üstteki kutu otomatik yönetir.
                        </li>
                    </ul>
                </details>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Ad</label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!canManage}
                        />
                        <p className="text-[11px] text-gray-500 mt-1">
                            Kullanıcıya görünen isim (örn. Renk, Beden).
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tip</label>
                        <select
                            className="form-select"
                            value={type}
                            onChange={(e) => setType(e.target.value as ProductAttributeType)}
                            disabled={!canManage}
                        >
                            {(Object.keys(TYPE_LABELS) as ProductAttributeType[]).map((t) => (
                                <option key={t} value={t}>
                                    {TYPE_LABELS[t]}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-gray-500 mt-1">{TYPE_HINTS[type]}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Kapsam</label>
                        <select
                            className="form-select"
                            value={scope}
                            onChange={(e) => setScope(e.target.value as ProductAttributeScope)}
                            disabled={!canManage}
                        >
                            <option value="variant">Varyant (stok/fiyat ayrılır)</option>
                            <option value="product">Ürün (tüm varyantlar ortak)</option>
                        </select>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {scope === 'variant'
                                ? 'Her varyant farklı değer alır — stok ve fiyat varyanta göre değişir.'
                                : 'Tüm varyantlar aynı değeri paylaşır — filtre/detay sayfası için kullanılır.'}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Global</label>
                        <label className="flex items-center gap-2 h-[38px]">
                            <input
                                type="checkbox"
                                className="form-checkbox"
                                checked={isGlobal}
                                onChange={(e) => setIsGlobal(e.target.checked)}
                                disabled={!canManage}
                            />
                            <span className="text-sm">Tüm kategorilerde otomatik kullanılır</span>
                        </label>
                        <p className="text-[11px] text-gray-500 mt-1">
                            İşaretsizse kategori-özellik eşlemesi ayrıca yapılmalı.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Renk özelliği mi?</label>
                        <label className="flex items-center gap-2 h-[38px]">
                            <input
                                type="checkbox"
                                className="form-checkbox"
                                checked={colorFlag}
                                onChange={(e) => setColorFlag(e.target.checked)}
                                disabled={!canManage}
                            />
                            <span className="text-sm">Değerler için Hex (renk kodu) alanı açılsın</span>
                        </label>
                        <p className="text-[11px] text-gray-500 mt-1">
                            İşaretlersen her değere renk kodu girip müşteriye renk küresi gösterilir.
                            (Slug "renk" ise zaten açıktır.)
                        </p>
                    </div>
                </div>

                <details className="mt-4 border rounded">
                    <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium bg-gray-50">
                        Gelişmiş (Slug & Ham Meta JSON)
                    </summary>
                    <div className="p-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Slug</label>
                                <input type="text" className="form-input font-mono text-xs" value={attr.slug} disabled />
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Otomatik üretilen teknik tanımlayıcı. Değiştirilemez.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Ham Meta JSON (ek anahtarlar)</label>
                                <textarea
                                    className="form-textarea font-mono text-xs"
                                    rows={3}
                                    value={metaJson}
                                    onChange={(e) => setMetaJson(e.target.value)}
                                    placeholder='{}'
                                    disabled={!canManage}
                                />
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Kaydet'e basınca üstteki "Renk özelliği" kutusu <code>color</code> anahtarını
                                    otomatik ekler; burada tekrar yazmana gerek yok.
                                </p>
                            </div>
                        </div>

                        <div className="text-xs text-gray-600 bg-gray-50 border rounded p-3">
                            <p className="font-medium mb-2">Tanınan anahtarlar (sistem şu an bunlara tepki veriyor):</p>
                            <ul className="list-disc ml-5 space-y-1">
                                <li>
                                    <code className="bg-white px-1 rounded border">color: true</code> —
                                    Bu özelliğin her <strong>değerine</strong> Hex (renk kodu) alanı açar.
                                    Üstteki "Renk özelliği mi?" kutusuyla aynı şey.
                                </li>
                            </ul>
                            <p className="mt-2">
                                Başka anahtarlar yazabilirsin; <strong>veritabanına kaydedilir</strong> ama
                                şu an hiçbir ekranda davranışı değiştirmez. Yeni bir davranış tanımlanırsa burada listelenecektir.
                            </p>
                            <p className="mt-1 text-gray-500">
                                Not: Değer seviyesindeki meta (örn. <code>{'{"hex":"#000"}'}</code>) değer ekleme/düzenleme
                                formundan otomatik yazılır — buraya elle girmene gerek yok.
                            </p>
                        </div>
                    </div>
                </details>

                {canManage && (
                    <div className="mt-4 flex gap-2">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            Kaydet
                        </button>
                    </div>
                )}
            </div>

            <div className="panel">
                <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold">Değerler ({attr.values?.length ?? 0})</h5>
                </div>

                <p className="text-xs text-gray-600 mb-3">
                    Bu özelliğin alabileceği seçenekler. Örn <em>Renk</em> özelliği için:
                    <em> Siyah, Beyaz, Kırmızı</em>. Değerler ürün eklerken seçim listesinde görünür.
                </p>

                {canManage && (
                    <div className="mb-4 p-3 bg-gray-50 rounded border">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Yeni Değer</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder="örn. Siyah, XL, Pamuk"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Müşteriye görünen etiket.
                                </p>
                            </div>
                            {isColorAttribute && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Renk Kodu (Hex)</label>
                                    <input
                                        type="text"
                                        className="form-input font-mono"
                                        value={newHex}
                                        onChange={(e) => setNewHex(e.target.value)}
                                        placeholder="#000000"
                                    />
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        Ürün detayında renk küresi olarak gösterilir.
                                    </p>
                                </div>
                            )}
                            <div>
                                <label
                                    className="block text-sm font-medium mb-1 invisible select-none"
                                    aria-hidden="true"
                                >
                                    &nbsp;
                                </label>
                                <button
                                    type="button"
                                    className="btn btn-primary flex items-center justify-center gap-2 w-full"
                                    onClick={handleAddValue}
                                >
                                    <IconPlus />
                                    Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                {canManage && <th className="w-8 px-2 py-2" title="Sürükle-bırak ile sırala"></th>}
                                <th className="px-3 py-2 text-left">ID</th>
                                <th className="px-3 py-2 text-left">Değer</th>
                                <th className="px-3 py-2 text-left" title="Özel ayarlar (renk hex vb.)">Meta</th>
                                <th className="px-3 py-2" title="Listelenme sırası (küçük → büyük)">Sıra</th>
                                {canManage && <th className="px-3 py-2">İşlemler</th>}
                            </tr>
                        </thead>
                        {sortedValues.length === 0 ? (
                            <tbody>
                                <tr>
                                    <td colSpan={canManage ? 6 : 4} className="text-center text-gray-500 py-6">
                                        Henüz değer yok. Yukarıdan ilk değeri ekle.
                                    </td>
                                </tr>
                            </tbody>
                        ) : (
                            <ReactSortable
                                tag="tbody"
                                list={sortedValues as any}
                                setList={(newList) => applySortedValues(newList as any)}
                                onEnd={(evt) => handleDragEnd(evt.oldIndex, evt.newIndex)}
                                animation={180}
                                handle=".value-drag-handle"
                                disabled={!canManage}
                                ghostClass="bg-blue-50"
                            >
                                {sortedValues.map((v, idx) => {
                                    const hex = (v.meta as any)?.hex;
                                    const isFirst = idx === 0;
                                    const isLast = idx === sortedValues.length - 1;
                                    return (
                                        <tr key={v.id} className="border-b">
                                            {canManage && (
                                                <td className="px-2 py-2 text-center">
                                                    <span
                                                        className="value-drag-handle cursor-grab active:cursor-grabbing text-gray-400 select-none"
                                                        title="Sürükleyerek sırala"
                                                    >
                                                        ⠿
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-3 py-2 text-gray-500">{v.id}</td>
                                            <td className="px-3 py-2 font-medium">
                                                <div className="flex items-center gap-2">
                                                    {hex && (
                                                        <span
                                                            className="inline-block w-4 h-4 rounded border"
                                                            style={{ backgroundColor: hex }}
                                                        />
                                                    )}
                                                    {v.value}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-500 font-mono">
                                                {v.meta ? JSON.stringify(v.meta) : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {v.sort_order ?? 0}
                                            </td>
                                            {canManage && (
                                                <td className="px-3 py-2">
                                                    <div className="flex gap-1 justify-center items-center">
                                                        <button
                                                            type="button"
                                                            className="p-1 text-gray-600 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                                                            onClick={() => handleReorder(v.id, 'up')}
                                                            disabled={isFirst}
                                                            title="Yukarı taşı"
                                                        >
                                                            ▲
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="p-1 text-gray-600 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                                                            onClick={() => handleReorder(v.id, 'down')}
                                                            disabled={isLast}
                                                            title="Aşağı taşı"
                                                        >
                                                            ▼
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="p-1 text-primary"
                                                            onClick={() => handleEditValue(v.id)}
                                                            title="Düzenle"
                                                        >
                                                            <IconPencil />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="p-1 text-red-500"
                                                            onClick={() => handleDeleteValue(v.id)}
                                                            title="Sil"
                                                        >
                                                            <IconTrashLines />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </ReactSortable>
                        )}
                    </table>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                    İpucu: Sıra değiştirmek için ⠿ tutamağını sürükle veya ▲/▼ butonlarını kullan.
                    Etiket/hex güncellemek için kalem, silmek için kırmızı çöp ikonunu kullan.
                    Ürün veya varyantta kullanılan değer silinemez — önce bağlantıları kaldırman gerekir.
                </p>
            </div>
        </div>
    );
};

export default ProductAttributeDetail;
