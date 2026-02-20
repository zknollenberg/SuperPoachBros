import GameCanvas from '@/components/GameCanvas';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center gap-6 px-4 py-8">
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-black tracking-tight text-amber-400">SuperPoachBros</h1>
        <p className="text-slate-300">What goes around comes around</p>
      </header>

      <section className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
        <h2 className="mb-2 text-lg font-semibold text-white">Story Mode: Walk It Off</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>You start outside Scruffy Murphy&apos;s at the bottom-left of the map.</li>
          <li>Move with WASD or Arrow Keys through traffic like an old-school arcade crossing game.</li>
          <li>Collect late-night snacks for +10 points along the way.</li>
          <li>Avoid moving cars, beat the timer, and reach your house at the top-right to win.</li>
          <li>Hit Restart to begin a new run.</li>
        </ul>
      </section>

      <GameCanvas />
    </main>
  );
}
