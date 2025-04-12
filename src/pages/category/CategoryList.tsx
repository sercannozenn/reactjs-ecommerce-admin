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
import { CategoryService } from '../../api/services/CategoryService';
import { useRouteNavigator } from '../../utils/RouteHelper';
import IconRefresh from '../../components/Icon/IconRefresh';
import { Tooltip } from '@mantine/core';

const PAGE_SIZES = [5, 10, 20, 50, 100];

type Category = {
    id: number;
    name: string;
    slug: string;
    description: string;
    parent_name: string;
    is_active: number;
    formatted_created_at: string;
};
const CategoryList = () => {
    const dispatch = useDispatch();
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
    const [data, setData] = useState<Category[]>([]);
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
        { accessor: 'name', title: 'Adı' },
        { accessor: 'slug', title: 'Slug Adı' },
        { accessor: 'description', title: 'Kısa Açıklama' },
        { accessor: 'parent_name', title: 'Üst Kategori' },
        { accessor: 'is_active', title: 'Durum' },
        { accessor: 'created_at', title: 'Oluşturma Tarihi' }

    ];

    const handleDelete = (id: number, name: string) => {
        Swal.fire({
            icon: 'warning',
            title: 'Kategori Sil',
            text: name + ' adlı  kategoriyi silmek istediğinize emin misiniz? Kategori silindiğinde tüm alt kategoriler ve bunlara bağlı ürünler de silinecektir.',
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
                    const response = await CategoryService.delete(id);
                    setRefreshLoad(prev => !prev);

                    Swal.fire({
                        title: 'Silindi!',
                        text: name + ' adlı kategori silindi.',
                        icon: 'success',
                        confirmButtonText: 'Tamam',
                        customClass: { popup: 'sweet-alerts' }
                    });
                } catch (error) {
                    Swal.fire({
                        title: 'Hata!',
                        text: name + ' adlı kategori silinemedi. Hata Alındı.',
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
    const navigateToRoute = useRouteNavigator();

    const handleEdit = (id: number) => {
        navigateToRoute('CategoryEdit', { id });
    };
    const handleChangeStatus = async (id: number) => { // ✅ currentStatus kaldırıldı
        try {
            const response = await CategoryService.changeStatus(id);

            setData((prevData: Category[]) =>
                prevData.map((category: Category) =>
                    category.id === id ? { ...category, is_active: (category.is_active ? 0 : 1) } : category
                )
            );
            let currentIsActiveText = response.data.is_active ? 'Aktif' : 'Pasif';
            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: `Kategori durumu ${currentIsActiveText} olarak değiştirildi.`,
                confirmButtonText: 'Tamam'
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: 'Kategori durumu değiştirilemedi. Lütfen tekrar deneyin.',
                confirmButtonText: 'Tamam'
            });
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Kategori Listesi'));
    });
    useEffect(() => {
        const loadCategories = async () => {
            setLoading(true);
            try {
                const response = await CategoryService.list(page, rowsPerPage, search, sortStatus);
                setData(response.data.data);
                setTotal(response.data.total);
            } catch (error) {
                console.error('Failed to load categories:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCategories();
    }, [page, rowsPerPage, search, sortStatus, refreshLoad]);

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Kategori Listesi</h5>
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
                                title: 'Adı',
                                sortable: true,
                                hidden: hideCols.includes('name')
                            },
                            {
                                accessor: 'slug',
                                title: 'Slug Adı',
                                sortable: true,
                                hidden: hideCols.includes('slug')
                            },
                            {
                                accessor: 'description',
                                title: 'Kısa Açıklama',
                                sortable: true,
                                hidden: hideCols.includes('description')
                            },
                            {
                                accessor: 'parent_name',
                                title: 'Üst Kategori',
                                sortable: true,
                                hidden: hideCols.includes('parent_name')
                            },
                            {
                                accessor: 'is_active',
                                title: 'Durum',
                                sortable: true,
                                hidden: hideCols.includes('is_active'),
                                render: (record: Category) => (
                                    <div>
                                        <Tooltip label="Tıklayarak Durumu değiştirebiliriniz">
                                            <button className="items-center" onClick={() => handleChangeStatus(record.id)}>
                                                {record.is_active ? (
                                                    <IconRefresh className="text-green-500 hover:text-green-700" />
                                                ) : (
                                                    <IconRefresh className="text-red-500 hover:text-red-700" />
                                                )}
                                            </button>
                                        </Tooltip>

                                    </div>
                                )
                            },
                            {
                                accessor: 'formatted_created_at',
                                title: 'Oluşturma Tarihi',
                                sortable: true,
                                hidden: hideCols.includes('created_at')
                            },
                            {
                                accessor: 'actions',
                                title: 'İşlemler',
                                render: (record: Category) => (
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

export default CategoryList;
