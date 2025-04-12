import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { SettingsService, SettingType } from '../../api/services/SettingsService';
import Swal from 'sweetalert2';
import { useDropzone } from 'react-dropzone';
import IconX from '../../components/Icon/IconX';

const SettingsAdd = () => {
    const { id } = useParams();
    const navigateToRoute = useRouteNavigator();

    const [formData, setFormData] = useState<SettingType>({ key: '', value: '' });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            SettingsService.fetchById(Number(id)).then((res: SettingType) => {
                setFormData(res);
                if (res.key === 'logo' || res.key === 'favicon') {
                    setFilePreview(res.value || null);
                }
            });
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: [] }));
        }
    };

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setFile(file);
        setFilePreview(URL.createObjectURL(file));
    };

    const handleRemoveFile = () => {
        setFile(null);
        setFilePreview(null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: formData.key === 'favicon'
            ? { 'image/x-icon': ['.ico'], 'image/png': ['.png'], 'image/svg+xml': ['.svg'] }
            : { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = new FormData();
        data.append('key', formData.key);

        if (formData.key === 'logo' || formData.key === 'favicon') {
            if (file) data.append(formData.key, file);
        } else {
            data.append('value', formData.value ?? '');
        }

        try {
            if (id) {
                await SettingsService.update(Number(id), data);
                Swal.fire('Başarılı', 'Ayar güncellendi.', 'success');
            } else {
                await SettingsService.add(data);
                Swal.fire('Başarılı', 'Ayar eklendi.', 'success');
            }

            navigateToRoute('SettingsList');
        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                Swal.fire('Hata', 'İşlem sırasında bir hata oluştu.', 'error');
            }
        }
    };

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">
                    {id ? 'Ayar Güncelle' : 'Yeni Ayar Ekle'}
                </h5>
            </div>

            <form className="grid xl:grid-cols-2 gap-6 grid-cols-1" onSubmit={handleSubmit}>
                <div className="mb-5">
                    <label>Anahtar (key)</label>
                    <input
                        type="text"
                        name="key"
                        className={`form-input ${errors.key ? 'border-red-500' : ''}`}
                        value={formData.key}
                        onChange={handleChange}
                        disabled={!!id}
                    />
                    {errors.key && <p className="text-red-500 text-xs mt-1">{errors.key[0]}</p>}
                </div>

                {formData.key === 'logo' || formData.key === 'favicon' ? (
                    <div className="col-span-2">
                        <label>{formData.key.toUpperCase()} Yükle</label>
                        <div {...getRootProps()} className="border-dashed border-2 p-4 rounded-md cursor-pointer">
                            <input {...getInputProps()} />
                            <p className="text-center">
                                {isDragActive ? 'Bırak!' : 'Dosya yüklemek için tıklayın veya sürükleyin'}
                            </p>
                        </div>
                        {filePreview && (
                            <div className="mt-4 relative inline-block">
                                <img
                                    src={filePreview}
                                    alt="Önizleme"
                                    className="w-48 h-24 object-contain border rounded"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl hover:bg-red-600"
                                >
                                    <IconX />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mb-5">
                        <label>Değer (value)</label>
                        <input
                            type="text"
                            name="value"
                            className={`form-input ${errors.value ? 'border-red-500' : ''}`}
                            value={formData.value ?? ''}
                            onChange={handleChange}
                        />
                        {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value[0]}</p>}
                    </div>
                )}

                <div className="col-span-2">
                    <hr className="my-5 border-gray-300" />
                    <div className="flex justify-center">
                        <button type="submit" className="btn btn-info hover:btn-success w-full">
                            {id ? 'GÜNCELLE' : 'KAYDET'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SettingsAdd;
