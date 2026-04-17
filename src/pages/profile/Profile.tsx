import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';
import { setPageTitle } from '../../store/themeConfigSlice';
import { setUser, updateProfile } from '../../store/slices/auth/authSlice';
import { IRootState } from '../../store';
import {
    ProfileService,
    SessionItem,
} from '../../api/services/ProfileService';

type ProfileFormState = {
    name: string;
    email: string;
};

type PasswordFormState = {
    current_password: string;
    password: string;
    password_confirmation: string;
};

type ApiErrorResponse = {
    message?: string;
    errors?: Record<string, string[]>;
};

const emptyPasswordForm: PasswordFormState = {
    current_password: '',
    password: '',
    password_confirmation: '',
};

const Profile = () => {
    const dispatch = useDispatch();
    const currentUser = useSelector((state: IRootState) => state.auth.user);

    const [profileForm, setProfileForm] = useState<ProfileFormState>({
        name: '',
        email: '',
    });
    const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSubmitting, setProfileSubmitting] = useState(false);

    const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm);
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);

    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Profilim'));
    }, [dispatch]);

    const loadProfile = async () => {
        setProfileLoading(true);
        try {
            const data = await ProfileService.fetch();
            setProfileForm({ name: data.name ?? '', email: data.email ?? '' });

            if (currentUser) {
                dispatch(
                    setUser({
                        ...currentUser,
                        id: data.id,
                        name: data.name,
                        email: data.email,
                        is_active: data.is_active,
                        roles: data.roles ?? [],
                        permissions: data.permissions ?? [],
                    }),
                );
            } else {
                dispatch(
                    setUser({
                        id: data.id,
                        name: data.name,
                        email: data.email,
                        is_active: data.is_active,
                        roles: data.roles ?? [],
                        permissions: data.permissions ?? [],
                    }),
                );
            }
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>;
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Profil bilgileri alınamadı.',
                confirmButtonText: 'Tamam',
                padding: '2em',
                customClass: { popup: 'sweet-alerts' },
            });
        } finally {
            setProfileLoading(false);
        }
    };

    const loadSessions = async () => {
        setSessionsLoading(true);
        try {
            const data = await ProfileService.listSessions();
            setSessions(Array.isArray(data) ? data : []);
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>;
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: err.response?.data?.message || 'Aktif oturumlar yüklenemedi.',
                confirmButtonText: 'Tamam',
                padding: '2em',
                customClass: { popup: 'sweet-alerts' },
            });
        } finally {
            setSessionsLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
        loadSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
        if (profileErrors[name]) {
            setProfileErrors((prev) => ({ ...prev, [name]: [] }));
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProfileErrors({});
        setProfileSubmitting(true);
        try {
            await ProfileService.update({
                name: profileForm.name,
                email: profileForm.email,
            });

            dispatch(
                updateProfile({
                    name: profileForm.name,
                    email: profileForm.email,
                }),
            );

            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: 'Profil bilgileriniz güncellendi.',
                confirmButtonText: 'Tamam',
                padding: '2em',
                customClass: { popup: 'sweet-alerts' },
            });
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>;
            if (err.response?.status === 422 && err.response.data?.errors) {
                setProfileErrors(err.response.data.errors);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text:
                        err.response?.data?.message ||
                        'Profil güncellenirken bir hata oluştu.',
                    confirmButtonText: 'Tamam',
                    padding: '2em',
                    customClass: { popup: 'sweet-alerts' },
                });
            }
        } finally {
            setProfileSubmitting(false);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
        if (passwordErrors[name]) {
            setPasswordErrors((prev) => ({ ...prev, [name]: [] }));
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPasswordErrors({});
        setPasswordSubmitting(true);
        try {
            await ProfileService.changePassword(passwordForm);
            setPasswordForm(emptyPasswordForm);
            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: 'Şifreniz başarıyla değiştirildi.',
                confirmButtonText: 'Tamam',
                padding: '2em',
                customClass: { popup: 'sweet-alerts' },
            });
        } catch (error) {
            const err = error as AxiosError<ApiErrorResponse>;
            if (err.response?.status === 422) {
                if (err.response.data?.errors) {
                    setPasswordErrors(err.response.data.errors);
                } else if (err.response.data?.message) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Hata!',
                        text: err.response.data.message,
                        confirmButtonText: 'Tamam',
                        padding: '2em',
                        customClass: { popup: 'sweet-alerts' },
                    });
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text:
                        err.response?.data?.message ||
                        'Şifre değiştirme sırasında bir hata oluştu.',
                    confirmButtonText: 'Tamam',
                    padding: '2em',
                    customClass: { popup: 'sweet-alerts' },
                });
            }
        } finally {
            setPasswordSubmitting(false);
        }
    };

    const handleDeleteSession = (session: SessionItem) => {
        Swal.fire({
            icon: 'warning',
            title: 'Oturum Sonlandır',
            text: `"${session.name}" oturumunu sonlandırmak istediğinize emin misiniz?`,
            showCancelButton: true,
            confirmButtonText: 'Evet, Sonlandır',
            cancelButtonText: 'Vazgeç',
            padding: '2em',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (!result.value) {
                return;
            }
            try {
                await ProfileService.deleteSession(session.id);
                setSessions((prev) => prev.filter((s) => s.id !== session.id));
                Swal.fire({
                    icon: 'success',
                    title: 'Sonlandırıldı!',
                    text: 'Oturum sonlandırıldı.',
                    confirmButtonText: 'Tamam',
                    customClass: { popup: 'sweet-alerts' },
                });
            } catch (error) {
                const err = error as AxiosError<ApiErrorResponse>;
                const message =
                    err.response?.data?.message || 'Oturum sonlandırılamadı.';
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: message,
                    confirmButtonText: 'Tamam',
                    customClass: { popup: 'sweet-alerts' },
                });
            }
        });
    };

    const handleDeleteOtherSessions = () => {
        Swal.fire({
            icon: 'warning',
            title: 'Diğer Oturumları Sonlandır',
            text:
                'Bu cihaz dışındaki tüm oturumlarınız sonlandırılacak. Devam etmek istiyor musunuz?',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sonlandır',
            cancelButtonText: 'Vazgeç',
            padding: '2em',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (!result.value) {
                return;
            }
            try {
                await ProfileService.deleteOtherSessions();
                await loadSessions();
                Swal.fire({
                    icon: 'success',
                    title: 'Sonlandırıldı!',
                    text: 'Diğer tüm oturumlar sonlandırıldı.',
                    confirmButtonText: 'Tamam',
                    customClass: { popup: 'sweet-alerts' },
                });
            } catch (error) {
                const err = error as AxiosError<ApiErrorResponse>;
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text:
                        err.response?.data?.message ||
                        'Oturumlar sonlandırılamadı.',
                    confirmButtonText: 'Tamam',
                    padding: '2em',
                    customClass: { popup: 'sweet-alerts' },
                });
            }
        });
    };

    const formatDate = (value: string | null): string => {
        if (!value) {
            return '-';
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return value;
        }
        return date.toLocaleString('tr-TR');
    };

    const hasOtherSessions = sessions.some((s) => !s.is_current);

    return (
        <div className="space-y-6">
            {/* Profil Bilgileri */}
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        Profil Bilgileri
                    </h5>
                </div>
                <form
                    className="grid xl:grid-cols-2 gap-6 grid-cols-1"
                    onSubmit={handleProfileSubmit}
                >
                    <div className="mb-5">
                        <label htmlFor="name">Ad Soyad *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="form-input"
                            placeholder="Ad Soyad"
                            value={profileForm.name}
                            onChange={handleProfileChange}
                            disabled={profileLoading}
                            required
                        />
                        {profileErrors.name && (
                            <p className="text-red-500 text-xs mt-1">
                                {profileErrors.name[0]}
                            </p>
                        )}
                    </div>
                    <div className="mb-5">
                        <label htmlFor="email">E-posta *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-input"
                            placeholder="E-posta"
                            value={profileForm.email}
                            onChange={handleProfileChange}
                            disabled={profileLoading}
                            required
                        />
                        {profileErrors.email && (
                            <p className="text-red-500 text-xs mt-1">
                                {profileErrors.email[0]}
                            </p>
                        )}
                    </div>
                    <div className="col-span-2">
                        <hr className="my-3 border-gray-300" />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-info hover:btn-success"
                                disabled={profileSubmitting || profileLoading}
                            >
                                {profileSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Şifre Değiştir */}
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        Şifre Değiştir
                    </h5>
                </div>
                <form
                    className="grid xl:grid-cols-3 gap-6 grid-cols-1"
                    onSubmit={handlePasswordSubmit}
                >
                    <div className="mb-5">
                        <label htmlFor="current_password">Mevcut Şifre *</label>
                        <input
                            type="password"
                            id="current_password"
                            name="current_password"
                            className="form-input"
                            autoComplete="current-password"
                            value={passwordForm.current_password}
                            onChange={handlePasswordChange}
                            required
                        />
                        {passwordErrors.current_password && (
                            <p className="text-red-500 text-xs mt-1">
                                {passwordErrors.current_password[0]}
                            </p>
                        )}
                    </div>
                    <div className="mb-5">
                        <label htmlFor="password">Yeni Şifre *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input"
                            autoComplete="new-password"
                            value={passwordForm.password}
                            onChange={handlePasswordChange}
                            required
                        />
                        {passwordErrors.password && (
                            <p className="text-red-500 text-xs mt-1">
                                {passwordErrors.password[0]}
                            </p>
                        )}
                    </div>
                    <div className="mb-5">
                        <label htmlFor="password_confirmation">
                            Yeni Şifre (Tekrar) *
                        </label>
                        <input
                            type="password"
                            id="password_confirmation"
                            name="password_confirmation"
                            className="form-input"
                            autoComplete="new-password"
                            value={passwordForm.password_confirmation}
                            onChange={handlePasswordChange}
                            required
                        />
                        {passwordErrors.password_confirmation && (
                            <p className="text-red-500 text-xs mt-1">
                                {passwordErrors.password_confirmation[0]}
                            </p>
                        )}
                    </div>
                    <div className="col-span-full">
                        <hr className="my-3 border-gray-300" />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-info hover:btn-success"
                                disabled={passwordSubmitting}
                            >
                                {passwordSubmitting
                                    ? 'Güncelleniyor...'
                                    : 'Şifreyi Güncelle'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Aktif Oturumlar */}
            <div className="panel">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        Aktif Oturumlar
                    </h5>
                    <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleDeleteOtherSessions}
                        disabled={sessionsLoading || !hasOtherSessions}
                    >
                        Tüm Diğer Oturumları Sonlandır
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="table-striped">
                        <thead>
                            <tr>
                                <th>Cihaz / Token Adı</th>
                                <th>Oluşturulma</th>
                                <th>Son Kullanım</th>
                                <th className="!text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessionsLoading ? (
                                <tr>
                                    <td colSpan={4} className="text-center">
                                        Yükleniyor...
                                    </td>
                                </tr>
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center">
                                        Aktif oturum bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                sessions.map((session) => (
                                    <tr key={session.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span>{session.name || '-'}</span>
                                                {session.is_current && (
                                                    <span className="badge bg-success text-white">
                                                        Bu cihaz
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{formatDate(session.created_at)}</td>
                                        <td>{formatDate(session.last_used_at)}</td>
                                        <td className="text-right">
                                            {!session.is_current && (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => handleDeleteSession(session)}
                                                >
                                                    Sonlandır
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Profile;
