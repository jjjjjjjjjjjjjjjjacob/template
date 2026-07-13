import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@template/backend';
import { MacScrollArea } from '@/components/alt-macos/mac-scroll-area';

interface Skill {
  category: string;
  skills: string[];
  proficiency: string;
}

interface Project {
  id: string;
  title: string;
  company: string;
  timeline: string;
  role: string;
  description: string;
  achievements?: { description: string }[];
}

interface IChatAppProps {
  name: string;
  title: string;
  summary: string;
  skills: Skill[];
  projects: Project[];
}

function playSound(name: string) {
  try {
    const audio = new Audio(`/os-x/sounds/${name}`);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  } catch {
    // audio playback not available
  }
}

export function IChatApp({
  name,
  title,
  summary,
  skills,
  projects,
}: IChatAppProps) {
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('ichat-session-id');
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem('ichat-session-id', id);
    return id;
  });

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const hasPlayedWelcomeRef = useRef(false);

  const queriedMessages = useQuery(api.chat.listMessages, { sessionId });
  const messages = useMemo(() => queriedMessages ?? [], [queriedMessages]);
  const sendMessage = useAction(api.chat.sendMessage);

  const resumeContext = useMemo(() => {
    const profileSection = `[Profile] ${name}, ${title}\nSummary: ${summary}`;

    const projectsSection = projects
      .map(
        (p) =>
          `[Project] ${p.title} at ${p.company} (${p.timeline}) - ${p.role}\n${p.description}${
            p.achievements?.length
              ? '\nAchievements: ' +
                p.achievements.map((a) => a.description).join('; ')
              : ''
          }`
      )
      .join('\n\n');

    const skillsSection = skills
      .map(
        (s) =>
          `[Skills - ${s.category}] ${s.skills.join(', ')} (${s.proficiency})`
      )
      .join('\n');

    return `${profileSection}\n\n${projectsSection}\n\n${skillsSection}`;
  }, [name, title, summary, skills, projects]);

  useEffect(() => {
    if (!hasPlayedWelcomeRef.current) {
      hasPlayedWelcomeRef.current = true;
      playSound('ichat-invitation.wav');
    }
  }, []);

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const newMessages = messages.slice(prevMessageCountRef.current);
      const hasAssistant = newMessages.some((m) => m.role === 'assistant');
      if (hasAssistant) {
        playSound('ichat-received-message.wav');
        setIsSending(false);
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setInput('');
    setIsSending(true);
    playSound('ichat-sent-message.wav');

    try {
      await sendMessage({
        sessionId,
        content: trimmed,
        resumeContext,
      });
    } catch {
      setIsSending(false);
    }
  }, [input, isSending, sendMessage, sessionId, resumeContext]);

  const showWelcome = messages.length === 0 && !isSending;

  return (
    <div
      className="flex h-full"
      style={{ fontFamily: "'Lucida Grande', sans-serif" }}
    >
      <div
        className="flex w-[140px] flex-shrink-0 flex-col"
        style={{
          background: 'linear-gradient(180deg, #c0c8d0, #a8b0b8)',
          borderRight: '1px solid #8a929a',
        }}
      >
        <div
          className="px-3 py-2 text-[10px] font-bold uppercase"
          style={{ color: '#555', borderBottom: '1px solid #99a1a9' }}
        >
          Buddies
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          <div
            className="rounded-full"
            style={{
              width: '8px',
              height: '8px',
              background: '#4cd964',
              boxShadow: '0 0 3px rgba(76,217,100,0.5)',
            }}
          />
          <span className="text-[12px]" style={{ color: '#222' }}>
            {name.split(' ')[0]}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col" style={{ background: '#fff' }}>
        <MacScrollArea
          className="flex-1"
          orientation="vertical"
          viewportClassName="px-3 py-3"
        >
          {showWelcome && (
            <div className="mb-4 flex justify-start">
              <div
                className="max-w-[80%] rounded-xl px-3 py-2 text-[13px]"
                style={{ background: '#e8e8e8', color: '#333' }}
              >
                hey! i'm {name.split(' ')[0]}'s portfolio assistant. ask me
                about their experience, projects, or skills!
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] rounded-xl px-3 py-2 text-[13px]"
                style={
                  msg.role === 'user'
                    ? {
                        background: 'linear-gradient(180deg, #5ba0e0, #3a7bd5)',
                        color: '#fff',
                      }
                    : {
                        background: '#e8e8e8',
                        color: '#333',
                      }
                }
              >
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="mb-2 flex justify-start">
              <div
                className="rounded-xl px-3 py-2 text-[13px]"
                style={{ background: '#e8e8e8', color: '#999' }}
              >
                <span className="inline-flex gap-1">
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  >
                    .
                  </span>
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  >
                    .
                  </span>
                  <span
                    className="animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  >
                    .
                  </span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </MacScrollArea>

        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ borderTop: '1px solid #ddd', background: '#f5f5f5' }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="type a message..."
            className="flex-1 rounded-full border px-3 py-1.5 text-[13px] outline-none"
            style={{
              borderColor: '#ccc',
              background: '#fff',
              color: '#333',
            }}
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-opacity"
            style={{
              background: 'linear-gradient(180deg, #5ba0e0, #3a7bd5)',
              color: '#fff',
              opacity: !input.trim() || isSending ? 0.5 : 1,
            }}
          >
            send
          </button>
        </div>
      </div>
    </div>
  );
}
