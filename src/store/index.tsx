import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeConfigSlice from './themeConfigSlice';
import authSlice from './slices/auth/authSlice';

const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
    auth: authSlice
});

export default configureStore({
    reducer: rootReducer,
});

export type IRootState = ReturnType<typeof rootReducer>;
