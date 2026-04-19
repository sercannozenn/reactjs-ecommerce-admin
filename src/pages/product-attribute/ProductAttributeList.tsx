import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ProductAttributeService } from '../../api/services/ProductAttributeService';
import type {
    ProductAttribute,
    ProductAttributeType,
    ProductAttributeScope,
} from '../../types/product';
import IconEdit from '../../components/Icon/IconEdit';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPlus from '../../components/Icon/IconPlus';
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

const SCOPE_LABELS: Record<ProductAttributeScope, string> = {
    product: 'Ürün',
    variant: 'Varyant',
};

const slugify = (s: string): string =>
    s
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const ProductAttributeList: React.FC = () => {
    const dispatch = useDispatch();
    const can = useCan();
    const [items, setItems] = useState<ProductAttribute[]>([]);
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(0);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [slugAuto, setSlugAuto] = useState(true);
    const [newType, setNewType] = useState<ProductAttributeType>('select');
    const [newScope, setNewScope] = useState<ProductAttributeScope>('variant');
    const [newGlobal, setNewGlobal] = useState(false);

    const [showTrashed, setShowTrashed] = useState(false);
    const [trashed, setTrashed] = useState<ProductAttribute[]>([]);
    const [trashLoading, setTrashLoading] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Ürün Özellikleri'));
    }, [dispatch]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await ProductAttributeService.list();
                setItems(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [refresh]);

    useEffect(() => {
        if (!showTrashed) return;
        const load = async () => {
            setTrashLoading(true);
            try {
                const data = await ProductAttributeService.listTrashed();
                setTrashed(data);
            } catch (err) {
                console.error(err);
            } finally {
                setTrashLoading(false);
            }
        };
        load();
    }, [showTrashed, refresh]);

    const handleNameChange = (value: string) => {
        setNewName(value);
        if (slugAuto) setNewSlug(slugify(value));
    };

    const handleCreate = async () => {
        if (!newName.trim()) {
            Swal.fire({ icon: 'warning', title: 'Özellik adı boş olamaz' });
            return;
        }
        try {
            await ProductAttributeService.create({
                name: newName.trim(),
                slug: newSlug.trim() || undefined,
                type: newType,
                scope: newScope,
                is_global: newGlobal,
            });
            Swal.fire({ icon: 'success', title: 'Eklendi', timer: 1200, showConfirmButton: false });
            setCreating(false);
            setNewName('');
            setNewSlug('');
            setSlugAuto(true);
            setNewType('select');
            setNewScope('variant');
            setNewGlobal(false);
            setRefresh((r) => r + 1);
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: firstApiErrorMessage(err, 'Oluşturulamadı'),
            });
        }
    };

    const handleRestore = async (item: ProductAttribute) => {
        const confirm = await Swal.fire({
            icon: 'question',
            title: `"${item.name}" geri yüklensin mi?`,
            text: 'Özellik tekrar aktif hale gelir ve listeye döner.',
            showCancelButton: true,
            confirmButtonText: 'Evet, Geri Yükle',
            cancelButtonText: 'İptal',
        });
        if (!confirm.isConfirmed) return;
        try {
            await ProductAttributeService.restore(item.id);
            Swal.fire({ icon: 'success', title: 'Geri yüklendi', timer: 1200, showConfirmButton: false });
            setRefresh((r) => r + 1);
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Geri yüklenemedi',
                text: firstApiErrorMessage(err, 'Geri yüklenemedi'),
            });
        }
    };

    const handleDelete = async (item: ProductAttribute) => {
        const confirm = await Swal.fire({
            icon: 'warning',
            title: `"${item.name}" özelliği silinsin mi?`,
            text: 'Bu özellik ve tüm değerleri silinir. Ürün/varyant bağlantıları bozulabilir.',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
        });
        if (!confirm.isConfirmed) return;
        try {
            await ProductAttributeService.delete(item.id);
            Swal.fire({ icon: 'success', title: 'Silindi', timer: 1200, showConfirmButton: false });
            setRefresh((r) => r + 1);
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: firstApiErrorMessage(err, 'Silinemedi'),
            });
        }
    };

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        Ürün Özellikleri
                    </h5>
                    <div className="ltr:ml-auto rtl:mr-auto flex gap-2">
                        {can('product_attribute.manage') && (
                            <button
                                type="button"
                                className={`btn btn-sm flex items-center gap-2 ${showTrashed ? 'btn-warning' : 'btn-outline-secondary'}`}
                                onClick={() => setShowTrashed((v) => !v)}
                                title="Silinmiş özellikleri göster / gizle"
                            >
                                {showTrashed ? 'Silinmişleri Gizle' : 'Silinmişleri Göster'}
                            </button>
                        )}
                        {can('product_attribute.manage') && !showTrashed && (
                            <button
                                type="button"
                                className="btn btn-primary flex items-center gap-2"
                                onClick={() => setCreating((v) => !v)}
                            >
                                <IconPlus />
                                Yeni Özellik
                            </button>
                        )}
                    </div>
                </div>

                <details className="mb-5 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                    <summary className="cursor-pointer select-none px-3 py-2 font-medium">
                        Ürün Özellikleri Nasıl Çalışır?
                    </summary>
                    <ul className="list-disc ml-8 mr-3 pb-3 space-y-1 text-xs">
                        <li>
                            <strong>Özellik</strong>, ürünleri veya varyantları tanımlayan sıfatlardır.
                            Örn: <em>Renk</em>, <em>Beden</em>, <em>Malzeme</em>, <em>Garanti Süresi</em>.
                            Her özelliğin bir veya daha fazla <strong>değeri</strong> olur
                            (Renk için: Siyah, Beyaz, Kırmızı...).
                        </li>
                        <li>
                            <strong>Kapsam — Varyant:</strong> Her varyant farklı değer alır.
                            Örn: <em>Renk</em>, <em>Beden</em> — aynı ürünün farklı renk/beden varyantları
                            oluşturulur, stok ve fiyat varyanta göre değişir.
                        </li>
                        <li>
                            <strong>Kapsam — Ürün:</strong> Tüm varyantlar aynı değeri paylaşır.
                            Filtreleme ve detay sayfası için kullanılır. Örn:{' '}
                            <em>Malzeme: Pamuk</em>, <em>Menşei: Türkiye</em>.
                        </li>
                        <li>
                            <strong>Tip</strong> değerin nasıl girileceğini belirler
                            (Seçim Listesi / Çoklu Seçim / Metin / Sayı / Evet-Hayır).
                        </li>
                        <li>
                            <strong>Global</strong> işaretliyse özellik tüm kategorilerde otomatik sunulur.
                            İşaretli değilse sadece eşlenen kategorilerde gösterilir
                            (kategori-özellik eşlemesi ayrıca yapılır).
                        </li>
                        <li>
                            <strong>Slug</strong> özellik adından otomatik üretilen teknik tanımlayıcıdır
                            (URL/API'da kullanılır). Ekleme sırasında istersen elle farklı bir değer
                            girebilirsin (örn. aynı isim başka bağlamda daha önce kullanıldıysa).
                        </li>
                        <li>
                            <strong>Silinen</strong> özellikler kalıcı olarak yok olmaz — üstteki
                            "Silinmişleri Göster" butonuyla listeleyip geri yükleyebilirsin. Aynı isim/slug'a
                            sahip yeni bir özellik açıldıysa geri yükleme çakışmaya takılır; önce ad/slug'ı farklılaştırmak gerekir.
                        </li>
                    </ul>
                </details>

                {creating && !showTrashed && (
                    <div className="mb-5 p-4 border rounded bg-gray-50">
                        <h6 className="font-semibold mb-3">Yeni Özellik Ekle</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Ad *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="örn. Renk, Beden, Malzeme"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Kullanıcıya görünen isim.
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium">Slug</label>
                                    <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-3 w-3"
                                            checked={slugAuto}
                                            onChange={(e) => {
                                                setSlugAuto(e.target.checked);
                                                if (e.target.checked) setNewSlug(slugify(newName));
                                            }}
                                        />
                                        Otomatik
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    className="form-input font-mono text-xs"
                                    value={newSlug}
                                    onChange={(e) => {
                                        setSlugAuto(false);
                                        setNewSlug(e.target.value);
                                    }}
                                    placeholder="örn. renk, renk-giyim"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">
                                    URL/API tanımlayıcısı. Otomatik isimden üretilir; manuel değiştirebilirsin.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tip</label>
                                <select
                                    className="form-select"
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as ProductAttributeType)}
                                >
                                    {(Object.keys(TYPE_LABELS) as ProductAttributeType[]).map((t) => (
                                        <option key={t} value={t}>
                                            {TYPE_LABELS[t]}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-gray-500 mt-1">{TYPE_HINTS[newType]}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Kapsam</label>
                                <select
                                    className="form-select"
                                    value={newScope}
                                    onChange={(e) => setNewScope(e.target.value as ProductAttributeScope)}
                                >
                                    <option value="variant">Varyant (stok/fiyat ayrılır)</option>
                                    <option value="product">Ürün (tüm varyantlar ortak)</option>
                                </select>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {newScope === 'variant'
                                        ? 'Her varyant farklı değer alır.'
                                        : 'Tüm varyantlar aynı değeri paylaşır.'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Global</label>
                                <label className="flex items-center gap-2 h-[38px]">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox"
                                        checked={newGlobal}
                                        onChange={(e) => setNewGlobal(e.target.checked)}
                                    />
                                    <span className="text-sm">Tüm kategorilerde kullanılır</span>
                                </label>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    İşaretsizse kategori eşlemesi gerekir.
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button type="button" className="btn btn-primary" onClick={handleCreate}>
                                Kaydet
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setCreating(false)}
                            >
                                Vazgeç
                            </button>
                        </div>
                    </div>
                )}

                {!showTrashed && loading ? (
                    <p>Yükleniyor...</p>
                ) : !showTrashed ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-3 py-2 text-left">Ad</th>
                                    <th className="px-3 py-2 text-left" title="URL/API'da kullanılan otomatik tanımlayıcı">
                                        Slug
                                    </th>
                                    <th className="px-3 py-2" title="Değerin nasıl girileceği">Tip</th>
                                    <th className="px-3 py-2" title="Özelliğin ürüne mi varyanta mı ait olduğu">Kapsam</th>
                                    <th className="px-3 py-2" title="Tüm kategorilerde otomatik kullanılır mı">Global</th>
                                    <th className="px-3 py-2">Değer Sayısı</th>
                                    <th className="px-3 py-2">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-gray-500 py-6">
                                            Henüz özellik tanımlanmamış. "Yeni Özellik" ile başla.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((attr) => (
                                        <tr key={attr.id} className="border-b">
                                            <td className="px-3 py-2 font-medium">{attr.name}</td>
                                            <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                                                {attr.slug}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <span className="badge bg-info" title={TYPE_HINTS[attr.type]}>
                                                    {TYPE_LABELS[attr.type] ?? attr.type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <span
                                                    className="badge bg-secondary"
                                                    title={
                                                        attr.scope === 'variant'
                                                            ? 'Her varyant farklı değer alır'
                                                            : 'Tüm varyantlar aynı değeri paylaşır'
                                                    }
                                                >
                                                    {SCOPE_LABELS[attr.scope] ?? attr.scope}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {attr.is_global ? (
                                                    <span className="badge bg-success" title="Tüm kategorilerde otomatik görünür">
                                                        Evet
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-light text-dark" title="Sadece eşleşmiş kategorilerde görünür">
                                                        Hayır
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {attr.values?.length ?? 0}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex gap-2 justify-center">
                                                    {can('product_attribute.manage') && (
                                                        <Link
                                                            to={`/urun-attribute/${attr.id}`}
                                                            className="p-2 text-primary"
                                                            title="Düzenle ve değerleri yönet"
                                                        >
                                                            <IconEdit />
                                                        </Link>
                                                    )}
                                                    {can('product_attribute.manage') && (
                                                        <button
                                                            type="button"
                                                            className="p-2 text-red-500"
                                                            onClick={() => handleDelete(attr)}
                                                            title="Sil"
                                                        >
                                                            <IconTrashLines />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : null}

                {showTrashed && (
                    <div>
                        <div className="flex items-center justify-between mb-3 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                            <h6 className="font-semibold text-base text-amber-900">
                                Silinmiş Özellikler{' '}
                                <span className="text-amber-600 font-normal">({trashed.length})</span>
                            </h6>
                            <p className="text-xs text-amber-800">
                                Silinen özellikler burada listelenir. "Geri Yükle" ile tekrar aktifleştirebilirsin.
                            </p>
                        </div>

                        {trashLoading ? (
                            <p className="text-sm text-gray-500">Yükleniyor...</p>
                        ) : trashed.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 border rounded">
                                Silinmiş özellik yok.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-3 py-2 text-left">Ad</th>
                                            <th className="px-3 py-2 text-left">Slug</th>
                                            <th className="px-3 py-2">Tip</th>
                                            <th className="px-3 py-2">Kapsam</th>
                                            <th className="px-3 py-2">Silinme</th>
                                            <th className="px-3 py-2">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trashed.map((attr) => (
                                            <tr key={attr.id} className="border-b opacity-70">
                                                <td className="px-3 py-2 font-medium">{attr.name}</td>
                                                <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                                                    {attr.slug}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className="badge bg-light text-dark">
                                                        {TYPE_LABELS[attr.type] ?? attr.type}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <span className="badge bg-light text-dark">
                                                        {SCOPE_LABELS[attr.scope] ?? attr.scope}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-center text-xs text-gray-500">
                                                    {attr.deleted_at
                                                        ? new Date(attr.deleted_at).toLocaleString('tr-TR')
                                                        : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    {can('product_attribute.manage') && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-success"
                                                            onClick={() => handleRestore(attr)}
                                                        >
                                                            Geri Yükle
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductAttributeList;
