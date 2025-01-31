import React, { useEffect, useState } from 'react';
import { TagService } from '../../api/services/TagService';
import { useParams } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import { SlugHelper }from '../../helpers/helpers';

const TagAdd = () => {
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
    });
    const { id } = useParams<{id: string}>(); // id urlden alınır.
    const [isEdit, setIsEdit] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({}); // Validation hataları için state

    useEffect(() => {
        dispatch(setPageTitle('Etiket ' + (isEdit ? 'Güncelleme' : 'Ekleme')));
    });
    useEffect(() => {
        if (id){
            setIsEdit(true);
            TagService.fetchTagById(id).then((tag) => {
                setFormData(tag);
            }).catch((error) => {
                console.log(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: 'Etiket bilgisi alınamadı:' + error ,
                    padding: '2em',
                    customClass: {
                        popup: 'sweet-alerts',
                    },
                });
            });
        }else{
            setIsEdit(false);
        }
    }, [id]);
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            slug: SlugHelper.generate(formData.name ?? ''),
        }));
    }, [formData.name]);
    const freshFormData = () => {
        setFormData({
            slug: '',
            name: '',
        });
    };
    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitizedSlug = SlugHelper.generate(e.target.value); // Girilen değeri anında sluglaştır
        setFormData((prev) => ({ ...prev, slug: sanitizedSlug }));


    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (errors[name]) {
            // errors un içinde name varsa bunu errorsa ekleyecek
            setErrors((prev) => ({ ...prev, [name]: [] }));
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({}); //Yeni istekten önce hataları temizle

        try {
            if (isEdit && id){
                const response = await TagService.updateTag(id, formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `Etiket başarıyla güncellendi! ID: ${response.data.id}` ,
                    confirmButtonText: 'Tamam',
                    padding: '2em',
                    customClass: {
                        popup: 'sweet-alerts',
                        htmlContainer: '!text-info'
                    },
                });
            }
            else{
                const response = await TagService.addTag(formData);
                freshFormData();
                Swal.fire({
                    icon: 'success',
                    title: 'Başarılı!',
                    text: `Etiket başarıyla oluşturuldu!` ,
                    padding: '2em',
                    customClass: {
                        popup: 'sweet-alerts',
                    },
                });
            }

        } catch (error: any) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Hata!',
                    text: error.response?.data?.message || 'Bir hata oluştu! Lütfen tekrar deneyin.' ,
                    padding: '2em',
                    customClass: {
                        popup: 'sweet-alerts',
                    },
                });
            }

        }
    };

    return (
        <div className="">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg  dark:text-white-light">
                        Etiket { isEdit ? 'Güncelleme' : 'Ekleme' }
                    </h5>
                </div>
                <form className="grid xl:grid-cols-2 gap-6 grid-cols-1" onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <input type="text" placeholder="Etiket Adı *" className="form-input" required
                               name="name"
                               value={formData.name}
                               onChange={handleInputChange}
                        />
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Etiket Slug Adı" className="form-input"
                               name="slug"
                               value={formData.slug}
                               onChange={handleSlugChange}
                        />
                        <span className="badge bg-info block text-xs hover:top-0">
                            Etikete verilen benzersiz isim. URL'de kullanılacak.
                        </span>

                    </div>

                    <div className="col-span-2">
                        <hr className="my-5 border-gray-300" />
                        <div className="flex justify-center">
                            <button type="submit" className="btn btn-info hover:btn-success w-full">
                                { isEdit ? 'GÜNCELLE' : 'KAYDET' }
                            </button>
                        </div>

                    </div>
                </form>

            </div>
        </div>
    );
};

export default TagAdd;
