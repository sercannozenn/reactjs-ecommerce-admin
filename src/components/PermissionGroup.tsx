import { useCallback, useRef, useEffect } from 'react';
import type { PermissionGroup as PermissionGroupType } from '../api/services/RoleService';

type Props = {
    groups: PermissionGroupType[];
    selected: string[];
    onChange: (permissions: string[]) => void;
    disabled?: boolean;
};

const MODULE_LABELS: Record<string, string> = {
    categories: 'Kategoriler',
    brands: 'Markalar',
    tags: 'Etiketler',
    products: 'Ürünler',
    discounts: 'İndirimler',
    sliders: 'Sliderlar',
    announcements: 'Duyurular',
    settings: 'Ayarlar',
    roles: 'Roller & Kullanıcılar',
};

const PermissionGroup = ({ groups, selected, onChange, disabled = false }: Props) => {
    const toggle = useCallback(
        (name: string) => {
            if (disabled) return;
            onChange(selected.includes(name) ? selected.filter((p) => p !== name) : [...selected, name]);
        },
        [selected, onChange, disabled]
    );

    const toggleGroup = useCallback(
        (groupPermissions: string[]) => {
            if (disabled) return;
            const allSelected = groupPermissions.every((p) => selected.includes(p));
            if (allSelected) {
                onChange(selected.filter((p) => !groupPermissions.includes(p)));
            } else {
                const merged = new Set([...selected, ...groupPermissions]);
                onChange([...merged]);
            }
        },
        [selected, onChange, disabled]
    );

    return (
        <div className="space-y-4">
            {groups.map((group) => {
                const names = group.permissions.map((p) => p.name);
                const selectedCount = names.filter((n) => selected.includes(n)).length;
                const allSelected = selectedCount === names.length;
                const indeterminate = selectedCount > 0 && !allSelected;

                return (
                    <div key={group.module} className="rounded border border-white-light dark:border-[#1b2e4b] p-3">
                        <GroupHeader
                            label={MODULE_LABELS[group.module] || group.module}
                            checked={allSelected}
                            indeterminate={indeterminate}
                            disabled={disabled}
                            onChange={() => toggleGroup(names)}
                        />
                        <div className="mt-2 ml-6 space-y-1">
                            {group.permissions.map((p) => (
                                <label key={p.name} className={`flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input
                                        type="checkbox"
                                        className="form-checkbox"
                                        checked={selected.includes(p.name)}
                                        onChange={() => toggle(p.name)}
                                        disabled={disabled}
                                    />
                                    <span className="text-sm">{p.description}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Grup başlığı — indeterminate state için ref gerekli
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
        <label className={`flex items-center gap-2 font-semibold text-base ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <input ref={ref} type="checkbox" className="form-checkbox" checked={checked} onChange={onChange} disabled={disabled} />
            {label}
        </label>
    );
};

export default PermissionGroup;
