import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { setPageTitle } from '../../store/themeConfigSlice';
import { useCan } from '../../utils/permissions';
import { orderService } from '../../api/services/orderService';
import {
    OrderDetail as IOrderDetail,
    TimelineEvent,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_BADGE,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_BADGE,
    STATUS_TRANSITIONS,
    OrderStatus,
} from '../../types/order';

import IconArrowBackward from '../../components/Icon/IconArrowBackward';
import IconPencil from '../../components/Icon/IconPencil';
import IconXCircle from '../../components/Icon/IconXCircle';
import IconNotes from '../../components/Icon/IconNotes';
import IconChecks from '../../components/Icon/IconChecks';
import IconCircleCheck from '../../components/Icon/IconCircleCheck';

const formatCurrency = (v: number) =>
    Number(v).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });

const formatDate = (v: string | null | undefined) =>
    v ? new Date(v).toLocaleString('tr-TR') : '-';

const OrderDetailPage = () => {
    const { orderNumber } = useParams<{ orderNumber: string }>();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const can = useCan();

    const [order, setOrder] = useState<IOrderDetail | null>(null);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Form state
    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [refundPayment, setRefundPayment] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Sipariş Detayı'));
    }, [dispatch]);

    useEffect(() => {
        if (!orderNumber) return;
        const load = async () => {
            setLoading(true);
            try {
                // Sipariş no ile önce liste çek, id'yi bul
                const listResponse = await orderService.list({ search: orderNumber }, 'created_at', 'desc', 1, 5);
                const found = listResponse.data?.find((o) => o.order_number === orderNumber);
                if (!found) { Swal.fire({ icon: 'error', title: 'Bulunamadı', text: 'Sipariş bulunamadı.' }); return; }

                const detailResponse = await orderService.show(found.id);
                setOrder(detailResponse.order);
                setAdminNote(detailResponse.order.admin_note ?? '');

                const tl = await orderService.timeline(found.id);
                setTimeline(tl);
            } catch {
                Swal.fire({ icon: 'error', title: 'Hata', text: 'Sipariş yüklenemedi.' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [orderNumber]);

    const refreshOrder = async () => {
        if (!order) return;
        try {
            const res = await orderService.show(order.id);
            setOrder(res.order);
            const tl = await orderService.timeline(order.id);
            setTimeline(tl);
        } catch { /* noop */ }
    };

    const handleUpdateStatus = async () => {
        if (!order || !newStatus) return;
        setSaving(true);
        try {
            const res = await orderService.updateStatus(order.id, newStatus, statusNote || undefined);
            setOrder(res.order);
            const tl = await orderService.timeline(order.id);
            setTimeline(tl);
            setShowStatusModal(false);
            setStatusNote('');
            Swal.fire({ icon: 'success', title: 'Güncellendi', text: 'Sipariş durumu değiştirildi.', confirmButtonText: 'Tamam' });
        } catch (err: any) {
            const msg = err?.response?.data?.errors?.message ?? 'Durum değiştirilemedi.';
            Swal.fire({ icon: 'error', title: 'Hata', text: msg, confirmButtonText: 'Tamam' });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateTracking = async () => {
        if (!order || !trackingNumber) return;
        setSaving(true);
        try {
            const res = await orderService.updateTracking(order.id, trackingNumber);
            setOrder(res.order);
            setShowTrackingModal(false);
            Swal.fire({ icon: 'success', title: 'Kaydedildi', text: 'Kargo takip numarası güncellendi. Müşteriye mail gönderildi.', confirmButtonText: 'Tamam' });
        } catch (err: any) {
            const msg = err?.response?.data?.errors?.message ?? 'Takip numarası kaydedilemedi.';
            Swal.fire({ icon: 'error', title: 'Hata', text: msg, confirmButtonText: 'Tamam' });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateNote = async () => {
        if (!order) return;
        setSaving(true);
        try {
            await orderService.updateAdminNote(order.id, adminNote || null);
            setOrder((prev) => prev ? { ...prev, admin_note: adminNote } : prev);
            setShowNoteModal(false);
            Swal.fire({ icon: 'success', title: 'Kaydedildi', text: 'Admin notu güncellendi.', confirmButtonText: 'Tamam' });
        } catch {
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Not kaydedilemedi.', confirmButtonText: 'Tamam' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        if (!order || !cancelReason) return;
        setSaving(true);
        try {
            const res = await orderService.cancel(order.id, cancelReason, refundPayment);
            setOrder(res.order);
            const tl = await orderService.timeline(order.id);
            setTimeline(tl);
            setShowCancelModal(false);
            setCancelReason('');
            setRefundPayment(false);
            Swal.fire({ icon: 'success', title: 'İptal Edildi', text: 'Sipariş iptal edildi. Müşteriye bildirim gönderildi.', confirmButtonText: 'Tamam' });
        } catch (err: any) {
            const msg = err?.response?.data?.errors?.message ?? 'İptal işlemi başarısız.';
            Swal.fire({ icon: 'error', title: 'Hata', text: msg, confirmButtonText: 'Tamam' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10" /></div>;
    }

    if (!order) return null;

    const allowedTransitions = STATUS_TRANSITIONS[order.status as OrderStatus] ?? [];
    const isCancellable = ['confirmed', 'preparing', 'shipped'].includes(order.status);
    const isTerminal = ['delivered', 'cancelled'].includes(order.status);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/siparisler')}>
                        <IconArrowBackward />
                    </button>
                    <h5 className="font-bold text-xl dark:text-white-light">
                        {order.order_number}
                    </h5>
                    <span className={ORDER_STATUS_BADGE[order.status]}>{ORDER_STATUS_LABELS[order.status]}</span>
                    <span className={PAYMENT_STATUS_BADGE[order.payment_status]}>{PAYMENT_STATUS_LABELS[order.payment_status]}</span>
                </div>

                {!isTerminal && (
                    <div className="flex gap-2">
                        {can('orders.update-status') && allowedTransitions.length > 0 && (
                            <button type="button" className="btn btn-primary btn-sm gap-1" onClick={() => { setNewStatus(allowedTransitions[0]); setShowStatusModal(true); }}>
                                <IconCircleCheck /> Durum Değiştir
                            </button>
                        )}
                        {can('orders.update-status') && (
                            <button type="button" className="btn btn-outline-info btn-sm gap-1" onClick={() => { setTrackingNumber(order.tracking_number ?? ''); setShowTrackingModal(true); }}>
                                Kargo Takip
                            </button>
                        )}
                        {can('orders.update-status') && (
                            <button type="button" className="btn btn-outline-secondary btn-sm gap-1" onClick={() => setShowNoteModal(true)}>
                                <IconNotes /> Not
                            </button>
                        )}
                        {can('orders.cancel') && isCancellable && (
                            <button type="button" className="btn btn-outline-danger btn-sm gap-1" onClick={() => setShowCancelModal(true)}>
                                <IconXCircle /> İptal Et
                            </button>
                        )}
                    </div>
                )}

                {isTerminal && can('orders.update-status') && (
                    <button type="button" className="btn btn-outline-secondary btn-sm gap-1" onClick={() => setShowNoteModal(true)}>
                        <IconNotes /> Admin Notu
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Sol: Müşteri + Ürünler */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Müşteri Kartı */}
                    {order.customer && (
                        <div className="panel">
                            <h6 className="font-semibold mb-3">Müşteri Bilgileri</h6>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-gray-400">Ad Soyad:</span> <strong>{order.customer.name}</strong></div>
                                <div><span className="text-gray-400">E-posta:</span> {order.customer.email}</div>
                                <div><span className="text-gray-400">Telefon:</span> {order.customer.phone ?? '-'}</div>
                                <div><span className="text-gray-400">Toplam Sipariş:</span> {order.customer.total_order_count}</div>
                                <div><span className="text-gray-400">Ömür Boyu Harcama:</span> <strong className="text-success">{formatCurrency(order.customer.lifetime_value)}</strong></div>
                            </div>
                        </div>
                    )}

                    {/* Ürünler */}
                    <div className="panel">
                        <h6 className="font-semibold mb-3">Ürünler</h6>
                        <div className="table-responsive">
                            <table className="table-striped">
                                <thead>
                                    <tr>
                                        <th>Ürün</th>
                                        <th>Varyant</th>
                                        <th className="text-right">Adet</th>
                                        <th className="text-right">Birim Fiyat</th>
                                        <th className="text-right">Tutar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    {item.featured_image_url && (
                                                        <img src={item.featured_image_url} alt="" className="w-10 h-10 object-cover rounded" />
                                                    )}
                                                    <span className="font-medium">{item.product_name}</span>
                                                </div>
                                            </td>
                                            <td>{item.variant_name ?? '-'}</td>
                                            <td className="text-right">{item.quantity}</td>
                                            <td className="text-right">{formatCurrency(item.unit_price)}</td>
                                            <td className="text-right font-semibold">{formatCurrency(item.line_total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Tutar özeti */}
                        <div className="mt-4 flex justify-end">
                            <div className="w-64 space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-gray-400">Ara Toplam</span><span>{formatCurrency(order.subtotal)}</span></div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-success"><span>İndirim ({order.coupon_code})</span><span>- {formatCurrency(order.discount_amount)}</span></div>
                                )}
                                <div className="flex justify-between"><span className="text-gray-400">Kargo</span><span>{formatCurrency(order.shipping_cost)}</span></div>
                                <div className="flex justify-between font-bold text-base border-t pt-1 mt-1"><span>Toplam</span><span>{formatCurrency(order.total)}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Adresler */}
                    <div className="panel grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h6 className="font-semibold mb-2">Teslimat Adresi</h6>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                                <div className="font-medium text-black dark:text-white">{order.shipping_address?.recipient_name}</div>
                                <div>{order.shipping_address?.full_address}</div>
                                <div>{order.shipping_address?.neighborhood}</div>
                                <div>{order.shipping_address?.district_name} / {order.shipping_address?.province_name}</div>
                                <div>{order.shipping_address?.phone}</div>
                            </div>
                        </div>
                        <div>
                            <h6 className="font-semibold mb-2">Fatura Adresi</h6>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                                <div className="font-medium text-black dark:text-white">{order.billing_address?.recipient_name}</div>
                                <div>{order.billing_address?.full_address}</div>
                                <div>{order.billing_address?.neighborhood}</div>
                                <div>{order.billing_address?.district_name} / {order.billing_address?.province_name}</div>
                                <div>{order.billing_address?.phone}</div>
                            </div>
                        </div>
                    </div>

                    {/* Notlar */}
                    {(order.customer_note || order.admin_note) && (
                        <div className="panel space-y-2">
                            {order.customer_note && (
                                <div>
                                    <span className="text-[11px] font-semibold text-gray-400 uppercase">Müşteri Notu</span>
                                    <p className="text-sm mt-0.5">{order.customer_note}</p>
                                </div>
                            )}
                            {order.admin_note && (
                                <div>
                                    <span className="text-[11px] font-semibold text-warning uppercase">Admin Notu</span>
                                    <p className="text-sm mt-0.5">{order.admin_note}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Kargo */}
                    {order.tracking_number && (
                        <div className="panel">
                            <h6 className="font-semibold mb-2">Kargo Bilgisi</h6>
                            <div className="text-sm space-y-1">
                                <div><span className="text-gray-400">Kargo Yöntemi:</span> {order.shipping_method}</div>
                                <div><span className="text-gray-400">Takip Numarası:</span> <strong>{order.tracking_number}</strong></div>
                                {order.shipped_at && <div><span className="text-gray-400">Kargoya Verilme:</span> {formatDate(order.shipped_at)}</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sağ: Timeline */}
                <div className="panel">
                    <h6 className="font-semibold mb-4">Sipariş Geçmişi</h6>
                    <div className="space-y-4">
                        {timeline.map((event, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                                        <IconChecks className="w-4 h-4" />
                                    </div>
                                    {idx < timeline.length - 1 && <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mt-1" />}
                                </div>
                                <div className="flex-1 pb-4">
                                    <div className="font-semibold text-sm">{event.title}</div>
                                    {event.description && <div className="text-xs text-gray-500 mt-0.5">{event.description}</div>}
                                    <div className="text-[11px] text-gray-400 mt-1">{event.actor} · {formatDate(event.at)}</div>
                                </div>
                            </div>
                        ))}
                        {timeline.length === 0 && (
                            <p className="text-sm text-gray-400">Henüz kayıt yok.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Durum Değiştir */}
            {showStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-[#1b2e4b] rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h5 className="font-bold text-lg mb-4">Durum Değiştir</h5>
                        <div className="mb-3">
                            <label className="text-sm font-medium mb-1 block">Yeni Durum</label>
                            <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                                {allowedTransitions.map((s) => (
                                    <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="text-sm font-medium mb-1 block">Not (opsiyonel)</label>
                            <textarea className="form-textarea" rows={3} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Durum değişikliği hakkında not..." />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowStatusModal(false)} disabled={saving}>İptal</button>
                            <button type="button" className="btn btn-primary" onClick={handleUpdateStatus} disabled={saving || !newStatus}>
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Kargo Takip */}
            {showTrackingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-[#1b2e4b] rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h5 className="font-bold text-lg mb-4">Kargo Takip Numarası</h5>
                        <div className="mb-4">
                            <label className="text-sm font-medium mb-1 block">Takip Numarası</label>
                            <input type="text" className="form-input" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="YK123456789TR" />
                            <p className="text-xs text-gray-400 mt-1">Kaydedilince müşteriye kargo bildirimi maili gönderilir.</p>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowTrackingModal(false)} disabled={saving}>İptal</button>
                            <button type="button" className="btn btn-primary" onClick={handleUpdateTracking} disabled={saving || !trackingNumber}>
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Admin Not */}
            {showNoteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-[#1b2e4b] rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h5 className="font-bold text-lg mb-4">Admin Notu</h5>
                        <div className="mb-4">
                            <label className="text-sm font-medium mb-1 block">Not</label>
                            <textarea className="form-textarea" rows={4} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="İç not (müşteri göremez)..." />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowNoteModal(false)} disabled={saving}>İptal</button>
                            <button type="button" className="btn btn-primary" onClick={handleUpdateNote} disabled={saving}>
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: İptal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-[#1b2e4b] rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h5 className="font-bold text-lg mb-4 text-danger">Siparişi İptal Et</h5>
                        <div className="mb-3">
                            <label className="text-sm font-medium mb-1 block">İptal Nedeni <span className="text-danger">*</span></label>
                            <textarea className="form-textarea" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="İptal nedenini giriniz..." />
                        </div>
                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="form-checkbox" checked={refundPayment} onChange={(e) => setRefundPayment(e.target.checked)} />
                                <span className="text-sm">Ödemeyi iade edildi olarak işaretle</span>
                            </label>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCancelModal(false)} disabled={saving}>Vazgeç</button>
                            <button type="button" className="btn btn-danger" onClick={handleCancel} disabled={saving || !cancelReason}>
                                {saving ? 'İptal Ediliyor...' : 'İptal Et'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetailPage;
