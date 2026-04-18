import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Turkish } from 'flatpickr/dist/l10n/tr.js';
import dayjs from 'dayjs';

import { setPageTitle } from '../../store/themeConfigSlice';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { couponService } from '../../api/services/couponService';
import { CouponFormData, CouponPayload, CouponType } from '../../types/coupon';

const initialFormState: CouponFormData = {
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    max_discount_amount: '',
    min_cart_amount: '',
    usage_limit: '',
    per_user_limit: 1,
    starts_at: '',
    ends_at: '',
    is_active: true,
};

const CouponForm = () => {
    const dispatch = useDispatch();
    const navigateToRoute = useRouteNavigator();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    const [formData, setFormData] = useState<CouponFormData>(initialFormState);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);

    const pageTitle = isEdit ? 'Kupon Güncelle' : 'Kupon Ekle';

    useEffect(() => {
        dispatch(setPageTitle(pageTitle));
    }, [dispatch, pageTitle]);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const response = await couponService.show(id);
                const c = response?.coupon;
                if (!c) return;
                setFormData({
                    code: c.code ?? '',
                    description: c.description ?? '',
                    type: c.type,
                    value: c.value ?? '',
                    max_discount_amount: c.max_discount_amount ?? '',
                    min_cart_amount: c.min_cart_amount ?? '',
                    usage_limit: c.usage_limit ?? '',
                    per_user_limit: c.per_user_limit ?? 1,
                    starts_at: c.starts_at ? dayjs(c.starts_at).format('YYYY-MM-DD HH:mm') : '',
                    ends_at: c.ends_at ? dayjs(c.ends_at).format('YYYY-MM-DD HH:mm') : '',
                    is_active: !!c.is_active,
                });
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: 'Kupon bilgisi alınamadı.',
                    confirmButtonText: 'Tamam',
                    customClass: { popup: 'sweet-alerts' },
                });
            }
        };
        load();
    }, [id]);

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Kod alanı otomatik uppercase (sadece ASCII harf/rakam bıraktırmıyoruz, backend zaten normalleştirir)
        setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
        if (errors.code) setErrors((prev) => ({ ...prev, code: [] }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: [] }));
    };

    const handleNumberChange = (name: keyof CouponFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const next = raw === '' ? '' : Number(raw);
        setFormData((prev) => ({ ...prev, [name]: next } as CouponFormData));
        if (errors[name as string]) setErrors((prev) => ({ ...prev, [name as string]: [] }));
    };

    const handleTypeChange = (type: CouponType) => {
        setFormData((prev) => ({
            ...prev,
            type,
            // percentage'tan fixed'e geçerken max_discount_amount temizlensin
            max_discount_amount: type === 'fixed' ? '' : prev.max_discount_amount,
        }));
    };

    const validateBeforeSubmit = (): boolean => {
        const localErrors: Record<string, string[]> = {};

        if (!formData.code.trim()) {
            localErrors.code = ['Kupon kodu gereklidir.'];
        }
        if (formData.value === '' || Number(formData.value) <= 0) {
            localErrors.value = ['Değer 0 dan büyük olmalıdır.'];
        }
        if (formData.type === 'percentage' && formData.value !== '' && Number(formData.value) > 100) {
            localErrors.value = ['Yüzde değeri 100 den büyük olamaz.'];
        }
        if (formData.starts_at && formData.ends_at) {
            if (dayjs(formData.ends_at).isBefore(dayjs(formData.starts_at))) {
                localErrors.ends_at = ['Bitiş tarihi başlangıç tarihinden sonra olmalıdır.'];
            }
        }

        if (Object.keys(localErrors).length > 0) {
            setErrors(localErrors);
            return false;
        }

        return true;
    };

    const buildPayload = (): CouponPayload => {
        const toNumberOrNull = (v: number | '' | null): number | null => {
            if (v === '' || v === null || v === undefined) return null;
            const n = Number(v);
            return isNaN(n) ? null : n;
        };

        return {
            code: formData.code.trim(),
            description: formData.description?.trim() || null,
            type: formData.type,
            value: Number(formData.value),
            max_discount_amount:
                formData.type === 'percentage' ? toNumberOrNull(formData.max_discount_amount) : null,
            min_cart_amount: toNumberOrNull(formData.min_cart_amount),
            usage_limit: toNumberOrNull(formData.usage_limit),
            per_user_limit: toNumberOrNull(formData.per_user_limit),
            starts_at: formData.starts_at || null,
            ends_at: formData.ends_at || null,
            is_active: formData.is_active,
        };
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateBeforeSubmit()) return;

        setLoading(true);
        try {
            const payload = buildPayload();
            if (isEdit && id) {
                await couponService.update(id, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: 'Kupon güncellendi.',
                    confirmButtonText: 'Tamam',
                });
            } else {
                await couponService.create(payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: 'Kupon oluşturuldu.',
                    confirmButtonText: 'Tamam',
                });
                navigateToRoute('CouponList');
            }
        } catch (error: any) {
            if (error?.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            } else {
                const msg = error?.response?.data?.message || 'İşlem sırasında bir hata oluştu.';
                Swal.fire({ icon: 'error', title: 'Hata!', text: msg, confirmButtonText: 'Tamam' });
            }
        } finally {
            setLoading(false);
        }
    };

    const renderError = (field: string) =>
        errors?.[field]?.[0] ? <p className="text-red-500 text-xs mt-1">{errors[field][0]}</p> : null;

    return (
        <div>
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">{pageTitle}</h5>
                </div>

                <form className="grid xl:grid-cols-2 gap-6 grid-cols-1" onSubmit={handleSubmit}>
                    {/* Kod */}
                    <div>
                        <label className="block text-sm font-semibold mb-1">Kupon Kodu *</label>
                        <input
                            type="text"
                            className="form-input tracking-widest font-mono"
                            name="code"
                            placeholder="INDIRIM10"
                            value={formData.code}
                            onChange={handleCodeChange}
                        />
                        <span className="text-xs text-gray-400 mt-1 block">
                            Kod otomatik olarak büyük harfe dönüştürülür.
                        </span>
                        {renderError('code')}
                    </div>

                    {/* Tip */}
                    <div>
                        <label className="block text-sm font-semibold mb-1">İndirim Tipi *</label>
                        <div className="flex gap-4 mt-2">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    className="form-radio"
                                    checked={formData.type === 'percentage'}
                                    onChange={() => handleTypeChange('percentage')}
                                />
                                <span className="ml-2">Yüzde (%)</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    className="form-radio"
                                    checked={formData.type === 'fixed'}
                                    onChange={() => handleTypeChange('fixed')}
                                />
                                <span className="ml-2">Sabit Tutar (₺)</span>
                            </label>
                        </div>
                        {renderError('type')}
                    </div>

                    {/* Değer */}
                    <div>
                        <label className="block text-sm font-semibold mb-1">
                            Değer * {formData.type === 'percentage' ? '(0-100)' : '(₺)'}
                        </label>
                        <input
                            type="number"
                            className="form-input"
                            name="value"
                            placeholder={formData.type === 'percentage' ? 'Örn: 10' : 'Örn: 50'}
                            value={formData.value}
                            onChange={handleNumberChange('value')}
                            min={0}
                            max={formData.type === 'percentage' ? 100 : undefined}
                            step="0.01"
                        />
                        {renderError('value')}
                    </div>

                    {/* Max discount amount (sadece percentage) */}
                    {formData.type === 'percentage' ? (
                        <div>
                            <label className="block text-sm font-semibold mb-1">Maksimum İndirim Tutarı (₺)</label>
                            <input
                                type="number"
                                className="form-input"
                                name="max_discount_amount"
                                placeholder="Sınırsız için boş bırakın"
                                value={formData.max_discount_amount ?? ''}
                                onChange={handleNumberChange('max_discount_amount')}
                                min={0}
                                step="0.01"
                            />
                            <span className="text-xs text-gray-400 mt-1 block">
                                Yüzdelik indirimin üst sınırı. Boş bırakılırsa sınırsız.
                            </span>
                            {renderError('max_discount_amount')}
                        </div>
                    ) : (
                        <div />
                    )}

                    {/* Min cart amount */}
                    <div>
                        <label className="block text-sm font-semibold mb-1">Minimum Sepet Tutarı (₺)</label>
                        <input
                            type="number"
                            className="form-input"
                            name="min_cart_amount"
                            placeholder="Minimum şart yok"
                            value={formData.min_cart_amount ?? ''}
                            onChange={handleNumberChange('min_cart_amount')}
                            min={0}
                            step="0.01"
                        />
                        {renderError('min_cart_amount')}
                    </div>

                    {/* Usage limit */}
                    <div>
                        <label className="block text-sm font-semibold mb-1">Toplam Kullanım Limiti</label>
                        <input
                            type="number"
                            className="form-input"
                            name="usage_limit"
                            placeholder="Sınırsız için boş bırakın"
                            value={formData.usage_limit ?? ''}
                            onChange={handleNumberChange('usage_limit')}
                            min={0}
                        />
                        {renderError('usage_limit')}
                    </div>

                    {/* Per user limit */}
                    <div>
                        <label className="block text-sm font-semibold mb-1">Müşteri Başına Kullanım Limiti</label>
                        <input
                            type="number"
                            className="form-input"
                            name="per_user_limit"
                            placeholder="Varsayılan 1"
                            value={formData.per_user_limit ?? ''}
                            onChange={handleNumberChange('per_user_limit')}
                            min={0}
                        />
                        {renderError('per_user_limit')}
                    </div>

                    {/* Başlangıç tarihi */}
                    <div>
                        <label className="block text-sm font-semibold mb-1">Başlangıç Tarihi</label>
                        <Flatpickr
                            placeholder="Başlangıç tarihi seçin..."
                            options={{
                                enableTime: true,
                                dateFormat: 'Y-m-d H:i',
                                locale: Turkish,
                            }}
                            value={formData.starts_at || undefined}
                            className="form-input"
                            onChange={(selectedDates) => {
                                const date = selectedDates[0];
                                const formatted = date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '';
                                setFormData((prev) => ({ ...prev, starts_at: formatted }));
                                if (errors.starts_at) setErrors((prev) => ({ ...prev, starts_at: [] }));
                            }}
                        />
                        {renderError('starts_at')}
                    </div>

                    {/* Bitiş tarihi */}
                    <div>
                        <label className="block text-sm font-semibold mb-1">Bitiş Tarihi</label>
                        <Flatpickr
                            placeholder="Bitiş tarihi seçin..."
                            options={{
                                enableTime: true,
                                dateFormat: 'Y-m-d H:i',
                                locale: Turkish,
                            }}
                            value={formData.ends_at || undefined}
                            className="form-input"
                            onChange={(selectedDates) => {
                                const date = selectedDates[0];
                                const formatted = date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '';
                                setFormData((prev) => ({ ...prev, ends_at: formatted }));
                                if (errors.ends_at) setErrors((prev) => ({ ...prev, ends_at: [] }));
                            }}
                        />
                        {renderError('ends_at')}
                    </div>

                    {/* Açıklama */}
                    <div className="col-span-1 xl:col-span-2">
                        <label className="block text-sm font-semibold mb-1">Açıklama</label>
                        <textarea
                            className="form-textarea"
                            name="description"
                            rows={3}
                            placeholder="Kupon hakkında kısa açıklama (opsiyonel)"
                            value={formData.description ?? ''}
                            onChange={handleInputChange}
                        />
                        {renderError('description')}
                    </div>

                    {/* Aktiflik */}
                    <div>
                        <label className="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="form-checkbox text-info"
                                checked={formData.is_active}
                                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                            />
                            <span className="text-white-dark ml-2">Aktif</span>
                        </label>
                    </div>

                    {/* Kaydet */}
                    <div className="col-span-1 xl:col-span-2">
                        <hr className="my-5 border-gray-300" />
                        <div className="flex justify-between gap-2">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => navigateToRoute('CouponList')}
                            >
                                Vazgeç
                            </button>
                            <button type="submit" className="btn btn-info hover:btn-success" disabled={loading}>
                                {loading ? 'Kaydediliyor...' : isEdit ? 'GÜNCELLE' : 'KAYDET'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CouponForm;
