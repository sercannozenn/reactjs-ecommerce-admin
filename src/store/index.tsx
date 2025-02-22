import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeConfigSlice from './themeConfigSlice';
import authSlice from './slices/auth/authSlice';
import storage from 'redux-persist/lib/storage'; // localStorage kullanımı için
import { persistReducer, persistStore } from 'redux-persist';

const persistConfig = {
    key: 'root', // Verilerin saklanacağı key
    storage, // localStorage kullan
    whitelist: ['auth'], // Sadece 'auth' state'ini sakla
};

const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
    auth: authSlice
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store'u oluştur
const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // redux-persist ile uyumlu hale getir
        }),
});

export const persistor = persistStore(store);
export default store;

export type IRootState = ReturnType<typeof rootReducer>;
