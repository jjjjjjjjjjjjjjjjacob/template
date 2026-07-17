import { useCallback, useEffect, useRef, useState } from 'react';
import { MacScrollArea } from '@/components/alt-macos/mac-scroll-area';

interface TerminalAppProps {
  name: string;
  title: string;
  skills: Array<{ category: string; skills: string[] }>;
  projectCount: number;
}

export function TerminalApp({
  name,
  title,
  skills,
  projectCount,
}: TerminalAppProps) {
  const [lines, setLines] = useState<
    Array<{ type: 'input' | 'output'; text: string }>
  >([
    { type: 'output', text: `The OS Terminal v1.0` },
    { type: 'output', text: `Type 'help' for available commands.\n` },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const processCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase();
      const newLines: Array<{ type: 'input' | 'output'; text: string }> = [
        { type: 'input', text: `$ ${cmd}` },
      ];

      switch (trimmed) {
        case 'help':
          newLines.push({
            type: 'output',
            text: [
              'Available Commands:',
              '  whoami     - Display user info',
              '  ls         - List projects',
              '  skills     - Show skills',
              '  clear      - Clear terminal',
              '  date       - Show current date',
              '  uname      - System info',
              '  neofetch   - System summary',
              '  help       - Show this message',
            ].join('\n'),
          });
          break;

        case 'whoami':
          newLines.push({
            type: 'output',
            text: `${name}\n${title}`,
          });
          break;

        case 'ls':
          newLines.push({
            type: 'output',
            text: `${projectCount} project${projectCount !== 1 ? 's' : ''} found in ~/Projects`,
          });
          break;

        case 'skills':
          newLines.push({
            type: 'output',
            text: skills
              .map((s) => `[${s.category}]: ${s.skills.join(', ')}`)
              .join('\n'),
          });
          break;

        case 'clear':
          setLines([]);
          return;

        case 'date':
          newLines.push({
            type: 'output',
            text: new Date().toString(),
          });
          break;

        case 'uname':
        case 'uname -a':
          newLines.push({
            type: 'output',
            text: 'Mac OS X 10.0 Darwin Kernel Version 1.0.0',
          });
          break;

        case 'neofetch':
          newLines.push({
            type: 'output',
            text: [
              '       _____       ',
              '      /     \\      ' + name,
              '     /       \\     ' + title,
              '    / Mac OS X \\   ',
              '   /  v 10.0    \\  Projects: ' + projectCount,
              '  /_______________\\ Skills: ' +
                skills.reduce((a, s) => a + s.skills.length, 0),
              '',
            ].join('\n'),
          });
          break;

        case '':
          return;

        default:
          newLines.push({
            type: 'output',
            text: `Command not found: ${trimmed}. Type 'help' for available commands.`,
          });
      }

      setLines((prev) => [...prev, ...newLines]);
    },
    [name, title, skills, projectCount]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      processCommand(input);
      setInput('');
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="focus terminal input"
      className="flex h-full flex-col p-3 font-mono text-sm"
      style={{ background: '#1a1a2e' }}
      onClick={() => inputRef.current?.focus()}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        inputRef.current?.focus();
      }}
    >
      <MacScrollArea className="flex-1">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {line.type === 'input' ? (
              <span style={{ color: '#4ade80' }}>{line.text}</span>
            ) : (
              <span style={{ color: 'rgba(74, 222, 128, 0.7)' }}>
                {line.text}
              </span>
            )}
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span className="shrink-0" style={{ color: '#4ade80' }}>
            $
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none"
            style={{ color: '#4ade80', caretColor: '#4ade80' }}
            autoFocus
          />
        </div>
        <div ref={bottomRef} />
      </MacScrollArea>
    </div>
  );
}
