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
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        logout(state) {
            state.token = null;
            state.user = null;
        },
    },
});


export const { setToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
