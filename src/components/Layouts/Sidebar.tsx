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

const Sidebar = () => {

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
                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <IconMinus className="w-4 h-5 flex-none hidden" />
                                <span>Dashboard</span>
                            </h2>

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
                                        <li>
                                            <NavLink to={route('CategoryAdd')} >Kategori Ekleme</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>
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
                                        <li>
                                            <NavLink to={route('TagAdd')} >Etiket Ekleme</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>
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
                                        <li>
                                            <NavLink to={route('ProductAdd')} >Ürün Ekleme</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
