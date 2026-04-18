import { useCallback, useRef, useEffect } from 'react';
import type { PermissionModule as PermissionGroupType } from '../api/services/RoleService';

type Props = {
    groups: PermissionGroupType[];
    selected: string[];
    onChange: (permissions: string[]) => void;
    inherited?: string[];
    roleName?: string;
    disabled?: boolean;
};

const MODULE_LABELS: Record<string, string> = {
    categories: 'Kategoriler',
    brands: 'Markalar',
    tags: 'Etiketler',
    products: 'Ürünler',
    discounts: 'İndirimler',
    coupons: 'Kuponlar',
    orders: 'Siparişler',
    stock: 'Stok',
    sliders: 'Sliderlar',
    announcements: 'Duyurular',
    settings: 'Ayarlar',
    roles: 'Roller & Kullanıcılar',
};

const PermissionGroup = ({ groups, selected, onChange, inherited = [], roleName, disabled = false }: Props) => {
    const inheritedSet = new Set(inherited);

    const toggle = useCallback(
        (name: string) => {
            if (disabled || inheritedSet.has(name)) return;
            onChange(selected.includes(name) ? selected.filter((p) => p !== name) : [...selected, name]);
        },
        [selected, onChange, disabled, inherited]
    );

    const toggleGroup = useCallback(
        (groupPermissions: string[]) => {
            if (disabled) return;
            const toggleable = groupPermissions.filter(p => !inheritedSet.has(p));
            if (toggleable.length === 0) return;
            const allSelected = toggleable.every((p) => selected.includes(p));
            if (allSelected) {
                onChange(selected.filter((p) => !toggleable.includes(p)));
            } else {
                onChange([...new Set([...selected, ...toggleable])]);
            }
        },
        [selected, onChange, disabled, inherited]
    );

    return (
        <div className="space-y-4">
            {groups.map((group) => {
                const names = group.permissions.map((p) => p.name);
                const effectiveCount = names.filter(n => selected.includes(n) || inheritedSet.has(n)).length;
                const allEffective = effectiveCount === names.length;
                const indeterminate = effectiveCount > 0 && !allEffective;
                const allInherited = names.every(n => inheritedSet.has(n));

                return (
                    <div key={group.module} className="rounded border border-white-light dark:border-[#1b2e4b] p-3">
                        <GroupHeader
                            label={MODULE_LABELS[group.module] || group.module}
                            checked={allEffective}
                            indeterminate={indeterminate}
                            disabled={disabled || allInherited}
                            onChange={() => toggleGroup(names)}
                        />
                        <div className="mt-2 ml-6 space-y-1">
                            {group.permissions.map((p) => {
                                const isInherited = inheritedSet.has(p.name);
                                const isChecked = isInherited || selected.includes(p.name);
                                return (
                                    <label
                                        key={p.name}
                                        className={`flex items-center gap-2 ${isInherited || disabled ? 'cursor-default' : 'cursor-pointer'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-checkbox"
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
                    </div>
                );
            })}
        </div>
    );
};

const GroupHeader = ({
    label,
    checked,
    indeterminate,
    disabled,
    onChange,
}: {
    label: string;
    checked: boolean;
    indeterminate: boolean;
    disabled: boolean;
    onChange: () => void;
}) => {
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    return (
        <label className={`flex items-center gap-2 font-semibold text-base ${disabled ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}>
            <input ref={ref} type="checkbox" className="form-checkbox" checked={checked} onChange={onChange} disabled={disabled} />
            {label}
        </label>
    );
};

export default PermissionGroup;
