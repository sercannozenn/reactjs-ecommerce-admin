import React, { useEffect, useState } from 'react';
import api from '../../api/api';

const TagAdd = () => {
    const [formData, setFormData] = useState({
        slug: '',
        name: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(formData);
        try {
            const response = await api.post('/admin/tag', formData);
            alert(`Etiket başarıyla eklendi! ID: ${response.data.id}`);
        } catch (error: any) {
            console.error(error);
            alert(
                error.response?.data?.message || 'Bir hata oluştu! Lütfen tekrar deneyin.'
            );
        }
    };

    return (
        <div className="">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        Etiket Ekleme
                    </h5>
                </div>
                <form className="grid xl:grid-cols-2 gap-6 grid-cols-1" onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <input type="text" placeholder="Etiket Adı *" className="form-input" required
                               name="name"
                               value={formData.name}
                               onChange={handleInputChange}
                        />
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Etiket Slug Adı" className="form-input"
                               name="slug"
                               value={formData.slug}
                               onChange={handleInputChange}
                        />
                        <span className="badge bg-info block text-xs hover:top-0">
                            Etikete verilem benzersiz isim. URL'de kullanılacak.
                        </span>

                    </div>

                    <div className="col-span-2">
                        <hr className="my-5 border-gray-300" />
                        <div className="flex justify-center">
                            <button type="submit" className="btn btn-info hover:btn-success w-full">
                                KAYDET
                            </button>
                        </div>

                    </div>
                </form>

            </div>
        </div>
    );
};

export default TagAdd;
