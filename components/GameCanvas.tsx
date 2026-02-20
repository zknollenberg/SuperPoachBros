'use client';

import { useEffect, useRef, useState } from 'react';

type Vec = { x: number; y: number };
type Obstacle = { x: number; y: number; w: number; h: number; vx: number; vy: number };

type GameStatus = 'ready' | 'running' | 'lost';

const WIDTH = 720;
const HEIGHT = 480;
const PLAYER_SIZE = 30;
const ITEM_SIZE = 24;
const SPEED = 240;
const ROUND_TIME_SECONDS = 45;

const createObstacles = (): Obstacle[] => [
  { x: 80, y: 70, w: 90, h: 26, vx: 54, vy: 0 },
  { x: 480, y: 110, w: 26, h: 110, vx: 0, vy: 74 },
  { x: 320, y: 330, w: 120, h: 26, vx: -62, vy: 0 },
  { x: 620, y: 260, w: 26, h: 100, vx: 0, vy: -65 }
];

const randomItem = (player: Vec): Vec => {
  let x = 0;
  let y = 0;
  do {
    x = Math.random() * (WIDTH - ITEM_SIZE * 2) + ITEM_SIZE;
    y = Math.random() * (HEIGHT - ITEM_SIZE * 2) + ITEM_SIZE;
  } while (Math.hypot(player.x - x, player.y - y) < 72);
  return { x, y };
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const collidesWithRect = (point: Vec, size: number, rect: Obstacle): boolean =>
  point.x + size > rect.x && point.x < rect.x + rect.w && point.y + size > rect.y && point.y < rect.y + rect.h;

const drawPixelCharacter = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  const pixel = size / 10;
  const draw = (dx: number, dy: number, color: string, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + dx * pixel, y + dy * pixel, pixel * w, pixel * h);
  };

  draw(3, 0, '#1e3a8a', 4, 1);
  draw(2, 1, '#1e3a8a', 6, 1);
  draw(3, 2, '#93c5fd', 4, 1);

  draw(3, 3, '#f4c7a1', 4, 2);
  draw(3, 4, '#000000', 1, 1);
  draw(6, 4, '#000000', 1, 1);
  draw(4, 5, '#ef4444', 2, 1);

  draw(2, 5, '#f4c7a1', 1, 1);
  draw(7, 5, '#f4c7a1', 1, 1);

  draw(2, 6, '#1d4ed8', 6, 2);
  draw(2, 8, '#f4c7a1', 1, 1);
  draw(7, 8, '#f4c7a1', 1, 1);

  draw(3, 8, '#0f172a', 1, 2);
  draw(6, 8, '#0f172a', 1, 2);
  draw(2, 9, '#e5e7eb', 2, 1);
  draw(6, 9, '#e5e7eb', 2, 1);
};

const drawBeerKeg = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  const kegW = size;
  const kegH = size * 0.78;
  const topX = x - kegW / 2;
  const topY = y - kegH / 2;

  ctx.fillStyle = '#a16207';
  ctx.fillRect(topX, topY, kegW, kegH);

  ctx.fillStyle = '#6b7280';
  ctx.fillRect(topX, topY + 2, kegW, 3);
  ctx.fillRect(topX, topY + kegH - 5, kegW, 3);

  ctx.fillStyle = '#d97706';
  ctx.fillRect(topX + 3, topY + 6, kegW - 6, kegH - 12);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(topX + kegW * 0.32, topY + kegH * 0.3, kegW * 0.36, kegH * 0.22);
  ctx.fillStyle = '#334155';
  ctx.fillRect(topX + kegW * 0.46, topY + kegH * 0.36, kegW * 0.08, kegH * 0.1);
};

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const playerRef = useRef<Vec>({ x: 80, y: HEIGHT / 2 });
  const obstaclesRef = useRef<Obstacle[]>(createObstacles());
  const itemRef = useRef<Vec>(randomItem(playerRef.current));
  const frameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(ROUND_TIME_SECONDS);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_SECONDS);
  const [status, setStatus] = useState<GameStatus>('ready');

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e293b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#0b1220';
    for (let i = 0; i < 9; i++) {
      ctx.fillRect(0, i * 56 + 16, WIDTH, 2);
    }

    const item = itemRef.current;
    drawBeerKeg(ctx, item.x, item.y, ITEM_SIZE);

    ctx.fillStyle = '#ef4444';
    for (const obstacle of obstaclesRef.current) {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    }

    const player = playerRef.current;
    drawPixelCharacter(ctx, player.x, player.y, PLAYER_SIZE);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`Score: ${scoreRef.current}`, 14, 24);
    ctx.fillText(`Time: ${Math.ceil(timeLeftRef.current)}s`, WIDTH - 105, 24);
  };

  const loseGame = () => {
    if (status === 'lost') return;
    setStatus('lost');
  };

  const restart = () => {
    playerRef.current = { x: 80, y: HEIGHT / 2 };
    obstaclesRef.current = createObstacles();
    itemRef.current = randomItem(playerRef.current);
    scoreRef.current = 0;
    timeLeftRef.current = ROUND_TIME_SECONDS;
    setScore(0);
    setTimeLeft(ROUND_TIME_SECONDS);
    setStatus('running');
    lastTimeRef.current = undefined;
  };

  useEffect(() => {
    restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keysRef.current.add(event.key.toLowerCase());
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
    };

    const up = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key.toLowerCase());
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const tick = (timestamp: number) => {
      const previous = lastTimeRef.current ?? timestamp;
      const delta = Math.min((timestamp - previous) / 1000, 0.04);
      lastTimeRef.current = timestamp;

      if (status === 'running') {
        const moveX = (keysRef.current.has('d') || keysRef.current.has('arrowright') ? 1 : 0) -
          (keysRef.current.has('a') || keysRef.current.has('arrowleft') ? 1 : 0);
        const moveY = (keysRef.current.has('s') || keysRef.current.has('arrowdown') ? 1 : 0) -
          (keysRef.current.has('w') || keysRef.current.has('arrowup') ? 1 : 0);

        playerRef.current = {
          x: clamp(playerRef.current.x + moveX * SPEED * delta, 0, WIDTH - PLAYER_SIZE),
          y: clamp(playerRef.current.y + moveY * SPEED * delta, 0, HEIGHT - PLAYER_SIZE)
        };

        obstaclesRef.current = obstaclesRef.current.map((obstacle) => {
          const next = {
            ...obstacle,
            x: obstacle.x + obstacle.vx * delta,
            y: obstacle.y + obstacle.vy * delta
          };

          if (next.x < 0 || next.x + next.w > WIDTH) {
            next.vx *= -1;
            next.x = clamp(next.x, 0, WIDTH - next.w);
          }

          if (next.y < 0 || next.y + next.h > HEIGHT) {
            next.vy *= -1;
            next.y = clamp(next.y, 0, HEIGHT - next.h);
          }

          return next;
        });

        for (const obstacle of obstaclesRef.current) {
          if (collidesWithRect(playerRef.current, PLAYER_SIZE, obstacle)) {
            loseGame();
          }
        }

        const item = itemRef.current;
        const playerCenterX = playerRef.current.x + PLAYER_SIZE / 2;
        const playerCenterY = playerRef.current.y + PLAYER_SIZE / 2;
        if (Math.hypot(playerCenterX - item.x, playerCenterY - item.y) < 22) {
          scoreRef.current += 10;
          setScore(scoreRef.current);
          itemRef.current = randomItem(playerRef.current);
        }

        timeLeftRef.current = Math.max(0, timeLeftRef.current - delta);
        setTimeLeft(timeLeftRef.current);
        if (timeLeftRef.current <= 0) {
          loseGame();
        }
      }

      draw();
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="w-full rounded-xl border border-slate-700 shadow-xl shadow-black/40"
      />
      <div className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-3">
        <p className="text-sm text-slate-200">
          {status === 'lost'
            ? `Game over! Final score: ${score}.`
            : `Kegs secured: ${score}. Keep poaching and dodging!`}
        </p>
        <button
          type="button"
          onClick={restart}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
        >
          Restart
        </button>
      </div>
      <p className="text-xs text-slate-400">Time left: {Math.ceil(timeLeft)}s</p>
    </div>
  );
}
