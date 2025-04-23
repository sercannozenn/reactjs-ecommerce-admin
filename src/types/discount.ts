import { SelectOptionsType } from './common';

export type DiscountTargetType = 'product' | 'category' | 'brand' | 'tag' | 'user';
export type DiscountAmountType = 'percentage' | 'fixed';

export type ProductDiscountFormData = {
    category_ids: SelectOptionsType[];
    tag_ids: SelectOptionsType[];
    brand_ids: SelectOptionsType[];
    name: string;
    description?: string;
    is_active: boolean;
    target_type?: DiscountTargetType;
    targets?: SelectOptionsType[];
    discount_start?: string;
    discount_end?: string;
    priority?: number | string | null;
    discount_type?: DiscountAmountType;
    discount_amount?: number;
};

export type ProductDiscountPayload = {
    category_ids: number[];
    tag_ids: number[];
    brand_ids: number[];
    name: string;
    description?: string;
    is_active: boolean;
    target_type?: DiscountTargetType;
    targets?: number[];
    discount_start?: string;
    discount_end?: string;
    priority?: number | string | null;
    discount_type?: DiscountAmountType;
    discount_amount?: number;
};
