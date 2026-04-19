import { useEffect, useRef } from 'react';
import { ProductService } from '../api/services/ProductService';
import type { ProductDraftPayload } from '../types/product';

interface Options {
    productId: number | null;
    enabled: boolean;
    payload: ProductDraftPayload;
    debounceMs?: number;
    onSuccess?: () => void;
    onError?: (err: any) => void;
}

/**
 * Sprint 32.2 — 2sn debounce'lı autosave.
 * productId null ise hiçbir şey yapmaz (ilk createDraft çağrısı form tarafında).
 */
export const useProductAutosave = ({
    productId,
    enabled,
    payload,
    debounceMs = 2000,
    onSuccess,
    onError,
}: Options) => {
    const timerRef = useRef<number | null>(null);
    const latestPayloadRef = useRef(payload);
    latestPayloadRef.current = payload;

    useEffect(() => {
        if (!enabled || !productId) return;

        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }

        timerRef.current = window.setTimeout(async () => {
            try {
                await ProductService.updateDraft(productId, latestPayloadRef.current);
                onSuccess?.();
            } catch (err) {
                onError?.(err);
            }
        }, debounceMs);

        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(payload), productId, enabled, debounceMs]);
};
