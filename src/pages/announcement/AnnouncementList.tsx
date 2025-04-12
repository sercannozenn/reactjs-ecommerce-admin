import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconEdit from '../../components/Icon/IconEdit';
import { AnnouncementService } from '../../api/services/AnnouncementService';
import { useRouteNavigator } from '../../utils/RouteHelper';
import IconRefresh from '../../components/Icon/IconRefresh';
import IconSettings from '../../components/Icon/IconSettings';
import IconPlus from '../../components/Icon/IconPlus';

import '../../assets/css/style.css';
import { Collapse, Tooltip } from '@mantine/core';
import Dropdown from '../../components/Dropdown';
import IconCaretDown from '../../components/Icon/IconCaretDown';
const PAGE_SIZES = [5, 10, 20, 50, 100];

type AnnouncementRecord = {
    id: number;
    title: string;
    type: string;
    date: string;
    is_active: boolean;
};

const AnnouncementList = () => {
    const dispatch = useDispatch();
    const navigateToRoute = useRouteNavigator();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState<AnnouncementRecord[]>([]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'desc' });
    const [search, setSearch] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [hideCols, setHideCols] = useState<any>([]);

    const [filterData, setFilterData] = useState<Record<string, any>>({
        search: '',
        type: '',
        is_active: '',
        date_from: '',
        date_to: ''
    });

    const preparedFilters= (filters: Record<string, any>)=> {
        const preparedFilters = { ...filters };

        if (preparedFilters.hasOwnProperty('is_active') && (preparedFilters.is_active == '' || preparedFilters.is_active === null || preparedFilters.is_active === undefined)){
            delete preparedFilters.is_active;
        }
        return preparedFilters;
    }
    const showHideColumns = (col: any, value: any) => {
        if (hideCols.includes(col)) {
            setHideCols((col: any) => hideCols.filter((d: any) => d !== col));
        } else {
            setHideCols([...hideCols, col]);
        }
    };
    const fetchData = async () => {
        try {
            setLoading(true);
            const preparedFiltersData = preparedFilters(filterData);
            const response = await AnnouncementService.list(page, pageSize, sortStatus, preparedFiltersData);
            setRecords(response.data.data);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Duyuru listesi alınamadı:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Duyurular'));
        fetchData();
    }, [page, pageSize, sortStatus, filterData]);

    const handleStatusChange = async (id: number) => {
        try {
            await AnnouncementService.changeStatus(id);
            fetchData();
        } catch (error) {
            console.error('Durum değiştirme hatası:', error);
        }
    };

    const handleDelete = async (id: number, title: string) => {
        const confirm = await Swal.fire({
            title: 'Duyuru Etkinlik Sil',
            text: title + ' başlıklı kaydı silmek istediğinize emin misiniz?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet',
            cancelButtonText: 'Hayır',
            padding: '2em',
            customClass: {
                popup: 'sweet-alerts'
            }
        });
        if (confirm.isConfirmed) {
            try {
                await AnnouncementService.delete(id);
                fetchData();
                Swal.fire({
                    title: 'Silindi!',
                    text: title + ' başlıklı duyuru etkinlik silindi.',
                    icon: 'success',
                    confirmButtonText: 'Tamam',
                    customClass: { popup: 'sweet-alerts' }
                });
            } catch (error) {
                Swal.fire({
                    title: 'Hata!',
                    text: title + ' başlıklı duyuru etkinlik silinemedi. Hata Alındı.',
                    icon: 'error',
                    confirmButtonText: 'Tamam',
                    customClass: { popup: 'sweet-alerts' }
                });
            }
        }
    };
    const handleEdit = (id: number) => {
        navigateToRoute('AnnouncementEdit', { id });
    };

    const columns = [
        { accessor: 'id', title: 'ID', sortable: true, hidden: hideCols.includes('id') },
        { accessor: 'title', title: 'Başlık', sortable: true, hidden: hideCols.includes('title') },
        { accessor: 'type', title: 'Tür', hidden: hideCols.includes('type') },
        { accessor: 'formatted_date', title: 'Etkinlik/Duyuru Tarihi', sortable: true, hidden: hideCols.includes('formatted_date') },
        { accessor: 'formatted_created_at', title: 'Oluşturma Tarihi', sortable: true, hidden: hideCols.includes('formatted_created_at') },
        {
            accessor: 'is_active',
            title: 'Durum',
            hidden: hideCols.includes('is_active'),
            render: (record: AnnouncementRecord) => (
                <div>
                    <Tooltip label="Tıklayarak durumu değiştirebilirsiniz">
                        <button className="items-center"
                                onClick={() => handleStatusChange(record.id)}>
                            {record.is_active ? (
                                <IconRefresh className="text-green-500 hover:text-green-700" />
                            ) : (
                                <IconRefresh className="text-red-500 hover:text-red-700" />
                            )}
                        </button>
                    </Tooltip>
                </div>
            ),
        },
        {
            accessor: 'actions',
            title: 'İşlemler',
            hidden: hideCols.includes('actions'),
            render: (record: AnnouncementRecord) => (
                <div className="flex gap-2">
                    <div className="cursor-pointer text-blue-600" onClick={() => handleEdit(record.id)}><IconEdit /></div>
                    <div className="cursor-pointer text-red-600" onClick={() => handleDelete(record.id, record.title)}><IconXCircle /></div>
                </div>
            ),
        },
    ];

    return (
        <div className="panel">
            <div className="grid gap-4">
                <div className="dropdown my-5">
                    <div className="flex flex-col gap-4 mb-5">
                        <div>
                            <h5 className="font-semibold text-lg dark:text-white-light">Duyuru & Etkinlik Listesi</h5>
                        </div>

                        <div className="flex justify-between items-center flex-wrap gap-4">

                            <div className="dropdown my-5">
                                <Dropdown
                                    placement={`'bottom-start'`}
                                    btnClassName="!flex items-center border font-semibold border-white-light dark:border-[#253b5c] rounded-md px-4 py-2 text-sm dark:bg-[#1b2e4b] dark:text-white-dark"
                                    button={
                                        <>
                                            <span className="ltr:mr-1 rtl:ml-1">Sütunlar</span>
                                            <IconCaretDown className="w-5 h-5" />
                                        </>
                                    }
                                >
                                    <ul className="!min-w-[210px]">
                                        {columns.map((col, i) => {
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

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className={`btn ${isFilterOpen ? 'btn-primary' : 'btn-outline-primary'} gap-2`}
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                >
                                    <IconSettings />
                                    Filtreler
                                </button>
                                <button className="btn btn-primary gap-2" onClick={() => navigateToRoute('AnnouncementAdd')}>
                                    <IconPlus />
                                    Yeni Ekle
                                </button>
                            </div>
                        </div>

                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div></div>
                        <Collapse in={isFilterOpen}>
                            <div className="flex flex-col gap-5 my-5 filter-product-list">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Arama yap..."
                                value={filterData.search}
                                onChange={(e) => setFilterData((prev) => ({ ...prev, search: e.target.value }))}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    className="form-input"
                                    value={filterData.type}
                                    onChange={(e) => setFilterData((prev) => ({ ...prev, type: e.target.value }))}
                                >
                                    <option value="">Tür</option>
                                    <option value="announcement">Duyuru</option>
                                    <option value="event">Etkinlik</option>
                                </select>
                                <select
                                    className="form-input"
                                    value={filterData.is_active}
                                    onChange={(e) => setFilterData((prev) => ({ ...prev, is_active: e.target.value }))}
                                >
                                    <option value="">Durum</option>
                                    <option value="1">Aktif</option>
                                    <option value="0">Pasif</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filterData.date_from}
                                    placeholder="Tarih Başlangıç"
                                    onChange={(e) => setFilterData((prev) => ({ ...prev, date_from: e.target.value }))}
                                />
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filterData.date_to}
                                    placeholder="Tarih Bitiş"
                                    onChange={(e) => setFilterData((prev) => ({ ...prev, date_to: e.target.value }))}
                                />
                            </div>

                        </div>
                        </Collapse>
                    </div>

                </div>
            </div>
            <DataTable
                className="whitespace-nowrap table-hover"
                records={records}
                columns={columns}
                highlightOnHover
                totalRecords={total}
                recordsPerPage={pageSize}
                page={page}
                onPageChange={setPage}
                recordsPerPageOptions={PAGE_SIZES}
                onRecordsPerPageChange={setPageSize}
                fetching={loading}
                sortStatus={sortStatus}
                onSortStatusChange={setSortStatus}
                minHeight={200}
            />
        </div>
    );
};

export default AnnouncementList;
