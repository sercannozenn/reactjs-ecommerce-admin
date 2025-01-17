import { routes } from '../router/routes';
import { useNavigate } from 'react-router-dom';

export const getRoutePath = (
    name: string,
    params?: Record<string, string | number>
): string => {
    const route = routes.find((r) => r.name === name);

    if (!route) {
        throw new Error(`Route with name "${name}" not found.`);
    }

    let path = route.path;

    // Parametreleri URL içine yerleştir
    if (params) {
        Object.keys(params).forEach((key) => {
            path = path.replace(`:${key}`, String(params[key]));
        });
    }

    return path;
};

export const useRouteNavigator = () => {
    const navigate = useNavigate();

    const navigateToRoute = (name: string, params?: Record<string, string | number>): void => {
        const route = routes.find((r) => r.name === name);

        if (!route) {
            throw new Error(`Route with name "${name}" not found.`);
        }

        let path = route.path;

        // Parametreleri URL içine yerleştir
        if (params) {
            Object.keys(params).forEach((key) => {
                path = path.replace(`:${key}`, String(params[key]));
            });
        }

        // Yönlendirme işlemi
        navigate(path);
    };

    return navigateToRoute;
};
