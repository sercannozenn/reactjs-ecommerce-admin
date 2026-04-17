/**
 * SettingsGroupOrder.tsx
 * Grup sıralama ekranı — react-sortablejs (sortablejs) kullanılmaktadır.
 * Proje package.json: "react-sortablejs": "^6.1.4", "sortablejs": "^1.15.0"
 */
import React, { useEffect, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { SettingsService, SettingGroupType } from '../../api/services/SettingsService';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { useCan } from '../../utils/permissions';

type SortableGroup = SettingGroupType & { id: string };

const groupLabel = (group: string) => {
    const map: Record<string, string> = {
        site_identity: 'Site Kimliği',
        contact: 'İletişim',
        social: 'Sosyal Medya',
        seo: 'SEO',
        footer: 'Footer',
    };
    return map[group] ?? group.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const SettingsGroupOrder = () => {
    const can = useCan();
    const dispatch = useDispatch();
    const navigateToRoute = useRouteNavigator();

    const [items, setItems] = useState<SortableGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const data = await SettingsService.listGroups();
            // react-sortablejs her öğenin benzersiz "id" alanına ihtiyaç duyar
            const withIds: SortableGroup[] = data.map((g) => ({ ...g, id: g.group }));
            setItems(withIds);
        } catch {
            Swal.fire('Hata', 'Gruplar yüklenemedi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Grup Sırasını Düzenle'));
        fetchGroups();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const groups = items.map((item, index) => ({
                group: item.group,
                order: index + 1,
            }));
            await SettingsService.reorderGroups(groups);
            Swal.fire({
                title: 'Kaydedildi!',
                text: 'Grup sırası güncellendi.',
                icon: 'success',
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' },
            });
        } catch {
            Swal.fire({
                title: 'Hata!',
                text: 'Sıralama kaydedilemedi.',
                icon: 'error',
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' },
            });
        } finally {
            setSaving(false);
        }
    };

    if (!can('settings.update')) {
        return (
            <div className="panel">
                <p className="text-red-500">Bu sayfayı görüntüleme yetkiniz yok.</p>
            </div>
        );
    }

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-6">
                <h5 className="font-semibold text-lg dark:text-white-light">Grup Sırasını Düzenle</h5>
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => navigateToRoute('SettingsList')}
                >
                    Geri Dön
                </button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12 text-gray-500">
                    Yükleniyor...
                </div>
            )}

            {!loading && (
                <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Grupları sürükleyerek sıralayın, ardından "Kaydet" butonuna tıklayın.
                    </p>

                    <ReactSortable
                        list={items}
                        setList={setItems}
                        animation={200}
                        handle=".drag-handle"
                        className="space-y-2"
                    >
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#1b2e4b] rounded-md border border-gray-200 dark:border-gray-700 cursor-default select-none"
                            >
                                <span
                                    className="drag-handle cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 text-lg"
                                    title="Sürükle"
                                >
                                    ⠿
                                </span>
                                <span className="text-sm font-medium w-6 text-gray-400 dark:text-gray-500 text-right">{index + 1}.</span>
                                <span className="font-medium dark:text-white-light">{groupLabel(item.group)}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{item.group}</span>
                            </div>
                        ))}
                    </ReactSortable>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            className="btn btn-success"
                            disabled={saving}
                            onClick={handleSave}
                        >
                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SettingsGroupOrder;
