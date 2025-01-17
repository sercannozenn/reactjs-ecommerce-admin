import React from 'react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { useState } from 'react';
const options = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' }
];
const animatedComponents = makeAnimated();
const [parentCategory, setParentCategory] = useState('');
const [slug, setSlug] = useState('');
const [name, setName] = useState('');
const [description, setDescription] = useState('');
const [tags, setTags] = useState([]);
const [isActive, setIsActive] = useState(true);
const [keywords, setKeywords] = useState('');
const [seoDescription, setSeoDescription] = useState('');
const [author, setAuthor] = useState('');
const customNoOptionsMessage = () => {
    return (
        <div style={{ textAlign: 'center', color: 'gray' }}>
            Aradığınız şeçenek bulunamadı.
        </div>
    );
};
const CategoryAdd = () => {

    return (
        <div className="">
            <div className="panel">
                <div className="flex items-center justify-between mb-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">
                        Kategori Ekleme
                    </h5>
                </div>
                <form className="grid xl:grid-cols-2 gap-6 grid-cols-1">
                    <div className="mb-5">
                        <select className="form-select text-white-dark">
                            <option>Üst Kategori</option>
                            <option>One</option>
                            <option>Two</option>
                            <option>Three</option>
                        </select>
                        <span className="badge bg-info block text-xs hover:top-0">
                            Kategorinin bir üst kategorisi varsa seçiniz.
                        </span>
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Kategori Slug Adı" className="form-input" />
                        <span className="badge bg-info block text-xs hover:top-0">
                            Kategori sayfasına gidildiğinde URL'de görünmesiniistediğiniz isim.
                        </span>

                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Kategori Adı *" className="form-input" required />
                    </div>
                    <div className="mb-5">
                        <input type="text" placeholder="Kategori Kısa Açıklama" className="form-input" />
                    </div>
                    <div className="mb-5">
                        <Select
                            defaultValue={[options[1], options[2]]}
                            isMulti
                            components={{ ...animatedComponents, NoOptionsMessage: customNoOptionsMessage }}
                            name="colors"
                            options={options}
                            className="basic-multi-select"
                            placeholder="Ürün Etiketi"
                            classNamePrefix="select"
                        />
                    </div>
                    <div className="mb-5"></div>
                    <div className="">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="form-checkbox text-info" defaultChecked />
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
                                <input type="text" placeholder="Anahtar Kelimeler" className="form-input" />
                            </div>
                            <div className="mb-5">
                                <input type="text" placeholder="Kategori Hakkında Seo Açıklaması"
                                       className="form-input" />
                            </div>
                            <div className="mb-5">
                                <input type="text" placeholder="Yazar Bilgisi" className="form-input" />
                            </div>
                        </div>
                    </div>


                    <div className="col-span-2">
                        <hr className="my-5 border-gray-300" />
                        <div className="flex justify-center">
                        <button type="button" className="btn btn-info hover:btn-success w-full">
                            KAYDET
                            </button>
                        </div>

                    </div>
                </form>

            </div>
        </div>
    );
};

export default CategoryAdd;
