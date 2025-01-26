import { lazy } from 'react';
import CategoryList from '../pages/category/CategoryList';
import TagAdd from '../pages/tag/TagAdd';
import TagList from '../pages/tag/TagList';
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
        path: '/kategori-ekle',
        name: 'CategoryAdd',
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
        path: '/etiket-ekle',
        name: 'TagAdd',
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
        path: '/giris-yap',
        name: 'Login',
        element: <Login />,
        layout: 'blank',
        protected: false
    },

];

export { routes };
