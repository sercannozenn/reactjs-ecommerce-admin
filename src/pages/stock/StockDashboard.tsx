import { useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Modal, Tooltip } from '@mantine/core';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { setPageTitle } from '../../store/themeConfigSlice';
import { useCan } from '../../utils/permissions';
import { route } from '../../utils/RouteHelper';
import { stockService } from '../../api/services/stockService';
import { ProductSizeStockItem } from '../../types/stock';

type ModalMode = 'adjust' | 'restock' | 'damage' | null;

const movementTypeLabel: Record<string, string> = {
    order_deduction:    'Sipariş Düşümü',
    order_cancellation: 'İptal İadesi',
    manual_adjustment:  'Manuel Düzeltme',
    restock:            'Stok Girişi',
    damage:             'Hasar/Fire',
};

const StockDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const can = useCan();

    const [data, setData] = useState<ProductSizeStockItem[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(false);

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedItem, setSelectedItem] = useState<ProductSizeStockItem | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [formNewStock, setFormNewStock] = useState('');
    const [formQuantity, setFormQuantity] = useState('');
    const [formNote, setFormNote] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('Stok Yönetimi'));
    }, [dispatch]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await stockService.getLowStock(page, 20);
                setData(res.data ?? []);
                setTotal(res.meta?.total ?? res.total ?? 0);
            } catch {
                // sessiz
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [page, refreshKey]);

    const openModal = (item: ProductSizeStockItem, mode: ModalMode) => {
        setSelectedItem(item);
        setModalMode(mode);
        setFormNewStock(String(item.stock));
        setFormQuantity('1');
        setFormNote('');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedItem(null);
        setFormNewStock('');
        setFormQuantity('');
        setFormNote('');
    };

    const handleSubmit = async () => {
        if (!selectedItem || !modalMode) return;

        const newStockNum = parseInt(formNewStock, 10);
        const quantityNum = parseInt(formQuantity, 10);

        if (modalMode === 'adjust') {
            if (isNaN(newStockNum) || newStockNum < 0) {
                Swal.fire({ icon: 'error', title: 'Hata', text: 'Geçerli bir stok miktarı girin.', confirmButtonText: 'Tamam' });
                return;
            }
            if (!formNote.trim()) {
                Swal.fire({ icon: 'error', title: 'Hata', text: 'Not alanı zorunludur.', confirmButtonText: 'Tamam' });
                return;
            }
        } else {
            if (isNaN(quantityNum) || quantityNum < 1) {
                Swal.fire({ icon: 'error', title: 'Hata', text: 'Miktar en az 1 olmalıdır.', confirmButtonText: 'Tamam' });
                return;
            }
            if (modalMode === 'damage' && !formNote.trim()) {
                Swal.fire({ icon: 'error', title: 'Hata', text: 'Hasar kaydı için not zorunludur.', confirmButtonText: 'Tamam' });
                return;
            }
        }

        setSubmitting(true);
        try {
            if (modalMode === 'adjust') {
                await stockService.adjust(selectedItem.id, newStockNum, formNote.trim());
            } else if (modalMode === 'restock') {
                await stockService.restock(selectedItem.id, quantityNum, formNote.trim() || undefined);
            } else if (modalMode === 'damage') {
                await stockService.damage(selectedItem.id, quantityNum, formNote.trim());
            }

            closeModal();
            setRefreshKey((p) => !p);

            Swal.fire({
                icon: 'success',
                title: 'Başarılı!',
                text: modalMode === 'adjust'
                    ? 'Stok düzeltildi.'
                    : modalMode === 'restock'
                    ? 'Stok girişi kaydedildi.'
                    : 'Hasar kaydı oluşturuldu.',
                confirmButtonText: 'Tamam',
            });
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'İşlem gerçekleştirilemedi.';
            Swal.fire({ icon: 'error', title: 'Hata!', text: msg, confirmButtonText: 'Tamam' });
        } finally {
            setSubmitting(false);
        }
    };

    const modalTitle =
        modalMode === 'adjust'
            ? 'Stok Düzeltme'
            : modalMode === 'restock'
            ? 'Stok Girişi'
            : 'Hasar / Fire Kaydı';

    const getStockBadge = (item: ProductSizeStockItem) => {
        if (item.stock === 0) return <span className="badge bg-danger">Tükendi</span>;
        return <span className="badge bg-warning">{item.stock} adet</span>;
    };

    const columns = [
        {
            accessor: 'product',
            title: 'Ürün',
            render: (record: ProductSizeStockItem) => (
                <button
                    type="button"
                    className="text-primary hover:underline font-medium text-left"
                    onClick={() => navigate(route('ProductStockMovements', { id: record.product_id }))}
                >
                    {record.product?.name ?? `Ürün #${record.product_id}`}
                </button>
            ),
        },
        {
            accessor: 'size',
            title: 'Beden',
            render: (record: ProductSizeStockItem) => (
                <span className="font-semibold">{record.size}</span>
            ),
        },
        {
            accessor: 'stock',
            title: 'Mevcut Stok',
            render: (record: ProductSizeStockItem) => getStockBadge(record),
        },
        {
            accessor: 'low_stock_threshold',
            title: 'Uyarı Eşiği',
            render: (record: ProductSizeStockItem) => (
                <span className="text-gray-500">{record.low_stock_threshold} adet</span>
            ),
        },
        {
            accessor: 'actions',
            title: 'İşlemler',
            render: (record: ProductSizeStockItem) =>
                can('stock.adjust') ? (
                    <div className="flex gap-2">
                        <Tooltip label="Stok Girişi">
                            <button
                                type="button"
                                className="btn btn-xs btn-success"
                                onClick={() => openModal(record, 'restock')}
                            >
                                + Giriş
                            </button>
                        </Tooltip>
                        <Tooltip label="Stok Düzeltme">
                            <button
                                type="button"
                                className="btn btn-xs btn-outline-primary"
                                onClick={() => openModal(record, 'adjust')}
                            >
                                Düzelt
                            </button>
                        </Tooltip>
                        <Tooltip label="Hasar / Fire">
                            <button
                                type="button"
                                className="btn btn-xs btn-outline-danger"
                                onClick={() => openModal(record, 'damage')}
                            >
                                Hasar
                            </button>
                        </Tooltip>
                    </div>
                ) : null,
        },
    ];

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <div>
                        <h5 className="font-semibold text-lg dark:text-white-light">Düşük Stok Uyarıları</h5>
                        <p className="text-sm text-gray-500 mt-0.5">Uyarı eşiğinin altındaki ürünler</p>
                    </div>
                    <div className="ltr:ml-auto rtl:mr-auto">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => navigate(route('StockMovements'))}
                        >
                            Tüm Hareketler →
                        </button>
                    </div>
                </div>

                {total === 0 && !loading && (
                    <div className="text-center py-10 text-gray-400">
                        <p className="text-2xl mb-2">✓</p>
                        <p>Tüm ürünlerin stoğu uyarı eşiğinin üzerinde.</p>
                    </div>
                )}

                {(total > 0 || loading) && (
                    <div className="datatables">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={data}
                            columns={columns}
                            highlightOnHover
                            totalRecords={total}
                            recordsPerPage={20}
                            page={page}
                            onPageChange={setPage}
                            fetching={loading}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) =>
                                `${totalRecords} kayıttan ${from} ile ${to} arasındaki satırlar görüntüleniyor.`
                            }
                        />
                    </div>
                )}
            </div>

            {/* ── Stok İşlem Modalı ── */}
            <Modal
                opened={modalMode !== null}
                onClose={closeModal}
                title={<span className="font-semibold">{modalTitle}</span>}
                size="sm"
                centered
            >
                {selectedItem && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                            <p><span className="font-medium">Ürün:</span> {selectedItem.product?.name ?? `#${selectedItem.product_id}`}</p>
                            <p><span className="font-medium">Beden:</span> {selectedItem.size}</p>
                            <p><span className="font-medium">Mevcut Stok:</span> {selectedItem.stock} adet</p>
                        </div>

                        {modalMode === 'adjust' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Yeni Stok Miktarı <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-input"
                                    value={formNewStock}
                                    onChange={(e) => setFormNewStock(e.target.value)}
                                />
                            </div>
                        )}

                        {(modalMode === 'restock' || modalMode === 'damage') && (
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Miktar <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-input"
                                    value={formQuantity}
                                    onChange={(e) => setFormQuantity(e.target.value)}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Not {(modalMode === 'adjust' || modalMode === 'damage') && <span className="text-danger">*</span>}
                                {modalMode === 'restock' && <span className="text-gray-400">(opsiyonel)</span>}
                            </label>
                            <textarea
                                className="form-textarea"
                                rows={3}
                                placeholder={
                                    modalMode === 'adjust'
                                        ? 'Düzeltme nedeni...'
                                        : modalMode === 'restock'
                                        ? 'Tedarik bilgisi...'
                                        : 'Hasar açıklaması...'
                                }
                                value={formNote}
                                onChange={(e) => setFormNote(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeModal} disabled={submitting}>
                                İptal
                            </button>
                            <button
                                type="button"
                                className={`btn btn-sm ${modalMode === 'damage' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StockDashboard;
