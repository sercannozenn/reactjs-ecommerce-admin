import React, { useEffect, useState } from 'react';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import Swal from 'sweetalert2';
import Dropdown from '../../components/Dropdown';
import { setPageTitle } from '../../store/themeConfigSlice';
import { ProductDiscountService } from '../../api/services/ProductDiscountService';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { Box, Collapse, Tooltip } from '@mantine/core';
import Select from 'react-select';

import IconEdit from '../../components/Icon/IconEdit';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconPlus from '../../components/Icon/IconPlus';
import IconSettings from '../../components/Icon/IconSettings';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconRefresh from '../../components/Icon/IconRefresh';
import { ProductDiscountListType } from '../../types/discount';


const customNoOptionsMessage = () => {
    return (
        <div style={{ textAlign: 'center', color: 'gray' }}>
            Aradığınız şeçenek bulunamadı.
        </div>
    );
};

const PAGE_SIZES = [5, 10, 20, 50, 100];

const ProductDiscountList = () => {
    const dispatch = useDispatch();
    const navigateToRoute = useRouteNavigator();

    const [data, setData] = useState<ProductDiscountListType[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZES[1]);
    const [refreshLoad, setRefreshLoad] = useState(false);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });

    const [filterData, setFilterData] = useState<Record<string, any>>({

        search: '',
        target_type: '',
        discount_type: '',
        is_active: '',
    });

    const [hideCols, setHideCols] = useState<any>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const cols = [
        { accessor: 'id', title: 'ID', sortable: true, hidden: hideCols.includes('id') },
        { accessor: 'name', title: 'İsim', sortable: true, hidden: hideCols.includes('name') },
        { accessor: 'description', title: 'Açıklama', hidden: hideCols.includes('description'),
            render: (record:ProductDiscountListType) => (
                <Tooltip label={record.description || ''}>
                    <Box>{record.description?.slice(0, 30) || '-'}</Box>
                </Tooltip>
            )
        },
        { accessor: 'target_type', title: 'Hedef Tipi', hidden: hideCols.includes('target_type') },
        { accessor: 'discount_type', title: 'İndirim Tipi', hidden: hideCols.includes('discount_type'), },
        { accessor: 'discount_amount', title: 'Miktar', hidden: hideCols.includes('discount_amount'),
            render: (record: ProductDiscountListType) =>
                record.discount_type === 'percentage'
                    ? `%${record.discount_amount}`
                    : record.discount_amount.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                    })
        },
        { accessor: 'priority', title: 'Öncelik', sortable: true, hidden: hideCols.includes('priority') },
        { accessor: 'is_active', title: 'Durum', hidden: hideCols.includes('is_active'),
            render: (record: ProductDiscountListType) => (
                <div>
                    <Tooltip label="Tıklayarak durumu değiştirebilirsiniz">
                        <button className="items-center" onClick={() => handleChangeStatus(record.id)}>
                            {
                                record.is_active
                                    ?
                                    (<IconRefresh className="text-green-500 hover:text-green-700" />)
                                    :
                                    (<IconRefresh className="text-red-500 hover:text-red-700" />)
                            }
                        </button>
                    </Tooltip>
                </div>
            )
        },
        { accessor: 'discount_start', title: 'Başlangıç', hidden: hideCols.includes('discount_start'),
            render: (record: ProductDiscountListType) => new Date(record.discount_start).toLocaleString('tr-TR')
        },
        { accessor: 'discount_end', title: 'Bitiş', hidden: hideCols.includes('discount_end'),
            render: (record: ProductDiscountListType) => new Date(record.discount_end).toLocaleString('tr-TR')
        },
        { accessor: 'actions', title: 'İşlemler', hidden: hideCols.includes('actions'),
            render: (record: ProductDiscountListType) => (
                <div className="flex gap-2">
                    <button onClick={() => navigateToRoute('ProductDiscountEdit', { id: record.id })} className="btn btn-sm btn-info">
                        <IconEdit />
                    </button>
                </div>
            )
        }
    ];

    const showHideColumns = (col: any, value: any) => {
        if (hideCols.includes(col)) {
            setHideCols((col: any) => hideCols.filter((d: any) => d !== col));
        } else {
            setHideCols([...hideCols, col]);
        }
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
    const handleChangeStatus = async (id: number) => {
        try {
            // 1) Servisten dönen güncel indirim objesini al
            const updated = await ProductDiscountService.changeStatus(id);
            if (updated.message){
                await Swal.fire({
                    icon: 'info',
                    title: 'Bilgilendirme!',
                    text: `${updated.message}`,
                    confirmButtonText: 'Tamam'
                });
            }
            // 2) State'i servis cevabına göre güncelle
            setData((prev) =>
                prev.map(item =>
                    item.id === updated.discount.id ? updated.discount : item
                )
            );

            const statusText = updated.discountis_active ? 'Aktif' : 'Pasif';
            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: `İndirim durumu ${statusText} olarak değiştirildi.`,
                confirmButtonText: 'Tamam'
            });
        } catch (error: any) {
            const msg = error.message || 'Durum değiştirilemedi. Lütfen tekrar deneyin.';
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: msg,
                confirmButtonText: 'Tamam'
            });
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
                        <div className="dropdown">
                            <Dropdown
                                btnClassName="!flex items-center border font-semibold border-white-light dark:border-[#253b5c] rounded-md px-4 py-2 text-sm dark:bg-[#1b2e4b] dark:text-white-dark"
                                button={
                                    <>
                                        <span className="ltr:mr-1 rtl:ml-1">Sütunlar</span>
                                        <IconCaretDown className="w-5 h-5" />
                                    </>
                                }
                            >
                                <ul className="!min-w-[190px]">
                                    {cols.map((col, i) => {
                                        return (
                                            <li
                                                key={i}
                                                className="flex flex-col"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <div className="flex items-center px-4 py-1">
                                                    <label className="cursor-pointer mb-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={!hideCols.includes(col.accessor)}
                                                            className="form-checkbox"
                                                            defaultValue={col.accessor}
                                                            onChange={(event: any) => {
                                                                setHideCols(event.target.value);
                                                                showHideColumns(col.accessor, event.target.checked);
                                                            }}
                                                        />
                                                        <span className="ltr:ml-2 rtl:mr-2">{col.title}</span>
                                                    </label>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Dropdown>
                        </div>

                        <button className={`btn ${isFilterOpen ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            <IconSettings /> Filtreler
                        </button>
                        <button className="btn btn-primary" onClick={() => navigateToRoute('ProductDiscountAdd')}>
                            <IconPlus /> Yeni Ekle
                        </button>
                    </div>
                </div>

                <Collapse in={isFilterOpen}>
                    <div className="grid grid-cols-4 gap-4 mb-4">
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
                    columns={cols}
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
