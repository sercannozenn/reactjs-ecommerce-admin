import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { Collapse } from '@mantine/core';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Turkish } from 'flatpickr/dist/l10n/tr.js';

import { setPageTitle } from '../../store/themeConfigSlice';
import { useCan } from '../../utils/permissions';
import { reviewService } from '../../api/services/reviewService';
import {
    Review,
    ReviewFilterData,
    ReviewStatus,
    REVIEW_STATUS_LABELS,
    REVIEW_STATUS_BADGE,
} from '../../types/review';

const PAGE_SIZE = 20;

const StarRating = ({ rating }: { rating: number }) => (
    <span className="text-warning">
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
);

const formatDate = (value: string | null | undefined) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const ReviewList = () => {
    const dispatch = useDispatch();
    const can = useCan();

    const [activeTab, setActiveTab] = useState<ReviewStatus>('pending');
    const [data, setData] = useState<Review[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterData, setFilterData] = useState<ReviewFilterData>({});

    const [rejectModal, setRejectModal] = useState<{ open: boolean; reviewId: number | null }>({ open: false, reviewId: null });
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('Yorum Moderasyonu'));
    }, [dispatch]);

    const fetchReviews = async (p = 1) => {
        setLoading(true);
        try {
            const resp = await reviewService.list({ ...filterData, status: activeTab }, p, PAGE_SIZE);
            setData(resp.data);
            setTotal(resp.meta.total);
            setLastPage(resp.meta.last_page);
            setPage(p);
        } catch {
            Swal.fire('Hata', 'Yorumlar yüklenirken bir hata oluştu.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleApprove = async (id: number) => {
        const result = await Swal.fire({
            title: 'Yorumu onayla',
            text: 'Yorum yayınlanacak ve müşteriye bildirim gönderilecek.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Onayla',
            cancelButtonText: 'İptal',
        });
        if (!result.isConfirmed) return;

        try {
            await reviewService.approve(id);
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Yorum onaylandı.', showConfirmButton: false, timer: 2500 });
            fetchReviews(page);
        } catch {
            Swal.fire('Hata', 'Onaylama işlemi başarısız.', 'error');
        }
    };

    const openRejectModal = (id: number) => {
        setRejectReason('');
        setRejectModal({ open: true, reviewId: id });
    };

    const handleReject = async () => {
        if (!rejectModal.reviewId) return;
        if (rejectReason.trim().length < 5) {
            Swal.fire('Uyarı', 'Lütfen geçerli bir ret sebebi girin (en az 5 karakter).', 'warning');
            return;
        }
        try {
            await reviewService.reject(rejectModal.reviewId, rejectReason.trim());
            setRejectModal({ open: false, reviewId: null });
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Yorum reddedildi.', showConfirmButton: false, timer: 2500 });
            fetchReviews(page);
        } catch {
            Swal.fire('Hata', 'Reddetme işlemi başarısız.', 'error');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                <h2 className="text-xl font-semibold">Yorum Moderasyonu</h2>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                    {isFilterOpen ? 'Filtreyi Kapat' : 'Filtrele'}
                </button>
            </div>

            {/* Filtre Paneli */}
            <Collapse in={isFilterOpen}>
                <div className="panel mb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Ürün ID</label>
                            <input
                                type="number"
                                className="form-input form-input-sm"
                                placeholder="Ürün ID"
                                value={filterData.product_id ?? ''}
                                onChange={e => setFilterData(f => ({ ...f, product_id: e.target.value ? Number(e.target.value) : '' }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Müşteri ID</label>
                            <input
                                type="number"
                                className="form-input form-input-sm"
                                placeholder="Müşteri ID"
                                value={filterData.customer_id ?? ''}
                                onChange={e => setFilterData(f => ({ ...f, customer_id: e.target.value ? Number(e.target.value) : '' }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Başlangıç Tarihi</label>
                            <Flatpickr
                                className="form-input form-input-sm"
                                options={{ locale: Turkish, dateFormat: 'Y-m-d' }}
                                value={filterData.date_from ?? ''}
                                onChange={([d]) => setFilterData(f => ({ ...f, date_from: d ? d.toISOString().slice(0, 10) : undefined }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Bitiş Tarihi</label>
                            <Flatpickr
                                className="form-input form-input-sm"
                                options={{ locale: Turkish, dateFormat: 'Y-m-d' }}
                                value={filterData.date_to ?? ''}
                                onChange={([d]) => setFilterData(f => ({ ...f, date_to: d ? d.toISOString().slice(0, 10) : undefined }))}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => { setFilterData({}); fetchReviews(1); }}
                        >
                            Temizle
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => fetchReviews(1)}
                        >
                            Uygula
                        </button>
                    </div>
                </div>
            </Collapse>

            {/* Sekmeler */}
            <div className="panel">
                <div className="flex gap-1 border-b dark:border-dark mb-1">
                    {(['pending', 'approved', 'rejected'] as ReviewStatus[]).map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {REVIEW_STATUS_LABELS[tab]}
                        </button>
                    ))}
                </div>

                <div className="mt-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Yükleniyor...</div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">Kayıt bulunamadı.</div>
                    ) : (
                        <div className="space-y-4">
                            {data.map(review => (
                                <div key={review.id} className="border rounded-lg p-4 dark:border-dark">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        {/* Sol: Müşteri + Ürün + İçerik */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-semibold text-sm">
                                                    {review.customer ? `${review.customer.first_name} ${review.customer.last_name}` : '-'}
                                                </span>
                                                <span className="text-gray-400 text-xs">{review.customer?.email}</span>
                                                <span className={`badge text-xs ${REVIEW_STATUS_BADGE[review.status]}`}>
                                                    {REVIEW_STATUS_LABELS[review.status]}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mb-1">
                                                Ürün: <span className="font-medium text-gray-700 dark:text-gray-300">{review.product?.name ?? '-'}</span>
                                                {' · '}Sipariş #{review.order_id}
                                                {' · '}{formatDate(review.created_at)}
                                            </div>
                                            <div className="mb-2">
                                                <StarRating rating={review.rating} />
                                            </div>
                                            {review.title && (
                                                <p className="font-semibold text-sm mb-1">{review.title}</p>
                                            )}
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{review.body}</p>
                                            {review.rejection_reason && (
                                                <p className="text-xs text-danger mt-2">
                                                    <span className="font-semibold">Ret sebebi:</span> {review.rejection_reason}
                                                </p>
                                            )}
                                        </div>

                                        {/* Sağ: Aksiyon butonları */}
                                        {can('reviews.moderate') && review.status === 'pending' && (
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleApprove(review.id)}
                                                >
                                                    Onayla
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => openRejectModal(review.id)}
                                                >
                                                    Reddet
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Sayfalama */}
                    {lastPage > 1 && (
                        <div className="flex items-center justify-between mt-5">
                            <span className="text-sm text-gray-500">
                                Toplam {total} yorum, sayfa {page}/{lastPage}
                            </span>
                            <div className="flex gap-1">
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={page <= 1}
                                    onClick={() => fetchReviews(page - 1)}
                                >
                                    ‹ Önceki
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={page >= lastPage}
                                    onClick={() => fetchReviews(page + 1)}
                                >
                                    Sonraki ›
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Ret Modal */}
            {rejectModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white dark:bg-dark rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-3">Yorumu Reddet</h3>
                        <label className="text-sm font-medium mb-1 block">Ret Sebebi <span className="text-danger">*</span></label>
                        <textarea
                            className="form-textarea w-full"
                            rows={4}
                            placeholder="Neden reddedildiğini açıklayın..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setRejectModal({ open: false, reviewId: null })}
                            >
                                İptal
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleReject}
                            >
                                Reddet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewList;
