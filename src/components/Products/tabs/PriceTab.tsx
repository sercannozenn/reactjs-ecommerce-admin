import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useProductForm } from '../ProductFormContext';
import { fieldClass, getFieldError, hasFieldError } from '../../../utils/formErrors';

const TAX_PRESETS = [0, 1, 10, 20];

const PriceTab: React.FC = () => {
    const { form, updateField, errors } = useProductForm();
    const [customTax, setCustomTax] = useState(!TAX_PRESETS.includes(form.tax_rate));

    const defaultVariant = useMemo(
        () => form.variants.find((v) => v.is_default) ?? form.variants[0],
        [form.variants]
    );

    // Base fiyat değerleri — yeni oluşacak variantlar için prefill kaynağı, mevcutları
    // toplu uygula butonu ile override eder.
    const basePrice = form.base_price ?? 0;
    const baseDiscount = form.base_price_discount;
    const baseCost = form.base_cost_price;

    const netPrice = useMemo(() => {
        const rate = form.tax_rate / 100;
        if (form.price_includes_tax) {
            return rate > 0 ? basePrice / (1 + rate) : basePrice;
        }
        return basePrice;
    }, [basePrice, form.price_includes_tax, form.tax_rate]);

    const taxAmount = basePrice - netPrice;
    const cost = baseCost ?? 0;
    const grossProfit = netPrice - cost;
    const profitPct = cost > 0 ? (grossProfit / cost) * 100 : 0;

    const handleApplyToAll = async () => {
        if (form.variants.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Varyant yok',
                text: 'Önce Stok & Varyant sekmesinden varyant oluşturun.',
            });
            return;
        }
        const confirm = await Swal.fire({
            icon: 'question',
            title: 'Tüm varyantlara uygula?',
            text: `Mevcut ${form.variants.length} varyantın fiyatı yeni base değerleri ile değiştirilecek.`,
            showCancelButton: true,
            confirmButtonText: 'Uygula',
            cancelButtonText: 'Vazgeç',
        });
        if (!confirm.isConfirmed) return;
        updateField(
            'variants',
            form.variants.map((v) => ({
                ...v,
                price: basePrice,
                price_discount: baseDiscount,
                cost_price: baseCost,
            }))
        );
    };

    const variantCount = form.variants.length;

    return (
        <div className="space-y-6">
            {/* Açıklama akordiyonu — fiyat tab vs variant fiyatı ilişkisi */}
            <details className="bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                <summary className="cursor-pointer select-none px-3 py-2 font-medium">
                    Fiyat Nasıl Çalışır?
                </summary>
                <ul className="list-disc ml-8 mr-3 pb-3 space-y-1 text-xs">
                    <li>
                        <strong>Ürün fiyatı</strong> her varyantta tutulur (Stok & Varyant sekmesinden).
                    </li>
                    <li>
                        Bu sekmedeki değerler{' '}
                        <strong>yeni oluşturulacak varyantlar için varsayılan</strong> olarak
                        kullanılır. Mevcut{' '}
                        <strong>{variantCount}</strong> varyantın fiyatını değiştirmez.
                    </li>
                    <li>
                        Mevcut tüm varyantların fiyatını buradaki değerle değiştirmek için{' '}
                        <strong>“Tüm varyantlara uygula”</strong> butonunu kullanabilirsiniz.
                    </li>
                </ul>
            </details>

            {/* Row 1: KDV Modeli */}
            <div>
                <label className="block text-sm font-medium mb-2">KDV Modeli</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            checked={form.price_includes_tax}
                            onChange={() => updateField('price_includes_tax', true)}
                        />
                        <span>KDV Dahil</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            checked={!form.price_includes_tax}
                            onChange={() => updateField('price_includes_tax', false)}
                        />
                        <span>KDV Hariç</span>
                    </label>
                </div>
            </div>

            {/* Row 2: KDV Oranı */}
            <div>
                <label className="block text-sm font-medium mb-2">KDV Oranı (%)</label>
                <div className="flex gap-2 flex-wrap items-center">
                    {TAX_PRESETS.map((r) => (
                        <button
                            key={r}
                            type="button"
                            className={`btn btn-sm ${
                                !customTax && form.tax_rate === r
                                    ? 'btn-primary'
                                    : 'btn-outline-primary'
                            }`}
                            onClick={() => {
                                setCustomTax(false);
                                updateField('tax_rate', r);
                            }}
                        >
                            %{r}
                        </button>
                    ))}
                    <button
                        type="button"
                        className={`btn btn-sm ${
                            customTax ? 'btn-primary' : 'btn-outline-primary'
                        }`}
                        onClick={() => setCustomTax(true)}
                    >
                        Özel
                    </button>
                    {customTax && (
                        <input
                            type="number"
                            step="0.01"
                            className={fieldClass('form-input max-w-[120px]', hasFieldError(errors, 'tax_rate'))}
                            value={form.tax_rate}
                            onChange={(e) =>
                                updateField('tax_rate', parseFloat(e.target.value) || 0)
                            }
                        />
                    )}
                </div>
                {hasFieldError(errors, 'tax_rate') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'tax_rate')}</p>
                )}
            </div>

            {/* Row 3: 3-col grid — Base Satış / Base İndirim / Base Maliyet */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Yeni Varyantların Satış Fiyatı <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        className={fieldClass('form-input', hasFieldError(errors, 'base_price'))}
                        value={form.base_price ?? 0}
                        onChange={(e) =>
                            updateField('base_price', parseFloat(e.target.value) || 0)
                        }
                    />
                    {hasFieldError(errors, 'base_price') ? (
                        <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'base_price')}</p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-1">
                            Yeni varyantlar bu fiyatla oluşturulur.
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Yeni Varyantların İndirimli Fiyatı{' '}
                        <span className="text-gray-400">(ops.)</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        className={fieldClass('form-input', hasFieldError(errors, 'base_price_discount'))}
                        value={form.base_price_discount ?? ''}
                        onChange={(e) => {
                            const val =
                                e.target.value === '' ? null : parseFloat(e.target.value);
                            updateField('base_price_discount', val);
                        }}
                    />
                    {hasFieldError(errors, 'base_price_discount') && (
                        <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'base_price_discount')}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Yeni Varyantların Maliyeti{' '}
                        <span className="text-gray-400">(ops.)</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        className={fieldClass('form-input', hasFieldError(errors, 'cost_price') || hasFieldError(errors, 'base_cost_price'))}
                        value={form.base_cost_price ?? ''}
                        onChange={(e) => {
                            const val =
                                e.target.value === '' ? null : parseFloat(e.target.value);
                            updateField('base_cost_price', val);
                            // cost_price alanı da hala backend'de kullanılıyor (ürün seviye)
                            updateField('cost_price', val);
                        }}
                    />
                    {hasFieldError(errors, 'cost_price') && (
                        <p className="text-red-500 text-xs mt-1">{getFieldError(errors, 'cost_price')}</p>
                    )}
                </div>
            </div>

            {/* Row 4: Apply to all */}
            <div className="flex flex-wrap gap-3 items-center">
                <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={handleApplyToAll}
                    disabled={form.variants.length === 0}
                >
                    Tüm varyantlara uygula
                </button>
                <span className="text-xs text-gray-500">
                    Mevcut {form.variants.length} varyantın fiyat/indirim/maliyet değerlerini
                    yukarıdaki base değerlerle değiştirir.
                </span>
            </div>

            {/* Row 5: Preview */}
            <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">Fiyat Özeti</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Satış Fiyatı:</div>
                    <div className="text-right">
                        {basePrice.toFixed(2)} ₺{' '}
                        <span className="text-gray-500 text-xs">
                            ({form.price_includes_tax ? 'KDV Dahil' : 'KDV Hariç'})
                        </span>
                    </div>
                    <div>Net Fiyat:</div>
                    <div className="text-right">{netPrice.toFixed(2)} ₺</div>
                    <div>KDV (%{form.tax_rate}):</div>
                    <div className="text-right">{taxAmount.toFixed(2)} ₺</div>
                    {cost > 0 && (
                        <>
                            <div>Maliyet:</div>
                            <div className="text-right">{cost.toFixed(2)} ₺</div>
                            <div>Brüt Kâr:</div>
                            <div
                                className={`text-right font-semibold ${
                                    grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                            >
                                {grossProfit.toFixed(2)} ₺ ({profitPct.toFixed(1)}%)
                            </div>
                        </>
                    )}
                    {defaultVariant && defaultVariant.price !== basePrice && (
                        <>
                            <div className="col-span-2 mt-2 text-xs text-orange-600">
                                Uyarı: Ana Varyantın fiyatı ({defaultVariant.price.toFixed(2)} ₺)
                                bu sekmedeki değerlerden farklı. "Tüm varyantlara uygula" butonu ile
                                senkronlayabilirsiniz.
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PriceTab;
