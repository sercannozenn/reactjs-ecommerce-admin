import React, { useEffect, useState } from 'react';
import Select, { ActionMeta, MultiValue, SingleValue } from 'react-select';
import makeAnimated from 'react-select/animated';
import { SlugHelper } from '../../helpers/helpers';
import Swal from 'sweetalert2';
import { useParams } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { ProductService } from '../../api/services/ProductService';
import { JoditEditorComponent } from '../../components/Editors/JoditEditor';
import { DropEvent, useDropzone, FileRejection, Accept } from 'react-dropzone';
import { useRouteNavigator } from '../../utils/RouteHelper';


// const animatedComponents = makeAnimated();
type Tag = {
    id: number;
    name: string;
};
type Category = {
    id: number;
    name: string;
};
type Brand = {
    id: number;
    name: string;
};
type SelectOptionsType = {
    value: number,
    label: string
}
type ImageType = {
    id: string; // Yüklenen dosya için unique ID veya veritabanından gelen ID
    file?: File; // Sadece yeni yüklenen dosyalar için
    image_path: string; // Hem yeni hem de var olan görsellerin yolunu saklar
    isNew: boolean; // Yeni eklenmiş mi yoksa önceden var olan mı
    is_featured: boolean|false;
};
type FormDataType = {
    category_ids: SelectOptionsType[];
    tag_ids: SelectOptionsType[];
    name: string;
    slug: string;
    brand_id: number|null;
    short_description: string;
    long_description: string;
    stock: number;
    stock_alert_limit: number;
    is_active: boolean;
    price: number;
    price_discount: number;
    keywords: string;
    seo_description: string;
    author: string;
    images: ImageType[];
    existing_images: [];
    featured_image: string;
};

const customNoOptionsMessage = () => {
    return (
        <div style={{ textAlign: 'center', color: 'gray' }}>
            Aradığınız şeçenek bulunamadı.
        </div>
    );
};

const ProductAdd = () => {
    const dispatch = useDispatch();
    const navigateToRoute = useRouteNavigator();

    const [formData, setFormData] = useState<FormDataType>({
        category_ids: [],
        tag_ids: [],
        name: '',
        slug: '',
        brand_id: null,
        short_description: '',
        long_description: '',
        stock: 0,
        stock_alert_limit: 10,
        is_active: true,
        price: 0,
        price_discount: 0,
        keywords: '',
        seo_description: '',
        author: '',
        images: [],
        existing_images: [],
        featured_image: ''
    });
    const [categories, setCategories] = useState([]); // Üst kategoriler
    const [brands, setBrands] = useState<SelectOptionsType[]>([]); // Markalar
    const [tagsOptions, setTagsOptions] = useState([]); // Etiket seçenekleri
    const [errors, setErrors] = useState<Record<string, string[]>>({}); // Validation hataları için state
    const { id } = useParams<{ id: string }>(); // id urlden alınır.
    const [isEdit, setIsEdit] = useState(false);
    const pageTitle = 'Ürün ' + (isEdit ? 'Güncelleme' : 'Ekleme');

    useEffect(() => {
        dispatch(setPageTitle(pageTitle));
    });
    useEffect(() => {
        const fetchCreateData = async () => {
            try {
                if (!id) {
                    const response = await ProductService.create();
                    setTagsOptions(response.data.tags.map((tag: Tag) => ({ value: tag.id, label: tag.name }))); // Etiketleri dönüştür
                    setCategories(response.data.categories.map((category: Category) => ({
                        value: category.id,
                        label: category.name
                    })));
                    setBrands([{ label: "Marka seçiniz" } ,...response.data.brands.map((brand: Brand) => ({
                        value: brand.id,
                        label: brand.name
                    }))]);
                }
            } catch (error) {
                console.error('Veriler alınırken hata oluştu:', error);
            }
        };

        fetchCreateData();
    }, []);
    useEffect(() => {
        if (id) {
            setIsEdit(true);
            ProductService.fetchById(id).then((response) => {
                console.log("response");
                console.log(response);
                const lastPrice = response.product.prices && response.product.prices.length > 0
                    ? response.product.prices[response.product.prices.length - 1]
                    : { price: 0, price_discount: 0 };
                setFormData((prev) => (
                    {
                        ...prev,
                        ...response.product,
                        price: lastPrice.price ?? 0,
                        price_discount: lastPrice.price_discount ?? 0,
                        featured_image: response.product.images.find((image: ImageType) => image.is_featured)?.id || '', // Öne çıkan görselin ID'si
                        images: response.product.images.map((image: ImageType) => ({
                            id: image.id || '',
                            image_path: 'http://kermes.test/storage/' + (image.image_path || ''),
                            isNew: false
                        })),
                        tag_ids: response.product.tags.map((tag: Tag) => ({ value: tag.id, label: tag.name || '' })),
                        category_ids: response.product.categories.map((tag: Tag) => ({ value: tag.id, label: tag.name || '' })),
                        name: response.product.name || '',
                        slug: response.product.slug || '',
                        short_description: response.product.short_description || '',
                        long_description: response.product.long_description || '',
                    }
                ));
                setTagsOptions(response.tags.map((tag: Tag) => ({ value: tag.id, label: tag.name }))); // Etiketleri dönüştür
                setCategories(response.categories.map((category: Category) => ({
                    value: category.id,
                    label: category.name
                }))); // Kategorileri dönüştür
                setBrands([{ label: "Marka seçiniz" } ,...response.brands.map((brand: Brand) => ({
                    value: brand.id,
                    label: brand.name
                }))]); // Markaları dönüştür
            }).catch((error) => {
                console.log(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: 'Ürün bilgisi alınamadı:' + error,
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

    useEffect(() => {
        return () => {
            // Cleanup fonksiyonu
            formData.images.forEach(image => {
                URL.revokeObjectURL(image.image_path);
            });
        };
    }, [formData.images]);


    const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Dropzone için ayar
    const onDrop = (acceptedFiles: File[], rejectedFiles: FileRejection[], event: DropEvent) => {
        const newImages: ImageType[] = acceptedFiles.map((file: File) => ({
            id: generateUniqueId(), // Benzersiz ID (isteğe bağlı değiştirilebilir)
            file,
            image_path: URL.createObjectURL(file), // Görsel önizlemesi
            isNew: true,
            is_featured: false
        }));
        setFormData(prev => {
            // Eğer hiç görsel yoksa ve yeni görseller eklendiyse
            const shouldSetFeatured = prev.images.length === 0 && newImages.length > 0;
            console.log(newImages);
            return {
                ...prev,
                images: [...prev.images, ...newImages],
                featured_image: shouldSetFeatured ? newImages[0].id : prev.featured_image
            };
        });
    };
    // `accept` türü için doğru nesne yapısı
    const acceptDropZone: Accept = {
        'image/*': [] // Sadece görseller
    };
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: acceptDropZone,
        multiple: true, // Çoklu dosya yükleme
        maxFiles: 10,
        maxSize: MAX_FILE_SIZE,
        onDropRejected: (rejectedFiles) => {
            const errors = rejectedFiles.map(({ file, errors }) => {
                if (errors[0]?.code === 'file-too-large') {
                    return `${file.name}: Dosya boyutu 2MB'dan büyük olamaz`;
                }
                if (errors[0]?.code === 'file-invalid-type') {
                    return `${file.name}: Sadece resim dosyaları kabul edilmektedir`;
                }
                return `${file.name}: Dosya kabul edilemedi`;
            });

            Swal.fire({
                icon: 'error',
                title: 'Hata!',
                html: errors.join('<br>'),
                confirmButtonText: 'Tamam'
            });
        }
    });

    // Öne çıkan görsel seçimi
    const handleSetFeatured = (id: string) => {
        setFormData(prev => ({
            ...prev,
            featured_image: id
        }));
    };
    // Görseli silme
    const handleRemoveImage = (id: string) => {
        // Silinecek görselin URL'ini temizle
        const imageToRemove = formData.images.find(img => img.id === id);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.image_path);
        }

        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((image) => image.id !== id),
            featured_image: prev.featured_image === id ? '' : prev.featured_image
        }));
    };
    const freshFormData = () => {
        setFormData(
            {
                category_ids: [],
                tag_ids: [],
                name: '',
                slug: '',
                brand_id: null,
                short_description: '',
                long_description: '',
                stock: 0,
                stock_alert_limit: 10,
                is_active: true,
                price: 0,
                price_discount: 0,
                keywords: '',
                seo_description: '',
                author: '',
                images: [],
                existing_images: [],
                featured_image: ''
            }
        );
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
        let { name, value } = e.target;
        if ((name === 'price' || name === 'stock' || name === 'price_discount') && value.startsWith("0")){
                value = value.slice(1);
        }
        setFormData(prev => ({
            ...prev,
            [name]: value === null ? '' : value
        }));
        if (errors[name]) {
            // errors un içinde name varsa bunu errorsda ekleyecek
            setErrors((prev) => ({
                    ...prev,
                    [name]: []
                })
            );
        }
    };
    const handleSelectChange = (selectedOptions: MultiValue<SelectOptionsType>, actionMeta: ActionMeta<SelectOptionsType>) => {

        if (!actionMeta.name) return;

        const fieldName = actionMeta.name as keyof typeof formData; // `name`'i kesin string olarak belirtiyoruz

        setFormData((prevData) => ({
            ...prevData,
            [fieldName]: selectedOptions
        }));
    };

    const validateForm = (): Record<string, string[]> => {
        const errors: Record<string, string[]> = {};

        // Ürün adı kontrolü
        if (!formData.name.trim()) {
            errors.name = ['Ürün adı zorunludur'];
        }

        // Slug kontrolü
        if (!formData.slug.trim()) {
            errors.slug = ['Slug alanı zorunludur'];
        }

        // Kategori kontrolü
        if (formData.category_ids.length === 0) {
            errors.category_ids = ['En az bir kategori seçilmelidir'];
        }

        // Stok kontrolü
        if (formData.stock < 0) {
            errors.stock = ['Stok değeri 0 veya daha büyük olmalıdır'];
        }

        // Fiyat kontrolü
        if (formData.price <= 0) {
            errors.price = ['Fiyat 0\'dan büyük olmalıdır'];
        }

        // Görsel kontrolü
        if (formData.images.length === 0) {
            errors.images = ['En az bir görsel yüklemelisiniz'];
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);

            const errorMessages = Object.entries(validationErrors)
                .map(([field, messages]) => `${messages[0]}`)
                .join('<br>');

            // Önce SweetAlert'i göster
            await Swal.fire({
                icon: 'error',
                title: 'Lütfen aşağıdaki hataları düzeltiniz:',
                html: errorMessages,
                confirmButtonText: 'Tamam'
            });

            // SweetAlert kapandıktan 500ms sonra scroll yap
            setTimeout(() => {
                const firstErrorField = Object.keys(validationErrors)[0];
                const errorElement = firstErrorField === 'images'
                    ? document.getElementById('images')
                    : document.querySelector(`[name="${firstErrorField}"]`);

                if (errorElement) {
                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 200);

            return;
        }

        setErrors({}); //Yeni istekten önce hataları temizle

        const serviceData = {
            ...formData,
            category_ids: formData.category_ids.map(cat => cat.value),
            tag_ids: formData.tag_ids.map(tag => tag.value),
            images: formData.images.filter((img: ImageType): img is ImageType & {file: File} => img.isNew && img.file !== undefined).map((img) => img), // Yeni yüklenen dosyalar
            existing_images: formData.images.filter((img) => !img.isNew).map((img) => img.id) // Var olan görseller
        };

        try {
            if (id) {
                const response = await ProductService.update(id, serviceData);
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `Ürün başarıyla güncellendi! ID: ${response.data.id}`,
                    confirmButtonText: 'Tamam',
                    padding: '2em',
                    customClass: {
                        popup: 'sweet-alerts',
                        htmlContainer: '!text-info'
                    }
                });
            } else {

                const response = await ProductService.add(serviceData);
                freshFormData();
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `Ürün başarıyla oluşturuldu!`,
                    confirmButtonText: 'Tamam',
                    padding: '2em',
                    customClass: {
                        popup: 'sweet-alerts'
                    }
                });
                navigateToRoute('ProductList');
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
                        {pageTitle}
                    </h5>
                </div>
                <form className="grid xl:grid-cols-2 gap-6 grid-cols-1" onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <input type="text" placeholder="Ürün Adı *" className="form-input"
                               name="name"
                               value={formData.name || ''}
                               onChange={handleInputChange}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Ürün Slug Adı" className="form-input"
                               name="slug"
                               value={formData.slug || ''}
                               onChange={handleSlugChange}
                        />
                        {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug[0]}</p>}
                        <span className="badge bg-info block text-xs hover:top-0">
                            Ürünün detay sayfasına gidildiğinde URL'de görünmesini istediğiniz isim.
                        </span>
                        <span className="badge bg-danger block text-xs hover:top-0">
                        Otomatik olarak oluşturulacaktır. İsterseniz müdahale edebilirsiniz.
                        </span>
                    </div>
                    <div className="mb-5">
                        <Select
                            value={brands.find(brand => brand.value === formData.brand_id) || null}
                            components={{ ...makeAnimated(), NoOptionsMessage: customNoOptionsMessage }}
                            options={brands}
                            className="basic-single-select"
                            placeholder="Ürün Marka"
                            classNamePrefix="select"
                            name="brand_id"
                            onChange={(newValue: SingleValue<SelectOptionsType> | MultiValue<SelectOptionsType>, actionMeta: ActionMeta<SelectOptionsType>) => {
                                if (newValue && !Array.isArray(newValue)) { // Eğer newValue bir dizi değilse ve null değilse
                                    const singleValue = newValue as SingleValue<SelectOptionsType>; // Türü kesinleştir
                                    if (singleValue) { // singleValue'nun null olmadığını kontrol et
                                        setFormData((prevData) => ({
                                            ...prevData,
                                            brand_id: singleValue.value // Seçili markanın ID'sini ayarla
                                        }));
                                    }
                                } else {
                                    setFormData((prevData) => ({
                                        ...prevData,
                                        brand_id: null // Seçim temizlendiğinde
                                    }));
                                }
                            }}

                        />
                        {errors.category_ids && <p className="text-red-500 text-xs mt-1">{errors.category_ids[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <Select
                            value={formData.category_ids}
                            isMulti
                            components={{ ...makeAnimated(), NoOptionsMessage: customNoOptionsMessage }}
                            options={categories}
                            className="basic-multi-select"
                            placeholder="Ürün Kategori"
                            classNamePrefix="select"
                            name="category_ids"
                            onChange={handleSelectChange}
                        />
                        {errors.category_ids && <p className="text-red-500 text-xs mt-1">{errors.category_ids[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <Select
                            value={formData.tag_ids}
                            isMulti
                            components={{ ...makeAnimated(), NoOptionsMessage: customNoOptionsMessage }}
                            options={tagsOptions}
                            className="basic-multi-select"
                            placeholder="Ürün Etiketi"
                            classNamePrefix="select"
                            name="tag_ids"
                            onChange={handleSelectChange} // Direkt olarak fonksiyonu verdik
                        />
                        {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags[0]}</p>}
                    </div>
                    <div className="mb-5"></div>




                    <div className="mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-4">Kısa Açıklama</h5>
                        <JoditEditorComponent
                            value={formData.short_description || ''}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, short_description: value }))
                            }
                        />

                        {errors.short_description &&
                            <p className="text-red-500 text-xs mt-1">{errors.short_description[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-4">Uzun Açıklama</h5>
                        <JoditEditorComponent
                            value={formData.long_description || ''}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, long_description: value }))
                            }
                        />
                        {errors.long_description &&
                            <p className="text-red-500 text-xs mt-1">{errors.long_description[0]}</p>}
                    </div>

                    {/*<div className="mb-5"></div>*/}
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
                                Ürün Stok Bilgileri
                            </h5>
                        </div>
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Ürün Stok" className="form-input"
                               name="stock"
                               value={formData.stock || 0}
                               onChange={handleInputChange}
                        />
                        {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Ürün Stok Alt Limit Bildirimi" className="form-input"
                               name="stock_alert_limit"
                               value={formData.stock_alert_limit || 10}
                               onChange={handleInputChange}
                        />
                        {errors.stock_alert_limit &&
                            <p className="text-red-500 text-xs mt-1">{errors.stock_alert_limit[0]}</p>}
                        <span className="badge bg-info block text-xs hover:top-0">
                            Ürünün stok değeri belirteceğiniz değerin altına düştüğünde bilgilendirme yapılacaktır.
                        </span>
                    </div>

                    <div className="col-span-2">
                        <hr className="mb-5 border-info" />
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">
                                Ürün Fiyat Bilgileri
                            </h5>
                        </div>
                    </div>
                    <div className="mb-5">
                        <label htmlFor="price">Ana Fiyat</label>
                        <input type="number" placeholder="Ürün Fiyat" className="form-input"
                               name="price"
                               min="0" // Negatif değerleri engellemek için
                               step="0.01" // Ondalık basamaklara izin vermek için
                               value={formData.price}
                               onChange={handleInputChange}
                        />
                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <label htmlFor="price_discount">İndirimli Son Fiyat</label>
                        <input type="number" placeholder="Ürün İndirimli Fiyat" className="form-input"
                               name="price_discount"
                               id="price_discount"
                               min="0" // Negatif değerleri engellemek için
                               step="0.01" // Ondalık basamaklara izin vermek için
                               value={formData.price_discount || 0}
                               onChange={handleInputChange}
                        />
                        {errors.price_discount &&
                            <p className="text-red-500 text-xs mt-1">{errors.price_discount[0]}</p>}
                        <span className="badge bg-info block text-xs hover:top-0">
                            Ürünün güncel fiyatı, indirimli fiyat olarak girilen fiyat olacaktır.
                            İndirim tanımlama ekranından yapacağınız indirim tanımlama işlemin sonrasında hesaplanacak fiyat bu alandaki indirimli fiyat üzerinden hesaplanacaktır.
                        </span>
                    </div>

                    <div className="col-span-2">
                        <hr className="mb-5 border-info" />
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">
                                Ürün Görselleri
                            </h5>
                        </div>
                    </div>

                    <div {...getRootProps()}
                         className="col-span-2 border-dashed border-2 border-gray-400 p-4 rounded-md cursor-pointer">
                        <input {...getInputProps()} />
                        <p>Görselleri buraya sürükleyin veya seçmek için tıklayın</p>
                        <div className="grid grid-cols-3 gap-4 mt-4">

                            {formData.images.length === 0 && (
                                <div className="col-span-3 text-center text-gray-500 py-4">
                                    Henüz resim yüklenmedi
                                </div>
                            )}

                            {formData.images.map((image) => (
                                <div key={image.id} className="relative group">
                                    <img
                                        src={image.image_path}
                                        alt="image_path"
                                        className="w-full h-32 object-contain rounded-md transition-transform group-hover:scale-105"
                                    />
                                    {/* Öne Çıkan İşareti */}
                                    {formData.featured_image === image.id && (
                                        <span
                                            className="absolute top-0 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded-br-md">
                                            Öne Çıkan
                                        </span>
                                    )}
                                    <div
                                        className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSetFeatured(image.id);
                                            }}
                                            className="absolute bottom-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-tr-md">
                                            Öne Çıkar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveImage(image.id);
                                            }}
                                            className="absolute bottom-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-tl-md"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                       value={formData.keywords || ''}
                                       onChange={handleInputChange}
                                />
                                {errors.keywords && <p className="text-red-500 text-xs mt-1">{errors.keywords[0]}</p>}
                            </div>
                            <div className="mb-5">
                                <input type="text" placeholder="Kategori Hakkında Seo Açıklaması"
                                       className="form-input"
                                       name="seo_description"
                                       value={formData.seo_description || ''}
                                       onChange={handleInputChange}
                                />
                                {errors.seo_description &&
                                    <p className="text-red-500 text-xs mt-1">{errors.seo_description[0]}</p>}
                            </div>
                            <div className="mb-5">
                                <input type="text" placeholder="Yazar Bilgisi" className="form-input"
                                       name="author"
                                       value={formData.author || ''}
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

export default ProductAdd;
