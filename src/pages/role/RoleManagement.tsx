import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { RoleService, PermissionGroup as PermissionGroupType, RoleItem, UserItem } from '../../api/services/RoleService';
import PermissionGroup from '../../components/PermissionGroup';
import Swal from 'sweetalert2';

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Süper Admin',
    admin: 'Admin',
    editor: 'Editör',
};

const RoleManagement = () => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');

    // Roller
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroupType[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    // Kullanıcılar
    const [users, setUsers] = useState<UserItem[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

    // Kullanıcıya özel permission modal
    const [permModalUser, setPermModalUser] = useState<UserItem | null>(null);
    const [userPermissions, setUserPermissions] = useState<string[]>([]);

    useEffect(() => {
        dispatch(setPageTitle('Rol & Yetki Yönetimi'));
        fetchRolesAndPermissions();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
    }, [activeTab]);

    const fetchRolesAndPermissions = async () => {
        try {
            setLoading(true);
            const [rolesData, permsData] = await Promise.all([RoleService.roles(), RoleService.permissions()]);
            setRoles(rolesData);
            setPermissionGroups(permsData);
            if (rolesData.length > 0 && !selectedRoleId) {
                setSelectedRoleId(rolesData[0].id);
                setSelectedPermissions(rolesData[0].permissions.map((p) => p.name));
            }
        } catch (error) {
            console.error('Rol/permission verisi alınamadı:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const data = await RoleService.users();
            setUsers(data);
        } catch (error) {
            console.error('Kullanıcı listesi alınamadı:', error);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleRoleSelect = (role: RoleItem) => {
        setSelectedRoleId(role.id);
        setSelectedPermissions(role.permissions.map((p) => p.name));
    };

    const selectedRole = roles.find((r) => r.id === selectedRoleId);
    const isSuperAdmin = selectedRole?.name === 'super_admin';

    const handleSavePermissions = async () => {
        if (!selectedRoleId || isSuperAdmin) return;
        try {
            setSaving(true);
            await RoleService.updateRolePermissions(selectedRoleId, selectedPermissions);
            Swal.fire({ icon: 'success', title: 'Kaydedildi', text: 'Rol yetkileri güncellendi.', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
            await fetchRolesAndPermissions();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Yetkiler güncellenemedi.', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
        } finally {
            setSaving(false);
        }
    };

    // --- Kullanıcı aksiyonları ---
    const handleAssignRole = (user: UserItem) => {
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
                    fetchUsers();
                } catch (error: any) {
                    const msg = error?.response?.data?.errors?.message || 'Rol atanamadı.';
                    Swal.fire({ icon: 'error', title: 'Hata', text: msg, confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
                }
            }
        });
    };

    const handleChangeStatus = (user: UserItem) => {
        const action = user.is_active ? 'pasife almak' : 'aktif etmek';
        Swal.fire({
            icon: 'warning',
            title: `${user.name}`,
            text: `Bu kullanıcıyı ${action} istediğinize emin misiniz?`,
            showCancelButton: true,
            confirmButtonText: 'Evet',
            cancelButtonText: 'Hayır',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await RoleService.changeStatus(user.id);
                    Swal.fire({ icon: 'success', title: 'Güncellendi', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
                    fetchUsers();
                } catch (error: any) {
                    const msg = error?.response?.data?.errors?.message || 'İşlem başarısız.';
                    Swal.fire({ icon: 'error', title: 'Hata', text: msg, confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
                }
            }
        });
    };

    const handleForceLogout = (user: UserItem) => {
        Swal.fire({
            icon: 'warning',
            title: `${user.name}`,
            text: 'Tüm oturumları sonlandırılsın mı?',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sonlandır',
            cancelButtonText: 'İptal',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await RoleService.forceLogout(user.id);
                    Swal.fire({ icon: 'success', title: 'Oturumlar Sonlandırıldı', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
                } catch {
                    Swal.fire({ icon: 'error', title: 'Hata', text: 'İşlem başarısız.', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
                }
            }
        });
    };

    const openPermissionModal = (user: UserItem) => {
        setPermModalUser(user);
        setUserPermissions(user.direct_permissions);
    };

    const handleSaveUserPermissions = async () => {
        if (!permModalUser) return;
        try {
            await RoleService.assignPermissions(permModalUser.id, userPermissions);
            Swal.fire({ icon: 'success', title: 'Kaydedildi', text: 'Özel yetkiler güncellendi.', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
            setPermModalUser(null);
            fetchUsers();
        } catch {
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Yetkiler güncellenemedi.', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
        }
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-5">
                <li className="font-semibold text-primary">Rol & Yetki Yönetimi</li>
            </ul>

            {/* Tab header */}
            <div className="mb-5 flex gap-2">
                <button className={`btn ${activeTab === 'roles' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('roles')}>
                    Roller
                </button>
                <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('users')}>
                    Kullanıcılar
                </button>
            </div>

            {/* ---- ROLLER SEKME ---- */}
            {activeTab === 'roles' && (
                <div className="panel">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block"></span>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-5">
                            {/* Sol — Rol seçimi */}
                            <div className="lg:w-1/4 space-y-2">
                                <h3 className="font-semibold text-lg mb-3">Roller</h3>
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        className={`w-full text-left px-4 py-2 rounded border ${
                                            selectedRoleId === role.id ? 'bg-primary text-white border-primary' : 'border-white-light dark:border-[#1b2e4b] hover:bg-primary/10'
                                        }`}
                                        onClick={() => handleRoleSelect(role)}
                                    >
                                        {ROLE_LABELS[role.name] || role.name}
                                    </button>
                                ))}
                            </div>

                            {/* Sag — Permission listesi */}
                            <div className="lg:w-3/4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-lg">{ROLE_LABELS[selectedRole?.name || ''] || selectedRole?.name} — Yetkiler</h3>
                                    {!isSuperAdmin && (
                                        <button className="btn btn-primary" onClick={handleSavePermissions} disabled={saving}>
                                            {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                        </button>
                                    )}
                                </div>

                                {isSuperAdmin && (
                                    <div className="bg-info-light text-info rounded p-3 mb-4 text-sm">
                                        Süper admin rolü tüm yetkilere sahiptir ve düzenlenemez.
                                    </div>
                                )}

                                <PermissionGroup groups={permissionGroups} selected={selectedPermissions} onChange={setSelectedPermissions} disabled={isSuperAdmin} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ---- KULLANICILAR SEKME ---- */}
            {activeTab === 'users' && (
                <div className="panel">
                    {usersLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block"></span>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table-striped">
                                <thead>
                                    <tr>
                                        <th>Ad</th>
                                        <th>E-posta</th>
                                        <th>Rol</th>
                                        <th>Durum</th>
                                        <th className="text-center">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className="badge bg-primary">{ROLE_LABELS[user.roles[0]] || user.roles[0]}</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                    {user.is_active ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-center gap-2">
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleAssignRole(user)}>
                                                        Rol
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-info" onClick={() => openPermissionModal(user)}>
                                                        Yetkiler
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-warning" onClick={() => handleChangeStatus(user)}>
                                                        {user.is_active ? 'Pasif' : 'Aktif'}
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleForceLogout(user)}>
                                                        Oturumları Kapat
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ---- KULLANICI PERMISSION MODAL ---- */}
            {permModalUser && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPermModalUser(null)}>
                    <div className="bg-white dark:bg-[#0e1726] rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-semibold text-lg mb-4">{permModalUser.name} — Ek Yetkiler</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Burada atanan yetkiler, kullanıcının rolünden bağımsız olarak ek olarak verilir.
                        </p>

                        <PermissionGroup groups={permissionGroups} selected={userPermissions} onChange={setUserPermissions} />

                        <div className="flex justify-end gap-2 mt-5">
                            <button className="btn btn-outline-danger" onClick={() => setPermModalUser(null)}>
                                İptal
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveUserPermissions}>
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagement;
