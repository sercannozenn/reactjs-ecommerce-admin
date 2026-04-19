import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';

import { setPageTitle } from '../../store/themeConfigSlice';
import { SettingsService, SettingType } from '../../api/services/SettingsService';
import { useCan } from '../../utils/permissions';

// ─── Tema Önizlemeleri ─────────────────────────────────────────────────
// CSS-tabanlı minyatür mockup'lar. Gerçek screenshot yerine hızlı iterable.
// Classic: turuncu slider çubuğu + 4 ürün kartı ızgarası.
// Modern: siyah hero + sol turuncu accent + asimetrik ürün/kategori ızgarası.

const CLASSIC_PREVIEW = (
    <div className="w-full h-full flex flex-col">
        <div className="h-[35%] bg-gradient-to-r from-orange-200 via-orange-300 to-orange-200 flex items-center justify-center">
            <div className="w-10 h-1.5 bg-white/80 rounded" />
        </div>
        <div className="flex-1 grid grid-cols-4 gap-1.5 p-2 bg-white">
            <div className="bg-gray-100 border border-gray-200 rounded-sm" />
            <div className="bg-gray-100 border border-gray-200 rounded-sm" />
            <div className="bg-gray-100 border border-gray-200 rounded-sm" />
            <div className="bg-gray-100 border border-gray-200 rounded-sm" />
        </div>
    </div>
);

const MODERN_PREVIEW = (
    <div className="w-full h-full bg-black flex">
        <div className="w-1.5 bg-orange-500" />
        <div className="flex-1 flex flex-col p-2 gap-1.5">
            <div className="h-4 flex items-center gap-1.5">
                <div className="w-5 h-1 bg-orange-500 rounded" />
                <div className="w-12 h-1.5 bg-white/60 rounded" />
            </div>
            <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-1">
                <div className="col-span-2 row-span-2 bg-neutral-800 rounded-sm" />
                <div className="bg-orange-500/80 rounded-sm" />
                <div className="bg-neutral-700 rounded-sm" />
            </div>
        </div>
    </div>
);

interface ThemeOption {
    value: string;
    label: string;
    description: string;
    tags: string[];
    preview: React.ReactNode;
}

const THEME_OPTIONS: ThemeOption[] = [
    {
        value: 'classic',
        label: 'Klasik Tema',
        description: 'Geniş slider, yatay ürün swiper\'ı ve dikey duyuru zaman çizgisi. Mevcut varsayılan şablon.',
        tags: ['Varsayılan', 'Uyumlu', 'Slider'],
        preview: CLASSIC_PREVIEW,
    },
    {
        value: 'modern',
        label: 'Modern Tema',
        description: 'Siyah & turuncu minimal hero, asimetrik kategori ızgarası, koyu marka şeridi ve newsletter CTA.',
        tags: ['Yeni', 'Minimal', 'Asimetrik'],
        preview: MODERN_PREVIEW,
    },
];

interface ThemePickerProps {
    value: string;
    onChange: (newValue: string) => void;
    disabled?: boolean;
}

const ThemePicker: React.FC<ThemePickerProps> = ({ value, onChange, disabled }) => {
    const normalized = (value || 'classic').toLowerCase();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THEME_OPTIONS.map((opt) => {
                const active = normalized === opt.value;
                return (
                    <button
                        type="button"
                        key={opt.value}
                        disabled={disabled}
                        onClick={() => onChange(opt.value)}
                        className={`relative text-left rounded-lg border-2 transition-all overflow-hidden focus:outline-none
                            ${active
                                ? 'border-primary ring-2 ring-primary/30 shadow-lg'
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:shadow'}
                            ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {active && (
                            <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-white text-xs font-semibold shadow">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Aktif
                            </span>
                        )}
                        <div className="h-40 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            {opt.preview}
                        </div>
                        <div className="p-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="font-semibold text-base dark:text-white-light">{opt.label}</div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">
                                {opt.description}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {opt.tags.map((t) => (
                                    <span
                                        key={t}
                                        className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                            <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mt-3 uppercase tracking-wider">
                                value: {opt.value}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

// ─── Ana sayfa ─────────────────────────────────────────────────────────

const HomepageThemeSelector: React.FC = () => {
    const can = useCan();
    const dispatch = useDispatch();
    const isDisabled = !can('settings.update');

    const [setting, setSetting] = useState<SettingType | null>(null);
    const [selectedValue, setSelectedValue] = useState<string>('classic');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Anasayfa Teması'));
        fetchSetting();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSetting = async () => {
        try {
            setLoading(true);
            const groups = await SettingsService.listGroups();
            const found = groups
                .flatMap((g) => g.settings)
                .find((s) => s.key === 'homepage_theme') ?? null;

            setSetting(found);
            setSelectedValue(((found?.value as string | null) ?? 'classic').toString().toLowerCase());
        } catch (err) {
            console.error('homepage_theme ayarı okunamadı:', err);
            Swal.fire({
                title: 'Hata',
                text: 'Ayar yüklenemedi.',
                icon: 'error',
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' },
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!setting?.id) return;
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('value', selectedValue);
            await SettingsService.update(setting.id, fd);
            // Senkron okuma: kaydedilen değeri mevcut state'e yansıt ki dirty=false olsun.
            setSetting((prev) => (prev ? { ...prev, value: selectedValue } : prev));
            Swal.fire({
                title: 'Kaydedildi!',
                text: 'Anasayfa teması başarıyla güncellendi. Storefront kullanıcıları sayfa yenilediğinde anında, aksi halde en geç 1 dakika içinde yeni temayı görecek.',
                icon: 'success',
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' },
            });
        } catch {
            Swal.fire({
                title: 'Hata!',
                text: 'Tema kaydedilemedi.',
                icon: 'error',
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' },
            });
        } finally {
            setSaving(false);
        }
    };

    const currentPersistedValue = ((setting?.value as string | null) ?? 'classic').toString().toLowerCase();
    const isDirty = currentPersistedValue !== selectedValue;

    return (
        <div className="space-y-3">
            {/* Başlık panel */}
            <div className="panel">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                        <h5 className="font-semibold text-lg dark:text-white-light">Anasayfa Teması</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Storefront <code className="text-xs px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800">/</code> rotasında hangi şablonun gösterileceğini seçin. Değişiklik kaydedildikten sonra storefront önbelleği yenilendiğinde yansır.
                        </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 inline-flex items-center gap-1.5">
                        Storefront önizleme rotası:
                        <code className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">/anasayfa-v2</code>
                    </span>
                </div>
            </div>

            {/* Seçici panel */}
            <div className="panel">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
                ) : !setting ? (
                    <div className="text-center py-12">
                        <div className="text-gray-500 mb-2">
                            <code>homepage_theme</code> ayarı bulunamadı.
                        </div>
                        <div className="text-xs text-gray-400">
                            Çözüm: <code>php artisan db:seed --class=SettingsSeeder</code>
                        </div>
                    </div>
                ) : (
                    <>
                        <ThemePicker
                            value={selectedValue}
                            disabled={isDisabled}
                            onChange={setSelectedValue}
                        />

                        {can('settings.update') && (
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
                                <div className="text-sm">
                                    {isDirty ? (
                                        <span className="inline-flex items-center gap-2 text-warning font-medium">
                                            <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                                            Kaydedilmemiş değişiklik — aktif tema: <code className="text-xs">{currentPersistedValue}</code>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <span className="w-2 h-2 rounded-full bg-success" />
                                            Kayıtlı tema: <code className="text-xs">{currentPersistedValue}</code>
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    disabled={!isDirty || saving}
                                    onClick={handleSave}
                                >
                                    {saving ? 'Kaydediliyor...' : 'Temayı Kaydet'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default HomepageThemeSelector;
