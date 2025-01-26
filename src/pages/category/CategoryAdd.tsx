import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import api from '../../api/api';

const animatedComponents = makeAnimated();
type Tag = {
    id: number;
    name: string;
};
type Category = {
    id: number;
    name: string;
};
const customNoOptionsMessage = () => {
    return (
        <div style={{ textAlign: 'center', color: 'gray' }}>
            Aradığınız şeçenek bulunamadı.
        </div>
    );
};

const CategoryAdd = () => {
    const [formData, setFormData] = useState({
        parentCategory: '',
        slug: '',
        name: '',
        description: '',
        tags: [],
        isActive: true,
        keywords: '',
        seoDescription: '',
        author: ''
    });
    const [categories, setCategories] = useState([]); // Üst kategoriler
    const [tagsOptions, setTagsOptions] = useState([]); // Etiket seçenekleri

    useEffect(() => {
        // category/create endpoint'ine istek at
        const fetchCreateData = async () => {
            try {
                const response = await api.get('/admin/category/create');
                setCategories(response.data.data.categories || []); // Gelen kategoriler
                setTagsOptions(response.data.data.tags.map((tag:Tag) => ({ value: tag.id, label: tag.name }))); // Etiketleri dönüştür
            } catch (error) {
                console.error('Veriler alınırken hata oluştu:', error);
            }
        };

        fetchCreateData();
    }, []);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };
    const handleSelectChange = (selectedOptions: any) => {
        setFormData({ ...formData, tags: selectedOptions });
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(formData);
        try {
            const response = await api.post('/admin/category', formData);
            alert(`Kategori başarıyla eklendi! ID: ${response.data.id}`);
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
                        Kategori Ekleme
                    </h5>
                </div>
                <form className="grid xl:grid-cols-2 gap-6 grid-cols-1" onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <select className="form-select text-white-dark"
                                name="parentCategory"
                                onChange={handleInputChange}
                                value={formData.parentCategory}>
                            <option>Üst Kategori</option>
                            {categories.map((category: Category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <span className="badge bg-info block text-xs hover:top-0">
                            Kategorinin bir üst kategorisi varsa seçiniz.
                        </span>
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Kategori Slug Adı" className="form-input"
                               name="slug"
                               value={formData.slug}
                               onChange={handleInputChange}
                        />
                        <span className="badge bg-info block text-xs hover:top-0">
                            Kategori sayfasına gidildiğinde URL'de görünmesiniistediğiniz isim.
                        </span>

                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Kategori Adı *" className="form-input" required
                               name="name"
                               value={formData.name}
                               onChange={handleInputChange}
                        />
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Kategori Kısa Açıklama" className="form-input"
                               name="description"
                               value={formData.description}
                               onChange={handleInputChange}
                        />
                    </div>
                    <div className="mb-5">
                        <Select
                            defaultValue={formData.tags}
                            isMulti
                            components={{ ...animatedComponents, NoOptionsMessage: customNoOptionsMessage }}
                            options={tagsOptions}
                            className="basic-multi-select"
                            placeholder="Ürün Etiketi"
                            classNamePrefix="select"
                            name="tags"
                            onChange={handleSelectChange}


                        />
                    </div>
                    <div className="mb-5"></div>
                    <div className="">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox text-info"
                                   name="isActive"
                                   checked={formData.isActive}
                                   onChange={(e) =>
                                       setFormData({ ...formData, isActive: e.target.checked })
                                   }
                            />
                            <span className=" text-white-dark">Aktif</span>
                        </label>
                    </div>
                    <div className="col-span-2">
                        <hr className="mb-5 border-info" />

                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">
                                Kategori SEO Bilgileri
                            </h5>
                        </div>
                        <div className="grid xl:grid-cols-3 gap-6 grid-cols-1">
                            <div className="mb-5">
                                <input type="text" placeholder="Anahtar Kelimeler" className="form-input"
                                       name="keywords"
                                       value={formData.keywords}
                                       onChange={handleInputChange}
                                />
                            </div>
                            <div className="mb-5">
                                <input type="text" placeholder="Kategori Hakkında Seo Açıklaması"
                                       className="form-input"
                                       name="seoDescription"
                                       value={formData.seoDescription}
                                       onChange={handleInputChange}
                                />
                            </div>
                            <div className="mb-5">
                                <input type="text" placeholder="Yazar Bilgisi" className="form-input"
                                       name="author"
                                       value={formData.author}
                                       onChange={handleInputChange}
                                />
                            </div>
                        </div>
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

export default CategoryAdd;
