import React, { useEffect, useState } from 'react';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { Box, Collapse, Tooltip } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import IconEdit from '../../components/Icon/IconEdit';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconPlus from '../../components/Icon/IconPlus';
import IconSettings from '../../components/Icon/IconSettings';
import { setPageTitle } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import { ProductDiscountService } from '../../api/services/ProductDiscountService';
import { useRouteNavigator } from '../../utils/RouteHelper';
import Select from 'react-select';

const PAGE_SIZES = [5, 10, 20, 50, 100];

const ProductDiscountList = () => {
    const dispatch = useDispatch();
    const navigateToRoute = useRouteNavigator();

    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZES[1]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });
    const [refreshLoad, setRefreshLoad] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [filterData, setFilterData] = useState<Record<string, any>>({
        search: '',
        target_type: '',
        discount_type: '',
        is_active: '',
    });

    const handleDelete = (id: number, name: string) => {
        Swal.fire({
            icon: 'warning',
            title: 'İndirim Sil',
            text: `${name} adlı indirimi silmek istediğinize emin misiniz?`,
            showCancelButton: true,
            confirmButtonText: 'Evet',
            cancelButtonText: 'Hayır'
        }).then(async (result) => {
            if (result.value) {
                await ProductDiscountService.delete(id);
                setRefreshLoad(prev => !prev);
                Swal.fire('Silindi!', `${name} adlı indirim silindi.`, 'success');
            }
        });
    };

    const loadDiscounts = async () => {
        setLoading(true);
        try {
            const response = await ProductDiscountService.list(page, rowsPerPage, sortStatus, filterData);
            setData(response.data.data);
            setTotal(response.data.total);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('İndirim Listesi'));
    }, []);

    useEffect(() => {
        loadDiscounts();
    }, [filterData, page, rowsPerPage, sortStatus, refreshLoad]);

    return (
        <div>
            <style>
                {`
                .css-1nmdiq5-menu{
                z-index:9 !important;
                min-width: 200px;
                right: 0;
                }
                `}
            </style>
            <div className="panel mt-6">
                <div className="flex justify-between items-center mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">İndirim Listesi</h5>
                    <div className="flex items-center gap-2">
                        <button className={`btn ${isFilterOpen ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            <IconSettings /> Filtrele
                        </button>
                        <button className="btn btn-primary" onClick={() => navigateToRoute('ProductDiscountAdd')}>
                            <IconPlus /> Yeni Ekle
                        </button>
                    </div>
                </div>

                <Collapse in={isFilterOpen}>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="İsim veya açıklama ara..."
                            value={filterData.search}
                            onChange={(e) => setFilterData(prev => ({ ...prev, search: e.target.value }))}
                        />
                        <Select
                            options={[
                                { value: 'product', label: 'Ürün' },
                                { value: 'category', label: 'Kategori' },
                                { value: 'brand', label: 'Marka' },
                                { value: 'tag', label: 'Etiket' },
                                { value: 'user', label: 'Kullanıcı' }
                            ]}
                            placeholder="Hedef Tipi"
                            onChange={(selected) => setFilterData(prev => ({ ...prev, target_type: selected?.value ?? '' }))}
                            isClearable
                        />
                        <Select
                            options={[
                                { value: 'percentage', label: 'Yüzdelik' },
                                { value: 'fixed', label: 'Sabit' }
                            ]}
                            placeholder="İndirim Tipi"
                            onChange={(selected) => setFilterData(prev => ({ ...prev, discount_type: selected?.value ?? '' }))}
                            isClearable
                        />
                        <Select
                            options={[
                                { value: '1', label: 'Aktif' },
                                { value: '0', label: 'Pasif' }
                            ]}
                            placeholder="Durum"
                            onChange={(selected) => setFilterData(prev => ({ ...prev, is_active: selected?.value ?? '' }))}
                            isClearable
                        />
                    </div>
                </Collapse>

                <DataTable
                    records={data}
                    columns={[
                        { accessor: 'id', title: 'ID', sortable: true },
                        { accessor: 'name', title: 'İsim', sortable: true },
                        {
                            accessor: 'description',
                            title: 'Açıklama',
                            render: (record) => (
                                <Tooltip label={record.description || ''}>
                                    <Box>{record.description?.slice(0, 30) || '-'}</Box>
                                </Tooltip>
                            )
                        },
                        { accessor: 'target_type', title: 'Hedef Tipi' },
                        { accessor: 'discount_type', title: 'İndirim Tipi' },
                        {
                            accessor: 'discount_amount',
                            title: 'Miktar',
                            render: (record) =>
                                record.discount_type === 'percentage'
                                    ? `%${record.discount_amount}`
                                    : record.discount_amount.toLocaleString('tr-TR', {
                                        style: 'currency',
                                        currency: 'TRY'
                                    })
                        },
                        { accessor: 'priority', title: 'Öncelik', sortable: true },
                        {
                            accessor: 'is_active',
                            title: 'Durum',
                            render: (record) => (record.is_active ? 'Aktif' : 'Pasif')
                        },
                        {
                            accessor: 'discount_start',
                            title: 'Başlangıç',
                            render: (record) => new Date(record.discount_start).toLocaleString('tr-TR')
                        },
                        {
                            accessor: 'discount_end',
                            title: 'Bitiş',
                            render: (record) => new Date(record.discount_end).toLocaleString('tr-TR')
                        },
                        {
                            accessor: 'actions',
                            title: 'İşlemler',
                            render: (record) => (
                                <div className="flex gap-2">
                                    <button onClick={() => navigateToRoute('ProductDiscountEdit', { id: record.id })} className="btn btn-sm btn-info">
                                        <IconEdit />
                                    </button>
                                    <button onClick={() => handleDelete(record.id, record.name)} className="btn btn-sm btn-danger">
                                        <IconXCircle />
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    fetching={loading}
                    highlightOnHover
                    totalRecords={total}
                    recordsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={setPage}
                    recordsPerPageOptions={PAGE_SIZES}
                    onRecordsPerPageChange={setRowsPerPage}
                    sortStatus={sortStatus}
                    onSortStatusChange={setSortStatus}
                />
            </div>
        </div>

    );
};

export default ProductDiscountList;
