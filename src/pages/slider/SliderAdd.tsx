import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { SliderService } from '../../api/services/SliderService';
import { useDropzone } from 'react-dropzone';
import IconX from '../../components/Icon/IconX';
import Swal from 'sweetalert2';
// Ace Editor importları
import AceEditor from "react-ace";

// Temel modları import et
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-monokai";

// Worker'ları import et
import "ace-builds/src-noconflict/worker-css";

// Ace için gerekli ek bileşenleri import et
import "ace-builds/src-noconflict/ext-language_tools";
import ace from "ace-builds";

// Worker yolunu ayarla
ace.config.set('basePath', '/node_modules/ace-builds/src-noconflict/');
ace.config.set('modePath', '/node_modules/ace-builds/src-noconflict/');
ace.config.set('themePath', '/node_modules/ace-builds/src-noconflict/');
ace.config.set('workerPath', '/node_modules/ace-builds/src-noconflict/');


type SliderFormData = {
    path: File | null;
    row_1_text: string;
    row_1_color: string;
    row_1_css: string;
    row_2_text: string;
    row_2_color: string;
    row_2_css: string;
    button_text: string;
    button_url: string;
    button_target: '_self' | '_blank';
    button_color: string;
    button_css: string;
    is_active: boolean;
};

const initialFormData: SliderFormData = {
    path: null,
    row_1_text: '',
    row_1_color: '',
    row_1_css: '',
    row_2_text: '',
    row_2_color: '',
    row_2_css: '',
    button_text: '',
    button_url: '',
    button_target: '_self',
    button_color: '',
    button_css: '',
    is_active: true
};

const SliderAdd = () => {
    const navigateToRoute = useRouteNavigator();

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const { id } = useParams();
    const [formData, setFormData] = useState<SliderFormData>(initialFormData);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            SliderService.fetchById(Number(id)).then((res) => {
                console.log(res);
                setFormData({ ...res.data, path: null });
                setPreview(res.data.path_url ? `${res.data.path_url}` : null);
            });
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, value, type, checked } = target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: [] }));
        }
    };
    const handleCssChange = (field: "row_1_css" | "row_2_css" | "button_css", value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value, // Değişen alanı güncelle
        }));
    };
    const handleRemoveImage = () => {
        setFormData({ ...formData, path: null });
        setPreview(null);
    };

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setFormData({ ...formData, path: file });
        setPreview(URL.createObjectURL(file));
        if (errors.path) {
            setErrors((prev) => ({ ...prev, path: [] }));
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors: Record<string, string[]> = {};

        if (!formData.path && !preview && !id) {
            validationErrors.path = ['Görsel yüklenmelidir.'];
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            const errorMessages = Object.values(validationErrors).map((msg) => msg[0]).join('<br>');
            await Swal.fire({ icon: 'error', title: 'Lütfen eksikleri düzeltin', html: errorMessages });
            return;
        }

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'is_active') {
                data.append(key, value ? "1" : "0");
            } else if (value !== null && value !== undefined) {
                data.append(key, value as string | Blob);
            }
        });

        try {
            let result;
            if (id) {
                result = await SliderService.update(Number(id), data);
                Swal.fire('Başarılı', `Slider güncellendi. ID: ${result.data?.id}`, 'success');
            } else {
                result = await SliderService.create(data);
                Swal.fire('Başarılı', `Slider eklendi. ID: ${result.data?.id}`, 'success');
            }
            navigateToRoute('SliderList');
        } catch (error: any) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                Swal.fire('Hata', 'İşlem sırasında bir hata oluştu', 'error');
            }
        }
    };

    return (
        <div className="">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        {id ? 'Slider Güncelle' : 'Slider Ekle'}
                    </h5>
                </div>
                <form className="grid xl:grid-cols-3 gap-6 grid-cols-1" onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <input
                            type="text"
                            placeholder="1. Satır Metni"
                            className={`form-input ${errors.row_1_text ? 'border-red-500' : ''}`}
                            name="row_1_text"
                            value={formData.row_1_text}
                            onChange={handleChange}
                        />
                        {errors.row_1_text && <p className="text-red-500 text-xs mt-1">{errors.row_1_text[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <input
                            type="color"
                            placeholder="1. Satır Renk"
                            className={`form-input ${errors.row_1_color ? 'border-red-500' : ''}`}
                            name="row_1_color"
                            value={formData.row_1_color}
                            onChange={handleChange}
                        />
                        <p style={{ color: formData.row_1_color}}>1. Yazı Seçilen Renk: {formData.row_1_text}</p>
                        {errors.row_1_color && <p className="text-red-500 text-xs mt-1">{errors.row_1_color[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <AceEditor
                            mode="css"
                            onChange={(value) => handleCssChange("row_1_css", value)}
                            name="row_1_css"
                            theme="monokai"
                            fontSize={14}
                            lineHeight={19}
                            showPrintMargin={true}
                            showGutter={true}
                            highlightActiveLine={true}
                            value={formData.row_1_css}
                            width="100½"
                            height="200px"
                            setOptions={{
                                enableBasicAutocompletion: false,
                                enableLiveAutocompletion: false,
                                enableSnippets: false,
                                enableMobileMenu: true,
                                showLineNumbers: true,
                                tabSize: 2,}}
                            placeholder="1.satır yazı css"
                        />
                        <span className="badge bg-info block text-xs hover:top-0">
                            1. satırın yazısı için css kodunuzu ihtiyaç durumunda bu alana ekleyebilirsiniz.
                        </span>
                        {errors.row_1_css && <p className="text-red-500 text-xs mt-1">{errors.row_1_css[0]}</p>}
                    </div>

                    <div className="mb-5">
                        <input
                            type="text"
                            placeholder="2. Satır Metni"
                            className={`form-input ${errors.row_2_text ? 'border-red-500' : ''}`}
                            name="row_2_text"
                            value={formData.row_2_text}
                            onChange={handleChange}
                        />
                        {errors.row_2_text && <p className="text-red-500 text-xs mt-1">{errors.row_2_text[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <input
                            type="color"
                            placeholder="2. Satır Renk"
                            className={`form-input ${errors.row_2_color ? 'border-red-500' : ''}`}
                            name="row_2_color"
                            value={formData.row_2_color}
                            onChange={handleChange}
                        />
                        <p style={{ color: formData.row_2_color}}>2. Yazı Seçilen Renk: {formData.row_2_text}</p>
                        {errors.row_2_color && <p className="text-red-500 text-xs mt-1">{errors.row_2_color[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <AceEditor
                            mode="css"
                            onChange={(value) => handleCssChange("row_2_css", value)}
                            name="row_2_css"
                            theme="monokai"
                            fontSize={14}
                            lineHeight={19}
                            showPrintMargin={true}
                            showGutter={true}
                            highlightActiveLine={true}
                            value={formData.row_2_css}
                            width="100½"
                            height="200px"
                            setOptions={{
                                enableBasicAutocompletion: false,
                                enableLiveAutocompletion: false,
                                enableSnippets: false,
                                enableMobileMenu: true,
                                showLineNumbers: true,
                                tabSize: 2,}}
                            placeholder="2.satır yazı css"
                        />
                        <span className="badge bg-info block text-xs hover:top-0">
                            2. satırın yazısı için css kodunuzu ihtiyaç durumunda bu alana ekleyebilirsiniz.
                        </span>
                        {errors.row_2_css && <p className="text-red-500 text-xs mt-1">{errors.row_2_css[0]}</p>}
                    </div>

                    <div className="mb-5">
                        <input
                            type="text"
                            placeholder="Buton Metni"
                            className={`form-input ${errors.button_text ? 'border-red-500' : ''}`}
                            name="button_text"
                            value={formData.button_text}
                            onChange={handleChange}
                        />
                        {errors.button_text && <p className="text-red-500 text-xs mt-1">{errors.button_text[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <input
                            type="color"
                            placeholder="Buton Renk"
                            className={`form-input ${errors.button_color ? 'border-red-500' : ''}`}
                            name="button_color"
                            value={formData.button_color}
                            onChange={handleChange}
                        />
                        <p style={{ color: formData.button_color}}>Button Yazı Seçilen Renk: {formData.button_text}</p>
                        {errors.button_color && <p className="text-red-500 text-xs mt-1">{errors.button_color[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <AceEditor
                            mode="css"
                            onChange={(value) => handleCssChange("button_css", value)}
                            name="button_css"
                            theme="monokai"
                            fontSize={14}
                            lineHeight={19}
                            showPrintMargin={true}
                            showGutter={true}
                            highlightActiveLine={true}
                            value={formData.row_2_css}
                            width="100½"
                            height="200px"
                            setOptions={{
                                enableBasicAutocompletion: false,
                                enableLiveAutocompletion: false,
                                enableSnippets: false,
                                enableMobileMenu: true,
                                showLineNumbers: true,
                                tabSize: 2,}}
                            placeholder="Button yazı css"
                        />
                        <span className="badge bg-info block text-xs hover:top-0">
                            Buttonun yazısı için css kodunuzu ihtiyaç durumunda bu alana ekleyebilirsiniz.
                        </span>
                        {errors.button_css && <p className="text-red-500 text-xs mt-1">{errors.button_css[0]}</p>}
                    </div>


                    <div className="mb-5">
                        <input
                            type="text"
                            placeholder="Buton URL"
                            className={`form-input ${errors.button_url ? 'border-red-500' : ''}`}
                            name="button_url"
                            value={formData.button_url}
                            onChange={handleChange}
                        />
                        {errors.button_url && <p className="text-red-500 text-xs mt-1">{errors.button_url[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <select
                            name="button_target"
                            className={`form-input ${errors.button_target ? 'border-red-500' : ''}`}
                            value={formData.button_target}
                            onChange={handleChange}
                        >
                            <option value="_self">Aynı Sayfa</option>
                            <option value="_blank">Yeni Sekme</option>
                        </select>
                        {errors.button_target && <p className="text-red-500 text-xs mt-1">{errors.button_target[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="form-checkbox text-info"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                            />
                            <span className="text-white-dark ml-2">Aktif</span>
                        </label>
                    </div>

                    <div className="col-span-3">
                        <hr className="mb-5 border-info" />
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Slider Görseli (Önerilen Boyut: 1920x500)</h5>
                        </div>
                        <div {...getRootProps()} className={`col-span-2 border-dashed border-2 p-4 rounded-md cursor-pointer ${errors.path ? 'border-red-500' : 'border-gray-400'}`}>
                            <input {...getInputProps()} />
                            <p className="text-center">
                                {isDragActive ? 'Bırakabilirsin!' : 'Görseli buraya sürükle ya da tıkla'}
                            </p>
                        </div>
                        {errors.path && <p className="text-red-500 text-xs mt-1">{errors.path[0]}</p>}
                        {preview && (
                            <div className="mt-4 relative inline-block">
                                <img src={preview} alt="Slider Preview" className="w-64 h-32 object-cover border rounded" />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl hover:bg-red-600"
                                >
                                    <IconX />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="col-span-3">
                        <hr className="my-5 border-gray-300" />
                        <div className="flex justify-center">
                            <button type="submit" className="btn btn-info hover:btn-success w-full">
                                {id ? 'GÜNCELLE' : 'KAYDET'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SliderAdd;
