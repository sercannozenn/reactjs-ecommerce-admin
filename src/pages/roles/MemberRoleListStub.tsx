import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';

const MemberRoleListStub = () => {
    const dispatch = useDispatch();
    useEffect(() => { dispatch(setPageTitle('Üye Rolleri')); }, []);
    return (
        <div className="panel text-center py-16">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Bu Bölüm Henüz Aktif Değil</h3>
            <p className="text-gray-500">Üye yönetimi Sprint 21 (Müşteri Kimlik Doğrulama) kapsamında eklenecek.</p>
        </div>
    );
};
export default MemberRoleListStub;
