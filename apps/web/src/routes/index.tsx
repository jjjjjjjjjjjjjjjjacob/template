import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="mb-8 text-6xl font-bold tracking-widest text-white opacity-90">
          template
        </h1>

        <p className="max-w-md text-center text-lg text-white/60">
          a modern full-stack monorepo template with real-time capabilities and
          3d graphics
        </p>

        <div className="mt-12 flex gap-4">
          <button className="rounded-lg border border-white/10 bg-white/10 px-6 py-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20">
            get started
          </button>
          <button className="rounded-lg border border-white/20 bg-transparent px-6 py-3 text-white transition-colors hover:bg-white/10">
            learn more
          </button>
        </div>
      </div>
    </div>
  );
}
