import { useEffect, useRef, useState } from 'react';
import { MacScrollArea } from '@/components/alt-macos/mac-scroll-area';

interface MailAppProps {
  email: string;
  name: string;
}

interface MailMessage {
  id: string;
  mailbox: 'Inbox' | 'Sent' | 'Drafts';
  fromName: string;
  fromEmail: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  body: string[];
}

const SAMPLE_MESSAGES: MailMessage[] = [
  {
    id: '1',
    mailbox: 'Inbox',
    fromName: 'Avery Chen',
    fromEmail: 'hiring@northstar.studio',
    subject: 'Your portfolio made it into our kickoff deck',
    preview:
      'The Safari and Finder variants are especially sharp. Are you free next week?',
    time: '2:30 PM',
    unread: true,
    body: [
      'Hi there,',
      'I spent part of the afternoon walking through your portfolio and ended up forwarding it around our team. The alt concepts in particular have a lot of personality without losing usability.',
      'If you are open to it, I would love to compare notes next week and hear how you think about product polish, motion, and shipping constraints.',
      'Best,',
      'Avery',
    ],
  },
  {
    id: '2',
    mailbox: 'Inbox',
    fromName: 'GitHub Notifications',
    fromEmail: 'notifications@github.com',
    subject: 'New star on your repository',
    preview: 'Someone found your work useful enough to click the shiny button.',
    time: '11:15 AM',
    unread: false,
    body: [
      'Good news.',
      'One of your repositories picked up a new star this morning. No action required, but quiet validation is always welcome.',
      'Regards,',
      'GitHub Notifications',
    ],
  },
  {
    id: '3',
    mailbox: 'Inbox',
    fromName: 'Mina Patel',
    fromEmail: 'mina@designcollective.co',
    subject: 'Collaboration opportunity',
    preview:
      'We are looking for someone who can bridge product thinking and interface craft.',
    time: 'Yesterday',
    unread: false,
    body: [
      'Hello,',
      'We are kicking off a product refresh and want someone who can move comfortably between systems work, visual decisions, and implementation details.',
      'Your work seems unusually balanced in that regard. If that sounds interesting, let me know.',
      'Thanks,',
      'Mina',
    ],
  },
  {
    id: '4',
    mailbox: 'Sent',
    fromName: 'You',
    fromEmail: 'visitor@portfolio.dev',
    subject: 'Thanks for taking a look',
    preview:
      'Appreciate the thoughtful feedback and the very specific bug report.',
    time: 'Monday',
    unread: false,
    body: [
      'Hi team,',
      'Thanks again for taking a look through the portfolio. I appreciated the detailed notes and the honesty.',
      'If it is helpful, I can send over a cleaner walkthrough of the case studies you asked about.',
      'Best,',
      'You',
    ],
  },
];

const MAILBOXES = ['Inbox', 'Sent', 'Drafts'] as const;

const DEFAULT_CONTAINER_WIDTH = 920;
const DEFAULT_CONTAINER_HEIGHT = 640;
const CONDENSED_LAYOUT_BREAKPOINT = 860;
const DENSE_LAYOUT_BREAKPOINT = 560;
interface ToolbarButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface MailboxesPanelProps {
  activeMailbox: (typeof MAILBOXES)[number];
  messageCounts: Record<(typeof MAILBOXES)[number], number>;
  onSelectMailbox: (mailbox: (typeof MAILBOXES)[number]) => void;
}

function ToolbarButton({
  children,
  onClick,
  active = false,
  disabled = false,
}: ToolbarButtonProps) {
  return (
    <button
      className="shrink-0 rounded-[7px] px-3 py-[4px] text-[10px] font-semibold whitespace-nowrap"
      style={{
        background: active
          ? 'linear-gradient(180deg, #6fbfff 0%, #3d83dc 100%)'
          : 'linear-gradient(180deg, #fefefe 0%, #dddddd 100%)',
        border: active
          ? '1px solid rgba(26,91,176,0.9)'
          : '1px solid rgba(0,0,0,0.18)',
        color: active ? '#fff' : '#4c5660',
        textShadow: active
          ? '0 -1px 0 rgba(0,0,0,0.22)'
          : '0 1px 0 rgba(255,255,255,0.8)',
        opacity: disabled ? 0.45 : 1,
      }}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function MailboxesPanel({
  activeMailbox,
  messageCounts,
  onSelectMailbox,
}: MailboxesPanelProps) {
  return (
    <div
      className="flex h-full shrink-0 flex-col px-2 py-3"
      style={{
        width: 165,
        background: 'linear-gradient(180deg, #cfd7df 0%, #aeb8c3 100%)',
        borderRight: '1px solid #8f99a4',
      }}
    >
      <p
        className="mb-2 px-2 text-[10px] font-bold tracking-wider uppercase"
        style={{ color: '#6f7a85' }}
      >
        Mailboxes
      </p>

      <div className="space-y-[2px]">
        {MAILBOXES.map((mailbox) => {
          const isActive = activeMailbox === mailbox;
          return (
            <button
              key={mailbox}
              className="flex w-full items-center justify-between rounded px-2 py-[4px] text-[11px]"
              style={
                isActive
                  ? {
                      background:
                        'linear-gradient(180deg, #5fa3f5 0%, #2f78d8 100%)',
                      color: '#fff',
                      textShadow: '0 -1px 0 rgba(0,0,0,0.22)',
                    }
                  : {
                      color: '#2f3740',
                      textShadow: '0 1px 0 rgba(255,255,255,0.55)',
                    }
              }
              onClick={() => onSelectMailbox(mailbox)}
            >
              <span>{mailbox}</span>
              <span>{messageCounts[mailbox]}</span>
            </button>
          );
        })}
      </div>

      <div
        className="mt-4 rounded-[14px] border px-3 py-3"
        style={{
          background: 'rgba(255,255,255,0.52)',
          borderColor: 'rgba(127,140,154,0.45)',
        }}
      >
        <p
          className="text-[10px] font-bold tracking-wider uppercase"
          style={{ color: '#74808c' }}
        >
          Quick Note
        </p>
        <p
          className="mt-2 text-[11px] leading-relaxed"
          style={{ color: '#4a5560' }}
        >
          Collapse panes from the toolbar when the window gets tight. Mail keeps
          the same horizontal structure.
        </p>
      </div>
    </div>
  );
}

function buildReplyBody(message: MailMessage) {
  return `Hi ${message.fromName.split(' ')[0]},\n\nThanks for the note.\n\n`;
}

function buildForwardBody(message: MailMessage) {
  return `\n\n--- Forwarded message ---\nFrom: ${message.fromName} <${message.fromEmail}>\nSubject: ${message.subject}\n\n${message.body.join('\n\n')}`;
}

export function MailApp({ email, name }: MailAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeMailbox, setActiveMailbox] =
    useState<(typeof MAILBOXES)[number]>('Inbox');
  const [selectedMessageId, setSelectedMessageId] = useState<string>(
    SAMPLE_MESSAGES[0]?.id ?? ''
  );
  const [isComposing, setIsComposing] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [archivedMessageIds, setArchivedMessageIds] = useState<string[]>([]);
  const [isMailboxCollapsed, setIsMailboxCollapsed] = useState(false);
  const [isMessageListCollapsed, setIsMessageListCollapsed] = useState(false);
  const [containerSize, setContainerSize] = useState({
    width: DEFAULT_CONTAINER_WIDTH,
    height: DEFAULT_CONTAINER_HEIGHT,
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateSize = () => {
      const nextWidth = node.clientWidth || DEFAULT_CONTAINER_WIDTH;
      const nextHeight = node.clientHeight || DEFAULT_CONTAINER_HEIGHT;
      setContainerSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight }
      );
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, []);

  const availableMessages = SAMPLE_MESSAGES.filter(
    (message) => !archivedMessageIds.includes(message.id)
  );
  const mailboxMessages = availableMessages.filter(
    (message) => message.mailbox === activeMailbox
  );
  const searchNeedle = searchQuery.trim().toLowerCase();
  const filteredMessages = mailboxMessages.filter((message) => {
    if (!searchNeedle) return true;
    return [
      message.fromName,
      message.fromEmail,
      message.subject,
      message.preview,
      message.body.join(' '),
    ]
      .join(' ')
      .toLowerCase()
      .includes(searchNeedle);
  });
  const selectedMessage =
    filteredMessages.find((message) => message.id === selectedMessageId) ??
    filteredMessages[0] ??
    null;

  useEffect(() => {
    if (!filteredMessages.some((message) => message.id === selectedMessageId)) {
      setSelectedMessageId(filteredMessages[0]?.id ?? '');
    }
  }, [filteredMessages, selectedMessageId]);

  const isCondensedLayout = containerSize.width < CONDENSED_LAYOUT_BREAKPOINT;
  const isDenseLayout =
    containerSize.width < DENSE_LAYOUT_BREAKPOINT || containerSize.height < 430;
  const messageListWidth = Math.min(
    isCondensedLayout ? 244 : 280,
    Math.max(212, Math.round(containerSize.width * 0.33))
  );
  const composeModalMaxHeight = Math.max(320, containerSize.height - 24);
  const composeEditorHeight = Math.min(
    Math.max(Math.round(containerSize.height * 0.38), 160),
    260
  );
  const messageCounts = MAILBOXES.reduce(
    (counts, mailbox) => {
      counts[mailbox] = availableMessages.filter(
        (message) => message.mailbox === mailbox
      ).length;
      return counts;
    },
    {} as Record<(typeof MAILBOXES)[number], number>
  );

  const openComposer = (nextSubject = '', nextBody = '') => {
    setSubject(nextSubject);
    setBody(nextBody);
    setIsComposing(true);
  };

  const handleMailboxSelect = (mailbox: (typeof MAILBOXES)[number]) => {
    setActiveMailbox(mailbox);
    const nextMessage = availableMessages.find(
      (message) => message.mailbox === mailbox
    );
    setSelectedMessageId(nextMessage?.id ?? '');
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    openComposer(
      `Re: ${selectedMessage.subject}`,
      buildReplyBody(selectedMessage)
    );
  };

  const handleForward = () => {
    if (!selectedMessage) return;
    openComposer(
      `Fwd: ${selectedMessage.subject}`,
      buildForwardBody(selectedMessage)
    );
  };

  const handleArchive = () => {
    if (!selectedMessage) return;
    setArchivedMessageIds((current) =>
      current.includes(selectedMessage.id)
        ? current
        : [...current, selectedMessage.id]
    );
  };

  const handleSend = () => {
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    setIsComposing(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-full min-h-0 flex-col"
      style={{ background: '#eef2f6' }}
    >
      <div
        className="flex shrink-0 items-center gap-2 overflow-hidden px-3 py-2"
        style={{
          background:
            'linear-gradient(180deg, #ececec 0%, #d4d4d4 52%, #c3c3c3 100%)',
          borderBottom: '1px solid #9e9e9e',
        }}
      >
        <div
          className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          <ToolbarButton onClick={() => openComposer()}>
            {isDenseLayout ? 'Compose' : 'New Message'}
          </ToolbarButton>
          <ToolbarButton
            active={!isMailboxCollapsed}
            onClick={() => setIsMailboxCollapsed((current) => !current)}
          >
            {isMailboxCollapsed
              ? isDenseLayout
                ? 'Mailboxes'
                : 'Show Mailboxes'
              : isDenseLayout
                ? 'Hide Box'
                : 'Hide Mailboxes'}
          </ToolbarButton>
          <ToolbarButton
            active={!isMessageListCollapsed}
            onClick={() => setIsMessageListCollapsed((current) => !current)}
          >
            {isMessageListCollapsed
              ? isDenseLayout
                ? 'Messages'
                : 'Show Messages'
              : isDenseLayout
                ? 'Hide List'
                : 'Hide Messages'}
          </ToolbarButton>
          <ToolbarButton
            disabled={!searchQuery && archivedMessageIds.length === 0}
            onClick={() => {
              setSearchQuery('');
              setArchivedMessageIds([]);
            }}
          >
            Reset
          </ToolbarButton>

          <div className="relative w-[170px] shrink-0 sm:w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                isDenseLayout
                  ? 'Search mail'
                  : 'Search sender, subject, or preview'
              }
              className="w-full rounded-full px-3 py-[5px] pr-14 text-[10px] outline-none"
              style={{
                background: '#fff',
                border: '1px solid #bcbcbc',
                color: '#4c5660',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
              }}
            />
            {searchQuery && (
              <button
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full px-2 py-[2px] text-[9px] font-semibold"
                style={{
                  background:
                    'linear-gradient(180deg, #fefefe 0%, #dddddd 100%)',
                  border: '1px solid rgba(0,0,0,0.18)',
                  color: '#4c5660',
                }}
                onClick={() => setSearchQuery('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pl-1 whitespace-nowrap">
          <span
            className="rounded-full px-3 py-[4px] text-[10px]"
            style={{
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(0,0,0,0.12)',
              color: '#626d78',
            }}
          >
            {activeMailbox}
          </span>
          <span className="text-[10px]" style={{ color: '#68737e' }}>
            {isDenseLayout
              ? `${filteredMessages.length} shown`
              : `${filteredMessages.length}/${mailboxMessages.length} shown`}
          </span>
          {!isDenseLayout && archivedMessageIds.length > 0 && (
            <span className="text-[10px]" style={{ color: '#68737e' }}>
              {archivedMessageIds.length} archived
            </span>
          )}
          {containerSize.width >= 760 && (
            <span className="truncate text-[11px]" style={{ color: '#59636e' }}>
              {email}
            </span>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {!isMailboxCollapsed && (
          <MailboxesPanel
            activeMailbox={activeMailbox}
            messageCounts={messageCounts}
            onSelectMailbox={handleMailboxSelect}
          />
        )}

        {!isMessageListCollapsed && (
          <div
            className="flex min-h-0 shrink-0 flex-col border-r"
            style={{
              width: messageListWidth,
              borderColor: '#c7d0da',
              background: '#fff',
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-2 text-[10px] font-bold tracking-wider uppercase"
              style={{
                background: 'linear-gradient(180deg, #f5f7f9 0%, #e5e9ee 100%)',
                borderBottom: '1px solid #d3dbe4',
                color: '#7b8794',
              }}
            >
              <span>{activeMailbox}</span>
              <span>{filteredMessages.length} messages</span>
            </div>

            <MacScrollArea className="min-h-0 flex-1" orientation="vertical">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message, index) => {
                  const isSelected = selectedMessage?.id === message.id;
                  return (
                    <button
                      key={message.id}
                      className="flex w-full gap-3 px-3 py-3 text-left"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(180deg, #6cb3f5 0%, #358cdb 100%)'
                          : index % 2 === 0
                            ? '#ffffff'
                            : '#f5f8fc',
                        borderBottom: '1px solid #edf1f5',
                        color: isSelected ? '#fff' : '#26303a',
                      }}
                      onClick={() => setSelectedMessageId(message.id)}
                    >
                      <div className="mt-[5px] h-2.5 w-2.5 shrink-0">
                        {message.unread && (
                          <span
                            className="block h-2.5 w-2.5 rounded-full"
                            style={{
                              background: isSelected ? '#fff' : '#4f8fe4',
                            }}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="truncate text-[12px] font-semibold"
                            style={{
                              opacity: isSelected
                                ? 1
                                : message.unread
                                  ? 1
                                  : 0.86,
                            }}
                          >
                            {message.fromName}
                          </span>
                          <span
                            className="shrink-0 text-[10px]"
                            style={{ opacity: 0.82 }}
                          >
                            {message.time}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[11px] font-medium">
                          {message.subject}
                        </p>
                        <p
                          className="mt-1 truncate text-[11px]"
                          style={{ opacity: 0.74 }}
                        >
                          {message.preview}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div
                  className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center"
                  style={{ color: '#8a97a3' }}
                >
                  <p className="text-[13px]">
                    {searchQuery
                      ? 'No messages match the current search.'
                      : 'This mailbox is empty.'}
                  </p>
                  {searchQuery && (
                    <ToolbarButton onClick={() => setSearchQuery('')}>
                      Clear Search
                    </ToolbarButton>
                  )}
                </div>
              )}
            </MacScrollArea>
          </div>
        )}

        <div
          className="min-h-0 min-w-0 flex-1"
          style={{ background: '#fdfefe' }}
        >
          {selectedMessage ? (
            <div className="flex h-full min-h-0 flex-col">
              <div
                className="px-4 py-4"
                style={{
                  background:
                    'linear-gradient(180deg, #ffffff 0%, #f3f6fa 100%)',
                  borderBottom: '1px solid #dbe3eb',
                }}
              >
                <div
                  className={`flex items-start gap-4 ${
                    isCondensedLayout ? 'flex-col' : 'justify-between'
                  }`}
                >
                  <div className="min-w-0">
                    <h2
                      className={`font-medium ${
                        isDenseLayout ? 'text-[17px]' : 'text-[20px]'
                      }`}
                      style={{ color: '#2d3640' }}
                    >
                      {selectedMessage.subject}
                    </h2>
                    <p
                      className="mt-1 text-[12px] break-words"
                      style={{ color: '#5f6a75' }}
                    >
                      {selectedMessage.fromName} &lt;{selectedMessage.fromEmail}
                      &gt;
                    </p>
                  </div>
                  <div
                    className={`text-[11px] ${
                      isCondensedLayout ? '' : 'text-right'
                    }`}
                    style={{ color: '#8a97a3' }}
                  >
                    <p>{selectedMessage.time}</p>
                    <p>{selectedMessage.mailbox}</p>
                  </div>
                </div>
              </div>

              <MacScrollArea
                className="min-h-0 flex-1"
                orientation="vertical"
                viewportClassName="px-4 py-4"
              >
                <div
                  className="space-y-4 text-[13px] leading-relaxed"
                  style={{
                    maxWidth: isCondensedLayout ? 'none' : '42rem',
                    color: '#39434d',
                  }}
                >
                  {selectedMessage.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </MacScrollArea>

              <div
                className={`flex gap-3 px-4 py-3 ${
                  isCondensedLayout
                    ? 'flex-col items-stretch'
                    : 'items-center justify-between'
                }`}
                style={{
                  borderTop: '1px solid #dde5ee',
                  background:
                    'linear-gradient(180deg, #fbfcfd 0%, #eef3f7 100%)',
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ToolbarButton onClick={handleReply}>Reply</ToolbarButton>
                  <ToolbarButton onClick={handleForward}>Forward</ToolbarButton>
                  <ToolbarButton onClick={handleArchive}>Archive</ToolbarButton>
                </div>

                <button
                  className={`rounded-[7px] px-3 py-[4px] text-[10px] font-semibold ${
                    isCondensedLayout ? 'w-full' : ''
                  }`}
                  style={{
                    background:
                      'linear-gradient(180deg, #6fbfff 0%, #3d83dc 100%)',
                    border: '1px solid rgba(26,91,176,0.9)',
                    color: '#fff',
                    textShadow: '0 -1px 0 rgba(0,0,0,0.22)',
                  }}
                  onClick={handleReply}
                >
                  Reply in New Message
                </button>
              </div>
            </div>
          ) : (
            <div
              className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center"
              style={{ color: '#95a0ab' }}
            >
              <p className="text-[13px]">
                {mailboxMessages.length === 0
                  ? 'No messages left in this mailbox.'
                  : searchQuery
                    ? 'No message is selected because the current search filtered everything out.'
                    : 'No message selected.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {isMessageListCollapsed && (
                  <ToolbarButton
                    onClick={() => setIsMessageListCollapsed(false)}
                  >
                    Show Messages
                  </ToolbarButton>
                )}
                {isMailboxCollapsed && (
                  <ToolbarButton onClick={() => setIsMailboxCollapsed(false)}>
                    Show Mailboxes
                  </ToolbarButton>
                )}
                {searchQuery && (
                  <ToolbarButton onClick={() => setSearchQuery('')}>
                    Clear Search
                  </ToolbarButton>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isComposing && (
        <div
          className="absolute inset-0 flex items-center justify-center p-3 sm:p-6"
          style={{ background: 'rgba(61,74,91,0.18)' }}
        >
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-[18px] border"
            style={{
              maxHeight: composeModalMaxHeight,
              borderColor: '#aab4bf',
              background: '#fff',
              boxShadow: '0 24px 54px rgba(39,52,66,0.28)',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background:
                  'linear-gradient(180deg, #ececec 0%, #d4d4d4 52%, #c3c3c3 100%)',
                borderBottom: '1px solid #a3a3a3',
              }}
            >
              <p
                className="text-[12px] font-semibold"
                style={{ color: '#3d4650' }}
              >
                New Message
              </p>
              <button
                className="rounded-full px-2 py-[2px] text-[10px]"
                style={{
                  background:
                    'linear-gradient(180deg, #fefefe 0%, #dddddd 100%)',
                  border: '1px solid rgba(0,0,0,0.18)',
                  color: '#4c5660',
                }}
                onClick={() => setIsComposing(false)}
              >
                Close
              </button>
            </div>

            <MacScrollArea
              className="min-h-0 flex-1"
              orientation="vertical"
              viewportClassName="flex flex-col gap-3 px-4 py-4"
            >
              {[
                { label: 'To:', value: email },
                { label: 'From:', value: 'visitor@portfolio.dev' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 border-b pb-2 text-[12px]"
                  style={{ borderColor: '#dde4eb' }}
                >
                  <span
                    className="w-12 text-right font-semibold"
                    style={{ color: '#7b8793' }}
                  >
                    {row.label}
                  </span>
                  <span style={{ color: '#36404a' }}>{row.value}</span>
                </div>
              ))}

              <div
                className="flex items-center gap-3 border-b pb-2"
                style={{ borderColor: '#dde4eb' }}
              >
                <span
                  className="w-12 text-right text-[12px] font-semibold"
                  style={{ color: '#7b8793' }}
                >
                  Subj:
                </span>
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Say hello"
                  className="w-full bg-transparent text-[12px] outline-none"
                  style={{ color: '#36404a' }}
                />
              </div>

              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={`Hi ${name.split(' ')[0]},\n\nI wanted to reach out about...`}
                className="w-full resize-none rounded-[12px] border p-3 text-[12px] leading-relaxed outline-none"
                style={{
                  minHeight: composeEditorHeight,
                  height: composeEditorHeight,
                  borderColor: '#d5dde7',
                  background: '#fbfcfd',
                  color: '#36404a',
                }}
              />

              <div className="flex flex-wrap justify-end gap-2">
                <ToolbarButton onClick={() => setIsComposing(false)}>
                  Cancel
                </ToolbarButton>
                <button
                  className="rounded-[7px] px-4 py-[6px] text-[10px] font-semibold"
                  style={{
                    background:
                      'linear-gradient(180deg, #6fbfff 0%, #3d83dc 100%)',
                    border: '1px solid rgba(26,91,176,0.9)',
                    color: '#fff',
                    textShadow: '0 -1px 0 rgba(0,0,0,0.22)',
                  }}
                  onClick={handleSend}
                >
                  Send Message
                </button>
              </div>
            </MacScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
