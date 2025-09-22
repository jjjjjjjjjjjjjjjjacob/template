import React, { useRef } from 'react';
import { cn } from '../../utils/tailwind-utils';

interface EditorTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function EditorTextarea({
  value,
  onChange,
  placeholder,
  className,
}: EditorTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Remove auto-height adjustment to prevent CSS blowout
  // The textarea will use the container's flex height instead

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;

    if (e.key === 'Tab') {
      e.preventDefault();
      const beforeTab = value.substring(0, selectionStart);
      const afterTab = value.substring(selectionEnd);
      const newValue = beforeTab + '  ' + afterTab;
      onChange(newValue);

      setTimeout(() => {
        textarea.setSelectionRange(selectionStart + 2, selectionStart + 2);
      }, 0);
    }

    if (e.key === 'Enter') {
      const lines = value.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];

      const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/);
      const blockquoteMatch = currentLine.match(/^(\s*>)\s/);

      if (listMatch) {
        e.preventDefault();
        const indent = listMatch[1];
        const marker = listMatch[2];
        let newMarker = marker;

        if (/^\d+\./.test(marker)) {
          const num = parseInt(marker) + 1;
          newMarker = `${num}.`;
        }

        const beforeCursor = value.substring(0, selectionStart);
        const afterCursor = value.substring(selectionEnd);
        const newValue =
          beforeCursor + `\n${indent}${newMarker} ` + afterCursor;
        onChange(newValue);

        setTimeout(() => {
          const newPos = selectionStart + indent.length + newMarker.length + 2;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      } else if (blockquoteMatch) {
        e.preventDefault();
        const indent = blockquoteMatch[1];
        const beforeCursor = value.substring(0, selectionStart);
        const afterCursor = value.substring(selectionEnd);
        const newValue = beforeCursor + `\n${indent} ` + afterCursor;
        onChange(newValue);

        setTimeout(() => {
          const newPos = selectionStart + indent.length + 2;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      id="markdown-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={cn(
        'h-full w-full resize-none border-none bg-transparent p-0 font-mono text-sm leading-relaxed focus:outline-none',
        'placeholder:text-muted-foreground/50',
        className
      )}
      spellCheck={false}
    />
  );
}
