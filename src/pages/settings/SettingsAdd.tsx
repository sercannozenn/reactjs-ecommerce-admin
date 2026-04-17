import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRouteNavigator } from '../../utils/RouteHelper';
import { SettingsService, SettingType } from '../../api/services/SettingsService';
import Swal from 'sweetalert2';
import { useDropzone } from 'react-dropzone';
import IconX from '../../components/Icon/IconX';

const TYPE_OPTIONS = [
    { value: 'string', label: 'Metin' },
    { value: 'text', label: 'Uzun Metin' },
    { value: 'file', label: 'Dosya' },
    { value: 'boolean', label: 'Evet/Hayır' },
    { value: 'integer', label: 'Sayı' },
] as const;

const SettingsAdd = () => {
    const { id } = useParams();
    const navigateToRoute = useRouteNavigator();

    const [formData, setFormData] = useState<SettingType>({
        key: '',
        label: '',
        description: '',
        value: '',
        type: 'string',
        group: '',
        order: undefined,
        is_protected: false,
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [groupOptions, setGroupOptions] = useState<string[]>([]);

    useEffect(() => {
        // Mevcut grupları yükle
        SettingsService.listGroups()
            .then((groups) => setGroupOptions(groups.map((g) => g.group)))
            .catch(() => {});

        if (id) {
            SettingsService.fetchById(Number(id)).then((res: SettingType) => {
                setFormData(res);
                if (res.type === 'file' && res.value_url) {
                    setFilePreview(res.value_url);
                } else if (!res.type && (res.key === 'logo' || res.key === 'favicon')) {
                    // Geriye dönük uyumluluk
                    setFilePreview(res.value ?? null);
                }
            });
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: [] }));
        }
    };

    const handleTypeChange = (value: string) => {
        setFormData((prev) => ({ ...prev, type: value as SettingType['type'], value: '' }));
        setFile(null);
        setFilePreview(null);
    };

    const onDrop = (acceptedFiles: File[]) => {
        const f = acceptedFiles[0];
        setFile(f);
        setFilePreview(URL.createObjectURL(f));
    };

    const handleRemoveFile = () => {
        setFile(null);
        setFilePreview(null);
    };

    const isFileType = formData.type === 'file' || formData.key === 'logo' || formData.key === 'favicon';

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: formData.key === 'favicon'
            ? { 'image/x-icon': ['.ico'], 'image/png': ['.png'], 'image/jpg': ['.jpg'], 'image/svg+xml': ['.svg'] }
            : { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.ico'] },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = new FormData();
        data.append('key', formData.key);
        if (formData.label) data.append('label', formData.label);
        if (formData.description) data.append('description', formData.description);
        data.append('is_protected', formData.is_protected ? '1' : '0');
        if (formData.type) data.append('type', formData.type);
        if (formData.group) data.append('group', formData.group);
        if (formData.order !== undefined && formData.order !== null) {
            data.append('order', String(formData.order));
        }

        if (isFileType) {
            if (file) data.append('value', file);
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

    const renderValueField = () => {
        if (isFileType) {
            return (
                <div className="col-span-2">
                    <label>Dosya Yükle</label>
                    <div {...getRootProps()} className="border-dashed border-2 p-4 rounded-md cursor-pointer hover:border-primary transition-colors">
                        <input {...getInputProps()} />
                        <p className="text-center text-sm text-gray-500">
                            {isDragActive ? 'Bırak!' : 'Dosya yüklemek için tıklayın veya sürükleyin'}
                        </p>
                    </div>
                    {filePreview && (
                        <div className="mt-4 relative inline-block">
                            <img src={filePreview} alt="Önizleme" className="w-48 h-24 object-contain border rounded" />
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
            );
        }

        if (formData.type === 'text') {
            return (
                <div className="mb-5">
                    <label>Değer (value)</label>
                    <textarea
                        name="value"
                        rows={4}
                        className={`form-textarea w-full ${errors.value ? 'border-red-500' : ''}`}
                        value={formData.value ?? ''}
                        onChange={handleChange}
                    />
                    {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value[0]}</p>}
                </div>
            );
        }

        if (formData.type === 'boolean') {
            return (
                <div className="mb-5">
                    <label>Değer</label>
                    <div className="mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="form-checkbox"
                                checked={formData.value === '1' || formData.value === 'true'}
                                onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.checked ? '1' : '0' }))}
                            />
                            <span className="text-sm">{formData.value === '1' || formData.value === 'true' ? 'Evet' : 'Hayır'}</span>
                        </label>
                    </div>
                    {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value[0]}</p>}
                </div>
            );
        }

        if (formData.type === 'integer') {
            return (
                <div className="mb-5">
                    <label>Değer (sayı)</label>
                    <input
                        type="number"
                        name="value"
                        className={`form-input ${errors.value ? 'border-red-500' : ''}`}
                        value={formData.value ?? ''}
                        onChange={handleChange}
                    />
                    {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value[0]}</p>}
                </div>
            );
        }

        // default: string
        return (
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
        );
    };

    return (
        <div className="panel">
            <div className="flex items-center justify-between mb-5">
                <h5 className="font-semibold text-lg dark:text-white-light">
                    {id ? 'Ayar Güncelle' : 'Yeni Ayar Ekle'}
                </h5>
            </div>

            <form className="grid xl:grid-cols-2 gap-6 grid-cols-1" onSubmit={handleSubmit}>
                {/* Etiket */}
                <div className="mb-5">
                    <label>Etiket (label) <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="label"
                        className={`form-input ${errors.label ? 'border-red-500' : ''}`}
                        value={formData.label ?? ''}
                        onChange={handleChange}
                        placeholder="Örn: Site Adı"
                    />
                    {errors.label && <p className="text-red-500 text-xs mt-1">{errors.label[0]}</p>}
                </div>

                {/* Anahtar */}
                <div className="mb-5">
                    <label>Anahtar (key) <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="key"
                        className={`form-input ${errors.key ? 'border-red-500' : ''}`}
                        value={formData.key}
                        onChange={handleChange}
                        disabled={!!id}
                        placeholder="Örn: contact_phone"
                    />
                    {!id && (
                        <p className="text-xs text-gray-400 mt-1">
                            Yalnızca küçük harf, rakam ve alt çizgi. Örn: <code>contact_phone</code>
                        </p>
                    )}
                    {errors.key && <p className="text-red-500 text-xs mt-1">{errors.key[0]}</p>}
                </div>

                {/* Tip */}
                <div className="mb-5">
                    <label>Tip (type)</label>
                    <select
                        name="type"
                        className={`form-select ${errors.type ? 'border-red-500' : ''}`}
                        value={formData.type ?? 'string'}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        disabled={!!id}
                    >
                        {TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type[0]}</p>}
                </div>

                {/* Grup */}
                <div className="mb-5">
                    <label>Grup (group)</label>
                    <input
                        type="text"
                        name="group"
                        list="group-options"
                        className={`form-input ${errors.group ? 'border-red-500' : ''}`}
                        value={formData.group ?? ''}
                        onChange={handleChange}
                        placeholder="Örn: site_identity"
                    />
                    <datalist id="group-options">
                        {groupOptions.map((g) => (
                            <option key={g} value={g} />
                        ))}
                    </datalist>
                    {errors.group && <p className="text-red-500 text-xs mt-1">{errors.group[0]}</p>}
                </div>

                {/* Sıralama */}
                <div className="mb-5">
                    <label>Sıralama (order) <span className="text-gray-400 text-xs">(opsiyonel)</span></label>
                    <input
                        type="number"
                        name="order"
                        className={`form-input ${errors.order ? 'border-red-500' : ''}`}
                        value={formData.order ?? ''}
                        onChange={(e) => setFormData((prev) => ({
                            ...prev,
                            order: e.target.value ? Number(e.target.value) : undefined,
                        }))}
                        min={1}
                    />
                    {errors.order && <p className="text-red-500 text-xs mt-1">{errors.order[0]}</p>}
                </div>

                {/* Açıklama */}
                <div className="mb-5 col-span-2">
                    <label>Açıklama <span className="text-gray-400 text-xs">(opsiyonel)</span></label>
                    <input
                        type="text"
                        name="description"
                        className={`form-input ${errors.description ? 'border-red-500' : ''}`}
                        value={formData.description ?? ''}
                        onChange={handleChange}
                        placeholder="Bu ayar ne için kullanılır? Yöneticilere hatırlatma notu olarak gösterilir."
                        maxLength={255}
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>}
                </div>

                {/* Korumalı ayar */}
                {!id && (
                    <div className="mb-5">
                        <label className="flex items-center gap-3 cursor-pointer w-fit">
                            <input
                                type="checkbox"
                                className="form-checkbox"
                                checked={formData.is_protected ?? false}
                                onChange={(e) => setFormData((prev) => ({ ...prev, is_protected: e.target.checked }))}
                            />
                            <span className="font-medium text-sm">Korumalı ayar</span>
                        </label>
                        <p className="text-xs text-gray-400 mt-1 ml-7">
                            İşaretlenirse bu ayar silinemez. Yalnızca Süper Admin silebilir.
                        </p>
                    </div>
                )}

                {/* Değer — tipe göre dinamik */}
                {renderValueField()}

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
