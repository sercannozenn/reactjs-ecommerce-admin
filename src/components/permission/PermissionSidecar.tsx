import { useState, useCallback, useRef, useEffect } from 'react';
import type { PermissionGroup } from '../../api/services/RoleService';
import AnimateHeight from 'react-animate-height';
import IconCaretDown from '../Icon/IconCaretDown';

// Frontend-only hiyerarşi haritası
const HIERARCHY: Array<{ key: string; label: string; modules: string[] }> = [
    { key: 'catalog',  label: 'Katalog Yönetimi',       modules: ['categories', 'brands', 'tags'] },
    { key: 'product',  label: 'Ürün & Satış',           modules: ['products', 'discounts'] },
    { key: 'content',  label: 'İçerik Yönetimi',        modules: ['sliders', 'announcements'] },
    { key: 'site',     label: 'Site Yönetimi',          modules: ['settings'] },
    { key: 'auth',     label: 'Kimlik & Yetkilendirme', modules: ['roles'] },
];

const MODULE_LABELS: Record<string, string> = {
    categories: 'Kategori Yönetimi',
    brands: 'Marka Yönetimi',
    tags: 'Etiket Yönetimi',
    products: 'Ürün İşlemleri',
    discounts: 'İndirim Yönetimi',
    sliders: 'Slider Yönetimi',
    announcements: 'Duyuru Yönetimi',
    settings: 'Site Ayarları',
    roles: 'Rol & Kullanıcı Yönetimi',
};

type Props = {
    groups: PermissionGroup[];
    selected: string[];
    onChange: (permissions: string[]) => void;
    disabled?: boolean;
};

const PermissionSidecar = ({ groups, selected, onChange, disabled = false }: Props) => {
    const [activeGroup, setActiveGroup] = useState(HIERARCHY[0].key);
    const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
    const [hinting, setHinting] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setHinting(false), 1200);
        return () => clearTimeout(t);
    }, []);

    const toggle = useCallback((name: string) => {
        if (disabled) return;
        onChange(selected.includes(name) ? selected.filter(p => p !== name) : [...selected, name]);
    }, [selected, onChange, disabled]);

    const toggleModule = useCallback((modulePerms: string[]) => {
        if (disabled) return;
        const allSelected = modulePerms.every(p => selected.includes(p));
        if (allSelected) {
            onChange(selected.filter(p => !modulePerms.includes(p)));
        } else {
            onChange([...new Set([...selected, ...modulePerms])]);
        }
    }, [selected, onChange, disabled]);

    const toggleAccordion = (mod: string) => {
        setOpenModules(prev => ({ ...prev, [mod]: !prev[mod] }));
    };

    const activeHierarchy = HIERARCHY.find(h => h.key === activeGroup)!;
    const activeGroups = groups.filter(g => activeHierarchy.modules.includes(g.module));

    // Üst grup için seçili izin sayısı
    const groupSelectedCount = (modules: string[]) => {
        const allPerms = groups
            .filter(g => modules.includes(g.module))
            .flatMap(g => g.permissions.map(p => p.name));
        return allPerms.filter(p => selected.includes(p)).length;
    };
    const groupTotalCount = (modules: string[]) => {
        return groups
            .filter(g => modules.includes(g.module))
            .flatMap(g => g.permissions).length;
    };

    return (
        <div className="flex gap-0 border border-white-light dark:border-[#1b2e4b] rounded overflow-hidden">
            {/* Sol Sidecar Nav */}
            <div className="w-52 shrink-0 bg-white-light/30 dark:bg-dark/20 border-r border-white-light dark:border-[#1b2e4b]">
                {HIERARCHY.map(h => {
                    const selCount = groupSelectedCount(h.modules);
                    const totCount = groupTotalCount(h.modules);
                    const isActive = activeGroup === h.key;
                    return (
                        <button
                            key={h.key}
                            onClick={() => setActiveGroup(h.key)}
                            className={`w-full text-left px-4 py-3 text-sm border-b border-white-light dark:border-[#1b2e4b] transition-colors
                                ${isActive ? 'bg-primary text-white font-semibold' : 'hover:bg-primary/10 text-black dark:text-white-dark'}`}
                        >
                            <div>{h.label}</div>
                            {totCount > 0 && (
                                <div className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                                    {selCount}/{totCount} izin
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Sağ Panel — Accordion'lar */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[500px]">
                {activeGroups.length === 0 && (
                    <p className="text-sm text-gray-400 py-4 text-center">Bu grupta henüz izin tanımlanmamış.</p>
                )}
                {activeGroups.map(group => {
                    const names = group.permissions.map(p => p.name);
                    const selCount = names.filter(n => selected.includes(n)).length;
                    const isOpen = !!openModules[group.module]; // default closed

                    return (
                        <div key={group.module} className="border border-white-light dark:border-[#1b2e4b] rounded">
                            <button
                                onClick={() => toggleAccordion(group.module)}
                                className="w-full flex items-center justify-between px-4 py-2.5 font-semibold text-sm hover:bg-primary/5 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <GroupCheckbox
                                        names={names}
                                        selected={selected}
                                        disabled={disabled}
                                        onToggle={() => toggleModule(names)}
                                    />
                                    <span>{MODULE_LABELS[group.module] || group.module}</span>
                                    <span className="text-xs text-gray-400 font-normal">{selCount}/{names.length}</span>
                                </div>
                                <IconCaretDown className={`transition-transform ${isOpen ? '' : '-rotate-90'} ${hinting && !isOpen ? 'animate-bounce' : ''}`} />
                            </button>
                            <AnimateHeight duration={200} height={isOpen ? 'auto' : 0}>
                                <div className="px-4 pb-3 pt-1 space-y-1 border-t border-white-light dark:border-[#1b2e4b]">
                                    {group.permissions.map(p => (
                                        <label
                                            key={p.name}
                                            className={`flex items-start gap-2 py-0.5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="form-checkbox mt-0.5 shrink-0"
                                                checked={selected.includes(p.name)}
                                                onChange={() => toggle(p.name)}
                                                disabled={disabled}
                                            />
                                            <span className="text-sm">{p.description}</span>
                                        </label>
                                    ))}
                                </div>
                            </AnimateHeight>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Grup başlık checkbox — indeterminate destekli
const GroupCheckbox = ({
    names, selected, disabled, onToggle
}: { names: string[]; selected: string[]; disabled: boolean; onToggle: () => void }) => {
    const ref = useRef<HTMLInputElement>(null);
    const selCount = names.filter(n => selected.includes(n)).length;
    const allSel = selCount === names.length;
    const indeterminate = selCount > 0 && !allSel;

    useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
        <input
            ref={ref}
            type="checkbox"
            className="form-checkbox shrink-0"
            checked={allSel}
            onChange={(e) => { e.stopPropagation(); onToggle(); }}
            onClick={(e) => e.stopPropagation()}
            disabled={disabled}
        />
    );
};

export default PermissionSidecar;
