interface NotesAppProps {
  name: string;
  title: string;
  location: string;
  summary: string;
  contact: {
    email?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
}

export function NotesApp({
  name,
  title,
  location,
  summary,
  contact,
}: NotesAppProps) {
  return (
    <div
      className="min-h-full p-6"
      style={{
        backgroundImage:
          'repeating-linear-gradient(transparent, transparent 27px, #ddd 27px, #ddd 28px)',
        backgroundSize: '100% 28px',
        backgroundPosition: '0 12px',
        background: '#fffef5',
        backgroundRepeat: 'repeat',
      }}
    >
      <div
        className="min-h-full p-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(transparent, transparent 27px, #e0d8c8 27px, #e0d8c8 28px)',
          backgroundSize: '100% 28px',
          backgroundPosition: '0 12px',
        }}
      >
        <div
          className="mb-1 border-b-2 pb-4"
          style={{ borderColor: 'rgba(200,80,80,0.3)' }}
        >
          <h1 className="text-xl font-medium" style={{ color: '#333' }}>
            {name}
          </h1>
          <p className="text-[13px]" style={{ color: '#666' }}>
            {title}
          </p>
          {location && (
            <p className="text-xs" style={{ color: '#999' }}>
              {location}
            </p>
          )}
        </div>

        <div className="mt-6 space-y-[28px] leading-[28px]">
          <p className="text-[13px]" style={{ color: '#444' }}>
            {summary}
          </p>
        </div>

        <div className="mt-8 pt-4" style={{ borderTop: '1px solid #ddd' }}>
          <p className="mb-3 text-xs font-bold" style={{ color: '#888' }}>
            Contact
          </p>
          <div className="space-y-2">
            {contact.email && (
              <div className="flex items-center gap-2">
                <span className="text-[13px]">📧</span>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-[13px] hover:underline"
                  style={{ color: '#3a7bd5' }}
                >
                  {contact.email}
                </a>
              </div>
            )}
            {contact.linkedin && (
              <div className="flex items-center gap-2">
                <span className="text-[13px]">💼</span>
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] hover:underline"
                  style={{ color: '#3a7bd5' }}
                >
                  LinkedIn
                </a>
              </div>
            )}
            {contact.github && (
              <div className="flex items-center gap-2">
                <span className="text-[13px]">🐙</span>
                <a
                  href={contact.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] hover:underline"
                  style={{ color: '#3a7bd5' }}
                >
                  GitHub
                </a>
              </div>
            )}
            {contact.website && (
              <div className="flex items-center gap-2">
                <span className="text-[13px]">🌐</span>
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] hover:underline"
                  style={{ color: '#3a7bd5' }}
                >
                  {contact.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
