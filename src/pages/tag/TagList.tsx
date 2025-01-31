import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import Swal from 'sweetalert2';
import Dropdown from '../../components/Dropdown';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconEdit from '../../components/Icon/IconEdit';
import { TagService } from '../../api/services/TagService';
import { useRouteNavigator } from '../../utils/RouteHelper';

const PAGE_SIZES = [5, 10, 20, 50, 100];


const TagList = () => {
    const dispatch = useDispatch();
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZES[1]);
    const [refreshLoad, setRefreshLoad] = useState(false);

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'id',
        direction: 'asc'
    });

    const [hideCols, setHideCols] = useState<any>([]);

    const showHideColumns = (col: any, value: any) => {
        if (hideCols.includes(col)) {
            setHideCols((col: any) => hideCols.filter((d: any) => d !== col));
        } else {
            setHideCols([...hideCols, col]);
        }
    };

    const cols = [
        { accessor: 'id', title: 'ID' },
        { accessor: 'name', title: 'Etiket Adı' },
        { accessor: 'slug', title: 'Etiket Slug Adı' }
    ];

    const handleDelete = (id: number, name: string) => {
        Swal.fire({
            icon: 'warning',
            title: 'Etiketi Sil',
            text: name + ' adlı  etiketi silmek istediğinize emin misiniz?',
            showCancelButton: true,
            confirmButtonText: 'Evet',
            cancelButtonText: 'Hayır',
            padding: '2em',
            customClass: {
                popup: 'sweet-alerts'
            }
        }).then(async (result) => {
            if (result.value) {
                try {
                    const response = await TagService.deleteTag(id);
                    setRefreshLoad(prev => !prev);

                    Swal.fire({
                        title: 'Silindi!',
                        text: name + ' adlı etiket silindi.',
                        icon: 'success',
                        confirmButtonText: 'Tamam',
                        customClass: { popup: 'sweet-alerts' }
                    });
                }
                catch (error){
                    Swal.fire({
                        title: 'Hata!',
                        text: name + ' adlı etiket silinemedi. Hata Alındı.',
                        icon: 'error',
                        confirmButtonText: 'Tamam',
                        customClass: { popup: 'sweet-alerts' }
                    });
                }

            }else{
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
    const navigateToRoute = useRouteNavigator();

    const handleEdit = (id: number) => {
        navigateToRoute('TagEdit', { id });
    };

    useEffect(() => {
        dispatch(setPageTitle('Etiket Listesi'));
    });
    useEffect(() => {
        const loadTags = async () => {
            setLoading(true);
            try {
                const response = await TagService.fetchTags(page, rowsPerPage, search, sortStatus);
                setData(response.data.data);
                setTotal(response.data.total);
            } catch (error) {
                console.error('Failed to load tags:', error);
            } finally {
                setLoading(false);
            }
        };
        loadTags();
    }, [page, rowsPerPage, search, sortStatus, refreshLoad]);

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Etiket Listesi</h5>
                    <div className="flex items-center gap-5 ltr:ml-auto rtl:mr-auto">
                        <div className="flex md:items-center md:flex-row flex-col gap-5">
                            <div className="dropdown">
                                <Dropdown
                                    placement={`${isRtl ? 'bottom-end' : 'bottom-start'}`}
                                    btnClassName="!flex items-center border font-semibold border-white-light dark:border-[#253b5c] rounded-md px-4 py-2 text-sm dark:bg-[#1b2e4b] dark:text-white-dark"
                                    button={
                                        <>
                                            <span className="ltr:mr-1 rtl:ml-1">Sütunlar</span>
                                            <IconCaretDown className="w-5 h-5" />
                                        </>
                                    }
                                >
                                    <ul className="!min-w-[140px]">
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
                        </div>
                        <div className="text-right">
                            <input type="text" className="form-input" placeholder="Arama Yap..." value={search}
                                   onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={data}
                        columns={[
                            {
                                accessor: 'id',
                                title: 'ID',
                                sortable: true,
                                hidden: hideCols.includes('id')
                            },
                            {
                                accessor: 'name',
                                title: 'Etiket Adı',
                                sortable: true,
                                hidden: hideCols.includes('name')
                            },
                            {
                                accessor: 'slug',
                                title: 'Etiket Slug Adı',
                                sortable: true,
                                hidden: hideCols.includes('slug')
                            },
                            {
                                accessor: 'actions',
                                title: 'İşlemler',
                                render: (record: { id: number, name: string }) => (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(record.id)}
                                            className="p-2"
                                        >
                                            <IconEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(record.id, record.name)}
                                            className="p-2"
                                        >
                                            <IconXCircle />
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                        highlightOnHover
                        totalRecords={total}
                        recordsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(newPage) => setPage(newPage)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setRowsPerPage}
                        fetching={loading}
                        sortStatus={sortStatus}
                        onSortStatusChange={newSortStatus => setSortStatus(newSortStatus)}
                        minHeight={200}
                        paginationText={({
                                             from,
                                             to,
                                             totalRecords
                                         }) => `${totalRecords} kayıttan  ${from} ile ${to} arasındaki satırlar görüntüleniyor.`}
                    />
                </div>
            </div>
        </div>
    );
};

export default TagList;
