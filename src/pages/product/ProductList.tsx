import React, { useEffect, useState } from 'react';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import Select, { MultiValue } from 'react-select';
import makeAnimated from 'react-select/animated';
import { Collapse, Tooltip } from '@mantine/core';
import DOMPurify from 'dompurify';

import { setPageTitle } from '../../store/themeConfigSlice';
import { ProductService } from '../../api/services/ProductService';
import { BrandService } from '../../api/services/BrandService';
import { CategoryService } from '../../api/services/CategoryService';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { useCan } from '../../utils/permissions';

import IconPlus from '../../components/Icon/IconPlus';
import IconEdit from '../../components/Icon/IconEdit';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconSettings from '../../components/Icon/IconSettings';
import IconCopy from '../../components/Icon/IconCopy';
import IconShare from '../../components/Icon/IconShare';

import BulkPriceUpdateModal from '../../components/Products/BulkPriceUpdateModal';
import type { ProductListItem, ProductStatus } from '../../types/product';

const PAGE_SIZES = [5, 10, 20, 50, 100];
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;

interface Option<T = number> {
    value: T;
    label: string;
}

const STATUS_OPTIONS: Option<ProductStatus>[] = [
    { value: 'draft', label: 'Taslak' },
    { value: 'pending_review', label: 'İncelemede' },
    { value: 'published', label: 'Yayında' },
    { value: 'scheduled', label: 'Planlanmış' },
    { value: 'archived', label: 'Arşivli' },
];

const STOCK_STATUS_OPTIONS: Option<string>[] = [
    { value: 'in_stock', label: 'Stokta' },
    { value: 'low_stock', label: 'Az Stok' },
    { value: 'out_of_stock', label: 'Tükendi' },
];

const STATUS_BADGE: Record<ProductStatus, string> = {
    draft: 'bg-gray-200 text-gray-700',
    pending_review: 'bg-yellow-200 text-yellow-800',
    published: 'bg-green-200 text-green-800',
    scheduled: 'bg-blue-200 text-blue-800',
    archived: 'bg-red-200 text-red-800',
};

const ProductList: React.FC = () => {
    const can = useCan();
    const dispatch = useDispatch();
    const navigate = useRouteNavigator();

    const [data, setData] = useState<ProductListItem[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZES[1]);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'id',
        direction: 'desc',
    });
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);

    const [brandOptions, setBrandOptions] = useState<Option[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);

    const [filters, setFilters] = useState<{
        statuses: Option<ProductStatus>[];
        brands: Option[];
        categories: Option[];
        stock_status: Option<string> | null;
        min_price: string;
        max_price: string;
    }>({
        statuses: [],
        brands: [],
        categories: [],
        stock_status: null,
        min_price: '',
        max_price: '',
    });

    useEffect(() => {
        dispatch(setPageTitle('Ürün Listesi'));
    }, [dispatch]);

    // Filtre için referans verileri
    useEffect(() => {
        const load = async () => {
            try {
                const [b, c] = await Promise.all([
                    (BrandService as any).list?.(1, 500, '', {
                        columnAccessor: 'name',
                        direction: 'asc',
                    }),
                    (CategoryService as any).list?.(1, 500, '', {
                        columnAccessor: 'name',
                        direction: 'asc',
                    }, {}),
                ]);
                const extract = (r: any) =>
                    Array.isArray(r?.data) ? r.data : r?.data?.data ?? [];
                setBrandOptions(extract(b).map((x: any) => ({ value: x.id, label: x.name })));
                setCategoryOptions(
                    extract(c).map((x: any) => ({ value: x.id, label: x.name }))
                );
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, []);

    // Ürünleri yükle
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const params: Record<string, any> = {};
                if (filters.statuses.length) {
                    params.status = filters.statuses.map((s) => s.value).join(',');
                }
                if (filters.brands.length) {
                    params.brand_id = filters.brands.map((b) => b.value).join(',');
                }
                if (filters.categories.length) {
                    params.category_id = filters.categories.map((c) => c.value).join(',');
                }
                if (filters.stock_status) params.stock_status = filters.stock_status.value;
                if (filters.min_price) params.min_price = filters.min_price;
                if (filters.max_price) params.max_price = filters.max_price;

                const response = await ProductService.list(
                    page,
                    rowsPerPage,
                    sortStatus,
                    params
                );
                const payload = response?.data ?? response;
                setData(payload.data ?? payload);
                setTotal(payload.total ?? payload.meta?.total ?? 0);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [page, rowsPerPage, sortStatus, filters, refreshKey]);

    const handleDelete = async (product: ProductListItem) => {
        try {
            const info = await ProductService.deleteInfo(product.id);
            const hasOrders = info.orders_count > 0;
            const hasMoves = info.stock_movements_count > 0;

            if (hasOrders || hasMoves) {
                const result = await Swal.fire({
                    icon: 'warning',
                    title: 'Dikkat!',
                    html: `
                        <p>Bu ürünün <strong>${info.orders_count}</strong> siparişi ve
                        <strong>${info.stock_movements_count}</strong> stok hareketi bulunuyor.</p>
                        <p class="text-sm text-gray-500 mt-2">
                            Silme yerine arşivlemeniz önerilir.
                        </p>
                    `,
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: 'Yine de Sil',
                    denyButtonText: 'Arşivle',
                    cancelButtonText: 'Vazgeç',
                    customClass: { actions: 'flex flex-col gap-2' },
                });
                if (result.isDismissed) return;
                if (result.isDenied) {
                    // TODO: archive endpoint çağrısı — şu an için kullanıcıya bilgi
                    Swal.fire({
                        icon: 'info',
                        title: 'Bilgi',
                        text: 'Ürünü düzenle → Durum: Arşivli seçip kaydedin.',
                    });
                    return;
                }
            } else {
                const result = await Swal.fire({
                    icon: 'question',
                    title: 'Silinsin mi?',
                    text: `${product.name} silinecek.`,
                    showCancelButton: true,
                    confirmButtonText: 'Evet, sil',
                    cancelButtonText: 'Vazgeç',
                });
                if (!result.isConfirmed) return;
            }

            await ProductService.delete(product.id);
            Swal.fire({ icon: 'success', title: 'Silindi', timer: 1500 });
            setRefreshKey((k) => k + 1);
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: err?.response?.data?.message || 'Silme başarısız',
            });
        }
    };

    const handleDuplicate = async (product: ProductListItem) => {
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Kopyalansın mı?',
            text: `${product.name} kopyalanacak (taslak olarak).`,
            showCancelButton: true,
            confirmButtonText: 'Kopyala',
            cancelButtonText: 'Vazgeç',
        });
        if (!confirm.isConfirmed) return;
        try {
            const dup = await ProductService.duplicate(product.id);
            Swal.fire({ icon: 'success', title: 'Kopyalandı', timer: 1500 });
            navigate('ProductEdit', { id: dup.id });
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: err?.response?.data?.message || 'Kopya başarısız',
            });
        }
    };

    const samplePrice = data[0]?.default_variant?.price ?? 499;

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex flex-col gap-4 mb-5">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <h5 className="font-semibold text-lg">Ürün Listesi</h5>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className={`btn ${
                                    isFilterOpen ? 'btn-primary' : 'btn-outline-primary'
                                } gap-2`}
                                onClick={() => setIsFilterOpen((v) => !v)}
                            >
                                <IconSettings />
                                Filtreler
                            </button>
                            {can('products.create') && (
                                <button
                                    type="button"
                                    className="btn btn-primary gap-2"
                                    onClick={() => navigate('ProductAdd')}
                                >
                                    <IconPlus /> Yeni Ekle
                                </button>
                            )}
                        </div>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
                            <span className="text-sm">
                                {selectedIds.length} ürün seçili
                            </span>
                            {can('product.bulk_update') && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => setBulkModalOpen(true)}
                                >
                                    Toplu Fiyat Güncelle
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-dark"
                                onClick={() => setSelectedIds([])}
                            >
                                Seçimi Temizle
                            </button>
                        </div>
                    )}
                </div>

                <Collapse in={isFilterOpen}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                        <Select<Option<ProductStatus>, true>
                            isMulti
                            options={STATUS_OPTIONS}
                            value={filters.statuses}
                            components={makeAnimated()}
                            placeholder="Durum"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                            onChange={(opts: MultiValue<Option<ProductStatus>>) =>
                                setFilters({ ...filters, statuses: opts as Option<ProductStatus>[] })
                            }
                        />
                        <Select<Option, true>
                            isMulti
                            options={brandOptions}
                            value={filters.brands}
                            components={makeAnimated()}
                            placeholder="Marka"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                            onChange={(opts: MultiValue<Option>) =>
                                setFilters({ ...filters, brands: opts as Option[] })
                            }
                        />
                        <Select<Option, true>
                            isMulti
                            options={categoryOptions}
                            value={filters.categories}
                            components={makeAnimated()}
                            placeholder="Kategori"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                            onChange={(opts: MultiValue<Option>) =>
                                setFilters({ ...filters, categories: opts as Option[] })
                            }
                        />
                        <Select<Option<string>, false>
                            options={STOCK_STATUS_OPTIONS}
                            value={filters.stock_status}
                            isClearable
                            placeholder="Stok Durumu"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                            onChange={(opt) =>
                                setFilters({ ...filters, stock_status: opt })
                            }
                        />
                        <input
                            type="number"
                            placeholder="Min Fiyat"
                            className="form-input"
                            value={filters.min_price}
                            onChange={(e) =>
                                setFilters({ ...filters, min_price: e.target.value })
                            }
                        />
                        <input
                            type="number"
                            placeholder="Max Fiyat"
                            className="form-input"
                            value={filters.max_price}
                            onChange={(e) =>
                                setFilters({ ...filters, max_price: e.target.value })
                            }
                        />
                    </div>
                </Collapse>

                <div className="datatables">
                    <DataTable<ProductListItem>
                        className="whitespace-nowrap table-hover"
                        records={data}
                        selectedRecords={data.filter((d) => selectedIds.includes(d.id))}
                        onSelectedRecordsChange={(rows) =>
                            setSelectedIds(rows.map((r) => r.id))
                        }
                        columns={[
                            { accessor: 'id', title: 'ID', sortable: true },
                            { accessor: 'name', title: 'Ürün Adı', sortable: true },
                            {
                                accessor: 'default_variant.price',
                                title: 'Fiyat',
                                render: (r) =>
                                    r.default_variant?.price != null
                                        ? `${Number(r.default_variant.price).toFixed(2)} ₺`
                                        : '—',
                            },
                            {
                                accessor: 'status',
                                title: 'Durum',
                                render: (r) => (
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${
                                            STATUS_BADGE[r.status] ?? 'bg-gray-200'
                                        }`}
                                    >
                                        {STATUS_OPTIONS.find((s) => s.value === r.status)?.label ??
                                            r.status}
                                    </span>
                                ),
                            },
                            {
                                accessor: 'is_active',
                                title: 'Aktif',
                                render: (r) => (
                                    <span
                                        className={`inline-block w-3 h-3 rounded-full ${
                                            r.is_active ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                    />
                                ),
                            },
                            {
                                accessor: 'total_stock',
                                title: 'Stok',
                                render: (r) => r.total_stock ?? r.default_variant?.stock ?? '—',
                            },
                            {
                                accessor: 'brand',
                                title: 'Marka',
                                render: (r) => r.brand?.name ?? '—',
                            },
                            {
                                accessor: 'categories',
                                title: 'Kategoriler',
                                render: (r) => (
                                    <div className="flex flex-wrap gap-1">
                                        {r.categories.map((c) => (
                                            <span
                                                key={c.id}
                                                className="px-2 py-0.5 bg-gray-100 rounded-full text-xs"
                                            >
                                                {c.name}
                                            </span>
                                        ))}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'created_at',
                                title: 'Tarih',
                                sortable: true,
                                render: (r) => r.formatted_created_at ?? r.created_at,
                            },
                            {
                                accessor: 'actions',
                                title: 'İşlemler',
                                render: (r) => (
                                    <div className="flex gap-1">
                                        {can('products.update') && (
                                            <Tooltip label="Düzenle">
                                                <button
                                                    onClick={() =>
                                                        navigate('ProductEdit', { id: r.id })
                                                    }
                                                    className="px-2 py-1 bg-yellow-400 text-white rounded"
                                                >
                                                    <IconEdit className="w-4 h-4" />
                                                </button>
                                            </Tooltip>
                                        )}
                                        {can('product.duplicate') && (
                                            <Tooltip label="Kopyala">
                                                <button
                                                    onClick={() => handleDuplicate(r)}
                                                    className="px-2 py-1 bg-blue-400 text-white rounded"
                                                >
                                                    <IconCopy className="w-4 h-4" />
                                                </button>
                                            </Tooltip>
                                        )}
                                        {can('products.delete') && (
                                            <Tooltip label="Sil">
                                                <button
                                                    onClick={() => handleDelete(r)}
                                                    className="px-2 py-1 bg-red-500 text-white rounded"
                                                >
                                                    <IconXCircle className="w-4 h-4" />
                                                </button>
                                            </Tooltip>
                                        )}
                                        <Tooltip label="Link Kopyala">
                                            <button
                                                onClick={() => {
                                                    const link = `${FRONTEND_URL}/urun/${r.slug}`;
                                                    navigator.clipboard.writeText(link);
                                                    Swal.fire({
                                                        icon: 'success',
                                                        title: 'Link Kopyalandı',
                                                        timer: 1500,
                                                        showConfirmButton: false,
                                                    });
                                                }}
                                                className="px-2 py-1 bg-green-500 text-white rounded"
                                            >
                                                <IconShare className="w-4 h-4" />
                                            </button>
                                        </Tooltip>
                                    </div>
                                ),
                            },
                        ]}
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
                        highlightOnHover
                        paginationText={({ from, to, totalRecords }) =>
                            `${totalRecords} kayıttan ${from}-${to} arası görüntüleniyor.`
                        }
                    />
                </div>
            </div>

            <BulkPriceUpdateModal
                open={bulkModalOpen}
                onClose={() => setBulkModalOpen(false)}
                selectedIds={selectedIds}
                samplePrice={samplePrice}
                onDone={() => {
                    setSelectedIds([]);
                    setRefreshKey((k) => k + 1);
                }}
            />
        </div>
    );
};

export default ProductList;
