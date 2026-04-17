import { NavLink } from 'react-router-dom';

const Forbidden = () => {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-danger mb-4">403</h1>
                <h2 className="text-2xl font-semibold mb-2">Erişim Engellendi</h2>
                <p className="text-gray-500 mb-6">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
                <NavLink to="/" className="btn btn-primary">
                    Ana Sayfaya Dön
                </NavLink>
            </div>
        </div>
    );
};

export default Forbidden;
