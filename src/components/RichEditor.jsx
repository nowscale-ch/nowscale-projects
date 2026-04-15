import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { useEffect } from 'react';

const MenuButton = ({ editor, action, isActive, label }) => (
  <button
    type="button"
    onMouseDown={e => { e.preventDefault(); action(); }}
    className={isActive?.() ? 'active' : ''}
  >
    {label}
  </button>
);

export default function RichEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [3] } }),
      Underline,
      Highlight.configure({ multicolor: false }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: { class: 'rich-content' },
    },
  });

  // Sync external value changes (e.g. initial load)
  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <MenuButton editor={editor} label="B" action={() => editor.chain().focus().toggleBold().run()} isActive={() => editor.isActive('bold')} />
        <MenuButton editor={editor} label="I" action={() => editor.chain().focus().toggleItalic().run()} isActive={() => editor.isActive('italic')} />
        <MenuButton editor={editor} label="U" action={() => editor.chain().focus().toggleUnderline().run()} isActive={() => editor.isActive('underline')} />
        <MenuButton editor={editor} label="S" action={() => editor.chain().focus().toggleStrike().run()} isActive={() => editor.isActive('strike')} />
        <MenuButton editor={editor} label="🖍" action={() => editor.chain().focus().toggleHighlight().run()} isActive={() => editor.isActive('highlight')} />
        <MenuButton editor={editor} label="•" action={() => editor.chain().focus().toggleBulletList().run()} isActive={() => editor.isActive('bulletList')} />
        <MenuButton editor={editor} label="1." action={() => editor.chain().focus().toggleOrderedList().run()} isActive={() => editor.isActive('orderedList')} />
        <MenuButton editor={editor} label="H" action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={() => editor.isActive('heading', { level: 3 })} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
