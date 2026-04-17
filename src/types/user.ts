export type User = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    roles: string[];
    permissions: string[];
};
