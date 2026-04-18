import { useEffect, useState } from 'react';
import { DataTable } from 'mantine-datatable';
import { Modal, Tooltip } from '@mantine/core';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { setPageTitle } from '../../store/themeConfigSlice';
import { useCan } from '../../utils/permissions';
import { stockService } from '../../api/services/stockService';
import { StockMovementItem, ProductSizeStockItem } from '../../types/stock';

type ModalMode = 'adjust' | 'restock' | 'damage' | null;

const typeLabels: Record<string, string> = {
    order_deduction:    'Sipariş Düşümü',
    order_cancellation: 'İptal İadesi',
    manual_adjustment:  'Manuel Düzeltme',
    restock:            'Stok Girişi',
    damage:             'Hasar/Fire',
};
const typeColors: Record<string, string> = {
    order_deduction:    'bg-danger',
    order_cancellation: 'bg-success',
    manual_adjustment:  'bg-info',
    restock:            'bg-primary',
    damage:             'bg-warning',
};

const formatDate = (val: string) => {
    const d = new Date(val);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString('tr-TR');
};

const ProductStockMovements = () => {
    const { id } = useParams<{ id: string }>();
    const productId = parseInt(id ?? '0', 10);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const can = useCan();

    const [movements, setMovements] = useState<StockMovementItem[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [productName, setProductName] = useState('');
    const [refreshKey, setRefreshKey] = useState(false);

    // Unique size stocks extracted from movements
    const [sizeStocks, setSizeStocks] = useState<ProductSizeStockItem[]>([]);

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [selectedSizeStock, setSelectedSizeStock] = useState<ProductSizeStockItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formNewStock, setFormNewStock] = useState('');
    const [formQuantity, setFormQuantity] = useState('');
    const [formNote, setFormNote] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('Ürün Stok Geçmişi'));
    }, [dispatch]);

    useEffect(() => {
        if (!productId) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await stockService.getProductMovements(productId, page, 20);
                const items = res.data ?? [];
                setMovements(items);
                setTotal(res.meta?.total ?? res.total ?? 0);

                if (items.length > 0) {
                    const name = items[0].productSizeStock?.product?.name;
                    if (name) setProductName(name);

                    // Tekil size stock'ları çıkar (mevcut stok için API'den fresh veri lazım, hareket kaydından al)
                    const seen = new Set<number>();
                    const unique: ProductSizeStockItem[] = [];
                    items.forEach((m) => {
                        if (m.productSizeStock && !seen.has(m.productSizeStock.id)) {
                            seen.add(m.productSizeStock.id);
                            // stock_after en son hareketten geldiği için gerçek stok değil ama gösterge için yeterli
                            unique.push(m.productSizeStock);
                        }
                    });
                    setSizeStocks(unique);
                }
            } catch {
                // sessiz
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [productId, page, refreshKey]);

    const openModal = (sizeStock: ProductSizeStockItem, mode: ModalMode) => {
        setSelectedSizeStock(sizeStock);
        setModalMode(mode);
        setFormNewStock(String(sizeStock.stock ?? 0));
        setFormQuantity('1');
        setFormNote('');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedSizeStock(null);
        setFormNewStock('');
        setFormQuantity('');
        setFormNote('');
    };

    const handleSubmit = async () => {
        if (!selectedSizeStock || !modalMode) return;

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
                await stockService.adjust(selectedSizeStock.id, newStockNum, formNote.trim());
            } else if (modalMode === 'restock') {
                await stockService.restock(selectedSizeStock.id, quantityNum, formNote.trim() || undefined);
            } else {
                await stockService.damage(selectedSizeStock.id, quantityNum, formNote.trim());
            }
            closeModal();
            setRefreshKey((p) => !p);
            Swal.fire({ icon: 'success', title: 'Başarılı!', text: 'İşlem kaydedildi.', confirmButtonText: 'Tamam' });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Hata!', text: error?.response?.data?.message ?? 'İşlem başarısız.', confirmButtonText: 'Tamam' });
        } finally {
            setSubmitting(false);
        }
    };

    const modalTitle =
        modalMode === 'adjust' ? 'Stok Düzeltme' : modalMode === 'restock' ? 'Stok Girişi' : 'Hasar / Fire Kaydı';

    const columns = [
        {
            accessor: 'type',
            title: 'Tür',
            render: (r: StockMovementItem) => (
                <span className={`badge ${typeColors[r.type] ?? 'bg-secondary'}`}>{typeLabels[r.type] ?? r.type}</span>
            ),
        },
        {
            accessor: 'size',
            title: 'Beden',
            render: (r: StockMovementItem) => <span>{r.productSizeStock?.size ?? '-'}</span>,
        },
        {
            accessor: 'quantity',
            title: 'Miktar',
            render: (r: StockMovementItem) => (
                <span className={r.quantity > 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                    {r.quantity > 0 ? `+${r.quantity}` : r.quantity}
                </span>
            ),
        },
        {
            accessor: 'stock_before',
            title: 'Önceki',
        },
        {
            accessor: 'stock_after',
            title: 'Sonraki',
        },
        {
            accessor: 'order',
            title: 'Sipariş',
            render: (r: StockMovementItem) =>
                r.order ? <span className="text-xs font-mono">{r.order.order_number}</span> : <span className="text-gray-400">-</span>,
        },
        {
            accessor: 'createdBy',
            title: 'İşlemi Yapan',
            render: (r: StockMovementItem) =>
                r.createdBy ? <span className="text-xs">{r.createdBy.name}</span> : <span className="text-gray-400 text-xs">Sistem</span>,
        },
        {
            accessor: 'note',
            title: 'Not',
            render: (r: StockMovementItem) => (
                <span className="text-xs text-gray-500 truncate max-w-[160px] block">{r.note ?? '-'}</span>
            ),
        },
        {
            accessor: 'created_at',
            title: 'Tarih',
            render: (r: StockMovementItem) => <span className="text-xs">{formatDate(r.created_at)}</span>,
        },
    ];

    return (
        <div>
            {/* Breadcrumb benzeri başlık */}
            <div className="flex items-center gap-2 mt-6 mb-4 text-sm text-gray-500">
                <button type="button" className="hover:text-primary" onClick={() => navigate(-1)}>← Geri</button>
                <span>/</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{productName || `Ürün #${productId}`} — Stok Geçmişi</span>
            </div>

            {/* Beden bazlı hızlı işlem kartları */}
            {can('stock.adjust') && sizeStocks.length > 0 && (
                <div className="panel mb-4">
                    <h6 className="font-semibold mb-3 text-sm">Hızlı İşlem</h6>
                    <div className="flex flex-wrap gap-3">
                        {sizeStocks.map((ss) => (
                            <div key={ss.id} className="border border-[#e0e6ed] dark:border-[#253b5c] rounded px-3 py-2 flex items-center gap-3">
                                <div>
                                    <p className="font-semibold text-sm">{ss.size}</p>
                                    <p className="text-xs text-gray-400">Stok: {ss.stock ?? '?'}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Tooltip label="Stok Girişi">
                                        <button type="button" className="btn btn-xs btn-success" onClick={() => openModal(ss, 'restock')}>+ Giriş</button>
                                    </Tooltip>
                                    <Tooltip label="Düzelt">
                                        <button type="button" className="btn btn-xs btn-outline-primary" onClick={() => openModal(ss, 'adjust')}>Düzelt</button>
                                    </Tooltip>
                                    <Tooltip label="Hasar">
                                        <button type="button" className="btn btn-xs btn-outline-danger" onClick={() => openModal(ss, 'damage')}>Hasar</button>
                                    </Tooltip>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="panel">
                <h5 className="font-semibold text-lg mb-4 dark:text-white-light">Stok Hareketleri</h5>
                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={movements}
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
            </div>

            {/* Modal */}
            <Modal opened={modalMode !== null} onClose={closeModal} title={<span className="font-semibold">{modalTitle}</span>} size="sm" centered>
                {selectedSizeStock && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                            <p><span className="font-medium">Beden:</span> {selectedSizeStock.size}</p>
                            <p><span className="font-medium">Mevcut Stok:</span> {selectedSizeStock.stock ?? '?'} adet</p>
                        </div>

                        {modalMode === 'adjust' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Yeni Stok Miktarı <span className="text-danger">*</span></label>
                                <input type="number" min="0" className="form-input" value={formNewStock} onChange={(e) => setFormNewStock(e.target.value)} />
                            </div>
                        )}
                        {(modalMode === 'restock' || modalMode === 'damage') && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Miktar <span className="text-danger">*</span></label>
                                <input type="number" min="1" className="form-input" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Not {modalMode !== 'restock' && <span className="text-danger">*</span>}
                                {modalMode === 'restock' && <span className="text-gray-400">(opsiyonel)</span>}
                            </label>
                            <textarea className="form-textarea" rows={3} value={formNote} onChange={(e) => setFormNote(e.target.value)} />
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeModal} disabled={submitting}>İptal</button>
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

export default ProductStockMovements;
