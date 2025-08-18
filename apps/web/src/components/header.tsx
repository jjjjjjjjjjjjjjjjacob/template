import { Link } from '@tanstack/react-router';

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          to="/"
          className="text-xl font-bold text-white transition-colors hover:text-white/80"
        >
          template
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            home
          </Link>
          <Link
            to="/discover"
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            discover
          </Link>
          <Link
            to="/search"
            className="text-sm text-white/70 transition-colors hover:text-white"
          >
            search
          </Link>
        </nav>
      </div>
    </header>
  );
}
