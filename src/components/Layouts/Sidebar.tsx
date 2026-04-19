import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconCaretDown from '../Icon/IconCaretDown';
import IconMinus from '../Icon/IconMinus';
import IconMenuComponents from '../Icon/Menu/IconMenuComponents';
import { route } from '../../utils/RouteHelper';
import { useCan } from '../../utils/permissions';

const Sidebar = () => {
    const can = useCan();

    const [menuCount, setMenuCount] = useState(0);
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [errorSubMenu, setErrorSubMenu] = useState(false);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        const allLinks = document.querySelectorAll('.sidebar a');
        allLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href == window.location.pathname) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }, [location]);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-8 ml-[5px] flex-none" src="/assets/images/logo.svg" alt="logo" />
                            <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle lg:inline dark:text-white-light">Admin Panel</span>
                        </NavLink>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">

                            {/* ── Katalog ── */}
                            {(can('categories.view-any') || can('brands.view-any') || can('tags.view-any')) && (
                                <h2 className="py-3 px-7 flex items-center font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>Katalog</span>
                                </h2>
                            )}

                            {can('categories.view-any') && (
                            <li className="menu nav-item">
                                <button type="button"
                                        className={`${currentMenu === 'category' ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu('category')}>
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span
                                            className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Kategori Yönetimi
                                        </span>
                                    </div>

                                    <div className={currentMenu !== 'category' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'category' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to={route('CategoryList')} >Kategori Listesi</NavLink>
                                        </li>
                                        {can('categories.create') && (
                                        <li>
                                            <NavLink to={route('CategoryAdd')} >Kategori Ekleme</NavLink>
                                        </li>
                                        )}
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}
                            {can('brands.view-any') && (
                            <li className="menu nav-item">
                                <button type="button"
                                        className={`${currentMenu === 'brand' ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu('brand')}>
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span
                                            className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Marka Yönetimi
                                        </span>
                                    </div>

                                    <div className={currentMenu !== 'brand' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'brand' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to={route('BrandList')} >Marka Listesi</NavLink>
                                        </li>
                                        {can('brands.create') && (
                                        <li>
                                            <NavLink to={route('BrandAdd')} >Marka Ekleme</NavLink>
                                        </li>
                                        )}
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}
                            {can('tags.view-any') && (
                            <li className="menu nav-item">
                                <button type="button"
                                        className={`${currentMenu === 'tag' ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu('tag')}>
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span
                                            className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Etiket(Tag) Yönetimi
                                        </span>
                                    </div>

                                    <div className={currentMenu !== 'tag' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'tag' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to={route('TagList')} >Etiket Listesi</NavLink>
                                        </li>
                                        {can('tags.create') && (
                                        <li>
                                            <NavLink to={route('TagAdd')} >Etiket Ekleme</NavLink>
                                        </li>
                                        )}
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}

                            {/* ── Ürün & Satış ── */}
                            {(can('products.view-any') || can('product_attribute.manage') || can('discounts.view-any') || can('coupons.view-any') || can('stock.view') || can('orders.view-any') || can('reviews.view-any')) && (
                                <h2 className="py-3 px-7 flex items-center font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 mt-2">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>Ürün & Satış</span>
                                </h2>
                            )}

                            {can('products.view-any') && (
                            <li className="menu nav-item">
                                <button type="button"
                                        className={`${currentMenu === 'product' ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu('product')}>
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span
                                            className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Ürün Yönetimi
                                        </span>
                                    </div>

                                    <div className={currentMenu !== 'product' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'product' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to={route('ProductList')} >Ürün Listesi</NavLink>
                                        </li>
                                        {can('products.create') && (
                                        <li>
                                            <NavLink to={route('ProductAdd')} >Ürün Ekleme</NavLink>
                                        </li>
                                        )}
                                        {can('product_attribute.manage') && (
                                        <li>
                                            <NavLink to={route('ProductAttributeList')}>Ürün Özellikleri</NavLink>
                                        </li>
                                        )}
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}

                            {!can('products.view-any') && can('product_attribute.manage') && (
                            <li className="menu nav-item">
                                <NavLink to={route('ProductAttributeList')} className="nav-link group">
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Ürün Özellikleri
                                        </span>
                                    </div>
                                </NavLink>
                            </li>
                            )}

                            {can('discounts.view-any') && (
                            <li className="menu nav-item">
                                <button type="button"
                                        className={`${currentMenu === 'discount' ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu('discount')}>
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span
                                            className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Ürün İndirim Yönetimi
                                        </span>
                                    </div>

                                    <div className={currentMenu !== 'discount' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'discount' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to={route('ProductDiscountList')} >İndirim Listesi</NavLink>
                                        </li>
                                        {can('discounts.create') && (
                                        <li>
                                            <NavLink to={route('ProductDiscountAdd')} >İndirim Ekleme</NavLink>
                                        </li>
                                        )}
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}

                            {can('coupons.view-any') && (
                            <li className="menu nav-item">
                                <button type="button"
                                        className={`${currentMenu === 'coupon' ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu('coupon')}>
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span
                                            className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Kupon Yönetimi
                                        </span>
                                    </div>

                                    <div className={currentMenu !== 'coupon' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'coupon' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to={route('CouponList')} >Kupon Listesi</NavLink>
                                        </li>
                                        {can('coupons.create') && (
                                        <li>
                                            <NavLink to={route('CouponAdd')} >Kupon Ekleme</NavLink>
                                        </li>
                                        )}
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}

                            {can('stock.view') && (
                            <li className="menu nav-item">
                                <button type="button"
                                        className={`${currentMenu === 'stock' ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu('stock')}>
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Stok Yönetimi
                                        </span>
                                    </div>
                                    <div className={currentMenu !== 'stock' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'stock' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to={route('StockDashboard')}>Düşük Stok</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to={route('StockMovements')}>Hareket Raporu</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}

                            {can('orders.view-any') && (
                            <li className="menu nav-item">
                                <button type="button"
                                        className={`${currentMenu === 'orders' ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu('orders')}>
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Sipariş Yönetimi
                                        </span>
                                    </div>
                                    <div className={currentMenu !== 'orders' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>
                                <AnimateHeight duration={300} height={currentMenu === 'orders' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to={route('OrderList')}>Sipariş Listesi</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}

                            {can('reviews.view-any') && (
                            <li className="menu nav-item">
                                <NavLink to="/yorumlar" className="nav-link group">
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Yorum Moderasyonu
                                        </span>
                                    </div>
                                </NavLink>
                            </li>
                            )}

                            {/* ── İçerik ── */}
                            {(can('sliders.view-any') || can('announcements.view-any')) && (
                                <h2 className="py-3 px-7 flex items-center font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 mt-2">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>İçerik</span>
                                </h2>
                            )}

                            {can('sliders.view-any') && (
                            <li className="menu nav-item">
                                <button type="button"
                                        className={`${currentMenu === 'slider' ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu('slider')}>
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span
                                            className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Slider Yönetimi
                                        </span>
                                    </div>

                                    <div className={currentMenu !== 'slider' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'slider' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to={route('SliderList')} >Slider Listesi</NavLink>
                                        </li>
                                        {can('sliders.create') && (
                                        <li>
                                            <NavLink to={route('SliderAdd')} >Slider Ekleme</NavLink>
                                        </li>
                                        )}
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}

                            {can('announcements.view-any') && (
                            <li className="menu nav-item">
                                <button type="button"
                                        className={`${currentMenu === 'announcement' ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu('announcement')}>
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span
                                            className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Duyuru Etkinlik Yönetimi
                                        </span>
                                    </div>

                                    <div className={currentMenu !== 'announcement' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'announcement' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to={route('AnnouncementList')} >Duyuru Etkinlik Listesi</NavLink>
                                        </li>
                                        {can('announcements.create') && (
                                        <li>
                                            <NavLink to={route('AnnouncementAdd')} >Duyuru Etkinlik Ekleme</NavLink>
                                        </li>
                                        )}
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}

                            {/* ── Yapılandırma ── */}
                            {can('settings.view-any') && (
                                <h2 className="py-3 px-7 flex items-center font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 mt-2">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>Yapılandırma</span>
                                </h2>
                            )}

                            {can('settings.view-any') && (
                            <li className="menu nav-item">
                                <button type="button"
                                        className={`${currentMenu === 'settings' ? 'active' : ''} nav-link group w-full`}
                                        onClick={() => toggleMenu('settings')}>
                                    <div className="flex items-center">
                                        <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                        <span
                                            className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                            Site Ayarları
                                        </span>
                                    </div>

                                    <div className={currentMenu !== 'settings' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                        <IconCaretDown />
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'settings' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to={route('SettingsList')} >Ayar Listesi</NavLink>
                                        </li>
                                        {can('settings.update') && (
                                        <li>
                                            <NavLink to={route('SettingsAdd')} >Ayar Ekleme</NavLink>
                                        </li>
                                        )}
                                        {can('settings.update') && (
                                        <li>
                                            <NavLink to={route('HomepageThemeSelector')} >Anasayfa Teması</NavLink>
                                        </li>
                                        )}
                                    </ul>
                                </AnimateHeight>
                            </li>
                            )}

                            {can('roles.view-any') && (
                            <>
                                <h2 className="py-3 px-7 flex items-center font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 mt-2">
                                    <IconMinus className="w-4 h-5 flex-none hidden" />
                                    <span>Yetki Yönetimi</span>
                                </h2>

                                {/* Yetkilendirme accordion */}
                                <li className="menu nav-item">
                                    <button type="button"
                                            className={`${currentMenu === 'yetkilendirme' ? 'active' : ''} nav-link group w-full`}
                                            onClick={() => toggleMenu('yetkilendirme')}>
                                        <div className="flex items-center">
                                            <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                                Yetkilendirme
                                            </span>
                                        </div>
                                        <div className={currentMenu !== 'yetkilendirme' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                            <IconCaretDown />
                                        </div>
                                    </button>
                                    <AnimateHeight duration={300} height={currentMenu === 'yetkilendirme' ? 'auto' : 0}>
                                        <ul className="sub-menu text-gray-500">
                                            <li><NavLink to="/yetkilendirme/sistem-kullanicilari">Sistem Kullanıcıları</NavLink></li>
                                            <li><NavLink to="/yetkilendirme/uyeler" className="opacity-60">Üyeler <span className="badge badge-outline-secondary text-xs py-0 px-1 ml-1">Yakında</span></NavLink></li>
                                        </ul>
                                    </AnimateHeight>
                                </li>

                                {/* Roller accordion */}
                                <li className="menu nav-item">
                                    <button type="button"
                                            className={`${currentMenu === 'roller' ? 'active' : ''} nav-link group w-full`}
                                            onClick={() => toggleMenu('roller')}>
                                        <div className="flex items-center">
                                            <IconMenuComponents className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">
                                                Roller
                                            </span>
                                        </div>
                                        <div className={currentMenu !== 'roller' ? 'rtl:rotate-90 -rotate-90' : ''}>
                                            <IconCaretDown />
                                        </div>
                                    </button>
                                    <AnimateHeight duration={300} height={currentMenu === 'roller' ? 'auto' : 0}>
                                        <ul className="sub-menu text-gray-500">
                                            <li><NavLink to="/roller/sistem-kullanicilari">Sistem Kullanıcı Rolleri</NavLink></li>
                                            <li><NavLink to="/roller/uyeler" className="opacity-60">Üye Rolleri <span className="badge badge-outline-secondary text-xs py-0 px-1 ml-1">Yakında</span></NavLink></li>
                                        </ul>
                                    </AnimateHeight>
                                </li>
                            </>
                            )}
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
