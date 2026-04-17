import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { RoleService, RoleItem, UserItem } from '../../api/services/RoleService';
import Swal from 'sweetalert2';

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Süper Admin',
    admin: 'Admin',
    editor: 'Editör',
};

const OperatorRoleList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Yeni rol modal
    const [showModal, setShowModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Sistem Kullanıcı Rolleri'));
        const load = async () => {
            setLoading(true);
            try {
                const [rolesData, usersResult] = await Promise.all([
                    RoleService.roles(),
                    RoleService.fetchUsers({ per_page: 1000 } as any),
                ]);
                setRoles(rolesData);
                setUsers(usersResult.data);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [refreshKey]);

    const getUserCount = (roleName: string) => {
        return users.filter(u => u.roles.includes(roleName)).length;
    };

    const handleCreate = async () => {
        if (!newRoleName.trim()) return;
        setCreating(true);
        try {
            await RoleService.createRole(newRoleName.trim());
            setShowModal(false);
            setNewRoleName('');
            setRefreshKey(k => k + 1);
            Swal.fire({ icon: 'success', title: 'Rol Oluşturuldu', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
        } catch (error: any) {
            const msg = error?.response?.data?.errors?.message || 'Rol oluşturulamadı.';
            Swal.fire({ icon: 'error', title: 'Hata', text: msg, confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = (role: RoleItem) => {
        Swal.fire({
            icon: 'warning',
            title: 'Rolü Sil',
            text: `"${ROLE_LABELS[role.name] || role.name}" rolünü silmek istediğinize emin misiniz?`,
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await RoleService.deleteRole(role.id);
                    setRefreshKey(k => k + 1);
                    Swal.fire({ icon: 'success', title: 'Silindi', confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
                } catch (error: any) {
                    const msg = error?.response?.data?.errors?.message || 'Rol silinemedi.';
                    Swal.fire({ icon: 'error', title: 'Hata', text: msg, confirmButtonText: 'Tamam', customClass: { popup: 'sweet-alerts' } });
                }
            }
        });
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-5">
                <li className="font-semibold text-primary">Sistem Kullanıcı Rolleri</li>
            </ul>

            <div className="panel mt-4">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Roller</h5>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => { setShowModal(true); setNewRoleName(''); }}
                    >
                        + Yeni Rol Oluştur
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block"></span>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table-striped">
                            <thead>
                                <tr>
                                    <th>Rol Adı</th>
                                    <th>İzin Sayısı</th>
                                    <th>Atanmış Kullanıcı</th>
                                    <th className="text-center">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map(role => (
                                    <tr key={role.id}>
                                        <td className="font-semibold">
                                            {ROLE_LABELS[role.name] || role.name}
                                            {role.name === 'super_admin' && (
                                                <span className="badge bg-info ml-2 text-xs">Sistem Rolü</span>
                                            )}
                                        </td>
                                        <td>{role.permissions.length}</td>
                                        <td>{getUserCount(role.name)}</td>
                                        <td>
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    className="btn btn-sm btn-outline-info"
                                                    onClick={() => navigate(`/roller/operatorler/${role.id}`)}
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(role)}
                                                    disabled={role.name === 'super_admin'}
                                                    title={role.name === 'super_admin' ? 'Sistem rolü silinemez' : undefined}
                                                >
                                                    Sil
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

            {/* Yeni Rol Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#0e1726] rounded-lg w-full max-w-md p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="font-semibold text-lg mb-4">Yeni Rol Oluştur</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold mb-1">Rol Adı</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="ornek_rol"
                                value={newRoleName}
                                onChange={e => setNewRoleName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                            />
                            <p className="text-xs text-gray-400 mt-1">Harf, rakam, boşluk ve tire kullanabilirsiniz.</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                className="btn btn-outline-danger"
                                onClick={() => setShowModal(false)}
                            >
                                İptal
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreate}
                                disabled={!newRoleName.trim() || creating}
                            >
                                {creating ? 'Oluşturuluyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperatorRoleList;
