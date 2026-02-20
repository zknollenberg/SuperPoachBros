import GameCanvas from '@/components/GameCanvas';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center gap-6 px-4 py-8">
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-black tracking-tight text-amber-400">SuperPoachBros</h1>
        <p className="text-slate-300">What goes around comes around</p>
      </header>

      <section className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
        <h2 className="mb-2 text-lg font-semibold text-white">How to play</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>Move with WASD or Arrow Keys.</li>
          <li>Collect beer kegs to gain +10 points.</li>
          <li>Avoid the moving red obstacles or you lose instantly.</li>
          <li>Survive and score before the 45-second timer hits zero.</li>
          <li>Click Restart anytime for a fresh run.</li>
        </ul>
      </section>

      <GameCanvas />
    </main>
  );
}
