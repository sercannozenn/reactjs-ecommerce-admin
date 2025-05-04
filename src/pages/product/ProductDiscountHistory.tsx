import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProductService } from '../../api/services/ProductService';

const ProductDiscountHistory = () => {
    const { id } = useParams();

    interface PriceHistoryItem {
        price: number;
        price_discount: number;
        discount_name: string;
        updated_by: string;
        reason: string;
        from: string;
        until: string | null;
    }

    interface ProductInfo {
        id: number;
        name: string;
        slug: string;
        short_description: string;
        long_description: string;
        final_price: number;
        price: number
    }

    const [history, setHistory] = useState<PriceHistoryItem[]>([]);
    const [product, setProduct] = useState<ProductInfo | null>(null);

    useEffect(() => {
        if (id) {
            ProductService.getPriceHistory(Number(id))
                .then(res => setHistory(res))
                .catch(() => alert("Geçmiş verisi alınamadı"));

            ProductService.fetchById((id))
                .then(res => setProduct(res.product))
                .catch(() => alert("Ürün bilgisi alınamadı"));
        }
    }, [id]);

    return (
        <div className="panel">
            <h4 className="mb-4 font-bold text-lg">İndirim Geçmişi</h4>

            {product && (
                <div className="bg-gray-50 p-4 mb-6 rounded border">
                    <p><strong>Ürün Adı:</strong> {product.name}</p>
                    <p><strong>Güncel Fiyat:</strong> {product.final_price?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                </div>
            )}

            {history.length === 0 ? (
                <p>Kayıt bulunamadı.</p>
            ) : (
                <table className="w-full table-auto border-collapse">
                    <thead>
                    <tr>
                        <th>Fiyat</th>
                        <th>İndirimli</th>
                        <th>İndirim Adı</th>
                        <th>Kim</th>
                        <th>İşlem</th>
                        <th>Başlangıç</th>
                        <th>Bitiş</th>
                    </tr>
                    </thead>
                    <tbody>
                    {history.map((item: PriceHistoryItem, idx: number) => (
                        <tr key={idx}>
                            <td>{item.price.toFixed(2)} ₺</td>
                            <td>{item.price_discount.toFixed(2)} ₺</td>
                            <td>{item.discount_name}</td>
                            <td>{item.updated_by}</td>
                            <td>{item.reason}</td>
                            <td>{new Date(item.from).toLocaleString('tr-TR')}</td>
                            <td>{item.until ? new Date(item.until).toLocaleString('tr-TR') : '-'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ProductDiscountHistory;
