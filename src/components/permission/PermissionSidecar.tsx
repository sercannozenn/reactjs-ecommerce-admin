import { useState, useCallback, useRef, useEffect } from 'react';
import type { PermissionGroup } from '../../api/services/RoleService';
import AnimateHeight from 'react-animate-height';
import IconCaretDown from '../Icon/IconCaretDown';

const MODULE_LABELS: Record<string, string> = {
    categories: 'Kategori Yönetimi',
    brands: 'Marka Yönetimi',
    tags: 'Etiket Yönetimi',
    products: 'Ürün İşlemleri',
    discounts: 'İndirim Yönetimi',
    coupons: 'Kupon Yönetimi',
    orders: 'Sipariş Yönetimi',
    stock: 'Stok Yönetimi',
    sliders: 'Slider Yönetimi',
    announcements: 'Duyuru Yönetimi',
    settings: 'Site Ayarları',
    roles: 'Rol & Kullanıcı Yönetimi',
};

type Props = {
    groups: PermissionGroup[];
    selected: string[];
    onChange: (permissions: string[]) => void;
    inherited?: string[];
    roleName?: string;
    disabled?: boolean;
};

const PermissionSidecar = ({ groups, selected, onChange, inherited = [], roleName, disabled = false }: Props) => {
    const [activeGroup, setActiveGroup] = useState('');
    const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
    const [hinting, setHinting] = useState(true);

    const inheritedSet = new Set(inherited);

    useEffect(() => {
        if (!activeGroup && groups.length > 0) {
            setActiveGroup(groups[0].group);
        }
    }, [groups, activeGroup]);

    useEffect(() => {
        const t = setTimeout(() => setHinting(false), 1200);
        return () => clearTimeout(t);
    }, []);

    const toggle = useCallback((name: string) => {
        if (disabled || inheritedSet.has(name)) return;
        onChange(selected.includes(name) ? selected.filter(p => p !== name) : [...selected, name]);
    }, [selected, onChange, disabled, inherited]);

    const toggleModule = useCallback((modulePerms: string[]) => {
        if (disabled) return;
        const toggleable = modulePerms.filter(p => !inheritedSet.has(p));
        if (toggleable.length === 0) return;
        const allSelected = toggleable.every(p => selected.includes(p));
        if (allSelected) {
            onChange(selected.filter(p => !toggleable.includes(p)));
        } else {
            onChange([...new Set([...selected, ...toggleable])]);
        }
    }, [selected, onChange, disabled, inherited]);

    const toggleAccordion = (mod: string) => {
        setOpenModules(prev => ({ ...prev, [mod]: !prev[mod] }));
    };

    // Effective count: direct OR inherited
    const effectiveCount = (names: string[]) =>
        names.filter(p => selected.includes(p) || inheritedSet.has(p)).length;

    const allPermsInGroup = (g: PermissionGroup) =>
        g.modules.flatMap(m => m.permissions.map(p => p.name));

    const activeGroupData = groups.find(g => g.group === activeGroup);

    return (
        <div className="flex gap-0 border border-white-light dark:border-[#1b2e4b] rounded overflow-hidden">
            {/* Sol Sidecar Nav */}
            <div className="w-52 shrink-0 bg-white-light/30 dark:bg-dark/20 border-r border-white-light dark:border-[#1b2e4b]">
                {groups.map(g => {
                    const allPerms = allPermsInGroup(g);
                    const selCount = effectiveCount(allPerms);
                    const isActive = activeGroup === g.group;
                    return (
                        <button
                            key={g.group}
                            onClick={() => setActiveGroup(g.group)}
                            className={`w-full text-left px-4 py-3 text-sm border-b border-white-light dark:border-[#1b2e4b] transition-colors
                                ${isActive ? 'bg-primary text-white font-semibold' : 'hover:bg-primary/10 text-black dark:text-white-dark'}`}
                        >
                            <div>{g.group_label}</div>
                            {allPerms.length > 0 && (
                                <div className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                                    {selCount}/{allPerms.length} izin
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Sağ Panel — Accordion'lar */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[500px]">
                {!activeGroupData || activeGroupData.modules.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">Bu grupta henüz izin tanımlanmamış.</p>
                ) : (
                    activeGroupData.modules.map(mod => {
                        const names = mod.permissions.map(p => p.name);
                        const selCount = effectiveCount(names);
                        const isOpen = !!openModules[mod.module];

                        return (
                            <div key={mod.module} className="border border-white-light dark:border-[#1b2e4b] rounded">
                                <button
                                    onClick={() => toggleAccordion(mod.module)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 font-semibold text-sm hover:bg-primary/5 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <GroupCheckbox
                                            names={names}
                                            selected={selected}
                                            inherited={inherited}
                                            disabled={disabled}
                                            onToggle={() => toggleModule(names)}
                                        />
                                        <span>{MODULE_LABELS[mod.module] || mod.module}</span>
                                        <span className="text-xs text-gray-400 font-normal">{selCount}/{names.length}</span>
                                    </div>
                                    <IconCaretDown className={`transition-transform ${isOpen ? '' : '-rotate-90'} ${hinting && !isOpen ? 'animate-bounce' : ''}`} />
                                </button>
                                <AnimateHeight duration={200} height={isOpen ? 'auto' : 0}>
                                    <div className="px-4 pb-3 pt-1 space-y-1 border-t border-white-light dark:border-[#1b2e4b]">
                                        {mod.permissions.map(p => {
                                            const isInherited = inheritedSet.has(p.name);
                                            const isChecked = isInherited || selected.includes(p.name);
                                            return (
                                                <label
                                                    key={p.name}
                                                    className={`flex items-start gap-2 py-0.5 ${isInherited || disabled ? 'cursor-default' : 'cursor-pointer'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="form-checkbox mt-0.5 shrink-0"
                                                        checked={isChecked}
                                                        onChange={() => toggle(p.name)}
                                                        disabled={isInherited || disabled}
                                                    />
                                                    <span className="text-sm flex items-center gap-1.5 flex-wrap">
                                                        <span className={isInherited ? 'text-gray-400 dark:text-gray-500' : ''}>
                                                            {p.description}
                                                        </span>
                                                        {isInherited && (
                                                            <span className="relative group/tip inline-flex">
                                                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium leading-none whitespace-nowrap cursor-help">
                                                                    Rol
                                                                </span>
                                                                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 hidden group-hover/tip:block w-max max-w-[220px] rounded bg-gray-800 dark:bg-gray-700 px-2.5 py-1.5 text-xs text-white text-center shadow-lg whitespace-normal">
                                                                    {roleName
                                                                        ? `"${roleName}" rolünden geliyor. Kaldırmak için rolü düzenleyin.`
                                                                        : 'Bu izin kullanıcının rolünden geliyor. Kaldırmak için rolü düzenleyin.'}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </AnimateHeight>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const GroupCheckbox = ({
    names, selected, inherited, disabled, onToggle
}: { names: string[]; selected: string[]; inherited: string[]; disabled: boolean; onToggle: () => void }) => {
    const ref = useRef<HTMLInputElement>(null);
    const inheritedSet = new Set(inherited);

    const effective = names.filter(n => selected.includes(n) || inheritedSet.has(n));
    const toggleable = names.filter(n => !inheritedSet.has(n));
    const allEffective = effective.length === names.length;
    const indeterminate = effective.length > 0 && !allEffective;
    const allInherited = toggleable.length === 0;

    useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
        <input
            ref={ref}
            type="checkbox"
            className="form-checkbox shrink-0"
            checked={allEffective}
            onChange={(e) => { e.stopPropagation(); if (!allInherited) onToggle(); }}
            onClick={(e) => e.stopPropagation()}
            disabled={disabled || allInherited}
        />
    );
};

export default PermissionSidecar;
