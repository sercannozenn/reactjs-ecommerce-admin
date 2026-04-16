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

    const executeDelete = async (id: number, name: string, force = false) => {
        try {
            await TagService.deleteTag(id, force ? { force: true } : undefined);
            setRefreshLoad(prev => !prev);
            Swal.fire({
                title: 'Silindi!',
                text: `"${name}" adlı etiket silindi.`,
                icon: 'success',
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' }
            });
        } catch (error) {
            Swal.fire({
                title: 'Hata!',
                text: `"${name}" adlı etiket silinemedi.`,
                icon: 'error',
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' }
            });
        }
    };

    const handleDelete = async (id: number, name: string) => {
        try {
            const info = await TagService.deleteInfo(id);

            if (info.total_products === 0 && info.total_categories === 0) {
                const result = await Swal.fire({
                    icon: 'warning',
                    title: 'Etiketi Sil',
                    text: `"${name}" etiketini silmek istediğinize emin misiniz?`,
                    showCancelButton: true,
                    confirmButtonText: 'Evet, Sil',
                    cancelButtonText: 'İptal',
                    padding: '2em',
                    customClass: { popup: 'sweet-alerts' }
                });
                if (result.isConfirmed) {
                    await executeDelete(id, name);
                }
                return;
            }

            const iconProduct = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`;
            const iconCategory = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
            const externalIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

            const cardStyle = `border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-top:12px;background:#f8fafc;`;
            const headerStyle = `display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:#1e293b;`;
            const badgeBase = `display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 7px;border-radius:12px;font-size:12px;font-weight:600;color:#fff;`;
            const viewBtnStyle = `background:#eef2ff;color:#4361ee;border:none;border-radius:8px;padding:10px;font-weight:600;font-size:13px;cursor:pointer;margin-top:12px;width:100%;display:flex;align-items:center;justify-content:center;gap:6px;`;

            const productUrl = `/urunler?preset_tag_id=${id}&preset_tag_name=${encodeURIComponent(name)}`;
            const categoryUrl = `/kategoriler?preset_tag_id=${id}&preset_tag_name=${encodeURIComponent(name)}`;

            const productListHtml = info.total_products > 0
                ? `<div style="${cardStyle}">
                    <div style="${headerStyle}">${iconProduct} Ürünler <span style="${badgeBase}background:#4361ee;">${info.total_products}</span></div>
                    <button id="swal-view-products-btn" style="${viewBtnStyle}">Ürünleri Görüntüle ${externalIcon}</button>
                   </div>`
                : '';

            const categoryListHtml = info.total_categories > 0
                ? `<div style="${cardStyle}">
                    <div style="${headerStyle}">${iconCategory} Kategoriler <span style="${badgeBase}background:#e7515a;">${info.total_categories}</span></div>
                    <button id="swal-view-categories-btn" style="${viewBtnStyle}">Kategorileri Görüntüle ${externalIcon}</button>
                   </div>`
                : '';

            const result = await Swal.fire({
                icon: 'warning',
                title: 'Etikette İlişkiler Var',
                html: `
                    <p style="color:#64748b;font-size:14px;margin-bottom:4px;"><strong>"${name}"</strong> etiketi silinirse aşağıdaki ilişkiler koparılacak:</p>
                    ${productListHtml}
                    ${categoryListHtml}
                `,
                showCancelButton: true,
                confirmButtonText: 'Yine de Sil',
                cancelButtonText: 'İptal',
                padding: '2em',
                width: 520,
                customClass: {
                    popup: 'sweet-alerts',
                    actions: '!flex-col !gap-2 !w-full !px-4',
                    confirmButton: '!w-full !m-0',
                    cancelButton: '!w-full !m-0',
                },
                didOpen: () => {
                    const productBtn = document.getElementById('swal-view-products-btn');
                    if (productBtn) {
                        productBtn.addEventListener('click', () => window.open(productUrl, '_blank'));
                    }
                    const categoryBtn = document.getElementById('swal-view-categories-btn');
                    if (categoryBtn) {
                        categoryBtn.addEventListener('click', () => window.open(categoryUrl, '_blank'));
                    }
                },
            });

            if (result.isConfirmed) {
                await executeDelete(id, name, true);
            }
        } catch (error) {
            Swal.fire({
                title: 'Hata!',
                text: 'Etiket bilgisi alınamadı.',
                icon: 'error',
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' }
            });
        }
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
