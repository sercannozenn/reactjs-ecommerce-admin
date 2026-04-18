import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import CategoryList from '../pages/category/CategoryList';
import TagAdd from '../pages/tag/TagAdd';
import TagList from '../pages/tag/TagList';
import ProductAdd from '../pages/product/ProductAdd';
import ProductList from '../pages/product/ProductList';
import BrandAdd from '../pages/brand/BrandAdd';
import BrandList from '../pages/brand/BrandList';
import SliderList from '../pages/slider/SliderList';
import SliderAdd from '../pages/slider/SliderAdd';
import AnnouncementAdd from '../pages/announcement/AnnouncementAdd';
import AnnouncementList from '../pages/announcement/AnnouncementList';
import SettingsAdd from '../pages/settings/SettingsAdd';
import SettingsList from '../pages/settings/SettingsList';
import SettingsGroupOrder from '../pages/settings/SettingsGroupOrder';
import ProductDiscountAdd from '../pages/product_discount/ProductDiscountAdd';
import ProductDiscountList from '../pages/product_discount/ProductDiscountList';
import ProductDiscountHistory from '../pages/product/ProductDiscountHistory';
import CouponIndex from '../pages/coupon/Index';
import CouponForm from '../pages/coupon/Form';
import CouponShow from '../pages/coupon/Show';
import Profile from '../pages/profile/Profile';
import RoleManagement from '../pages/role/RoleManagement';
import Forbidden from '../pages/Forbidden';
import PermissionRoute from './PermissionRoute';
import OperatorList from '../pages/authorization/OperatorList';
import OperatorEdit from '../pages/authorization/OperatorEdit';
import MemberListStub from '../pages/authorization/MemberListStub';
import OperatorRoleList from '../pages/roles/OperatorRoleList';
import OperatorRoleEdit from '../pages/roles/OperatorRoleEdit';
import MemberRoleListStub from '../pages/roles/MemberRoleListStub';
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
        path: '/403',
        name: 'Forbidden',
        element: <Forbidden />,
        layout: 'default',
        protected: true
    },
    {
        path: '/kategoriler/ekle',
        name: 'CategoryAdd',
        element: <PermissionRoute permission="categories.create"><CategoryAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/kategoriler/:id/duzenle',
        name: 'CategoryEdit',
        element: <PermissionRoute permission="categories.update"><CategoryAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/kategoriler',
        name: 'CategoryList',
        element: <PermissionRoute permission="categories.view-any"><CategoryList /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/etiketler/ekle',
        name: 'TagAdd',
        element: <PermissionRoute permission="tags.create"><TagAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/etiketler/:id/duzenle',
        name: 'TagEdit',
        element: <PermissionRoute permission="tags.update"><TagAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/etiketler',
        name: 'TagList',
        element: <PermissionRoute permission="tags.view-any"><TagList /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/markalar/ekle',
        name: 'BrandAdd',
        element: <PermissionRoute permission="brands.create"><BrandAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/markalar/:id/duzenle',
        name: 'BrandEdit',
        element: <PermissionRoute permission="brands.update"><BrandAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/markalar',
        name: 'BrandList',
        element: <PermissionRoute permission="brands.view-any"><BrandList /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/urunler/ekle',
        name: 'ProductAdd',
        element: <PermissionRoute permission="products.create"><ProductAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/urunler/:id/duzenle',
        name: 'ProductEdit',
        element: <PermissionRoute permission="products.update"><ProductAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/urunler/:id/indirim-gecmisi',
        name: 'ProductDiscountHistory',
        element: <PermissionRoute permission="products.view-price-history"><ProductDiscountHistory /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/urunler',
        name: 'ProductList',
        element: <PermissionRoute permission="products.view-any"><ProductList /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/slider/ekle',
        name: 'SliderAdd',
        element: <PermissionRoute permission="sliders.create"><SliderAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/slider/:id/duzenle',
        name: 'SliderEdit',
        element: <PermissionRoute permission="sliders.update"><SliderAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/sliders',
        name: 'SliderList',
        element: <PermissionRoute permission="sliders.view-any"><SliderList /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/duyuru/ekle',
        name: 'AnnouncementAdd',
        element: <PermissionRoute permission="announcements.create"><AnnouncementAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/duyuru/:id/duzenle',
        name: 'AnnouncementEdit',
        element: <PermissionRoute permission="announcements.update"><AnnouncementAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/duyuru',
        name: 'AnnouncementList',
        element: <PermissionRoute permission="announcements.view-any"><AnnouncementList /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/ayarlar',
        name: 'SettingsList',
        element: <PermissionRoute permission="settings.view-any"><SettingsList /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/ayarlar/grup-sirala',
        name: 'SettingsGroupOrder',
        element: <PermissionRoute permission="settings.update"><SettingsGroupOrder /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/ayarlar/ekle',
        name: 'SettingsAdd',
        element: <PermissionRoute permission="settings.update"><SettingsAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/ayarlar/:id/duzenle',
        name: 'SettingsEdit',
        element: <PermissionRoute permission="settings.update"><SettingsAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/urun-indirim',
        name: 'ProductDiscountList',
        element: <PermissionRoute permission="discounts.view-any"><ProductDiscountList /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/urun-indirim/ekle',
        name: 'ProductDiscountAdd',
        element: <PermissionRoute permission="discounts.create"><ProductDiscountAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/urun-indirim/:id/duzenle',
        name: 'ProductDiscountEdit',
        element: <PermissionRoute permission="discounts.update"><ProductDiscountAdd /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/kuponlar',
        name: 'CouponList',
        element: <PermissionRoute permission="coupons.view-any"><CouponIndex /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/kuponlar/ekle',
        name: 'CouponAdd',
        element: <PermissionRoute permission="coupons.create"><CouponForm /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/kuponlar/:id/duzenle',
        name: 'CouponEdit',
        element: <PermissionRoute permission="coupons.update"><CouponForm /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/kuponlar/:id',
        name: 'CouponShow',
        element: <PermissionRoute permission="coupons.view-any"><CouponShow /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/roller',
        element: <Navigate to="/roller/operatorler" replace />,
        layout: 'default',
        protected: true
    },
    {
        path: '/yetkilendirme/operatorler',
        name: 'OperatorList',
        element: <PermissionRoute permission="roles.view-any"><OperatorList /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/yetkilendirme/operatorler/:id',
        name: 'OperatorEdit',
        element: <PermissionRoute permission="roles.assign-permission-to-user"><OperatorEdit /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/yetkilendirme/uyeler',
        name: 'MemberListStub',
        element: <PermissionRoute permission="roles.view-any"><MemberListStub /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/roller/operatorler',
        name: 'OperatorRoleList',
        element: <PermissionRoute permission="roles.view-any"><OperatorRoleList /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/roller/operatorler/:id',
        name: 'OperatorRoleEdit',
        element: <PermissionRoute permission="roles.update"><OperatorRoleEdit /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/roller/uyeler',
        name: 'MemberRoleListStub',
        element: <PermissionRoute permission="roles.view-any"><MemberRoleListStub /></PermissionRoute>,
        layout: 'default',
        protected: true
    },
    {
        path: '/profil',
        name: 'Profile',
        element: <Profile />,
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
