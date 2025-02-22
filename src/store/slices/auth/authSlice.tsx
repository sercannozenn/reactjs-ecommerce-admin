import { createSlice } from '@reduxjs/toolkit';

interface User {
    id: number;
    name: string;
    email: string;
}

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        token: null as string | null,
        user: null as User | null,
    },
    reducers: {
        setToken: (state, action) => {
            state.token = action.payload;
            // localStorage.setItem('access_token', action.payload);
        },
        clearToken(state) {
            state.token = null;
            // localStorage.removeItem('access_token');
        },
        setUser: (state, action) => {
            state.user = action.payload; // Kullanıcı bilgilerini sakla
        },
    },
});


export const { setToken, clearToken, setUser } = authSlice.actions;
export default authSlice.reducer;
