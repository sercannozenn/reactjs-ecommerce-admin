import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import { SettingsService, SettingGroupType, SettingType } from '../../api/services/SettingsService';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { useCan } from '../../utils/permissions';
import { useDropzone } from 'react-dropzone';
import IconPlus from '../../components/Icon/IconPlus';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconPencil from '../../components/Icon/IconPencil';
import IconInfoCircle from '../../components/Icon/IconInfoCircle';
import IconLockDots from '../../components/Icon/IconLockDots';

// ------- File Field (2-kolon: dropzone sol, önizleme sağ) -------

interface FileFieldProps {
    setting: SettingType;
    onFileChange: (id: number, file: File | null) => void;
    pendingFile: File | null;
}

const FileField: React.FC<FileFieldProps> = ({ setting, onFileChange, pendingFile }) => {
    const [preview, setPreview] = useState<string | null>(setting.value_url ?? null);

    const onDrop = (accepted: File[]) => {
        const f = accepted[0];
        if (!f) return;
        onFileChange(setting.id!, f);
        setPreview(URL.createObjectURL(f));
    };

    const handleRemove = () => {
        onFileChange(setting.id!, null);
        setPreview(null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'] },
    });

    return (
        <div className="grid grid-cols-2 gap-4 items-start">
            {/* Sol: dropzone */}
            <div>
                <div
                    {...getRootProps()}
                    className="border-dashed border-2 border-gray-300 dark:border-gray-600 p-4 rounded-md cursor-pointer text-sm text-center hover:border-primary transition-colors min-h-[80px] flex flex-col items-center justify-center gap-1"
                >
                    <input {...getInputProps()} />
                    {isDragActive ? (
                        <p className="text-primary">Dosyayı bırakın...</p>
                    ) : (
                        <>
                            <p className="text-gray-400 dark:text-gray-500 text-xs">
                                {pendingFile ? (
                                    <span className="text-primary font-medium">{pendingFile.name}</span>
                                ) : (
                                    'Tıklayın veya sürükleyin'
                                )}
                            </p>
                            <p className="text-gray-300 dark:text-gray-600 text-xs">JPG, PNG, SVG, ICO • max 2MB</p>
                        </>
                    )}
                </div>
            </div>

            {/* Sağ: önizleme */}
            <div className="flex flex-col items-center justify-center min-h-[80px]">
                {preview ? (
                    <div className="relative inline-block">
                        <img
                            src={preview}
                            alt={setting.label ?? setting.key}
                            className="max-h-24 max-w-full object-contain rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 p-1"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                            title="Görseli kaldır"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <div className="text-gray-300 dark:text-gray-600 text-xs text-center">Önizleme yok</div>
                )}
            </div>
        </div>
    );
};

// "homepage_theme" ayarı bu listede göstermiyoruz; ayrı bir sayfa (HomepageThemeSelector)
// tile picker deneyimiyle yönetiyor. Filtre SettingsList render bloğunda uygulanıyor.

// ------- Description inline edit -------

interface DescriptionFieldProps {
    setting: SettingType;
    onSaved: (id: number, description: string) => void;
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ setting, onSaved }) => {
    const can = useCan();
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(setting.description ?? '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('description', value);
            await SettingsService.update(setting.id!, fd);
            onSaved(setting.id!, value);
            setEditing(false);
        } catch {
            Swal.fire({ title: 'Hata', text: 'Açıklama kaydedilemedi.', icon: 'error', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
        } finally {
            setSaving(false);
        }
    };

    if (editing) {
        return (
            <div className="mt-2 flex flex-col gap-1">
                <textarea
                    className="form-textarea w-full text-xs"
                    rows={2}
                    maxLength={255}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Bu ayar ne için kullanılır?"
                    autoFocus
                />
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-primary py-0.5 px-2 text-xs"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-0.5 px-2 text-xs"
                        onClick={() => { setEditing(false); setValue(setting.description ?? ''); }}
                    >
                        İptal
                    </button>
                </div>
            </div>
        );
    }

    if (setting.description) {
        return (
            <div className="mt-1.5 flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400 group/desc">
                <IconInfoCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-400 dark:text-blue-500" />
                <span className="leading-relaxed flex-1">{setting.description}</span>
                {can('settings.update') && (
                    <button
                        type="button"
                        className="opacity-0 group-hover/desc:opacity-100 transition-opacity text-gray-400 hover:text-primary ml-1 flex-shrink-0"
                        onClick={() => setEditing(true)}
                        title="Açıklamayı düzenle"
                    >
                        <IconPencil className="w-3 h-3" />
                    </button>
                )}
            </div>
        );
    }

    if (can('settings.update')) {
        return (
            <button
                type="button"
                className="mt-1 text-xs text-gray-300 dark:text-gray-600 hover:text-primary dark:hover:text-primary transition-colors"
                onClick={() => setEditing(true)}
            >
                + Açıklama ekle
            </button>
        );
    }

    return null;
};

// ------- Grup başlığı çevirisi -------

const GROUP_LABELS: Record<string, string> = {
    site_identity: 'Site Kimliği',
    contact: 'İletişim',
    social_media: 'Sosyal Medya',
    whatsapp: 'WhatsApp',
    footer: 'Footer',
    seo: 'SEO',
    about: 'Hakkımızda',
};

const groupLabel = (group: string) =>
    GROUP_LABELS[group] ?? group.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

// ------- Ana bileşen -------

type DirtyValues = Record<number, string | File | null>;
type DirtyFiles = Record<number, File | null>;

const SettingsList = () => {
    const can = useCan();
    const isSuperAdmin = useSelector((state: IRootState) => state.auth.user?.roles?.includes('super_admin') ?? false);
    const dispatch = useDispatch();
    const navigateToRoute = useRouteNavigator();

    const [groups, setGroups] = useState<SettingGroupType[]>([]);
    const [loading, setLoading] = useState(false);
    const [dirtyValues, setDirtyValues] = useState<DirtyValues>({});
    const [dirtyFiles, setDirtyFiles] = useState<DirtyFiles>({});
    const [savingGroup, setSavingGroup] = useState<string | null>(null);
    // Başta tüm gruplar kapalı
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const data = await SettingsService.listGroups();
            setGroups(data);
        } catch (error) {
            console.error('Ayar grupları alınamadı:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Ayarlar'));
        fetchGroups();
    }, []);

    const toggleGroup = (group: string) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(group)) next.delete(group);
            else next.add(group);
            return next;
        });
    };

    const handleValueChange = (setting: SettingType, newValue: string) => {
        setDirtyValues((prev) => ({ ...prev, [setting.id!]: newValue }));
    };

    const handleFileChange = (id: number, file: File | null) => {
        setDirtyFiles((prev) => ({ ...prev, [id]: file }));
    };

    const handleDescriptionSaved = (id: number, description: string) => {
        setGroups((prev) =>
            prev.map((g) => ({
                ...g,
                settings: g.settings.map((s) =>
                    s.id === id ? { ...s, description } : s
                ),
            }))
        );
    };

    const handleSaveGroup = async (group: SettingGroupType) => {
        const settingIds = group.settings.map((s) => s.id!);
        const changed = group.settings.filter((s) => {
            return s.id! in dirtyValues || s.id! in dirtyFiles;
        });

        if (changed.length === 0) {
            Swal.fire({ title: 'Bilgi', text: 'Değişiklik yapılmadı.', icon: 'info', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
            return;
        }

        setSavingGroup(group.group);
        try {
            for (const setting of changed) {
                const id = setting.id!;
                const payload = new FormData();

                if (setting.type === 'file') {
                    const file = dirtyFiles[id];
                    if (file) payload.append('value', file);
                } else {
                    const val = id in dirtyValues ? String(dirtyValues[id] ?? '') : String(setting.value ?? '');
                    payload.append('value', val);
                }

                await SettingsService.update(id, payload);
            }

            const cleanDirtyValues = { ...dirtyValues };
            const cleanDirtyFiles = { ...dirtyFiles };
            settingIds.forEach((id) => { delete cleanDirtyValues[id]; delete cleanDirtyFiles[id]; });
            setDirtyValues(cleanDirtyValues);
            setDirtyFiles(cleanDirtyFiles);

            await fetchGroups();

            Swal.fire({ title: 'Kaydedildi!', text: 'Grup ayarları başarıyla güncellendi.', icon: 'success', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
        } catch {
            Swal.fire({ title: 'Hata!', text: 'Ayarlar kaydedilemedi.', icon: 'error', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
        } finally {
            setSavingGroup(null);
        }
    };

    const handleDelete = (setting: SettingType) => {
        if (setting.is_protected) return;
        Swal.fire({
            title: 'Ayar Sil',
            text: `"${setting.label ?? setting.key}" ayarını kalıcı olarak silmek istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'Hayır',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (result.value) {
                try {
                    await SettingsService.delete(setting.id!);
                    await fetchGroups();
                    Swal.fire({ title: 'Silindi!', text: `"${setting.label ?? setting.key}" ayarı silindi.`, icon: 'success', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
                } catch {
                    Swal.fire({ title: 'Hata!', text: 'Ayar silinemedi.', icon: 'error', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
                }
            }
        });
    };

    const renderField = (setting: SettingType) => {
        const currentValue = setting.id! in dirtyValues
            ? String(dirtyValues[setting.id!] ?? '')
            : String(setting.value ?? '');

        const isDisabled = !can('settings.update');

        switch (setting.type) {
            case 'text':
                return (
                    <textarea
                        className="form-textarea w-full"
                        rows={3}
                        value={currentValue}
                        disabled={isDisabled}
                        onChange={(e) => handleValueChange(setting, e.target.value)}
                    />
                );

            case 'boolean':
                return (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={currentValue === '1' || currentValue === 'true'}
                            disabled={isDisabled}
                            onChange={(e) => handleValueChange(setting, e.target.checked ? '1' : '0')}
                        />
                        <span className="text-sm">{currentValue === '1' || currentValue === 'true' ? 'Evet' : 'Hayır'}</span>
                    </label>
                );

            case 'integer':
                return (
                    <input
                        type="number"
                        className="form-input w-full"
                        value={currentValue}
                        disabled={isDisabled}
                        onChange={(e) => handleValueChange(setting, e.target.value)}
                    />
                );

            case 'file':
                return (
                    <FileField
                        setting={setting}
                        onFileChange={handleFileChange}
                        pendingFile={dirtyFiles[setting.id!] ?? null}
                    />
                );

            default:
                return (
                    <input
                        type="text"
                        className="form-input w-full"
                        value={currentValue}
                        disabled={isDisabled}
                        onChange={(e) => handleValueChange(setting, e.target.value)}
                    />
                );
        }
    };

    return (
        <div className="space-y-3">
            {/* Başlık + Eylemler */}
            <div className="panel">
                <div className="flex justify-between items-center">
                    <h5 className="font-semibold text-lg dark:text-white-light">Ayarlar</h5>
                    <div className="flex gap-2">
                        {can('settings.update') && (
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => navigateToRoute('SettingsGroupOrder')}
                            >
                                Grup Sırasını Düzenle
                            </button>
                        )}
                        {can('settings.update') && (
                            <button
                                type="button"
                                className="btn btn-primary btn-sm gap-2"
                                onClick={() => navigateToRoute('SettingsAdd')}
                            >
                                <IconPlus />
                                Yeni Ekle
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loading && (
                <div className="panel flex items-center justify-center py-12">
                    <span className="text-gray-500">Yükleniyor...</span>
                </div>
            )}

            {/* Accordion gruplar */}
            {!loading && groups.map((group) => {
                const isOpen = openGroups.has(group.group);
                // homepage_theme ayrı sayfada yönetiliyor; bu listede gizli.
                const visibleSettings = group.settings.filter((s) => s.key !== 'homepage_theme');
                const hasDirty = visibleSettings.some((s) => s.id! in dirtyValues || s.id! in dirtyFiles);

                return (
                    <div key={group.group} className="panel overflow-hidden">
                        {/* Grup başlığı — tıklanabilir */}
                        <button
                            type="button"
                            className="w-full flex items-center justify-between text-left"
                            onClick={() => toggleGroup(group.group)}
                        >
                            <div className="flex items-center gap-2">
                                <h6 className="font-semibold text-base dark:text-white-light">
                                    {groupLabel(group.group)}
                                </h6>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {visibleSettings.length} ayar
                                </span>
                                {hasDirty && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-warning/20 text-warning">
                                        Kaydedilmemiş değişiklik
                                    </span>
                                )}
                            </div>
                            <IconCaretDown
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Accordion içerik */}
                        {isOpen && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {/* site_identity grubu için özel yönlendirme: Anasayfa Teması */}
                                {group.group === 'site_identity' && (
                                    <div className="mb-4 flex items-center justify-between gap-3 p-3 rounded-md bg-primary/5 border border-primary/20 dark:bg-primary/10">
                                        <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                                            <IconInfoCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                                            <span>
                                                <strong className="dark:text-white-light">Anasayfa Teması</strong> bu listede gösterilmez —
                                                görsel tile picker ile seçmek için ayrı sayfayı kullanın.
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary btn-sm whitespace-nowrap"
                                            onClick={() => navigateToRoute('HomepageThemeSelector')}
                                        >
                                            Tema Seçimi →
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {visibleSettings.map((setting) => (
                                        <div key={setting.id} className="flex flex-col gap-1">
                                            {/* Label + sil butonu */}
                                            <div className="flex items-center justify-between">
                                                <label className="font-medium text-sm dark:text-white-light flex items-center gap-1">
                                                    {setting.label ?? setting.key}
                                                </label>
                                                {setting.is_protected && !isSuperAdmin ? (
                                                <span title="Korumalı ayar — yalnızca Süper Admin silebilir" className="text-gray-300 dark:text-gray-600 cursor-default">
                                                    <IconLockDots className="w-4 h-4" />
                                                </span>
                                            ) : can('settings.delete') ? (
                                                <button
                                                    type="button"
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                    onClick={() => handleDelete(setting)}
                                                    title={setting.is_protected ? 'Korumalı ayarı sil (Süper Admin)' : 'Ayarı sil'}
                                                >
                                                    <IconXCircle className="w-4 h-4" />
                                                </button>
                                            ) : null}
                                            </div>

                                            {/* Key */}
                                            <p className="text-xs font-mono text-gray-400 dark:text-gray-500">{setting.key}</p>

                                            {/* Değer alanı */}
                                            {renderField(setting)}

                                            {/* Description */}
                                            <DescriptionField
                                                setting={setting}
                                                onSaved={handleDescriptionSaved}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {can('settings.update') && (
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="button"
                                            className="btn btn-success btn-sm"
                                            disabled={savingGroup === group.group}
                                            onClick={() => handleSaveGroup(group)}
                                        >
                                            {savingGroup === group.group ? 'Kaydediliyor...' : 'Grubu Kaydet'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {!loading && groups.length === 0 && (
                <div className="panel text-center py-12 text-gray-500">
                    Henüz ayar grubu bulunamadı.
                </div>
            )}
        </div>
    );
};

export default SettingsList;
