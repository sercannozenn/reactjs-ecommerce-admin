import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { SlugHelper } from '../../helpers/helpers';
import Swal from 'sweetalert2';
import { useParams } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { CategoryService } from '../../api/services/CategoryService';

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
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        parent_category_id: '',
        slug: '',
        name: '',
        description: '',
        tags: [],
        is_active: true,
        keywords: '',
        seo_description: '',
        author: ''
    });
    const [categories, setCategories] = useState([]); // Üst kategoriler
    const [tagsOptions, setTagsOptions] = useState([]); // Etiket seçenekleri
    const [errors, setErrors] = useState<Record<string, string[]>>({}); // Validation hataları için state
    const { id } = useParams<{ id: string }>(); // id urlden alınır.
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Kategori ' + (isEdit ? 'Güncelleme' : 'Ekleme')));
    });
    useEffect(() => {
        // category/create endpoint'ine istek at
        const fetchCreateData = async () => {
            try {
                const response = await CategoryService.create();
                console.log('response-2 s');
                console.log(response);
                setCategories(response.data.categories || []); // Gelen kategoriler
                setTagsOptions(response.data.tags.map((tag: Tag) => ({ value: tag.id, label: tag.name }))); // Etiketleri dönüştür
            } catch (error) {
                console.error('Veriler alınırken hata oluştu:', error);
            }
        };

        fetchCreateData();
    }, []);
    useEffect(() => {
        if (id) {
            setIsEdit(true);
            CategoryService.fetchById(id).then((category) => {
                setFormData((prev) => (
                    {
                        ...prev,
                        ...category,
                        tags: category.tags.map((tag: Tag) => ({ value: tag.id, label: tag.name }))
                    }
                ));
            }).catch((error) => {
                console.log(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: 'Kategori bilgisi alınamadı:' + error,
                    confirmButtonText: 'Tamam',
                    padding: '2em',
                    customClass: {
                        popup: 'sweet-alerts'
                    }
                });
            });
        } else {
            setIsEdit(false);
        }
    }, [id]);
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            slug: SlugHelper.generate(formData.name ?? '')
        }));
    }, [formData.name]);

    const freshFormData = () => {
        setFormData({
            parent_category_id: '',
            slug: '',
            name: '',
            description: '',
            tags: [],
            is_active: true,
            keywords: '',
            seo_description: '',
            author: ''
        });
        setErrors({});
    };
    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitizedSlug = SlugHelper.generate(e.target.value); // Girilen değeri anında sluglaştır
        setFormData((prev) => ({ ...prev, slug: sanitizedSlug }));

        if (errors[e.target.name]) {
            // errors un içinde name varsa bunu errorsa ekleyecek
            setErrors((prev) => ({ ...prev, [e.target.name]: [] }));
        }
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (errors[name]) {
            // errors un içinde name varsa bunu errorsda ekleyecek
            setErrors((prev) => ({
                    ...prev,
                    [name]: []
                })
            );
        }
    };
    const handleSelectChange = (selectedOptions: any) => {
        setFormData({ ...formData, tags: selectedOptions });
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors({}); //Yeni istekten önce hataları temizle

        try {
            if (id) {
                const response = await CategoryService.update(id, formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `Kategori başarıyla güncellendi! ID: ${response.data.id}`,
                    confirmButtonText: 'Tamam',
                    padding: '2em',
                    customClass: {
                        popup: 'sweet-alerts',
                        htmlContainer: '!text-info'
                    }
                });
            } else {
                const response = await CategoryService.add(formData);
                freshFormData();
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `Kategori başarıyla oluşturuldu!`,
                    confirmButtonText: 'Tamam',
                    padding: '2em',
                    customClass: {
                        popup: 'sweet-alerts'
                    }
                });
            }
        } catch (error: any) {
            if (error.response?.status === 422) {
                // Laravel'den gelen validation hatalarını state'e kaydet
                setErrors(error.response.data.errors);
            } else {
                console.error(error);
                alert(error.response?.data?.message || 'Bir hata oluştu! Lütfen tekrar deneyin.');
            }

        }
    };

    return (
        <div className="">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        Kategori {isEdit ? 'Güncelleme' : 'Ekleme'}
                    </h5>
                </div>
                <form className="grid xl:grid-cols-2 gap-6 grid-cols-1" onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <select className="form-select text-white-dark"
                                name="parent_category_id"
                                onChange={handleInputChange}
                                value={formData.parent_category_id}>
                            <option>Üst Kategori</option>
                            {categories.map((category: Category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {errors.parent_category_id &&
                            <p className="text-red-500 text-xs mt-1">{errors.parent_category_id[0]}</p>}
                        <span className="badge bg-info block text-xs hover:top-0">
                            Kategorinin bir üst kategorisi varsa seçiniz.
                        </span>
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Kategori Adı *" className="form-input" required
                               name="name"
                               value={formData.name}
                               onChange={handleInputChange}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Kategori Kısa Açıklama" className="form-input"
                               name="description"
                               value={formData.description}
                               onChange={handleInputChange}
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Kategori Slug Adı" className="form-input"
                               name="slug"
                               value={formData.slug}
                               onChange={handleSlugChange}
                        />
                        {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug[0]}</p>}
                        <span className="badge bg-info block text-xs hover:top-0">
                            Kategori sayfasına gidildiğinde URL'de görünmesini istediğiniz isim.
                        </span>
                        <span className="badge bg-danger block text-xs hover:top-0">
                        Otomatik olarak oluşturulacaktır. İsterseniz müdahale edebilirsiniz.
                        </span>
                    </div>

                    <div className="mb-5">
                        <Select
                            value={formData.tags}
                            isMulti
                            components={{ ...animatedComponents, NoOptionsMessage: customNoOptionsMessage }}
                            options={tagsOptions}
                            className="basic-multi-select"
                            placeholder="Kategori Etiketi"
                            classNamePrefix="select"
                            name="tags"
                            onChange={handleSelectChange}
                        />
                        {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags[0]}</p>}
                    </div>
                    <div className="mb-5"></div>
                    <div className="">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox text-info"
                                   name="is_active"
                                   checked={formData.is_active}
                                   onChange={(e) =>
                                       setFormData({ ...formData, is_active: e.target.checked })
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
                                {errors.keywords && <p className="text-red-500 text-xs mt-1">{errors.keywords[0]}</p>}
                            </div>
                            <div className="mb-5">
                                <input type="text" placeholder="Kategori Hakkında Seo Açıklaması"
                                       className="form-input"
                                       name="seo_description"
                                       value={formData.seo_description}
                                       onChange={handleInputChange}
                                />
                                {errors.seo_description &&
                                    <p className="text-red-500 text-xs mt-1">{errors.seo_description[0]}</p>}
                            </div>
                            <div className="mb-5">
                                <input type="text" placeholder="Yazar Bilgisi" className="form-input"
                                       name="author"
                                       value={formData.author}
                                       onChange={handleInputChange}
                                />
                                {errors.author && <p className="text-red-500 text-xs mt-1">{errors.author[0]}</p>}
                            </div>
                        </div>
                    </div>


                    <div className="col-span-2">
                        <hr className="my-5 border-gray-300" />
                        <div className="flex justify-center">
                            <button type="submit" className="btn btn-info hover:btn-success w-full">
                                {isEdit ? 'GÜNCELLE' : 'KAYDET'}
                            </button>
                        </div>

                    </div>
                </form>

            </div>
        </div>
    );
};

export default CategoryAdd;
