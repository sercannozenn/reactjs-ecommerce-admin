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
import { useCan } from '../../utils/permissions';
import { orderService } from '../../api/services/orderService';
import {
    OrderListItem,
    OrderFilterData,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_BADGE,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_BADGE,
} from '../../types/order';

import IconEye from '../../components/Icon/IconEye';
import IconSettings from '../../components/Icon/IconSettings';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconDownload from '../../components/Icon/IconDownload';

const PAGE_SIZES = [10, 20, 50, 100];

const compactSelectStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    control: (base: any) => ({ ...base, minHeight: '30px', fontSize: '12px' }),
    valueContainer: (base: any) => ({ ...base, padding: '0 6px' }),
    indicatorsContainer: (base: any) => ({ ...base, height: '30px' }),
    dropdownIndicator: (base: any) => ({ ...base, padding: '4px' }),
    clearIndicator: (base: any) => ({ ...base, padding: '4px' }),
};

const statusOptions = [
    { value: 'pending_payment', label: 'Ödeme Bekleniyor' },
    { value: 'confirmed',       label: 'Onaylandı' },
    { value: 'preparing',       label: 'Hazırlanıyor' },
    { value: 'shipped',         label: 'Kargoda' },
    { value: 'delivered',       label: 'Teslim Edildi' },
    { value: 'cancelled',       label: 'İptal Edildi' },
];

const paymentStatusOptions = [
    { value: 'pending',  label: 'Bekliyor' },
    { value: 'paid',     label: 'Ödendi' },
    { value: 'failed',   label: 'Başarısız' },
    { value: 'refunded', label: 'İade Edildi' },
];

const formatCurrency = (value: number) =>
    Number(value).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

const formatDate = (value: string | null | undefined) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('tr-TR');
};

const OrderList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const can = useCan();

    const [data, setData] = useState<OrderListItem[]>([]);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZES[1]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterSearch, setFilterSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<any[]>([]);
    const [filterPaymentStatus, setFilterPaymentStatus] = useState<any[]>([]);
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterMinTotal, setFilterMinTotal] = useState('');
    const [filterMaxTotal, setFilterMaxTotal] = useState('');

    const hasActiveFilters = !!(
        filterSearch || filterStatus.length || filterPaymentStatus.length ||
        filterDateFrom || filterDateTo || filterMinTotal || filterMaxTotal
    );

    const activeFilterCount = useMemo(() =>
        [filterSearch, filterStatus.length > 0, filterPaymentStatus.length > 0,
         filterDateFrom, filterDateTo, filterMinTotal, filterMaxTotal].filter(Boolean).length,
        [filterSearch, filterStatus, filterPaymentStatus, filterDateFrom, filterDateTo, filterMinTotal, filterMaxTotal]
    );

    const clearFilters = () => {
        setFilterSearch('');
        setFilterStatus([]);
        setFilterPaymentStatus([]);
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilterMinTotal('');
        setFilterMaxTotal('');
    };

    useEffect(() => {
        dispatch(setPageTitle('Sipariş Listesi'));
    }, [dispatch]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const filters: OrderFilterData = {};
                if (filterSearch)               filters.search = filterSearch;
                if (filterStatus.length)        filters.status = filterStatus.map((s) => s.value);
                if (filterPaymentStatus.length) filters.payment_status = filterPaymentStatus.map((s) => s.value);
                if (filterDateFrom)             filters.date_from = filterDateFrom;
                if (filterDateTo)               filters.date_to = filterDateTo;
                if (filterMinTotal)             filters.min_total = filterMinTotal;
                if (filterMaxTotal)             filters.max_total = filterMaxTotal;

                const response = await orderService.list(
                    filters,
                    sortStatus.columnAccessor as string,
                    sortStatus.direction as 'asc' | 'desc',
                    page,
                    rowsPerPage,
                );

                setData(response.data ?? []);
                setTotal(response.meta?.total ?? 0);
            } catch (err) {
                console.error('Sipariş listesi alınamadı:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [page, rowsPerPage, sortStatus, filterSearch, filterStatus, filterPaymentStatus,
        filterDateFrom, filterDateTo, filterMinTotal, filterMaxTotal]);

    const handleExport = async () => {
        try {
            const filters: OrderFilterData = {};
            if (filterStatus.length)        filters.status = filterStatus.map((s) => s.value);
            if (filterPaymentStatus.length) filters.payment_status = filterPaymentStatus.map((s) => s.value);
            if (filterDateFrom)             filters.date_from = filterDateFrom;
            if (filterDateTo)               filters.date_to = filterDateTo;
            if (filterMinTotal)             filters.min_total = filterMinTotal;
            if (filterMaxTotal)             filters.max_total = filterMaxTotal;

            const blob = await orderService.export(filters);
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `siparisler-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Export başarısız.', confirmButtonText: 'Tamam' });
        }
    };

    const toDate = (str: string) => {
        const [d, m, y] = str.split('.');
        return `${y}-${m}-${d}`;
    };

    const columns = [
        {
            accessor: 'order_number',
            title: 'Sipariş No',
            sortable: true,
            render: (r: OrderListItem) => (
                <span className="font-semibold text-primary">{r.order_number}</span>
            ),
        },
        {
            accessor: 'customer_name',
            title: 'Müşteri',
            render: (r: OrderListItem) => (
                <div>
                    <div className="font-medium">{r.customer_name ?? '-'}</div>
                    <div className="text-xs text-gray-400">{r.customer_email}</div>
                </div>
            ),
        },
        {
            accessor: 'status',
            title: 'Durum',
            render: (r: OrderListItem) => (
                <span className={ORDER_STATUS_BADGE[r.status]}>
                    {ORDER_STATUS_LABELS[r.status]}
                </span>
            ),
        },
        {
            accessor: 'payment_status',
            title: 'Ödeme',
            render: (r: OrderListItem) => (
                <span className={PAYMENT_STATUS_BADGE[r.payment_status]}>
                    {PAYMENT_STATUS_LABELS[r.payment_status]}
                </span>
            ),
        },
        {
            accessor: 'total',
            title: 'Toplam',
            sortable: true,
            render: (r: OrderListItem) => formatCurrency(r.total),
        },
        {
            accessor: 'item_count',
            title: 'Ürün',
            render: (r: OrderListItem) => `${r.item_count} adet`,
        },
        {
            accessor: 'created_at',
            title: 'Tarih',
            sortable: true,
            render: (r: OrderListItem) => formatDate(r.created_at),
        },
        {
            accessor: 'actions',
            title: '',
            render: (r: OrderListItem) => (
                <Tooltip label="Detay">
                    <button type="button" className="p-2" onClick={() => navigate(`/siparisler/${r.order_number}`)}>
                        <IconEye />
                    </button>
                </Tooltip>
            ),
        },
    ];

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Sipariş Listesi</h5>
                    <div className="flex items-center gap-3 ltr:ml-auto rtl:mr-auto">
                        {can('orders.export') && (
                            <button type="button" className="btn btn-outline-secondary gap-2" onClick={handleExport}>
                                <IconDownload /> CSV
                            </button>
                        )}
                        <button
                            type="button"
                            className={`btn ${isFilterOpen ? 'btn-primary' : 'btn-outline-primary'} gap-2`}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <IconSettings />
                            Filtreler
                            {hasActiveFilters && (
                                <span className="badge bg-white text-primary rounded-full ml-1">{activeFilterCount}</span>
                            )}
                        </button>
                    </div>
                </div>

                <Collapse in={isFilterOpen}>
                    <div className="border border-[#e0e6ed] dark:border-[#253b5c] rounded-md px-4 py-3 mb-4 bg-[#f9fafb] dark:bg-[#0e1726] max-w-5xl ml-auto">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-semibold text-gray-400 tracking-wider">FİLTRELER</span>
                            {hasActiveFilters && (
                                <button type="button" className="text-[11px] text-danger hover:underline flex items-center gap-1" onClick={clearFilters}>
                                    <IconXCircle className="w-3 h-3" /> Temizle
                                </button>
                            )}
                        </div>

                        {/* Satır 1 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Sipariş No / E-posta</label>
                                <input
                                    type="text"
                                    className="form-input py-1 text-xs"
                                    placeholder="Ara..."
                                    value={filterSearch}
                                    onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Sipariş Durumu</label>
                                <Select
                                    isMulti
                                    value={filterStatus}
                                    options={statusOptions}
                                    placeholder="Seçiniz..."
                                    classNamePrefix="select"
                                    onChange={(s: any) => { setFilterStatus(s as any[]); setPage(1); }}
                                    menuPortalTarget={document.body}
                                    styles={compactSelectStyles}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Ödeme Durumu</label>
                                <Select
                                    isMulti
                                    value={filterPaymentStatus}
                                    options={paymentStatusOptions}
                                    placeholder="Seçiniz..."
                                    classNamePrefix="select"
                                    onChange={(s: any) => { setFilterPaymentStatus(s as any[]); setPage(1); }}
                                    menuPortalTarget={document.body}
                                    styles={compactSelectStyles}
                                />
                            </div>
                        </div>

                        {/* Satır 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Tarih Başlangıç</label>
                                <Flatpickr
                                    placeholder="Tarih seçin..."
                                    options={{ dateFormat: 'd.m.Y', altInput: true, altFormat: 'd.m.Y', locale: Turkish }}
                                    value={filterDateFrom ? new Date(filterDateFrom) : undefined}
                                    className="form-input py-1 text-xs"
                                    onChange={(dates) => { setFilterDateFrom(dates[0] ? toDate(dates[0].toLocaleDateString('tr-TR')) : ''); setPage(1); }}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Tarih Bitiş</label>
                                <Flatpickr
                                    placeholder="Tarih seçin..."
                                    options={{ dateFormat: 'd.m.Y', altInput: true, altFormat: 'd.m.Y', locale: Turkish }}
                                    value={filterDateTo ? new Date(filterDateTo) : undefined}
                                    className="form-input py-1 text-xs"
                                    onChange={(dates) => { setFilterDateTo(dates[0] ? toDate(dates[0].toLocaleDateString('tr-TR')) : ''); setPage(1); }}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Min Tutar</label>
                                <input
                                    type="number"
                                    className="form-input py-1 text-xs"
                                    placeholder="0"
                                    value={filterMinTotal}
                                    onChange={(e) => { setFilterMinTotal(e.target.value); setPage(1); }}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Maks Tutar</label>
                                <input
                                    type="number"
                                    className="form-input py-1 text-xs"
                                    placeholder="∞"
                                    value={filterMaxTotal}
                                    onChange={(e) => { setFilterMaxTotal(e.target.value); setPage(1); }}
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
                        onPageChange={setPage}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setRowsPerPage}
                        fetching={loading}
                        sortStatus={sortStatus}
                        onSortStatusChange={setSortStatus}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) =>
                            `${totalRecords} kayıttan ${from} ile ${to} arasındakiler gösteriliyor.`
                        }
                        onRowClick={(record) => navigate(`/siparisler/${record.order_number}`)}
                    />
                </div>
            </div>
        </div>
    );
};

export default OrderList;
