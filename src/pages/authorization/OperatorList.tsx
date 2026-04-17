import { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { RoleService, UserItem, RoleItem } from '../../api/services/RoleService';
import Swal from 'sweetalert2';

const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Süper Admin',
    admin: 'Admin',
    editor: 'Editör',
};

const OperatorList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [users, setUsers] = useState<UserItem[]>([]);
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, per_page: 15, current_page: 1, last_page: 1 });
    const [refreshKey, setRefreshKey] = useState(0);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('Sistem Kullanıcıları'));
        RoleService.roles().then(setRoles).catch(() => {});
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params: Record<string, string | number> = { page };
                if (debouncedSearch) params.search = debouncedSearch;
                if (roleFilter) params.role = roleFilter;
                if (statusFilter) params.status = statusFilter;

                const result = await RoleService.fetchUsers(params);
                setUsers(result.data);
                setMeta(result.meta);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [page, debouncedSearch, roleFilter, statusFilter, refreshKey]);

    const handleChangeStatus = (user: UserItem) => {
        const action = user.is_active ? 'pasife almak' : 'aktif etmek';
        Swal.fire({
            icon: 'warning',
            title: user.name,
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
                    setRefreshKey(k => k + 1);
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
            title: user.name,
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

    const pageNumbers = () => {
        const pages: number[] = [];
        for (let i = 1; i <= meta.last_page; i++) pages.push(i);
        return pages;
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse mb-5">
                <li className="font-semibold text-primary">Sistem Kullanıcıları</li>
            </ul>

            <div className="panel mt-4">
                {/* Filtre Paneli */}
                <div className="flex flex-wrap items-end gap-3 mb-5">
                    <div className="flex-1 min-w-[180px]">
                        <label className="block text-xs font-semibold mb-1 text-gray-500">Ad / E-posta Ara</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ara..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="min-w-[150px]">
                        <label className="block text-xs font-semibold mb-1 text-gray-500">Rol</label>
                        <select
                            className="form-select"
                            value={roleFilter}
                            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">Tümü</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.name}>{ROLE_LABELS[r.name] || r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-[130px]">
                        <label className="block text-xs font-semibold mb-1 text-gray-500">Durum</label>
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">Tümü</option>
                            <option value="1">Aktif</option>
                            <option value="0">Pasif</option>
                        </select>
                    </div>
                </div>

                {/* Tablo */}
                <div className="table-responsive">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block"></span>
                        </div>
                    ) : (
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
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-400">Kayıt bulunamadı.</td>
                                    </tr>
                                )}
                                {users.map(user => (
                                    <tr key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                                        <td className="font-semibold">{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className="badge bg-primary">
                                                {ROLE_LABELS[user.roles[0]] || user.roles[0] || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                {user.is_active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                <button
                                                    className="btn btn-sm btn-outline-info"
                                                    onClick={() => navigate(`/yetkilendirme/operatorler/${user.id}`)}
                                                >
                                                    Düzenle
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-warning"
                                                    onClick={() => handleChangeStatus(user)}
                                                >
                                                    Durum
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleForceLogout(user)}
                                                >
                                                    Otur. Kapat
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
                        <span className="text-sm text-gray-500">
                            Toplam {meta.total} kayıt — Sayfa {meta.current_page}/{meta.last_page}
                        </span>
                        <div className="flex gap-1 flex-wrap">
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                Önceki
                            </button>
                            {pageNumbers().map(n => (
                                <button
                                    key={n}
                                    className={`btn btn-sm ${n === page ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setPage(n)}
                                >
                                    {n}
                                </button>
                            ))}
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                disabled={page >= meta.last_page}
                            >
                                Sonraki
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OperatorList;
