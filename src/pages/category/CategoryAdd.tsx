import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { SlugHelper } from '../../helpers/helpers';
import Swal from 'sweetalert2';
import { useParams } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { CategoryService } from '../../api/services/CategoryService';
import IconX from '../../components/Icon/IconX';

const animatedComponents = makeAnimated();
type Tag = {
    id: number;
    name: string;
};
type Category = {
    id: number;
    name: string;
    parent_category_id: number | null;
    image_url?: string | null;
};

type BreadcrumbItem = { id: number; name: string; slug: string };

type FlatOption = { id: number; name: string; depth: number };

const buildTreeOptions = (categories: Category[]): FlatOption[] => {
    const result: FlatOption[] = [];
    const addChildren = (parentId: number | null, depth: number) => {
        categories
            .filter((c) => c.parent_category_id === parentId)
            .forEach((c) => {
                result.push({ id: c.id, name: c.name, depth });
                addChildren(c.id, depth + 1);
            });
    };
    addChildren(null, 0);
    return result;
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

    const [formData, setFormData] = useState<{
        parent_category_id: string;
        slug: string;
        name: string;
        description: string;
        tags: any[];
        is_active: boolean;
        keywords: string;
        seo_description: string;
        author: string;
        sort_order: string;
        meta_title: string;
        meta_description: string;
        og_image_url: string;
    }>({
        parent_category_id: '',
        slug: '',
        name: '',
        description: '',
        tags: [],
        is_active: true,
        keywords: '',
        seo_description: '',
        author: '',
        sort_order: '',
        meta_title: '',
        meta_description: '',
        og_image_url: '',
    });
    const [categories, setCategories] = useState([]); // Üst kategoriler
    const [tagsOptions, setTagsOptions] = useState([]); // Etiket seçenekleri
    const [errors, setErrors] = useState<Record<string, string[]>>({}); // Validation hataları için state
    const { id } = useParams<{ id: string }>(); // id urlden alınır.
    const [isEdit, setIsEdit] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [removeImage, setRemoveImage] = useState<boolean>(false);
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);

    useEffect(() => {
        dispatch(setPageTitle('Kategori ' + (isEdit ? 'Güncelleme' : 'Ekleme')));
    });
    useEffect(() => {
        // category/create endpoint'ine istek at
        const fetchCreateData = async () => {
            try {
                const response = await CategoryService.create();
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
                        sort_order: category?.sort_order ?? '',
                        tags: category?.tags ?? []
                    }
                ));
                // Sprint 17: mevcut görsel önizlemesi (backend image_url accessor döndürür)
                if (category?.image_url) {
                    setImagePreview(category.image_url);
                }
                // Sprint 18: breadcrumb
                setBreadcrumb(category?.breadcrumb ?? []);
            }).catch((error) => {
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
            author: '',
            sort_order: '',
            meta_title: '',
            meta_description: '',
            og_image_url: '',
        });
        setErrors({});
        setImageFile(null);
        setImagePreview(null);
        setRemoveImage(false);
        setBreadcrumb([]);
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
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            // Yeni görsel akışı zaten eskiyi siler, remove flag'i sıfırla
            setRemoveImage(false);
            if (errors.image) {
                setErrors((prev) => ({ ...prev, image: [] }));
            }
        }
    };
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        // Edit modunda backend'e remove_image flag'i gönderilmesi için
        setRemoveImage(true);
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors({}); //Yeni istekten önce hataları temizle

        const payload = { ...formData, image: imageFile };

        try {
            if (id) {
                const response = await CategoryService.update(id, payload as any, removeImage);
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `Kategori başarıyla güncellendi! ID: ${response.data?.id ?? ''}`,
                    confirmButtonText: 'Tamam',
                    padding: '2em',
                    customClass: {
                        popup: 'sweet-alerts',
                        htmlContainer: '!text-info'
                    }
                });
            } else {
                await CategoryService.add(payload as any);
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
                <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        Kategori {isEdit ? 'Güncelleme' : 'Ekleme'}
                    </h5>
                </div>
                {/* Sprint 18: Edit modunda breadcrumb göstergesi */}
                {isEdit && breadcrumb.length > 0 && (
                    <nav className="text-xs text-gray-400 mb-4" aria-label="breadcrumb">
                        {breadcrumb.map((b, i) => (
                            <span key={b.id}>
                                {i > 0 && <span className="mx-1">›</span>}
                                <span>{b.name}</span>
                            </span>
                        ))}
                    </nav>
                )}
                <form className="grid xl:grid-cols-2 gap-6 grid-cols-1" onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <select className="form-select text-white-dark"
                                name="parent_category_id"
                                onChange={handleInputChange}
                                value={formData.parent_category_id}>
                            <option value="">Üst Kategori</option>
                            {buildTreeOptions(categories).map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {'—'.repeat(opt.depth) + (opt.depth > 0 ? ' ' : '')}{opt.name}
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
                    {/* Sprint 17: sort_order */}
                    <div className="mb-5">
                        <input
                            type="number"
                            placeholder="Sıralama (opsiyonel)"
                            className="form-input"
                            name="sort_order"
                            value={formData.sort_order}
                            onChange={handleInputChange}
                            min={0}
                        />
                        {errors.sort_order && <p className="text-red-500 text-xs mt-1">{errors.sort_order[0]}</p>}
                        <span className="badge bg-info block text-xs hover:top-0">
                            Düşük değer önce gelir. Boş bırakılırsa ada göre sıralanır.
                        </span>
                    </div>
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
                    {/* Sprint 17: Görsel yükleme */}
                    <div className="col-span-2">
                        <hr className="mb-5 border-info" />
                        <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-lg dark:text-white-light">
                                Kategori Görseli
                            </h5>
                        </div>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="form-input"
                            onChange={handleImageChange}
                        />
                        {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image[0]}</p>}
                        <span className="badge bg-info block text-xs hover:top-0 mt-1">
                            JPEG, PNG veya WEBP — en fazla 2MB. Opsiyonel.
                        </span>
                        {imagePreview && (
                            <div className="mt-4 relative inline-block">
                                <img src={imagePreview} alt="Kategori Görseli Önizleme" className="w-48 h-32 object-cover border rounded" />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl hover:bg-red-600"
                                    title="Kaldır"
                                >
                                    <IconX />
                                </button>
                            </div>
                        )}
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

                    {/* Meta SEO alanları */}
                    <div className="col-span-2">
                        <hr className="mb-5 border-info" />
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">
                                Meta SEO (Google / Sosyal Medya)
                            </h5>
                        </div>
                        <div className="grid xl:grid-cols-2 gap-6 grid-cols-1">
                            <div className="mb-5">
                                <label className="block text-sm font-medium mb-1">
                                    Meta Başlık
                                    <span className={`ml-2 text-xs ${(formData.meta_title?.length || 0) > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {formData.meta_title?.length || 0}/160
                                    </span>
                                </label>
                                <input type="text" placeholder={`${formData.name || 'Kategori Adı'} | Kermes`}
                                       className="form-input"
                                       name="meta_title"
                                       maxLength={160}
                                       value={formData.meta_title || ''}
                                       onChange={handleInputChange}
                                />
                                {errors.meta_title && <p className="text-red-500 text-xs mt-1">{errors.meta_title[0]}</p>}
                            </div>
                            <div className="mb-5">
                                <label className="block text-sm font-medium mb-1">
                                    Meta Açıklama
                                    <span className={`ml-2 text-xs ${(formData.meta_description?.length || 0) > 320 ? 'text-red-500' : 'text-gray-400'}`}>
                                        {formData.meta_description?.length || 0}/320
                                    </span>
                                </label>
                                <textarea placeholder="Kategori açıklaması (boş bırakılırsa açıklama kullanılır)"
                                          className="form-textarea"
                                          name="meta_description"
                                          maxLength={320}
                                          rows={3}
                                          value={formData.meta_description || ''}
                                          onChange={(e) => handleInputChange(e as any)}
                                />
                                {errors.meta_description && <p className="text-red-500 text-xs mt-1">{errors.meta_description[0]}</p>}
                            </div>
                            <div className="mb-5">
                                <label className="block text-sm font-medium mb-1">OG Görsel URL</label>
                                <input type="url" placeholder="https://..."
                                       className="form-input"
                                       name="og_image_url"
                                       value={formData.og_image_url || ''}
                                       onChange={handleInputChange}
                                />
                                {errors.og_image_url && <p className="text-red-500 text-xs mt-1">{errors.og_image_url[0]}</p>}
                            </div>
                        </div>
                        {/* Google Önizleme */}
                        <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-white dark:bg-gray-800">
                            <p className="text-xs text-gray-400 mb-2">Google Önizleme</p>
                            <p className="text-blue-700 text-base font-medium truncate">
                                {formData.meta_title || (formData.name ? `${formData.name} | Kermes` : 'Kategori Adı | Kermes')}
                            </p>
                            <p className="text-green-700 text-xs mb-1">kermes.com › kategori › {formData.slug || 'kategori-slug'}</p>
                            <p className="text-gray-600 text-sm line-clamp-2">
                                {formData.meta_description || formData.description || 'Meta açıklama girilmemiş.'}
                            </p>
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
