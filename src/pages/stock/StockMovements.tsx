import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Collapse } from '@mantine/core';
import { useDispatch } from 'react-redux';
import Flatpickr from 'react-flatpickr';
import Select from 'react-select';
import 'flatpickr/dist/flatpickr.css';
import { Turkish } from 'flatpickr/dist/l10n/tr.js';

import { setPageTitle } from '../../store/themeConfigSlice';
import { stockService } from '../../api/services/stockService';
import { StockMovementItem, StockMovementType, StockReportSummary } from '../../types/stock';
import IconSettings from '../../components/Icon/IconSettings';
import IconXCircle from '../../components/Icon/IconXCircle';

const PAGE_SIZES = [20, 50, 100];

const typeOptions = [
    { value: 'order_deduction',    label: 'Sipariş Düşümü' },
    { value: 'order_cancellation', label: 'İptal İadesi' },
    { value: 'manual_adjustment',  label: 'Manuel Düzeltme' },
    { value: 'restock',            label: 'Stok Girişi' },
    { value: 'damage',             label: 'Hasar/Fire' },
];

const typeColors: Record<StockMovementType, string> = {
    order_deduction:    'bg-danger',
    order_cancellation: 'bg-success',
    manual_adjustment:  'bg-info',
    restock:            'bg-primary',
    damage:             'bg-warning',
};

const typeLabels: Record<StockMovementType, string> = {
    order_deduction:    'Sipariş Düşümü',
    order_cancellation: 'İptal İadesi',
    manual_adjustment:  'Manuel Düzeltme',
    restock:            'Stok Girişi',
    damage:             'Hasar/Fire',
};

const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const thirtyDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (val: string) => {
    const d = new Date(val);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString('tr-TR');
};

const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const compactSelectStyles = {
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    control: (base: any) => ({ ...base, minHeight: '30px', fontSize: '12px' }),
    valueContainer: (base: any) => ({ ...base, padding: '0 6px' }),
    indicatorsContainer: (base: any) => ({ ...base, height: '30px' }),
    dropdownIndicator: (base: any) => ({ ...base, padding: '4px' }),
    clearIndicator: (base: any) => ({ ...base, padding: '4px' }),
};

const StockMovements = () => {
    const dispatch = useDispatch();

    const [data, setData] = useState<StockMovementItem[]>([]);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZES[0]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<StockReportSummary | null>(null);

    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [filterDateFrom, setFilterDateFrom] = useState(thirtyDaysAgo());
    const [filterDateTo, setFilterDateTo] = useState(todayStr());
    const [filterTypes, setFilterTypes] = useState<any[]>([]);

    const hasActiveFilters = filterTypes.length > 0;
    const activeFilterCount = useMemo(() => filterTypes.length, [filterTypes]);

    useEffect(() => {
        dispatch(setPageTitle('Stok Hareket Raporu'));
    }, [dispatch]);

    useEffect(() => {
        if (!filterDateFrom || !filterDateTo) return;

        const load = async () => {
            setLoading(true);
            try {
                const res = await stockService.getReport(
                    {
                        date_from: filterDateFrom,
                        date_to: filterDateTo,
                        type: filterTypes.length ? filterTypes.map((t) => t.value as StockMovementType) : undefined,
                    },
                    page,
                    rowsPerPage
                );
                const movements = res.data?.movements;
                setData(movements?.data ?? []);
                setTotal(movements?.total ?? 0);
                setSummary(res.data?.summary ?? null);
            } catch (error: any) {
                const msg = error?.response?.data?.message || error?.response?.data?.errors?.date_to?.[0];
                if (msg) {
                    setData([]);
                    setTotal(0);
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [page, rowsPerPage, filterDateFrom, filterDateTo, filterTypes]);

    const clearFilters = () => {
        setFilterTypes([]);
    };

    const columns = [
        {
            accessor: 'type',
            title: 'Tür',
            render: (record: StockMovementItem) => (
                <span className={`badge ${typeColors[record.type]}`}>
                    {typeLabels[record.type]}
                </span>
            ),
        },
        {
            accessor: 'product',
            title: 'Ürün / Beden',
            render: (record: StockMovementItem) => (
                <div>
                    <p className="font-medium">{record.productSizeStock?.product?.name ?? `#${record.product_size_stock_id}`}</p>
                    <p className="text-xs text-gray-400">{record.productSizeStock?.size ?? '-'}</p>
                </div>
            ),
        },
        {
            accessor: 'quantity',
            title: 'Miktar',
            render: (record: StockMovementItem) => (
                <span className={record.quantity > 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                    {record.quantity > 0 ? `+${record.quantity}` : record.quantity}
                </span>
            ),
        },
        {
            accessor: 'stock_before',
            title: 'Önceki',
            render: (record: StockMovementItem) => <span>{record.stock_before}</span>,
        },
        {
            accessor: 'stock_after',
            title: 'Sonraki',
            render: (record: StockMovementItem) => <span>{record.stock_after}</span>,
        },
        {
            accessor: 'order',
            title: 'Sipariş',
            render: (record: StockMovementItem) =>
                record.order ? (
                    <span className="text-xs font-mono">{record.order.order_number}</span>
                ) : (
                    <span className="text-gray-400">-</span>
                ),
        },
        {
            accessor: 'createdBy',
            title: 'İşlemi Yapan',
            render: (record: StockMovementItem) =>
                record.createdBy ? (
                    <span className="text-xs">{record.createdBy.name}</span>
                ) : (
                    <span className="text-gray-400 text-xs">Sistem</span>
                ),
        },
        {
            accessor: 'note',
            title: 'Not',
            render: (record: StockMovementItem) => (
                <span className="text-xs text-gray-500 truncate max-w-[160px] block">
                    {record.note ?? '-'}
                </span>
            ),
        },
        {
            accessor: 'created_at',
            title: 'Tarih',
            render: (record: StockMovementItem) => (
                <span className="text-xs">{formatDate(record.created_at)}</span>
            ),
        },
    ];

    return (
        <div>
            {/* ── Özet Kartları ── */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 mb-4">
                    {[
                        { label: 'Stok Girişi', value: summary.total_restock, color: 'text-primary' },
                        { label: 'Sipariş Düşümü', value: summary.total_deducted, color: 'text-danger' },
                        { label: 'İptal İadesi', value: summary.total_restored, color: 'text-success' },
                        { label: 'Hasar/Fire', value: summary.total_damage, color: 'text-warning' },
                        { label: 'Manuel Düzeltme', value: summary.manual_adjustment_count, color: 'text-info' },
                    ].map((card) => (
                        <div key={card.label} className="panel py-3 px-4 text-center">
                            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="panel">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Stok Hareket Raporu</h5>
                    <div className="ltr:ml-auto rtl:mr-auto">
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
                    <div className="border border-[#e0e6ed] dark:border-[#253b5c] rounded-md px-4 py-3 mb-4 bg-[#f9fafb] dark:bg-[#0e1726] max-w-4xl ml-auto">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider">FİLTRELER</span>
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Başlangıç Tarihi</label>
                                <Flatpickr
                                    options={{ dateFormat: 'd.m.Y', altInput: true, altFormat: 'd.m.Y', locale: Turkish }}
                                    value={filterDateFrom ? new Date(filterDateFrom) : undefined}
                                    className="form-input py-1 text-xs"
                                    onChange={(dates) => { if (dates[0]) { setPage(1); setFilterDateFrom(toDateStr(dates[0])); } }}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Bitiş Tarihi</label>
                                <Flatpickr
                                    options={{ dateFormat: 'd.m.Y', altInput: true, altFormat: 'd.m.Y', locale: Turkish }}
                                    value={filterDateTo ? new Date(filterDateTo) : undefined}
                                    className="form-input py-1 text-xs"
                                    onChange={(dates) => { if (dates[0]) { setPage(1); setFilterDateTo(toDateStr(dates[0])); } }}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 mb-0.5">Hareket Türü</label>
                                <Select
                                    isMulti
                                    value={filterTypes}
                                    options={typeOptions}
                                    placeholder="Tümü..."
                                    classNamePrefix="select"
                                    onChange={(selected: any) => { setPage(1); setFilterTypes(selected ?? []); }}
                                    menuPortalTarget={document.body}
                                    styles={compactSelectStyles}
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
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) =>
                            `${totalRecords} kayıttan ${from} ile ${to} arasındaki satırlar görüntüleniyor.`
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default StockMovements;
