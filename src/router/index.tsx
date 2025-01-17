import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import { routes } from './routes';
import ProtectedRoute from './ProtectedRoute';

const finalRoutes = routes.map((route) => {
    return {
        ...route,
        element:
            route.protected
                ?
                <ProtectedRoute>
                    {
                        route.layout === 'blank'
                            ?
                            <BlankLayout>{route.element}</BlankLayout>
                            :
                            <DefaultLayout>{route.element}</DefaultLayout>
                    }
                </ProtectedRoute>
                :
                route.layout === 'blank'
                    ?
                    <BlankLayout>{route.element}</BlankLayout>
                    :
                    <DefaultLayout>{route.element}</DefaultLayout>
    };
});

const router = createBrowserRouter(finalRoutes);

export default router;
