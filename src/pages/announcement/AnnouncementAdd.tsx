import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { AnnouncementService } from '../../api/services/AnnouncementService';
import { useDropzone } from 'react-dropzone';
import IconX from '../../components/Icon/IconX';
import Swal from 'sweetalert2';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';

// Temel modları import et
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-monokai";

// Worker'ları import et
import "ace-builds/src-noconflict/worker-css";

// Ace için gerekli ek bileşenleri import et
import "ace-builds/src-noconflict/ext-language_tools";
import ace from "ace-builds";
import { JoditEditorComponent } from '../../components/Editors/JoditEditor';

// Worker yolunu ayarla
ace.config.set('basePath', '/node_modules/ace-builds/src-noconflict/');
ace.config.set('modePath', '/node_modules/ace-builds/src-noconflict/');
ace.config.set('themePath', '/node_modules/ace-builds/src-noconflict/');
ace.config.set('workerPath', '/node_modules/ace-builds/src-noconflict/');


type FormDataType = {
    title: string;
    type: 'announcement' | 'event' | null;
    date: string;
    short_description: string;
    description: string;
    image: File | null;
    is_active: boolean;
};

const initialFormState: FormDataType = {
    title: '',
    type: null,
    date: '',
    short_description: '',
    description: '',
    image: null,
    is_active: false
};
const AnnouncementAdd = () => {
    const navigateToRoute = useRouteNavigator();

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const { id } = useParams();
    const [formData, setFormData] = useState<FormDataType>(initialFormState);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            AnnouncementService.fetchById(Number(id)).then((res) => {
                console.log(res);
                setFormData({ ...res, image: null });
                console.log(formData);
                setPreview(res.image_url ? `${res.image_url}` : null);
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
        setFormData({ ...formData, image: null });
        setPreview(null);
    };

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setFormData({ ...formData, image: file });
        setPreview(URL.createObjectURL(file));
        if (errors.image) {
            setErrors((prev) => ({ ...prev, image: [] }));
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

        if (!formData.image && !preview && !id) {
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
                result = await AnnouncementService.update(Number(id), data);
                Swal.fire('Başarılı', `Duyuru Etkinlik güncellendi. ID: ${result.data?.id}`, 'success');
            } else {
                result = await AnnouncementService.add(data);
                Swal.fire('Başarılı', `Duyuru Etkinlik eklendi. ID: ${result.data?.id}`, 'success');
            }
            navigateToRoute('AnnouncementList');
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
                        {id ? 'Duyuru Etkinlik Güncelle' : 'Duyuru Etkinlik Ekle'}
                    </h5>
                </div>
                <form className="grid xl:grid-cols-3 gap-6 grid-cols-1" onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <input
                            type="text"
                            placeholder="Başlık"
                            className={`form-input ${errors.title ? 'border-red-500' : ''}`}
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <select
                            name="type"
                            className={`form-input ${errors.type ? 'border-red-500' : ''}`}
                            value={formData.type ?? ''}
                            onChange={handleChange}
                        >
                            <option value="">Seçiniz</option>
                            <option value="announcement">Duyuru</option>
                            <option value="event">Etkinlik</option>
                        </select>
                        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type[0]}</p>}
                    </div>
                    <div className="mb-5">
                        <Flatpickr
                            name="date"
                            data-enable-time
                            options={{
                                enableTime: true,
                                dateFormat: 'Y-m-d H:i',
                            }}
                            value={formData.date}
                            className="form-input"
                            onChange={(selectedDates) => {
                                const isoDate = selectedDates[0]?.toISOString().slice(0, 16).replace('T', ' ');
                                handleChange({
                                    target: {
                                        name: 'date',
                                        value: isoDate,
                                        type: 'text',
                                        checked: false,
                                    },
                                } as React.ChangeEvent<HTMLInputElement>);
                            }}
                        />
                    </div>
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
                        <h5 className="font-semibold text-lg dark:text-white-light mb-4">Açıklama</h5>
                        <JoditEditorComponent
                            value={formData.description || ''}
                            onChange={(value) =>
                                setFormData((prev) => ({ ...prev, description: value }))
                            }
                        />
                        {errors.description &&
                            <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>}
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
                            <h5 className="font-semibold text-lg dark:text-white-light">Duyuru Etkinlik Görseli</h5>
                        </div>
                        <div {...getRootProps()} className={`col-span-2 border-dashed border-2 p-4 rounded-md cursor-pointer ${errors.image ? 'border-red-500' : 'border-gray-400'}`}>
                            <input {...getInputProps()} />
                            <p className="text-center">
                                {isDragActive ? 'Bırakabilirsin!' : 'Görseli buraya sürükle ya da tıkla'}
                            </p>
                        </div>
                        {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image[0]}</p>}
                        {preview && (
                            <div className="mt-4 relative inline-block">
                                <img src={preview} alt="Duyuru Etkinlik Önizleme" className="w-64 h-32 object-cover border rounded" />
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

export default AnnouncementAdd;
