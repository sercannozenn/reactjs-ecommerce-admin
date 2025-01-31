import slugify from 'slugify';

export const SlugHelper = {
    generate: (text: string) => {
        return slugify(text, {
            lower: true,
            strict: true, // Özel karakterleri temizle
            locale: "tr",
        });
    },
}
