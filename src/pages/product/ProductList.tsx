import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import Swal from 'sweetalert2';
import Dropdown from '../../components/Dropdown';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconCaretDown from '../../components/Icon/IconCaretDown';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconEdit from '../../components/Icon/IconEdit';
import { ProductService } from '../../api/services/ProductService';
import { useRouteNavigator } from '../../utils/RouteHelper';
import IconRefresh from '../../components/Icon/IconRefresh';
import IconSettings from '../../components/Icon/IconSettings';
import IconPlus from '../../components/Icon/IconPlus';
import { Box, Collapse, Tooltip } from '@mantine/core';
import makeAnimated from 'react-select/animated';
import Select, { ActionMeta, MultiValue } from 'react-select';
import '../../assets/css/style.css';

const customNoOptionsMessage = () => {
    return (
        <div style={{ textAlign: 'center', color: 'gray' }}>
            Aradığınız şeçenek bulunamadı.
        </div>
    );
};

const PAGE_SIZES = [5, 10, 20, 50, 100];
const cols = [
    { accessor: 'id', title: 'ID' },
    { accessor: 'name', title: 'Ürün Adı' },
    { accessor: 'slug', title: 'Slug' },
    { accessor: 'short_description', title: 'Kısa Açıklama' },
    { accessor: 'long_description', title: 'Uzun Açıklama' },
    { accessor: 'brand', title: 'Marka' },
    { accessor: 'categories', title: 'Kategoriler' },
    { accessor: 'tags', title: 'Etiketler' },
    { accessor: 'price', title: 'Ana Fiyat' },
    { accessor: 'price_discount', title: 'İndirimli Son Fiyat' },
    { accessor: 'stock', title: 'Stok' },
    { accessor: 'is_active', title: 'Durum' },
    { accessor: 'created_at', title: 'Oluşturma Tarihi' }
];

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string;
    short_description: string;
    long_description: string;
    brand: { id: number; name: string };
    categories: { id: number; name: string }[];
    tags: { id: number; name: string }[];
    prices: { id: number, price: number, price_discount: number }[];
    stock: number;
    is_active: number;
    formatted_created_at: string;
};
type SelectOptionsType = {
    value: number,
    label: string
}

const ProductList = () => {
    const dispatch = useDispatch();
    const navigateToRoute = useRouteNavigator();

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
    const [data, setData] = useState<Product[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    // const [search, setSearch] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZES[1]);
    const [refreshLoad, setRefreshLoad] = useState(false);


    const [filterData, setFilterData] = useState<Record<string, any>>({
        search: '', // Arama için alan ekleniyor
        brands: [],
        categories: [],
        tags: [],
        min_price: '',
        max_price: '',
        min_price_discount: '',
        max_price_discount: ''
    });
    const [brands, setBrands] = useState([]); // Markalar
    const [categories, setCategories] = useState([]); // Üst kategoriler
    const [tagsOptions, setTagsOptions] = useState([]); // Etiket seçenekleri

    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'id',
        direction: 'asc'
    });

    const [hideCols, setHideCols] = useState<any>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const showHideColumns = (col: any, value: any) => {
        if (hideCols.includes(col)) {
            setHideCols((col: any) => hideCols.filter((d: any) => d !== col));
        } else {
            setHideCols([...hideCols, col]);
        }
    };

    const handleDelete = (id: number, name: string) => {
        Swal.fire({
            icon: 'warning',
            title: 'Ürün Sil',
            text: name + ' adlı ürünü silmek istediğinize emin misiniz?',
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
                    const response = await ProductService.delete(id);
                    setRefreshLoad(prev => !prev);

                    Swal.fire({
                        title: 'Silindi!',
                        text: name + ' adlı ürün silindi.',
                        icon: 'success',
                        confirmButtonText: 'Tamam',
                        customClass: { popup: 'sweet-alerts' }
                    });
                } catch (error) {
                    Swal.fire({
                        title: 'Hata!',
                        text: name + ' adlı ürün silinemedi. Hata Alındı.',
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
        navigateToRoute('ProductEdit', { id });
    };
    const handleChangeStatus = async (id: number) => {
        try {
            const response = await ProductService.changeStatus(id);

            setData((prevData) =>
                prevData.map((product: Product) =>
                    product.id === id ? { ...product, is_active: (product.is_active ? 0 : 1) } : product
                )
            );

            let currentIsActiveText = response.data.is_active ? 'Aktif' : 'Pasif';
            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: `Ürün durumu ${currentIsActiveText} olarak değiştirildi.`,
                confirmButtonText: 'Tamam'
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                text: 'Ürün durumu değiştirilemedi. Lütfen tekrar deneyin.',
                confirmButtonText: 'Tamam'
            });
        }
    };
    const getFiltersData = async () => {
        try {
            const response = await ProductService.getFiltersData();

            setBrands(
                response.data.brands.map((brand: any) => ({
                    value: brand.id,
                    label: brand.name
                }))
            );

            setCategories(
                response.data.categories.map((category: any) => ({
                    value: category.id,
                    label: category.name
                }))
            );

            setTagsOptions(
                response.data.tags.map((tag: any) => ({
                    value: tag.id,
                    label: tag.name
                }))
            );
        } catch (error) {
            console.error('Filtre verileri çekilirken hata oluştu:', error);
        }
    };
    const prepareFilters = (filters: Record<string, any>) => {
        const preparedFilters = { ...filters };

        if (filters.brands) {
            preparedFilters.brands = filters.brands.map((brand: SelectOptionsType) => brand.value);
        }
        // Categories ve Tags'ı ID dizisine dönüştür
        if (filters.categories) {
            preparedFilters.categories = filters.categories.map((category: SelectOptionsType) => category.value);
        }

        if (filters.tags) {
            preparedFilters.tags = filters.tags.map((tag: SelectOptionsType) => tag.value);
        }

        return preparedFilters;
    };
    useEffect(() => {
        dispatch(setPageTitle('Ürün Listesi'));
    });
    useEffect(() => {
        getFiltersData();
    }, []);
    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            try {
                const preparedFilterData = prepareFilters(filterData);

                const response = await ProductService.list(page, rowsPerPage, sortStatus, preparedFilterData);
                setData(response.data.data);
                setTotal(response.data.total);
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
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
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Ürün Listesi</h5>
                    <div className="ltr:ml-auto rtl:mr-auto flex gap-2">
                        <button
                            type="button"
                            className={`btn ${isFilterOpen ? 'btn-primary' : 'btn-outline-primary'} gap-2`}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                        >
                            <IconSettings />
                            Filtreler
                        </button>
                        {/*<button type="button" className="btn btn-primary gap-2" onClick="">*/}
                        {/*    <IconPlus />*/}
                        {/*    Yeni Ekle*/}
                        {/*</button>*/}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="dropdown my-5">
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
                    <Collapse in={isFilterOpen} >
                        <div className="flex flex-col gap-5 my-5 filter-product-list">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <input type="text" className="form-input" placeholder="Arama Yap..."
                                           value={filterData.search}
                                           onChange={(e) =>
                                               setFilterData((prevData) => ({
                                                   ...prevData,
                                                   search: e.target.value
                                               }))} />
                                </div>
                                <div>
                                    <Select
                                        value={filterData.brands}
                                        isMulti
                                        components={{ ...makeAnimated(), NoOptionsMessage: customNoOptionsMessage }}
                                        options={brands}
                                        className="basic-multi-select"
                                        placeholder="Markalar"
                                        classNamePrefix="select"
                                        name="brands"
                                        onChange={(selectedOptions) =>
                                            setFilterData((prevData) => ({
                                                ...prevData,
                                                brands: selectedOptions
                                            }))
                                        }
                                    />
                                </div>

                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-right">
                                        <Select
                                            value={filterData.categories}
                                            isMulti
                                            components={{ ...makeAnimated(), NoOptionsMessage: customNoOptionsMessage }}
                                            options={categories}
                                            className="basic-multi-select"
                                            placeholder="Kategoriler"
                                            classNamePrefix="select"
                                            name="categories"
                                            onChange={(selectedOptions) =>
                                                setFilterData((prevData) => ({
                                                    ...prevData,
                                                    categories: selectedOptions
                                                }))
                                            }
                                        />
                                </div>
                                <div className="text-right">
                                    <Select
                                        value={filterData.tags}
                                        isMulti
                                        components={{ ...makeAnimated(), NoOptionsMessage: customNoOptionsMessage }}
                                        options={tagsOptions}
                                        className="basic-multi-select"
                                        placeholder="Etiketler"
                                        classNamePrefix="select"
                                        name="tags"
                                        onChange={(selectedOptions) =>
                                            setFilterData((prevData) => ({
                                                ...prevData,
                                                tags: selectedOptions
                                            }))
                                        }
                                    />
                                </div>
                                <div className="text-right">
                                    <div className="flex">
                                        <input type="number" placeholder="Minimum Fiyat"
                                               className="form-input ltr:border-r-0 rtl:border-l-0 focus:!border-r rounded-none flex-1"
                                               value={filterData.min_price}
                                               onChange={(e) =>
                                                   setFilterData((prevData) => ({
                                                       ...prevData,
                                                       min_price: e.target.value
                                                   }))
                                               }

                                        />
                                        <input type="number"
                                               placeholder="Maksimum Fiyat"
                                               className="form-input ltr:rounded-l-none rtl:rounded-r-none flex-1"
                                               value={filterData.max_price}
                                               onChange={(e) =>
                                                   setFilterData((prevData) => ({
                                                       ...prevData,
                                                       max_price: e.target.value
                                                   }))
                                               }
                                        />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex">
                                        <input type="number" placeholder="Minimum İndirimli Fiyat"
                                               className="form-input ltr:border-r-0 rtl:border-l-0 focus:!border-r rounded-none flex-1"
                                               value={filterData.min_price_discount}
                                               onChange={(e) =>
                                                   setFilterData((prevData) => ({
                                                       ...prevData,
                                                       min_price_discount: e.target.value
                                                   }))
                                               }

                                        />
                                        <input type="number"
                                               placeholder="Maksimum İndirimli Fiyat"
                                               className="form-input ltr:rounded-l-none rtl:rounded-r-none flex-1"
                                               value={filterData.max_price_discount}
                                               onChange={(e) =>
                                                   setFilterData((prevData) => ({
                                                       ...prevData,
                                                       max_price_discount: e.target.value
                                                   }))
                                               }
                                        />
                                    </div>
                                </div>
                            </div>


                        </div>
                    </Collapse>

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
                                title: 'Ürün Adı',
                                sortable: true,
                                hidden: hideCols.includes('name')
                            },
                            {
                                accessor: 'slug',
                                title: 'Ürün Slug Adı',
                                sortable: true,
                                hidden: hideCols.includes('slug')
                            },
                            {
                                accessor: 'short_description',
                                title: 'Kısa Açıklama',
                                sortable: true,
                                hidden: hideCols.includes('short_description'),
                                render: (record: Product) => (
                                    <Tooltip
                                        label={<Box dangerouslySetInnerHTML={{ __html: record.short_description }} />}>
                                        <div
                                            dangerouslySetInnerHTML={{ __html: record.short_description.substring(0, 30) }} />
                                    </Tooltip>
                                )
                            },
                            {
                                accessor: 'long_description',
                                title: 'Uzun Açıklama',
                                sortable: true,
                                hidden: hideCols.includes('long_description'),
                                render: (record: Product) => (
                                    <Tooltip
                                        label={<Box dangerouslySetInnerHTML={{ __html: record.long_description }} />}>
                                        <div
                                            dangerouslySetInnerHTML={{ __html: record.long_description.substring(0, 30) }} />
                                    </Tooltip>
                                )
                            },
                            {
                                accessor: 'brand',
                                title: 'Marka',
                                sortable: false,
                                hidden: hideCols.includes('brand'),
                                render: (record: Product) => (
                                    <div className="flex flex-wrap gap-1">
                                        {record?.brand?.name}
                                    </div>
                                )
                            },
                            {
                                accessor: 'categories',
                                title: 'Kategoriler',
                                sortable: false,
                                hidden: hideCols.includes('categories'),
                                render: (record: Product) => (
                                    <div className="flex flex-wrap gap-1">
                                        {record.categories.map((category) => (
                                            <span key={category.id}
                                                  className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                                {category.name}
                                            </span>
                                        ))}
                                    </div>
                                )
                            },
                            {
                                accessor: 'tags',
                                title: 'Etiketler',
                                sortable: false,
                                hidden: hideCols.includes('tags'),
                                render: (record: Product) => (
                                    <div className="flex flex-wrap gap-1">
                                        {record.tags.map((tag) => (
                                            <span key={tag.id} className="px-2 py-1 bg-blue-100 rounded-full text-xs">
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )
                            },
                            {
                                accessor: 'price',
                                title: 'Ana Fiyat',
                                sortable: true,
                                hidden: hideCols.includes('price'),
                                render: (record: Product) => (
                                    <span>{record.prices[0].price.toLocaleString('tr-TR', {
                                        style: 'currency',
                                        currency: 'TRY'
                                    })}</span>
                                )
                            },
                            {
                                accessor: 'price_discount',
                                title: 'İndirimli Son Fiyat',
                                sortable: true,
                                hidden: hideCols.includes('price_discount'),
                                render: (record: Product) => (
                                    <span>{record.prices[0].price_discount?.toLocaleString('tr-TR', {
                                        style: 'currency',
                                        currency: 'TRY'
                                    })}</span>
                                )
                            },
                            {
                                accessor: 'stock',
                                title: 'Stok',
                                sortable: true,
                                hidden: hideCols.includes('stock')
                            },
                            {
                                accessor: 'is_active',
                                title: 'Durum',
                                sortable: true,
                                hidden: hideCols.includes('is_active'),
                                render: (record: Product) => (
                                    <div>
                                        <Tooltip label="Tıklayarak durumu değiştirebilirsiniz">
                                            <button className="items-center"
                                                    onClick={() => handleChangeStatus(record.id)}>
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
                                render: (record: Product) => (
                                    <div className="flex space-x-2">
                                        <button onClick={() => handleEdit(record.id)} className="p-2">
                                            <IconEdit />
                                        </button>
                                        <button onClick={() => handleDelete(record.id, record.name)} className="p-2">
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

export default ProductList;
