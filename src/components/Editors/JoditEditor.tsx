import React, { useRef } from "react";
import JoditEditor from "jodit-react";

interface JoditEditorProps {
    value: string;
    onChange: (content: string) => void;
}

export function JoditEditorComponent({ value, onChange }: JoditEditorProps) {
    const editor = useRef(null);

    return (
        <JoditEditor
            ref={editor}
            value={value}
            config={{
                readonly: false,
                height: 300,
                language: "tr",
                toolbarAdaptive: false,
                toolbarSticky: false,
                buttons: [
                    "bold",
                    "italic",
                    "underline",
                    "strikethrough",
                    "|",
                    "ul",
                    "ol",
                    "|",
                    "link",
                    "image",
                    "|",
                    "align",
                    "undo",
                    "redo",
                    "hr",
                ],
                i18n: {
                    tr: {
                        Bold: "Kalın",
                        Italic: "İtalik",
                        "Insert Image": "Resim Ekle",
                        "Insert link": "Bağlantı Ekle",
                        Underline: "Altı Çizili",
                        Strikethrough: "Üstü Çizili",
                        Undo: "Geri Al",
                        Redo: "Yinele",
                        Align: "Hizala",
                        "Bullet list": "Madde İşaretleri",
                        "Ordered list": "Sıralı Liste",
                        "Horizontal line": "Yatay Çizgi",
                        "Open link": "Bağlantıyı Aç",
                        "Edit link": "Bağlantıyı Düzenle",
                        "Unlink": "Bağlantıyı Kaldır",
                        "Upload File": "Dosya Yükle",
                    },
                },
            }}
            onBlur={(newContent) => onChange(newContent)}
        />
    );
}
