import { lazy } from 'react';
import CategoryList from '../pages/category/CategoryList';
import TagAdd from '../pages/tag/TagAdd';
import TagList from '../pages/tag/TagList';
import ProductAdd from '../pages/product/ProductAdd';
import ProductList from '../pages/product/ProductList';
import BrandAdd from '../pages/brand/BrandAdd';
import BrandList from '../pages/brand/BrandList';
import SliderList from '../pages/slider/SliderList';
import SliderAdd from '../pages/slider/SliderAdd';
const Index = lazy(() => import('../pages/Index'));
const Login = lazy(() => import('../pages/auth/Login'));
const CategoryAdd = lazy(() => import('../pages/category/CategoryAdd'));

const routes = [
    {
        path: '/',
        name: 'Index',
        element: <Index />,
        layout: 'default',
        protected: true
    },
    {
        path: '/kategoriler/ekle',
        name: 'CategoryAdd',
        element: <CategoryAdd />,
        layout: 'default',
        protected: true
    },
    {
        path: '/kategoriler/:id/duzenle',
        name: 'CategoryEdit',
        element: <CategoryAdd />,
        layout: 'default',
        protected: true
    },
    {
        path: '/kategoriler',
        name: 'CategoryList',
        element: <CategoryList />,
        layout: 'default',
        protected: true
    },
    {
        path: '/etiketler/ekle',
        name: 'TagAdd',
        element: <TagAdd />,
        layout: 'default',
        protected: true
    },
    {
        path: '/etiketler/:id/duzenle',
        name: 'TagEdit',
        element: <TagAdd />,
        layout: 'default',
        protected: true
    },
    {
        path: '/etiketler',
        name: 'TagList',
        element: <TagList />,
        layout: 'default',
        protected: true
    },
    {
        path: '/markalar/ekle',
        name: 'BrandAdd',
        element: <BrandAdd />,
        layout: 'default',
        protected: true
    },
    {
        path: '/markalar/:id/duzenle',
        name: 'BrandEdit',
        element: <BrandAdd />,
        layout: 'default',
        protected: true
    },
    {
        path: '/markalar',
        name: 'BrandList',
        element: <BrandList />,
        layout: 'default',
        protected: true
    },
    {
        path: '/urunler/ekle',
        name: 'ProductAdd',
        element: <ProductAdd />,
        layout: 'default',
        protected: true
    },
    {
        path: '/urunler/:id/duzenle',
        name: 'ProductEdit',
        element: <ProductAdd />,
        layout: 'default',
        protected: true
    },
    {
        path: '/urunler',
        name: 'ProductList',
        element: <ProductList />,
        layout: 'default',
        protected: true
    },
    {
        path: '/slider/ekle',
        name: 'SliderAdd',
        element: <SliderAdd />,
        layout: 'default',
        protected: true
    },
    {
        path: '/slider/:id/duzenle',
        name: 'SliderEdit',
        element: <SliderAdd />,
        layout: 'default',
        protected: true
    },
    {
        path: '/sliders',
        name: 'SliderList',
        element: <SliderList />,
        layout: 'default',
        protected: true
    },
    {
        path: '/giris-yap',
        name: 'Login',
        element: <Login />,
        layout: 'blank',
        protected: false
    },

];

export { routes };
