import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, NavLink } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { RoleService, UserItem, PermissionGroup as PermissionGroupType, RoleItem } from '../../api/services/RoleService';
import PermissionSidecar from '../../components/permission/PermissionSidecar';
import Swal from 'sweetalert2';

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Süper Admin',
    admin: 'Admin',
    editor: 'Editör',
};

const OperatorEdit = () => {
    const dispatch = useDispatch();
    const { id } = useParams<{ id: string }>();
    const userId = Number(id);

    const [user, setUser] = useState<UserItem | null>(null);
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroupType[]>([]);
    const [directPermissions, setDirectPermissions] = useState<string[]>([]);
    const [originalPermissions, setOriginalPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Operatör Düzenle'));
        const load = async () => {
            try {
                setLoading(true);
                const [userData, permsData, rolesData] = await Promise.all([
                    RoleService.getUser(userId),
                    RoleService.permissions(),
                    RoleService.roles(),
                ]);
                setUser(userData);
                setPermissionGroups(permsData);
                setRoles(rolesData);
                setDirectPermissions(userData.direct_permissions);
                setOriginalPermissions(userData.direct_permissions);
            } catch {
                Swal.fire({ icon: 'error', title: 'Hata', text: 'Kullanıcı bilgisi yüklenemedi.', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    const handleAssignRole = () => {
        if (!user) return;
        const roleOptions = roles.reduce((acc, r) => {
            acc[r.name] = ROLE_LABELS[r.name] || r.name;
            return acc;
        }, {} as Record<string, string>);

        Swal.fire({
            title: `${user.name} — Rol Değiştir`,
            input: 'select',
            inputOptions: roleOptions,
            inputValue: user.roles[0] || '',
            showCancelButton: true,
            confirmButtonText: 'Kaydet',
            cancelButtonText: 'İptal',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    await RoleService.assignRole(user.id, result.value);
                    Swal.fire({ icon: 'success', title: 'Rol Atandı', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
                    const updated = await RoleService.getUser(userId);
                    setUser(updated);
                } catch (error: any) {
                    const msg = error?.response?.data?.errors?.message || 'Rol atanamadı.';
                    Swal.fire({ icon: 'error', title: 'Hata', text: msg, confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
                }
            }
        });
    };

    const hasChanges = JSON.stringify([...directPermissions].sort()) !== JSON.stringify([...originalPermissions].sort());

    const handleSavePermissions = async () => {
        if (!hasChanges) return;
        try {
            setSaving(true);
            await RoleService.assignPermissions(userId, directPermissions);
            setOriginalPermissions([...directPermissions]);
            Swal.fire({ icon: 'success', title: 'Kaydedildi', text: 'Ek yetkiler güncellendi.', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
        } catch {
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Yetkiler güncellenemedi.', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
        } finally {
            setSaving(false);
        }
    };

    const initials = user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

    return (
        <div>
            {/* Breadcrumb */}
            <ul className="flex space-x-2 rtl:space-x-reverse mb-5">
                <li>
                    <NavLink to="/yetkilendirme/operatorler" className="text-primary hover:underline">
                        ← Operatörler
                    </NavLink>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-600 dark:text-gray-400">
                    Operatör Düzenle
                </li>
            </ul>

            {loading ? (
                <div className="flex items-center justify-center h-60">
                    <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-12 h-12 inline-block"></span>
                </div>
            ) : user ? (
                <>
                    {/* Kullanıcı Bilgi Kartı */}
                    <div className="panel mb-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {/* Avatar */}
                            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold shrink-0">
                                {initials}
                            </div>
                            {/* Bilgiler */}
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg font-semibold">{user.name}</h2>
                                    <span className="badge bg-primary">
                                        {ROLE_LABELS[user.roles[0]] || user.roles[0] || '—'}
                                    </span>
                                    <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                                        {user.is_active ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">{user.email}</div>
                            </div>
                            {/* Rol Değiştir */}
                            <button
                                className="btn btn-outline-primary btn-sm shrink-0"
                                onClick={handleAssignRole}
                            >
                                Rol Değiştir
                            </button>
                        </div>
                    </div>

                    {/* Ek Yetkiler */}
                    <div className="panel">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-base">Ek Yetkiler</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            Buradaki izinler kullanıcının rolüne ek olarak atanır.
                        </p>
                        <PermissionSidecar
                            groups={permissionGroups}
                            selected={directPermissions}
                            onChange={setDirectPermissions}
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                className="btn btn-primary"
                                onClick={handleSavePermissions}
                                disabled={!hasChanges || saving}
                            >
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="panel text-center py-16 text-gray-400">Kullanıcı bulunamadı.</div>
            )}
        </div>
    );
};

export default OperatorEdit;
