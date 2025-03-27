import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useParams } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import { SliderService } from '../../api/services/SliderService';
import { Accept, DropEvent, FileRejection, useDropzone } from 'react-dropzone';

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

type ImageType = {
    id: string; // Yüklenen dosya için unique ID veya veritabanından gelen ID
    file?: File; // Sadece yeni yüklenen dosyalar için
    image_path: string; // Hem yeni hem de var olan görsellerin yolunu saklar
    isNew: boolean; // Yeni eklenmiş mi yoksa önceden var olan mı
    };
const SliderAdd = () => {
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        path: null as ImageType | null,  // Dosya tipi veya null
        row_1_text: '',
        row_1_color: '',
        row_1_css: '',
        row_2_text: '',
        row_2_color: '',
        row_2_css: '',
        button_text: '',
        button_url: '',
        button_target: '',
        button_color: '',
        button_css: '',
        is_active: true,
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({}); // Validation hataları için state
    const { id } = useParams<{ id: string }>(); // id urlden alınır.
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Slider ' + (isEdit ? 'Güncelleme' : 'Ekleme')));
    });
    useEffect(() => {
        if (id) {
            setIsEdit(true);
            SliderService.fetchById(id).then((slider) => {
                setFormData((prev) => (
                    {
                        ...prev,
                        ...slider,
                    }
                ));
            }).catch((error) => {
                console.log(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: 'Slider bilgisi alınamadı:' + error,
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

    const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Dropzone için ayar
    const onDrop = (acceptedFiles: File[], rejectedFiles: FileRejection[], event: DropEvent) => {
        const newImage: ImageType = {
            id: generateUniqueId(), // Benzersiz ID (isteğe bağlı değiştirilebilir)
            file: acceptedFiles[0],
            image_path: URL.createObjectURL(acceptedFiles[0]), // Görsel önizlemesi
            isNew: true
        };
        setFormData(prev => ({
            ...prev,
            path: newImage, // Tek bir görseli formData'ya ekle
        }));
    };
    // `accept` türü için doğru nesne yapısı
    const acceptDropZone: Accept = {
        'image/*': [] // Sadece görseller
    };
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: acceptDropZone,
        multiple: false, // tekli dosya yükleme
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

    const freshFormData = () => {
        setFormData({
            path: null,
            row_1_text: '',
            row_1_color: '',
            row_1_css: '',
            row_2_text: '',
            row_2_color: '',
            row_2_css: '',
            button_text: '',
            button_url: '',
            button_target: '',
            button_color: '',
            button_css: '',
            is_active: true,
        });
        setErrors({});
    };
    const handleCssChange = (field: "row_1_css" | "row_2_css" | "button_css", value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value, // Değişen alanı güncelle
        }));
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        console.log(value);
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
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors({});

        try {
            if (id) {
                const response = await SliderService.update(id, formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `Slider başarıyla güncellendi! ID: ${response.data.id}`,
                    confirmButtonText: 'Tamam',
                    padding: '2em',
                    customClass: {
                        popup: 'sweet-alerts',
                        htmlContainer: '!text-info'
                    }
                });
            } else {
                const response = await SliderService.add(formData);
                freshFormData();
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `Slider başarıyla oluşturuldu!`,
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
                        Slider {isEdit ? 'Güncelleme' : 'Ekleme'}
                    </h5>
                </div>
                <form className="grid xl:grid-cols-1 gap-6" onSubmit={handleSubmit}>

                    <div className="mb-5">
                        <div {...getRootProps()}
                             className="col-span-2 border-dashed border-2 border-gray-400 p-4 rounded-md cursor-pointer">
                            <input {...getInputProps()} />
                            <p>Görseli buraya sürükleyin veya seçmek için tıklayın</p>
                            <div className="mt-4">
                                {formData.path ? (
                                    <div className="relative group">
                                        <img
                                            src={formData.path.image_path}
                                            alt="image_path"
                                            className="w-full h-32 object-contain rounded-md transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-4">
                                        Henüz resim yüklenmedi
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid xl:grid-cols-3 gap-6 grid-cols-1">
                        <div className="mb-5">
                            <input type="text" placeholder="1. Satır Yazı" className="form-input" required
                                   name="row_1_text"
                                   value={formData.row_1_text}
                                   onChange={handleInputChange}
                            />
                            {errors.row_1_text && <p className="text-red-500 text-xs mt-1">{errors.row_1_text[0]}</p>}
                        </div>
                        <div className="mb-5">
                            <input type="color" placeholder="1. Satır Yazı Renk" className="form-input" required
                                   name="row_1_color"
                                   value={formData.row_1_color}
                                   onChange={handleInputChange}
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
                            <input type="text" placeholder="2. Satır Yazı" className="form-input" required
                                   name="row_2_text"
                                   value={formData.row_2_text}
                                   onChange={handleInputChange}
                            />
                            {errors.row_2_text && <p className="text-red-500 text-xs mt-1">{errors.row_2_text[0]}</p>}
                        </div>
                        <div className="mb-5">
                            <input type="color" placeholder="2. Satır Yazı Renk" className="form-input" required
                                   name="row_2_color"
                                   value={formData.row_2_color}
                                   onChange={handleInputChange}
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
                            <input type="text" placeholder="Button Yazı" className="form-input" required
                                   name="button_text"
                                   value={formData.button_text}
                                   onChange={handleInputChange}
                            />
                            {errors.button_text && <p className="text-red-500 text-xs mt-1">{errors.button_text[0]}</p>}
                        </div>
                        <div className="mb-5">
                            <input type="color" placeholder="Button Yazı Renk" className="form-input" required
                                   name="button_color"
                                   value={formData.button_color}
                                   onChange={handleInputChange}
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
                            <input type="text" placeholder="Button URL" className="form-input" required
                                   name="button_url"
                                   value={formData.button_url}
                                   onChange={handleInputChange}
                            />
                            {errors.button_url && <p className="text-red-500 text-xs mt-1">{errors.button_url[0]}</p>}
                        </div>
                        <div className="mb-5">
                            <select name="button_target" onChange={handleInputChange}  className="form-select">
                                <option value="self">Aynı Sayfada</option>
                                <option value="_blank">Farklı Sekmede</option>
                            </select>
                            {errors.button_target && <p className="text-red-500 text-xs mt-1">{errors.button_target[0]}</p>}
                        </div>

                        <div className="mb-5">
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


                        <div className="col-span-2">
                            <hr className="my-5 border-gray-300" />
                            <div className="flex justify-center">
                                <button type="submit" className="btn btn-info hover:btn-success w-full">
                                    {isEdit ? 'GÜNCELLE' : 'KAYDET'}
                                </button>
                            </div>

                        </div>
                    </div>


                </form>

            </div>
        </div>
    );
};

export default SliderAdd;
