import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { SettingsService, SettingType } from '../../api/services/SettingsService';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconEdit from '../../components/Icon/IconEdit';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { Collapse } from '@mantine/core';
import IconSettings from '../../components/Icon/IconSettings';
import IconPlus from '../../components/Icon/IconPlus';
import Dropdown from '../../components/Dropdown';
import IconCaretDown from '../../components/Icon/IconCaretDown';

const PAGE_SIZES = [5, 10, 20, 50, 100];

const SettingsList = () => {
    const dispatch = useDispatch();
    const navigateToRoute = useRouteNavigator();

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState<SettingType[]>([]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'desc' });
    const [search, setSearch] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [hideCols, setHideCols] = useState<any[]>([]);
    const [refreshLoad, setRefreshLoad] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await SettingsService.list({
                page,
                limit: pageSize,
                search,
                sort_by: sortStatus.columnAccessor,
                sort_order: sortStatus.direction,
            });
            setRecords(response.data);
            setTotal(response.total);
        } catch (error) {
            console.error('Ayar listesi alınamadı:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Ayarlar'));
        fetchData();
    }, [page, pageSize, sortStatus, search, refreshLoad]);

    const handleDelete = async (id: number, key: string) => {
        Swal.fire({
            title: 'Ayar Sil',
            text: `${key} ayarı silmek istediğinize emin misiniz?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet',
            cancelButtonText: 'Hayır',
            customClass: { popup: 'sweet-alerts' },
        }).then(async (result) => {
            if (result.value){
                try {
                    await SettingsService.delete(id);
                    setRefreshLoad(prev => !prev);

                    Swal.fire({
                        title: 'Silindi!',
                        text: `${key} ayarı silindi.`,
                        icon: 'success',
                        confirmButtonText: 'Tamam',
                        customClass: { popup: 'sweet-alerts' },
                    });
                } catch (error) {
                    Swal.fire({
                        title: 'Hata!',
                        text: key + ' keyine sahip ayar silinemedi. Hata Alındı.',
                        icon: 'error',
                        confirmButtonText: 'Tamam',
                        customClass: { popup: 'sweet-alerts' }
                    });
                }
            } else {
                Swal.fire({
                    title: 'Bilgi!',
                    text: 'Herhangi bir işlem yapılmadı.',
                    icon: 'info',
                    confirmButtonText: 'Tamam',
                    customClass: { popup: 'sweet-alerts' }
                });
            }
        });
    };

    const handleEdit = (id: number) => {
        navigateToRoute('SettingsEdit', { id });
    };

    const columns = [
        { accessor: 'id', title: 'ID', sortable: true, hidden: hideCols.includes('id') },
        { accessor: 'key', title: 'Anahtar', sortable: true, hidden: hideCols.includes('key') },
        { accessor: 'value', title: 'Değer', sortable: true, hidden: hideCols.includes('value') },
        {
            accessor: 'actions',
            title: 'İşlemler',
            hidden: hideCols.includes('actions'),
            render: (record: SettingType) => (
                <div className="flex gap-2">

                    <div className="cursor-pointer text-blue-600" onClick={() => handleEdit(record.id!)}><IconEdit /></div>

                    <div className="cursor-pointer text-red-600" onClick={() => handleDelete(record.id!, record.key)}><IconXCircle /></div>
                </div>
            ),
        },
    ];

    const showHideColumns = (col: any, value: any) => {
        if (hideCols.includes(col)) {
            setHideCols((prev) => prev.filter((d: any) => d !== col));
        } else {
            setHideCols([...hideCols, col]);
        }
    };

    return (
        <div className="panel">
            <div className="grid gap-4">
                <div className="dropdown my-5">
                    <div className="flex flex-col gap-4 mb-5">
                        <div>
                            <h5 className="font-semibold text-lg dark:text-white-light">Ayar Listesi</h5>
                        </div>
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div className="dropdown my-5">
                                <Dropdown
                                    placement="bottom-start"
                                    btnClassName="!flex items-center border font-semibold border-white-light dark:border-[#253b5c] rounded-md px-4 py-2 text-sm dark:bg-[#1b2e4b] dark:text-white-dark"
                                    button={<><span className="ltr:mr-1 rtl:ml-1">Sütunlar</span><IconCaretDown className="w-5 h-5" /></>}
                                >
                                    <ul className="!min-w-[210px]">
                                        {columns.map((col, i) => (
                                            <li key={i} className="flex flex-col" onClick={(e) => e.stopPropagation()}>
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
                                        ))}
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
                                <button className="btn btn-primary gap-2" onClick={() => navigateToRoute('SettingsAdd')}>
                                    <IconPlus />
                                    Yeni Ekle
                                </button>
                            </div>
                        </div>
                    </div>

                    <Collapse in={isFilterOpen}>
                        <div className="flex flex-col gap-5 my-5">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Arama yap..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </Collapse>
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

export default SettingsList;
