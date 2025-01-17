import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        token: localStorage.getItem('access_token') || null,
    },
    reducers: {
        setToken: (state, action) => {
            state.token = action.payload;
            localStorage.setItem('access_token', action.payload);
        },
        clearToken(state) {
            state.token = null;
            localStorage.removeItem('access_token');
        },
    },
});


export const { setToken, clearToken } = authSlice.actions;
export default authSlice.reducer;
