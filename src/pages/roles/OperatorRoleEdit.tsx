import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, NavLink } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { RoleService, RoleDetail, PermissionGroup as PermissionGroupType } from '../../api/services/RoleService';
import PermissionSidecar from '../../components/permission/PermissionSidecar';
import Swal from 'sweetalert2';

const OperatorRoleEdit = () => {
    const dispatch = useDispatch();
    const { id } = useParams<{ id: string }>();
    const roleId = Number(id);

    const [role, setRole] = useState<RoleDetail | null>(null);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroupType[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [original, setOriginal] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Rol Düzenle'));
        const load = async () => {
            setLoading(true);
            try {
                const [roleData, permsData] = await Promise.all([
                    RoleService.getRole(roleId),
                    RoleService.permissions(),
                ]);
                setRole(roleData);
                setPermissionGroups(permsData);
                const perms = roleData.permissions;
                setSelected(perms);
                setOriginal(perms);
            } catch {
                Swal.fire({ icon: 'error', title: 'Hata', text: 'Rol bilgisi yüklenemedi.', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [roleId]);

    const isSuperAdmin = role?.name === 'super_admin';
    const hasChanges = JSON.stringify([...selected].sort()) !== JSON.stringify([...original].sort());

    const handleSave = async () => {
        if (!hasChanges || isSuperAdmin) return;
        setSaving(true);
        try {
            await RoleService.updateRolePermissions(roleId, selected);
            setOriginal([...selected]);
            Swal.fire({ icon: 'success', title: 'Kaydedildi', text: 'Rol yetkileri güncellendi.', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
        } catch {
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Yetkiler güncellenemedi.', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            {/* Breadcrumb */}
            <ul className="flex space-x-2 rtl:space-x-reverse mb-5">
                <li>
                    <NavLink to="/roller/operatorler" className="text-primary hover:underline">
                        ← Operatör Rolleri
                    </NavLink>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-600 dark:text-gray-400">
                    Rol Düzenle
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center h-60">
                    <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-12 h-12 inline-block"></span>
                </div>
            ) : role ? (
                <div className="panel">
                    {/* Rol Adı */}
                    <div className="mb-5">
                        <label className="block text-sm font-semibold mb-1">Rol Adı</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                className="form-input max-w-xs"
                                value={role.name}
                                disabled
                            />
                            {isSuperAdmin && (
                                <span className="badge bg-info">Sistem Rolü</span>
                            )}
                        </div>
                        {isSuperAdmin && (
                            <p className="text-sm text-info mt-2">
                                Süper admin rolü tüm yetkilere sahiptir ve düzenlenemez.
                            </p>
                        )}
                    </div>

                    {/* İzinler */}
                    <div className="mb-5">
                        <h3 className="font-semibold text-base mb-3">İzinler</h3>
                        <PermissionSidecar
                            groups={permissionGroups}
                            selected={selected}
                            onChange={setSelected}
                            disabled={isSuperAdmin}
                        />
                    </div>

                    {/* Kaydet Butonu */}
                    {!isSuperAdmin && (
                        <div className="flex justify-end">
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={!hasChanges || saving}
                            >
                                {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="panel text-center py-16 text-gray-400">Rol bulunamadı.</div>
            )}
        </div>
    );
};

export default OperatorRoleEdit;
