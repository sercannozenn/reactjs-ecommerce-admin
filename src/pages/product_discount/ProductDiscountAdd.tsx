import React, { useEffect, useState } from 'react';
import Select, { ActionMeta, MultiValue } from 'react-select';
import makeAnimated from 'react-select/animated';
import Swal from 'sweetalert2';
import { useParams } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { JoditEditorComponent } from '../../components/Editors/JoditEditor';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { ProductDiscountService } from '../../api/services/ProductDiscountService';
import { SelectOptionsType } from '../../types/common';
import { ProductDiscountFormData, DiscountTargetType, DiscountAmountType } from '../../types/discount';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Turkish } from 'flatpickr/dist/l10n/tr.js';
import dayjs from 'dayjs';


const discountTypeOptions = [
    { value: 'percentage', label: 'Yüzde' },
    { value: 'fixed', label: 'Sabit Miktar' },
];


const initialFormState: ProductDiscountFormData = {
    category_ids: [],
    tag_ids: [],
    brand_ids: [],
    name: '',
    description: '',
    is_active: true,
    target_type: 'product',
    targets: [],
    discount_start: '',
    discount_end: '',
    priority: '',
    discount_type: 'percentage',
    discount_amount: 0,
};

const getTargetLabel = (type?: string): string => {
    switch (type) {
        case 'product': return 'Ürün';
        case 'category': return 'Kategori';
        case 'brand': return 'Marka';
        case 'tag': return 'Etiket';
        case 'user': return 'Kullanıcı';
        default: return '';
    }
};

const ProductDiscountAdd = () => {

    const [targetOptions, setTargetOptions] = useState<SelectOptionsType[]>([]);
    const [isLoadingTargets, setIsLoadingTargets] = useState(false);
    const [inputValue, setInputValue] = useState<string>(''); // <== önemli

    const handleTargetSearch = async (inputValue: string) => {
        if (!formData.target_type || !inputValue.trim()) {
            setTargetOptions([]);
            return;
        }

        try {
            setIsLoadingTargets(true);
            const response = await ProductDiscountService.searchTargets(formData.target_type, inputValue);
            const formatted = response.map((item: any) => ({
                value: item.id,
                label: item.name,
            }));
            setTargetOptions(formatted);
        } catch (error) {
            console.error("Hedef arama hatası", error);
        } finally {
            setIsLoadingTargets(false);
        }
    };




    const dispatch = useDispatch();
    const navigateToRoute = useRouteNavigator();
    const { id } = useParams<{ id: string }>();

    const [formData, setFormData] = useState<ProductDiscountFormData>(initialFormState);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [tagsOptions, setTagsOptions] = useState([]);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isEdit, setIsEdit] = useState(false);

    const pageTitle = 'İndirim ' + (isEdit ? 'Güncelleme' : 'Ekleme');

    useEffect(() => {
        dispatch(setPageTitle(pageTitle));
    }, []);

    useEffect(() => {
        const fetchCreateData = async () => {
            try {
                if (!id) {
                    const response = await ProductDiscountService.create();
                    setTagsOptions(response.data.tags.map((tag: any) => ({ value: tag.id, label: tag.name })));
                    setCategories(response.data.categories.map((c: any) => ({ value: c.id, label: c.name })));
                    setBrands(response.data.brands.map((b: any) => ({ value: b.id, label: b.name })));
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
            ProductDiscountService.fetchById(id).then((response) => {
                console.log(response);
                setFormData((prev) => ({
                    ...prev,
                    ...response,
                }));
            }).catch((error) => {
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: [] }));
        }
    };

    const handleSelectChange = (selectedOptions: MultiValue<SelectOptionsType>, actionMeta: ActionMeta<SelectOptionsType>) => {
        const fieldName = actionMeta.name as keyof ProductDiscountFormData;
        setFormData(prev => ({ ...prev, [fieldName]: selectedOptions }));
    };

    const loadTargetOptions = async (inputValue: string) => {
        if (!formData.target_type || !inputValue) return [];

        try {
            const response = await ProductDiscountService.searchTargets(formData.target_type, inputValue);
            return response.map((item: any) => ({
                value: item.id,
                label: item.name,
            }));
        } catch (error) {
            console.error("Hedef arama hatası", error);
            return [];
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const serviceData = {
            ...formData,
            category_ids: formData.category_ids.map(c => c.value),
            tag_ids: formData.tag_ids.map(t => t.value),
            brand_ids: formData.brand_ids.map(b => b.value),
            targets: formData.targets?.map(t => t.value),
        };

        try {
            if (id) {
                const response = await ProductDiscountService.update(id, serviceData);
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `İndirim güncellendi! ID: ${response.data.id}`,
                    confirmButtonText: 'Tamam'
                });
            } else {
                const response = await ProductDiscountService.add(serviceData);
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `İndirim oluşturuldu!`,
                    confirmButtonText: 'Tamam'
                });
                navigateToRoute('ProductDiscountList');
            }
        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                alert(error.response?.data?.message || 'Bir hata oluştu.');
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
                        <input type="text" placeholder="İndirim Adı *" className="form-input" name="name" value={formData.name} onChange={handleInputChange} />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                    </div>

                    {/* İndirim Tipi */}
                    <div className="mb-5">
                        <Select
                            value={{ value: formData.target_type, label: getTargetLabel(formData.target_type) }}
                            options={[
                                { value: 'product', label: 'Ürün' },
                                { value: 'category', label: 'Kategori' },
                                { value: 'brand', label: 'Marka' },
                                { value: 'tag', label: 'Etiket' },
                                { value: 'user', label: 'Kullanıcı' },
                            ]}
                            onChange={(option) =>
                                setFormData((prev) => ({ ...prev, target_type: option?.value as DiscountTargetType, targets: [] }))
                            }
                            classNamePrefix="select"
                            placeholder="İndirim Tipi Seçin"
                        />
                        {errors.target_type && <p className="text-red-500 text-xs mt-1">{errors.target_type[0]}</p>}
                    </div>

                    {/* Dinamik arama ile hedef seçimi */}
                    <div className="mb-5">
                        <Select
                            isMulti
                            options={targetOptions}
                            value={formData.targets}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, targets: [...value] }))
                            }
                            inputValue={inputValue}
                            onInputChange={(value, { action }) => {
                                setInputValue(value);
                                if (action === 'input-change') {
                                    handleTargetSearch(value);
                                }
                            }}
                            isLoading={isLoadingTargets}
                            placeholder={`${getTargetLabel(formData.target_type)} ara ve seç`}
                            classNamePrefix="select"
                            closeMenuOnSelect={false}
                            components={makeAnimated()}
                        />

                        {errors.targets && <p className="text-red-500 text-xs mt-1">{errors.targets[0]}</p>}

                    </div>
                    <div className="mb-5">
                        <input
                            type="number"
                            name="priority"
                            className="form-input"
                            value={formData.priority ?? ''}
                            onChange={handleInputChange}
                            placeholder="Öncelik (Çakışmalarda bu öncelik kullanılacaktır. 1, 5, 10 gibi değerler verilebilir.)"
                        />
                        {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority[0]}</p>}
                        <span className="badge bg-info block text-xs hover:top-0">Öncelik (Çakışmalarda bu öncelik kullanılacaktır. 1, 5, 10 gibi değerler verilebilir.)</span>
                        <span className="badge bg-danger block text-xs hover:top-0">Aynı ürüne ikinci bir indirim tanımlanmak istendiğinde verdiğiniz önceliğe göre hesaplama yapılacaktır.</span>

                    </div>
                    {/* Tarih & Öncelik */}
                    <div className="mb-5">
                        <Flatpickr
                            name="discount_start"
                            placeholder="Başlangıç Tarihi"
                            data-enable-time
                            options={{
                                enableTime: true,
                                dateFormat: 'Y-m-d H:i',
                                locale: Turkish,
                            }}
                            value={formData.discount_start}
                            className="form-input"
                            onChange={(selectedDates) => {
                                const date = selectedDates[0];
                                const formatted = dayjs(date).format('YYYY-MM-DD HH:mm');
                                handleInputChange({
                                    target: {
                                        name: 'discount_start',
                                        value: formatted,
                                        type: 'text',
                                        checked: false,
                                    },
                                } as React.ChangeEvent<HTMLInputElement>);
                            }}

                        />
                        {errors.discount_start && <p className="text-red-500 text-xs mt-1">{errors.discount_start[0]}</p>}

                    </div>
                    <div className="mb-5">
                        <Flatpickr
                            name="discount_end"
                            placeholder="Bitiş Tarihi"
                            data-enable-time
                            options={{
                                enableTime: true,
                                dateFormat: 'Y-m-d H:i',
                                locale: Turkish,
                            }}
                            value={formData.discount_end}
                            className="form-input"
                            onChange={(selectedDates) => {
                                const date = selectedDates[0];
                                const formatted = dayjs(date).format('YYYY-MM-DD HH:mm');

                                handleInputChange({
                                    target: {
                                        name: 'discount_end',
                                        value: formatted,
                                        type: 'text',
                                        checked: false,
                                    },
                                } as React.ChangeEvent<HTMLInputElement>);
                            }}
                        />
                        {errors.discount_end && <p className="text-red-500 text-xs mt-1">{errors.discount_end[0]}</p>}

                    </div>


                    {/* İndirim Tipi ve Miktar */}
                    <div className="mb-5">
                        <Select
                            value={discountTypeOptions.find(opt => opt.value === formData.discount_type)}
                            options={discountTypeOptions}
                            onChange={(option) =>
                                setFormData((prev) => ({ ...prev, discount_type: option?.value as DiscountAmountType }))
                            }
                            classNamePrefix="select"
                            placeholder="İndirim Tipi"
                        />
                        {errors.discount_type && <p className="text-red-500 text-xs mt-1">{errors.discount_type[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <input type="number" name="discount_amount" className="form-input" value={formData.discount_amount} onChange={handleInputChange} placeholder="İndirim Miktarı" />
                        {errors.discount_amount && <p className="text-red-500 text-xs mt-1">{errors.discount_amount[0]}</p>}
                    </div>

                    {/* Açıklama */}
                    <div className="mb-5 col-span-2">
                        <h5 className="font-semibold text-lg dark:text-white-light mb-2">Kısa Açıklama</h5>
                        <JoditEditorComponent
                            value={formData.description ?? ''}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, description: value }))
                            }
                        />
                    </div>

                    {/* Aktiflik */}
                    <div className="">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox text-info" name="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                            <span className="text-white-dark ml-2">Aktif</span>
                        </label>
                    </div>

                    {/* Kaydet */}
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

export default ProductDiscountAdd;
