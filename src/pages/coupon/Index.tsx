import { useEffect, useMemo, useState } from 'react';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Collapse, Tooltip } from '@mantine/core';
import Select from 'react-select';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Turkish } from 'flatpickr/dist/l10n/tr.js';

import { setPageTitle } from '../../store/themeConfigSlice';
import { route, useRouteNavigator } from '../../utils/RouteHelper';
import { useCan } from '../../utils/permissions';
import { couponService, CouponSortKey } from '../../api/services/couponService';
import { CouponItem, CouponFilterData } from '../../types/coupon';

import IconPlus from '../../components/Icon/IconPlus';
import IconEdit from '../../components/Icon/IconEdit';
import IconEye from '../../components/Icon/IconEye';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconRefresh from '../../components/Icon/IconRefresh';
import IconSettings from '../../components/Icon/IconSettings';

const PAGE_SIZES = [5, 10, 20, 50, 100];

const statusOptions = [
    { value: 'active', label: 'Aktif' },
    { value: 'scheduled', label: 'Başlamadı' },
    { value: 'expired', label: 'Süresi Dolmuş' },
];

const isActiveOptions = [
    { value: '1', label: 'Aktif' },
    { value: '0', label: 'Pasif' },
];

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

const getStatusBadge = (record: CouponItem): JSX.Element => {
    if (!record.is_active) {
        return <span className="badge bg-slate-400">Pasif</span>;
    }
    if (record.is_expired) {
        return <span className="badge bg-danger">Süresi Dolmuş</span>;
    }
    if (record.is_not_started) {
        return <span className="badge bg-warning">Başlamadı</span>;
    }
    return <span className="badge bg-success">Aktif</span>;
};

const compactSelectStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    control: (base: any) => ({ ...base, minHeight: '30px', fontSize: '12px' }),
    valueContainer: (base: any) => ({ ...base, padding: '0 6px' }),
    indicatorsContainer: (base: any) => ({ ...base, height: '30px' }),
    dropdownIndicator: (base: any) => ({ ...base, padding: '4px' }),
    clearIndicator: (base: any) => ({ ...base, padding: '4px' }),
};

const CouponIndex = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const navigateToRoute = useRouteNavigator();
    const can = useCan();

    const [data, setData] = useState<CouponItem[]>([]);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZES[1]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [refreshLoad, setRefreshLoad] = useState(false);

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'id',
        direction: 'desc',
    });

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterCode, setFilterCode] = useState('');
    const [filterIsActive, setFilterIsActive] = useState<any>(null);
    const [filterStatus, setFilterStatus] = useState<any>(null);
    const [filterStartsFrom, setFilterStartsFrom] = useState('');
    const [filterEndsTo, setFilterEndsTo] = useState('');

    const hasActiveFilters =
        !!filterCode || filterIsActive !== null || filterStatus !== null || !!filterStartsFrom || !!filterEndsTo;

    const activeFilterCount = useMemo(
        () =>
            [filterCode, filterIsActive !== null, filterStatus !== null, filterStartsFrom, filterEndsTo].filter(Boolean)
                .length,
        [filterCode, filterIsActive, filterStatus, filterStartsFrom, filterEndsTo]
    );

    const clearFilters = () => {
        setFilterCode('');
        setFilterIsActive(null);
        setFilterStatus(null);
        setFilterStartsFrom('');
        setFilterEndsTo('');
    };

    useEffect(() => {
        dispatch(setPageTitle('Kupon Listesi'));
    }, [dispatch]);

    useEffect(() => {
        const loadCoupons = async () => {
            setLoading(true);
            try {
                const filters: CouponFilterData = {};
                if (filterCode) filters.code = filterCode;
                if (filterIsActive) filters.is_active = filterIsActive.value;
                if (filterStatus) filters.status = filterStatus.value;
                if (filterStartsFrom) filters.starts_from = filterStartsFrom;
                if (filterEndsTo) filters.ends_to = filterEndsTo;

                const response = await couponService.list(
                    filters,
                    sortStatus.columnAccessor as CouponSortKey,
                    sortStatus.direction as 'asc' | 'desc',
                    page,
                    rowsPerPage
                );

                setData(response.data ?? []);
                const totalCount = response.meta?.total ?? response.total ?? 0;
                setTotal(totalCount);
            } catch (error) {
                console.error('Kupon listesi alınamadı:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCoupons();
    }, [
        page,
        rowsPerPage,
        sortStatus,
        refreshLoad,
        filterCode,
        filterIsActive,
        filterStatus,
        filterStartsFrom,
        filterEndsTo,
    ]);

    const handleChangeStatus = async (id: number) => {
        try {
            const updated = await couponService.changeStatus(id);
            setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: `Kupon durumu ${updated.is_active ? 'Aktif' : 'Pasif'} olarak değiştirildi.`,
                confirmButtonText: 'Tamam',
            });
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Durum değiştirilemedi.';
            Swal.fire({ icon: 'error', title: 'Hata!', text: msg, confirmButtonText: 'Tamam' });
        }
    };

    const showInUseDialog = async (id: number, code: string) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Kupon Silinemez',
            html: `<p><strong>${code}</strong> kuponu daha önce kullanıldığı için silinemez.</p>
                   <p class="text-sm mt-2">Kuponu pasif yaparak kullanımını engelleyebilirsiniz.</p>`,
            showCancelButton: true,
            showConfirmButton: can('coupons.change-status'),
            confirmButtonText: 'Pasif Yap',
            cancelButtonText: 'İptal',
            padding: '2em',
            customClass: {
                popup: 'sweet-alerts',
                actions: '!flex-col !gap-2 !w-full !px-4',
                confirmButton: '!w-full !m-0',
                cancelButton: '!w-full !m-0',
            },
        });

        if (result.isConfirmed) {
            try {
                const updated = await couponService.changeStatus(id);
                // Servis zaten aktif/pasif toggle. Eğer hala aktifse bir kez daha toggle gerekebilir:
                // Ancak güvenli tarafta kalmak için sadece refresh edelim.
                setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `${code} kuponu ${updated.is_active ? 'aktif' : 'pasif'} yapıldı.`,
                    confirmButtonText: 'Tamam',
                });
            } catch {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: 'Durum değiştirilemedi.',
                    confirmButtonText: 'Tamam',
                });
            }
        }
    };

    const handleDelete = async (id: number, code: string) => {
        const confirm = await Swal.fire({
            icon: 'warning',
            title: 'Kuponu Sil',
            text: `"${code}" kuponunu silmek istediğinize emin misiniz?`,
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
            padding: '2em',
            customClass: { popup: 'sweet-alerts' },
        });
        if (!confirm.isConfirmed) return;

        try {
            await couponService.destroy(id);
            setRefreshLoad((prev) => !prev);
            Swal.fire({
                icon: 'success',
                title: 'Silindi!',
                text: `${code} kuponu silindi.`,
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' },
            });
        } catch (error: any) {
            const errorCode = error?.response?.data?.errors?.error_code;
            if (error?.response?.status === 422 && errorCode === 'COUPON_IN_USE') {
                await showInUseDialog(id, code);
                return;
            }
            const errorMessage = error?.response?.data?.message || `${code} kuponu silinemedi.`;
            Swal.fire({
                icon: 'error',
                title: 'Silinemedi!',
                text: errorMessage,
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' },
            });
        }
    };

    const columns = [
        { accessor: 'id', title: 'ID', sortable: true, width: 60 },
        {
            accessor: 'code',
            title: 'Kod',
            sortable: true,
            render: (record: CouponItem) => (
                <span className="font-semibold tracking-wide">{record.code}</span>
            ),
        },
        {
            accessor: 'type',
            title: 'Tip',
            render: (record: CouponItem) =>
                record.type === 'percentage' ? (
                    <span className="badge bg-info">%</span>
                ) : (
                    <span className="badge bg-primary">₺</span>
                ),
        },
        {
            accessor: 'value',
            title: 'Değer',
            sortable: true,
            render: (record: CouponItem) =>
                record.type === 'percentage' ? `%${record.value}` : formatCurrency(record.value),
        },
        {
            accessor: 'starts_at',
            title: 'Başlangıç',
            sortable: true,
            render: (record: CouponItem) => formatDate(record.starts_at),
        },
        {
            accessor: 'ends_at',
            title: 'Bitiş',
            sortable: true,
            render: (record: CouponItem) => formatDate(record.ends_at),
        },
        {
            accessor: 'usage',
            title: 'Kullanım',
            render: (record: CouponItem) => {
                const used = record.total_usage_count ?? 0;
                const limit = record.usage_limit ?? null;
                return <span>{limit ? `${used} / ${limit}` : `${used} / ∞`}</span>;
            },
        },
        {
            accessor: 'status',
            title: 'Durum',
            render: (record: CouponItem) => (
                <div className="flex items-center gap-2">
                    {getStatusBadge(record)}
                    {can('coupons.change-status') && (
                        <Tooltip label="Aktif/Pasif değiştir">
                            <button
                                type="button"
                                className="items-center"
                                onClick={() => handleChangeStatus(record.id)}
                            >
                                <IconRefresh
                                    className={
                                        record.is_active
                                            ? 'text-green-500 hover:text-green-700'
                                            : 'text-red-500 hover:text-red-700'
                                    }
                                />
                            </button>
                        </Tooltip>
                    )}
                </div>
            ),
        },
        {
            accessor: 'actions',
            title: 'İşlemler',
            render: (record: CouponItem) => (
                <div className="flex space-x-2">
                    <Tooltip label="Detay">
                        <button
                            type="button"
                            onClick={() => navigate(route('CouponShow', { id: record.id }))}
                            className="p-2"
                        >
                            <IconEye />
                        </button>
                    </Tooltip>
                    {can('coupons.update') && (
                        <Tooltip label="Düzenle">
                            <button
                                type="button"
                                onClick={() => navigateToRoute('CouponEdit', { id: record.id })}
                                className="p-2"
                            >
                                <IconEdit />
                            </button>
                        </Tooltip>
                    )}
                    {can('coupons.delete') && (
                        <Tooltip label="Sil">
                            <button
                                type="button"
                                onClick={() => handleDelete(record.id, record.code)}
                                className="p-2"
                            >
                                <IconXCircle />
                            </button>
                        </Tooltip>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Kupon Listesi</h5>
                    <div className="flex items-center gap-3 ltr:ml-auto rtl:mr-auto">
                        <button
                            type="button"
                            className={`btn ${isFilterOpen ? 'btn-primary' : 'btn-outline-primary'} gap-2`}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <IconSettings />
                            Filtreler
                            {hasActiveFilters && (
                                <span className="badge bg-white text-primary rounded-full ml-1">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        {can('coupons.create') && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => navigateToRoute('CouponAdd')}
                            >
                                <IconPlus /> Yeni Kupon
                            </button>
                        )}
                    </div>
                </div>

                <Collapse in={isFilterOpen}>
                    <div className="border border-[#e0e6ed] dark:border-[#253b5c] rounded-md px-4 py-3 mb-4 bg-[#f9fafb] dark:bg-[#0e1726] max-w-4xl ml-auto">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider">
                                FİLTRELER
                            </span>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    className="text-[11px] text-danger hover:underline flex items-center gap-1"
                                    onClick={clearFilters}
                                >
                                    <IconXCircle className="w-3 h-3" />
                                    Temizle
                                </button>
                            )}
                        </div>

                        {/* Satır 1: Kod + Select'ler */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">
                                    Kupon Kodu
                                </label>
                                <input
                                    type="text"
                                    className="form-input py-1 text-xs"
                                    placeholder="Ara..."
                                    value={filterCode}
                                    onChange={(e) => setFilterCode(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">
                                    Aktiflik
                                </label>
                                <Select
                                    value={filterIsActive}
                                    isClearable
                                    options={isActiveOptions}
                                    placeholder="Seçiniz..."
                                    classNamePrefix="select"
                                    onChange={(selected: any) => setFilterIsActive(selected)}
                                    menuPortalTarget={document.body}
                                    styles={compactSelectStyles}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">
                                    Durum
                                </label>
                                <Select
                                    value={filterStatus}
                                    isClearable
                                    options={statusOptions}
                                    placeholder="Seçiniz..."
                                    classNamePrefix="select"
                                    onChange={(selected: any) => setFilterStatus(selected)}
                                    menuPortalTarget={document.body}
                                    styles={compactSelectStyles}
                                />
                            </div>
                        </div>

                        {/* Satır 2: Tarih aralığı */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">
                                    Başlangıç Tarihinden İtibaren
                                </label>
                                <Flatpickr
                                    placeholder="Tarih seçin..."
                                    options={{
                                        dateFormat: 'd.m.Y',
                                        altInput: true,
                                        altFormat: 'd.m.Y',
                                        locale: Turkish,
                                    }}
                                    value={filterStartsFrom ? new Date(filterStartsFrom) : undefined}
                                    className="form-input py-1 text-xs"
                                    onChange={(dates) =>
                                        setFilterStartsFrom(
                                            dates[0]
                                                ? `${dates[0].getFullYear()}-${String(dates[0].getMonth() + 1).padStart(2, '0')}-${String(dates[0].getDate()).padStart(2, '0')}`
                                                : ''
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">
                                    Bitiş Tarihine Kadar
                                </label>
                                <Flatpickr
                                    placeholder="Tarih seçin..."
                                    options={{
                                        dateFormat: 'd.m.Y',
                                        altInput: true,
                                        altFormat: 'd.m.Y',
                                        locale: Turkish,
                                    }}
                                    value={filterEndsTo ? new Date(filterEndsTo) : undefined}
                                    className="form-input py-1 text-xs"
                                    onChange={(dates) =>
                                        setFilterEndsTo(
                                            dates[0]
                                                ? `${dates[0].getFullYear()}-${String(dates[0].getMonth() + 1).padStart(2, '0')}-${String(dates[0].getDate()).padStart(2, '0')}`
                                                : ''
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </Collapse>

                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={data}
                        columns={columns}
                        highlightOnHover
                        totalRecords={total}
                        recordsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(newPage) => setPage(newPage)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setRowsPerPage}
                        fetching={loading}
                        sortStatus={sortStatus}
                        onSortStatusChange={(newSort) => setSortStatus(newSort)}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) =>
                            `${totalRecords} kayıttan  ${from} ile ${to} arasındaki satırlar görüntüleniyor.`
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default CouponIndex;
