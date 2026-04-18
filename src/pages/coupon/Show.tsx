import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { DataTable } from 'mantine-datatable';

import { setPageTitle } from '../../store/themeConfigSlice';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { useCan } from '../../utils/permissions';
import { couponService } from '../../api/services/couponService';
import { CouponShowResponse } from '../../types/coupon';

import IconEdit from '../../components/Icon/IconEdit';
import IconArrowLeft from '../../components/Icon/IconArrowLeft';

const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return Number(value).toLocaleString('tr-TR', {
        style: 'currency',
        currency: 'TRY',
    });
};

const formatDate = (value: string | null | undefined): string => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('tr-TR');
};

const CouponShow = () => {
    const dispatch = useDispatch();
    const { id } = useParams<{ id: string }>();
    const navigateToRoute = useRouteNavigator();
    const can = useCan();

    const [loading, setLoading] = useState(true);
    const [payload, setPayload] = useState<CouponShowResponse | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('Kupon Detayı'));
    }, [dispatch]);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true);
            try {
                const response = await couponService.show(id);
                setPayload(response);
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: 'Kupon bilgisi alınamadı.',
                    confirmButtonText: 'Tamam',
                    customClass: { popup: 'sweet-alerts' },
                });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const coupon = payload?.coupon;
    const stats = payload?.stats;
    const usages = payload?.usages ?? [];

    const renderStatusBadge = () => {
        if (!coupon) return null;
        if (!coupon.is_active) return <span className="badge bg-slate-400">Pasif</span>;
        if (coupon.is_expired) return <span className="badge bg-danger">Süresi Dolmuş</span>;
        if (coupon.is_not_started) return <span className="badge bg-warning">Başlamadı</span>;
        return <span className="badge bg-success">Aktif</span>;
    };

    if (loading) {
        return (
            <div className="panel mt-6">
                <p>Yükleniyor...</p>
            </div>
        );
    }

    if (!coupon) {
        return (
            <div className="panel mt-6">
                <p>Kupon bulunamadı.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-2 mt-6 mb-3">
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => navigateToRoute('CouponList')}
                >
                    <IconArrowLeft className="w-4 h-4" />
                    Listeye Dön
                </button>
                {can('coupons.update') && (
                    <button
                        type="button"
                        className="btn btn-info btn-sm ml-auto"
                        onClick={() => navigateToRoute('CouponEdit', { id: coupon.id })}
                    >
                        <IconEdit className="w-4 h-4" />
                        Düzenle
                    </button>
                )}
            </div>

            {/* Bilgi + İstatistik grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kupon bilgileri */}
                <div className="panel lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">Kupon Bilgileri</h5>
                        {renderStatusBadge()}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-gray-400">Kod</span>
                            <p className="font-mono font-bold tracking-widest text-lg">{coupon.code}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Tip</span>
                            <p>
                                {coupon.type === 'percentage' ? (
                                    <span className="badge bg-info">Yüzde (%)</span>
                                ) : (
                                    <span className="badge bg-primary">Sabit Tutar (₺)</span>
                                )}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Değer</span>
                            <p className="font-semibold">
                                {coupon.type === 'percentage'
                                    ? `%${coupon.value}`
                                    : formatCurrency(coupon.value)}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Maksimum İndirim</span>
                            <p>{formatCurrency(coupon.max_discount_amount)}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Minimum Sepet Tutarı</span>
                            <p>{formatCurrency(coupon.min_cart_amount)}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Başlangıç</span>
                            <p>{formatDate(coupon.starts_at)}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Bitiş</span>
                            <p>{formatDate(coupon.ends_at)}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Toplam Kullanım Limiti</span>
                            <p>{coupon.usage_limit ?? 'Sınırsız'}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Müşteri Başına Limit</span>
                            <p>{coupon.per_user_limit ?? 'Sınırsız'}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Kalan Kullanım</span>
                            <p>
                                {coupon.remaining_usage === null || coupon.remaining_usage === undefined
                                    ? 'Sınırsız'
                                    : coupon.remaining_usage}
                            </p>
                        </div>
                        {coupon.description && (
                            <div className="sm:col-span-2">
                                <span className="text-xs text-gray-400">Açıklama</span>
                                <p className="mt-1">{coupon.description}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-xs text-gray-400">Oluşturulma</span>
                            <p>{formatDate(coupon.created_at)}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Son Güncelleme</span>
                            <p>{formatDate(coupon.updated_at)}</p>
                        </div>
                    </div>
                </div>

                {/* İstatistik */}
                <div className="panel">
                    <h5 className="font-semibold text-lg dark:text-white-light mb-5">İstatistikler</h5>
                    <div className="space-y-4">
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                            <span className="text-xs text-gray-400">Toplam Kullanım</span>
                            <p className="text-2xl font-bold text-primary">
                                {stats?.total_usage_count ?? 0}
                            </p>
                        </div>
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                            <span className="text-xs text-gray-400">Toplam İndirim</span>
                            <p className="text-2xl font-bold text-success">
                                {formatCurrency(stats?.total_discount_amount ?? 0)}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Ortalama İndirim</span>
                            <p className="text-2xl font-bold text-info">
                                {formatCurrency(stats?.average_discount_amount ?? 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kullanım tablosu */}
            <div className="panel mt-6">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Son Kullanımlar</h5>
                    <span className="text-xs text-gray-400">{usages.length} kayıt</span>
                </div>

                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={usages}
                        columns={[
                            { accessor: 'id', title: 'ID', width: 60 },
                            {
                                accessor: 'customer_name',
                                title: 'Müşteri',
                                render: (record) => record?.customer_name ?? '-',
                            },
                            {
                                accessor: 'order_number',
                                title: 'Sipariş No',
                                render: (record) => record?.order_number ?? '-',
                            },
                            {
                                accessor: 'discount_amount',
                                title: 'İndirim Tutarı',
                                render: (record) => formatCurrency(record?.discount_amount),
                            },
                            {
                                accessor: 'used_at',
                                title: 'Kullanım Tarihi',
                                render: (record) => formatDate(record?.used_at),
                            },
                        ]}
                        highlightOnHover
                        minHeight={150}
                        noRecordsText="Henüz kullanım kaydı yok."
                    />
                </div>
            </div>
        </div>
    );
};

export default CouponShow;
