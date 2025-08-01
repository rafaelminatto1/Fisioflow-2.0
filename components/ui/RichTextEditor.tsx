import React, { useRef } from 'react';
import { Bold, Italic, List } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, rows = 3, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (format: 'bold' | 'italic' | 'list') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let newValue = '';
    
    if (format === 'list') {
        const lines = value.substring(0, start).split('\n');
        const currentLineIndex = lines.length - 1;
        const lineStart = start - lines[currentLineIndex].length;

        const textBefore = value.substring(0, lineStart);
        const selectedLines = value.substring(lineStart, end);
        const textAfter = value.substring(end);
        
        const newSelectedLines = selectedLines
            .split('\n')
            .map(line => line.trim().startsWith('* ') ? line.replace('* ', '') : `* ${line}`)
            .join('\n');
        
        newValue = `${textBefore}${newSelectedLines}${textAfter}`;

    } else {
        const markdown = format === 'bold' ? '**' : '*';
        const formattedText = `${markdown}${selectedText}${markdown}`;
        newValue = `${value.substring(0, start)}${formattedText}${value.substring(end)}`;
    }
    
    onChange(newValue);
  };

  return (
    <div>
      <div className="flex items-center gap-2 border border-b-0 border-slate-300 bg-slate-50 p-2 rounded-t-lg">
        <button type="button" onClick={() => applyFormatting('bold')} className="p-1.5 rounded hover:bg-slate-200" title="Negrito"><Bold className="w-4 h-4" /></button>
        <button type="button" onClick={() => applyFormatting('italic')} className="p-1.5 rounded hover:bg-slate-200" title="Itálico"><Italic className="w-4 h-4" /></button>
        <button type="button" onClick={() => applyFormatting('list')} className="p-1.5 rounded hover:bg-slate-200" title="Lista"><List className="w-4 h-4" /></button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full p-2 border border-slate-300 rounded-b-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm"
      />
    </div>
  );
};

export default RichTextEditor;
