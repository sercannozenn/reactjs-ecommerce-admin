import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconEdit from '../../components/Icon/IconEdit';
import IconRefresh from '../../components/Icon/IconRefresh';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { Tooltip } from '@mantine/core';
import { SliderService } from '../../api/services/SliderService';

const PAGE_SIZES = [5, 10, 20, 50, 100];

const SliderList = () => {
    const navigateToRoute = useRouteNavigator();
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZES[1]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'desc' });

    const fetchData = async () => {
        setLoading(true);
        const response = await SliderService.list(page, rowsPerPage, search, sortStatus);
        setData(response.data.data);
        setTotal(response.data.total);
        setLoading(false);
    };

    const handleDelete = async (item: any) => {
        Swal.fire({
            title: 'Emin misiniz?',
            text: `ID: ${item.id} olan slider silinecek!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, sil',
            cancelButtonText: 'Vazgeç'
        }).then(async result => {
            if (result.isConfirmed) {
                await SliderService.delete(item.id);
                fetchData();
            }
        });
    };

    const handleChangeStatus = async (item: any) => {
        await SliderService.changeStatus(item.id);
        fetchData();
    };

    useEffect(() => {
        fetchData();
    }, [page, rowsPerPage, sortStatus, search]);

    const columns = [
        { accessor: 'id', title: '#', sortable: true },
        { accessor: 'row_1_text', title: '1. Satır' },
        { accessor: 'row_2_text', title: '2. Satır' },
        { accessor: 'button_text', title: 'Buton' },
        {
            accessor: 'is_active',
            title: 'Durum',
            render: (item: any) => (
                <Tooltip label="Tıklayarak durumu değiştirebilirsiniz">
                    <button
                        onClick={() => handleChangeStatus(item)}
                        className={`text-sm px-2 py-1 rounded font-semibold ${
                            item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                    >
                        {item.is_active ? 'Aktif' : 'Pasif'}
                    </button>
                </Tooltip>
            )
        },
        {
            accessor: 'actions',
            title: 'İşlem',
            render: (item: any) => (
                <div className="flex items-center gap-2">
                    <Tooltip label="Düzenle">
                        <button onClick={() => navigateToRoute('SliderEdit', { id: item.id })}>
                            <IconEdit />
                        </button>
                    </Tooltip>
                    <Tooltip label="Sil">
                        <button onClick={() => handleDelete(item)}>
                            <IconXCircle className="text-red-500" />
                        </button>
                    </Tooltip>
                </div>
            )
        }
    ];

    return (
        <div className="panel">
            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-lg font-bold">Slider Listesi</h1>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Ara..."
                        className="input input-sm max-w-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button onClick={() => navigateToRoute('SliderAdd')} className="btn btn-primary">Ekle</button>
                    <button onClick={fetchData} className="btn btn-secondary"><IconRefresh /></button>
                </div>
            </div>

            <DataTable
                highlightOnHover
                className="table-hover whitespace-nowrap"
                records={data}
                columns={columns}
                totalRecords={total}
                recordsPerPage={rowsPerPage}
                page={page}
                onPageChange={setPage}
                onRecordsPerPageChange={setRowsPerPage}
                recordsPerPageOptions={PAGE_SIZES}
                sortStatus={sortStatus}
                onSortStatusChange={setSortStatus}
                fetching={loading}
            />
        </div>
    );
};

export default SliderList;
