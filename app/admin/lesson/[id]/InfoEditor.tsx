
import styles from '../../Admin.module.scss';
import { Editor as TinyMCEEditor } from 'tinymce';
import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

export default function InfoEditor({ data, setData }: { data: string, setData: (data: string) => void}) {

    const editorRef = useRef<TinyMCEEditor | null>(null);

    return (
        <>
        <div>
            <Editor
                apiKey={process.env.NEXT_PUBLIC_TINY_API_KEY}
                onInit={(evt, editor) => editorRef.current = editor}
                value={data}
                onEditorChange={e => setData(e)}
                init={{
                    height: 500,
                    menubar: true,
                    plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                }}
            />
        </div>
        </>
    );
}