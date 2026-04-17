import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../../types/user';

export type AuthState = {
    token: string | null;
    user: User | null;
};

export type LoginPayload = {
    token: string;
    user: User;
};

export const initialState: AuthState = {
    token: null,
    user: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken: (state, action: PayloadAction<string | null>) => {
            state.token = action.payload;
        },
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
        },
        updateProfile: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        loginSuccess: (state, action: PayloadAction<LoginPayload>) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
        },
        logout(state) {
            state.token = null;
            state.user = null;
        },
    },
});


export const { setToken, setUser, updateProfile, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
