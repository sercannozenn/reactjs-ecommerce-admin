import { routes } from '../router/routes';

export const route = (name: string, params?: Record<string, any>): string => {

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
    const navigateToRoute = (name: string, params?: Record<string, any>): void => {
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
        window.location.href = path; // veya başka bir yönlendirme yöntemi
        // navigate(path);
    };

    return navigateToRoute;
};
