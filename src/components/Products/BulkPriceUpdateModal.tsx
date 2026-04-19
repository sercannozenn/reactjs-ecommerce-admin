import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { ProductService } from '../../api/services/ProductService';

type Operation =
    | 'increase_percent'
    | 'decrease_percent'
    | 'set_fixed'
    | 'increase_fixed'
    | 'decrease_fixed';

interface Props {
    open: boolean;
    onClose: () => void;
    selectedIds: number[];
    samplePrice?: number; // preview için
    onDone: () => void;
}

const OPERATIONS: Array<{ value: Operation; label: string }> = [
    { value: 'increase_percent', label: 'Yüzde Artır' },
    { value: 'decrease_percent', label: 'Yüzde Azalt' },
    { value: 'set_fixed', label: 'Sabit Fiyat Yap' },
    { value: 'increase_fixed', label: 'Sabit Tutar Artır' },
    { value: 'decrease_fixed', label: 'Sabit Tutar Azalt' },
];

const BulkPriceUpdateModal: React.FC<Props> = ({
    open,
    onClose,
    selectedIds,
    samplePrice = 499,
    onDone,
}) => {
    const [operation, setOperation] = useState<Operation>('increase_percent');
    const [value, setValue] = useState<string>('10');
    const [submitting, setSubmitting] = useState(false);

    const preview = useMemo(() => {
        const v = parseFloat(value);
        if (Number.isNaN(v)) return samplePrice;
        switch (operation) {
            case 'increase_percent':
                return samplePrice * (1 + v / 100);
            case 'decrease_percent':
                return samplePrice * (1 - v / 100);
            case 'set_fixed':
                return v;
            case 'increase_fixed':
                return samplePrice + v;
            case 'decrease_fixed':
                return samplePrice - v;
        }
    }, [operation, value, samplePrice]);

    const handleSubmit = async () => {
        const v = parseFloat(value);
        if (Number.isNaN(v)) {
            Swal.fire({ icon: 'warning', title: 'Geçerli bir değer girin' });
            return;
        }
        // Backend şu an yalnızca percent tabanlı toplu güncelleme destekliyor;
        // artı değer = artış, eksi değer = indirim.
        let percent: number;
        switch (operation) {
            case 'increase_percent':
                percent = v;
                break;
            case 'decrease_percent':
                percent = -v;
                break;
            default:
                Swal.fire({
                    icon: 'info',
                    title: 'Bilgi',
                    text: 'Şu anda sadece yüzde bazlı toplu güncelleme destekleniyor.',
                });
                return;
        }

        setSubmitting(true);
        try {
            const res = await ProductService.bulkPriceUpdate({
                product_ids: selectedIds,
                percent,
            });
            Swal.fire({
                icon: 'success',
                title: 'Tamam',
                text: `${res.count ?? selectedIds.length} ürün güncellendi`,
            });
            onDone();
            onClose();
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: err?.response?.data?.message || 'Toplu güncelleme başarısız',
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <h3 className="text-lg font-semibold mb-4">Toplu Fiyat Güncelleme</h3>

                <p className="text-sm text-gray-600 mb-4">
                    {selectedIds.length} ürün etkilenecek.
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">İşlem</label>
                    <select
                        className="form-select"
                        value={operation}
                        onChange={(e) => setOperation(e.target.value as Operation)}
                    >
                        {OPERATIONS.map((op) => (
                            <option key={op.value} value={op.value}>
                                {op.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Değer</label>
                    <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </div>

                <div className="mb-5 p-3 bg-gray-50 rounded text-sm">
                    <p className="text-gray-600">
                        Örnek: {samplePrice.toFixed(2)} ₺ → {preview.toFixed(2)} ₺
                    </p>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        className="btn btn-outline-dark"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Vazgeç
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={submitting || selectedIds.length === 0}
                    >
                        {submitting ? 'Güncelleniyor...' : 'Uygula'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkPriceUpdateModal;
