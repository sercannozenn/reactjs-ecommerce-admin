import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IRootState } from '../../store';
import Swal from 'sweetalert2';
import Dropdown from '../../components/Dropdown';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconEdit from '../../components/Icon/IconEdit';
import { CategoryService } from '../../api/services/CategoryService';
import { TagService } from '../../api/services/TagService';
import { useRouteNavigator } from '../../utils/RouteHelper';
import IconRefresh from '../../components/Icon/IconRefresh';
import IconSettings from '../../components/Icon/IconSettings';
import { Collapse, Tooltip } from '@mantine/core';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Turkish } from 'flatpickr/dist/l10n/tr.js';
import { useCan } from '../../utils/permissions';

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
    const can = useCan();
    const dispatch = useDispatch();
    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
    const [searchParams] = useSearchParams();
    const presetTagId = searchParams.get('preset_tag_id');
    const presetTagName = searchParams.get('preset_tag_name');
    const presetTag = presetTagId ? { value: Number(presetTagId), label: presetTagName || '' } : undefined;

    const [data, setData] = useState<Category[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZES[1]);
    const [refreshLoad, setRefreshLoad] = useState(false);

    const [filterTags, setFilterTags] = useState<any[]>(presetTag ? [presetTag] : []);
    const [tagsOptions, setTagsOptions] = useState<any[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(!!presetTag);
    const [filterParentCategory, setFilterParentCategory] = useState<any>(null);
    const [filterStatus, setFilterStatus] = useState<any>(null);
    const [parentCategoryOptions, setParentCategoryOptions] = useState<any[]>([]);
    const [filterName, setFilterName] = useState('');
    const [filterSlug, setFilterSlug] = useState('');
    const [filterDescription, setFilterDescription] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const statusOptions = [
        { value: 1, label: 'Aktif' },
        { value: 0, label: 'Pasif' },
    ];

    const hasActiveFilters = filterName || filterSlug || filterDescription || filterTags.length > 0 || filterParentCategory || filterStatus !== null || filterStartDate || filterEndDate;

    const clearFilters = () => {
        setFilterName('');
        setFilterSlug('');
        setFilterDescription('');
        setFilterTags([]);
        setFilterParentCategory(null);
        setFilterStatus(null);
        setFilterStartDate('');
        setFilterEndDate('');
    };

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

    const executeDelete = async (id: number, name: string, params?: { target_category_id?: number; force?: boolean }) => {
        try {
            await CategoryService.delete(id, params);
            setRefreshLoad(prev => !prev);
            Swal.fire({
                title: 'Silindi!',
                text: name + ' adlı kategori silindi.',
                icon: 'success',
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' }
            });
        } catch (error: any) {
            const errorMessage = error?.response?.data?.errors?.error ?? name + ' adlı kategori silinemedi.';
            Swal.fire({
                title: 'Silinemedi!',
                text: errorMessage,
                icon: 'error',
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' }
            });
        }
    };

    const handleDelete = async (id: number, name: string) => {
        try {
            const info = await CategoryService.deleteInfo(id);

            if (info.has_children) {
                Swal.fire({
                    icon: 'error',
                    title: 'Silinemez!',
                    text: `"${name}" kategorisinin alt kategorileri bulunuyor. Önce alt kategorileri taşıyın.`,
                    confirmButtonText: 'Tamam',
                    customClass: { popup: 'sweet-alerts' }
                });
                return;
            }

            if (info.total_products === 0) {
                const result = await Swal.fire({
                    icon: 'warning',
                    title: 'Kategori Sil',
                    text: `"${name}" kategorisini silmek istediğinize emin misiniz?`,
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

            let exclusiveHtml = '';
            if (info.exclusive_products > 0) {
                exclusiveHtml = `<p class="text-danger text-sm mt-2"><strong>${info.exclusive_products} ürün</strong> sadece bu kategoride yer alıyor ve taşınmazsa kategorisiz kalacak.</p>`;
            }

            const result = await Swal.fire({
                icon: 'warning',
                title: 'Kategoride Ürün Var',
                html: `
                    <p class="mb-3"><strong>"${name}"</strong> kategorisinde <strong>${info.total_products} ürün</strong> bulunuyor.</p>
                    ${exclusiveHtml}
                    <button id="swal-view-products-btn" style="display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:7px 16px;background:#4361ee;color:#fff;border-radius:6px;font-size:13px;font-weight:600;border:none;cursor:pointer;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>${info.total_products} ürünü görüntüle</button>
                `,
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Kategorilerini Değiştir ve Sil',
                denyButtonText: 'Yine de Sil',
                cancelButtonText: 'İptal',
                padding: '2em',
                customClass: {
                    popup: 'sweet-alerts',
                    actions: '!flex-col !gap-2 !w-full !px-4',
                    confirmButton: '!w-full !m-0',
                    denyButton: '!w-full !m-0',
                    cancelButton: '!w-full !m-0',
                },
                didOpen: () => {
                    document.getElementById('swal-view-products-btn')?.addEventListener('click', () => {
                        Swal.close();
                        navigate('/urunler', {
                            state: { preset_category: { value: id, label: info.category_name || name } }
                        });
                    });
                }
            });

            if (result.isConfirmed) {
                const categories = await CategoryService.create();
                const options = (categories.data.categories || [])
                    .filter((c: any) => c.id !== id)
                    .reduce((acc: Record<string, string>, c: any) => {
                        acc[c.id] = c.name;
                        return acc;
                    }, {});

                const { value: targetId } = await Swal.fire({
                    title: 'Hedef Kategori Seçin',
                    text: 'Ürünler bu kategoriye taşınacak:',
                    input: 'select',
                    inputOptions: options,
                    inputPlaceholder: 'Kategori seçin...',
                    showCancelButton: true,
                    confirmButtonText: 'Taşı ve Sil',
                    cancelButtonText: 'İptal',
                    padding: '2em',
                    customClass: { popup: 'sweet-alerts' },
                    inputValidator: (value) => {
                        if (!value) return 'Lütfen bir kategori seçin.';
                    }
                });

                if (targetId) {
                    await executeDelete(id, name, { target_category_id: Number(targetId) });
                }
            } else if (result.isDenied) {
                await executeDelete(id, name, { force: true });
            }
        } catch (error) {
            Swal.fire({
                title: 'Hata!',
                text: 'Kategori bilgisi alınamadı.',
                icon: 'error',
                confirmButtonText: 'Tamam',
                customClass: { popup: 'sweet-alerts' }
            });
        }
    };
    const navigateToRoute = useRouteNavigator();
    const navigate = useNavigate();

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
        const loadFilterOptions = async () => {
            try {
                const [tagResponse, categoryResponse] = await Promise.all([
                    TagService.fetchTags(1, 1000, '', { columnAccessor: 'name', direction: 'asc' }),
                    CategoryService.create()
                ]);
                setTagsOptions(
                    tagResponse.data.data.map((tag: any) => ({
                        value: tag.id,
                        label: tag.name
                    }))
                );
                setParentCategoryOptions(
                    (categoryResponse.data.categories || []).map((cat: any) => ({
                        value: cat.id,
                        label: cat.name
                    }))
                );
            } catch (error) {
                console.error('Filtre seçenekleri yüklenemedi:', error);
            }
        };
        loadFilterOptions();
    }, []);
    useEffect(() => {
        const loadCategories = async () => {
            setLoading(true);
            try {
                const filters: any = {};
                const tagIds = filterTags.map((t: any) => t.value);
                if (tagIds.length > 0) filters.tags = tagIds;
                if (filterParentCategory) filters.parent_category_id = filterParentCategory.value;
                if (filterStatus !== null) filters.is_active = filterStatus?.value;
                if (filterName) filters.name = filterName;
                if (filterSlug) filters.slug = filterSlug;
                if (filterDescription) filters.description = filterDescription;
                if (filterStartDate) filters.start_date = filterStartDate;
                if (filterEndDate) filters.end_date = filterEndDate;

                const response = await CategoryService.list(page, rowsPerPage, '', sortStatus, filters);
                setData(response.data.data);
                setTotal(response.data.total);
            } catch (error) {
                console.error('Failed to load categories:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCategories();
    }, [page, rowsPerPage, sortStatus, refreshLoad, filterTags, filterParentCategory, filterStatus, filterName, filterSlug, filterDescription, filterStartDate, filterEndDate]);

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Kategori Listesi</h5>
                    <div className="flex items-center gap-3 ltr:ml-auto rtl:mr-auto">
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
                                    {cols.map((col, i) => (
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
                        <button
                            type="button"
                            className={`btn ${isFilterOpen ? 'btn-primary' : 'btn-outline-primary'} gap-2`}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <IconSettings />
                            Filtreler
                            {hasActiveFilters && <span className="badge bg-white text-primary rounded-full ml-1">{[filterName, filterSlug, filterDescription, filterTags.length > 0, filterParentCategory, filterStatus !== null, filterStartDate, filterEndDate].filter(Boolean).length}</span>}
                        </button>
                    </div>
                </div>
                <Collapse in={isFilterOpen}>
                    <div className="border border-[#e0e6ed] dark:border-[#253b5c] rounded-md px-4 py-3 mb-4 bg-[#f9fafb] dark:bg-[#0e1726] max-w-4xl ml-auto">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Filtreler</span>
                            {hasActiveFilters && (
                                <button type="button" className="text-[11px] text-danger hover:underline flex items-center gap-1" onClick={clearFilters}>
                                    <IconXCircle className="w-3 h-3" />
                                    Temizle
                                </button>
                            )}
                        </div>
                        {/* Satır 1: Text inputlar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">Kategori Adı</label>
                                <input type="text" className="form-input py-1 text-xs" placeholder="Ara..." value={filterName} onChange={(e) => setFilterName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">Slug Adı</label>
                                <input type="text" className="form-input py-1 text-xs" placeholder="Ara..." value={filterSlug} onChange={(e) => setFilterSlug(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">Kısa Açıklama</label>
                                <input type="text" className="form-input py-1 text-xs" placeholder="Ara..." value={filterDescription} onChange={(e) => setFilterDescription(e.target.value)} />
                            </div>
                        </div>
                        {/* Satır 2: Select'ler */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">Üst Kategori</label>
                                <Select
                                    value={filterParentCategory}
                                    isClearable
                                    components={makeAnimated()}
                                    options={parentCategoryOptions}
                                    placeholder="Seçiniz..."
                                    classNamePrefix="select"
                                    name="parent_category"
                                    onChange={(selectedOption: any) => setFilterParentCategory(selectedOption)}
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                        control: (base: any) => ({ ...base, minHeight: '30px', fontSize: '12px' }),
                                        valueContainer: (base: any) => ({ ...base, padding: '0 6px' }),
                                        indicatorsContainer: (base: any) => ({ ...base, height: '30px' }),
                                        dropdownIndicator: (base: any) => ({ ...base, padding: '4px' }),
                                        clearIndicator: (base: any) => ({ ...base, padding: '4px' }),
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">Etiketler</label>
                                <Select
                                    value={filterTags}
                                    isMulti
                                    components={makeAnimated()}
                                    options={tagsOptions}
                                    placeholder="Seçiniz..."
                                    classNamePrefix="select"
                                    name="tags"
                                    onChange={(selectedOptions: any) => setFilterTags(selectedOptions || [])}
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                        control: (base: any) => ({ ...base, minHeight: '30px', fontSize: '12px' }),
                                        valueContainer: (base: any) => ({ ...base, padding: '0 6px' }),
                                        indicatorsContainer: (base: any) => ({ ...base, height: '30px' }),
                                        dropdownIndicator: (base: any) => ({ ...base, padding: '4px' }),
                                        clearIndicator: (base: any) => ({ ...base, padding: '4px' }),
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">Durum</label>
                                <Select
                                    value={filterStatus}
                                    isClearable
                                    options={statusOptions}
                                    placeholder="Seçiniz..."
                                    classNamePrefix="select"
                                    name="status"
                                    onChange={(selectedOption: any) => setFilterStatus(selectedOption)}
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                        control: (base: any) => ({ ...base, minHeight: '30px', fontSize: '12px' }),
                                        valueContainer: (base: any) => ({ ...base, padding: '0 6px' }),
                                        indicatorsContainer: (base: any) => ({ ...base, height: '30px' }),
                                        dropdownIndicator: (base: any) => ({ ...base, padding: '4px' }),
                                        clearIndicator: (base: any) => ({ ...base, padding: '4px' }),
                                    }}
                                />
                            </div>
                        </div>
                        {/* Satır 3: Tarih aralığı */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">Oluşturma Tarihi (Başlangıç)</label>
                                <Flatpickr
                                    placeholder="Başlangıç tarihi seçin..."
                                    options={{ dateFormat: 'd.m.Y', altInput: true, altFormat: 'd.m.Y', locale: Turkish }}
                                    value={filterStartDate ? new Date(filterStartDate) : undefined}
                                    className="form-input py-1 text-xs"
                                    onChange={(dates) => setFilterStartDate(dates[0] ? `${dates[0].getFullYear()}-${String(dates[0].getMonth() + 1).padStart(2, '0')}-${String(dates[0].getDate()).padStart(2, '0')}` : '')}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">Oluşturma Tarihi (Bitiş)</label>
                                <Flatpickr
                                    placeholder="Bitiş tarihi seçin..."
                                    options={{ dateFormat: 'd.m.Y', altInput: true, altFormat: 'd.m.Y', locale: Turkish }}
                                    value={filterEndDate ? new Date(filterEndDate) : undefined}
                                    className="form-input py-1 text-xs"
                                    onChange={(dates) => setFilterEndDate(dates[0] ? `${dates[0].getFullYear()}-${String(dates[0].getMonth() + 1).padStart(2, '0')}-${String(dates[0].getDate()).padStart(2, '0')}` : '')}
                                />
                            </div>
                        </div>
                    </div>
                </Collapse>
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
                                        {can('categories.change-status') ? (
                                        <Tooltip label="Tıklayarak Durumu değiştirebiliriniz">
                                            <button className="items-center" onClick={() => handleChangeStatus(record.id)}>
                                                {record.is_active ? (
                                                    <IconRefresh className="text-green-500 hover:text-green-700" />
                                                ) : (
                                                    <IconRefresh className="text-red-500 hover:text-red-700" />
                                                )}
                                            </button>
                                        </Tooltip>
                                        ) : (
                                            record.is_active ? <IconRefresh className="text-green-500" /> : <IconRefresh className="text-red-500" />
                                        )}
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
                                        {can('categories.update') && (
                                        <button
                                            onClick={() => handleEdit(record.id)}
                                            className="p-2"
                                        >
                                            <IconEdit />
                                        </button>
                                        )}
                                        {can('categories.delete') && (
                                        <button
                                            onClick={() => handleDelete(record.id, record.name)}
                                            className="p-2"
                                        >
                                            <IconXCircle />
                                        </button>
                                        )}
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
