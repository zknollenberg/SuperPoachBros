'use client';

import { useEffect, useRef, useState } from 'react';

type Vec = { x: number; y: number };
type Obstacle = { x: number; y: number; w: number; h: number; vx: number; vy: number };

type GameStatus = 'running' | 'lost' | 'won';

const WIDTH = 720;
const HEIGHT = 480;
const PLAYER_SIZE = 34;
const ITEM_SIZE = 18;
const SPEED = 240;
const ROUND_TIME_SECONDS = 55;
const HOME_ZONE = { x: WIDTH - 120, y: 38, w: 90, h: 70 };

const createObstacles = (): Obstacle[] => [
  { x: 90, y: 360, w: 92, h: 22, vx: 126, vy: 0 },
  { x: 480, y: 322, w: 100, h: 22, vx: -154, vy: 0 },
  { x: 250, y: 285, w: 82, h: 22, vx: 142, vy: 0 },
  { x: 560, y: 248, w: 96, h: 22, vx: -118, vy: 0 }
];

const randomItem = (player: Vec): Vec => {
  let x = 0;
  let y = 0;
  do {
    x = Math.random() * (WIDTH - ITEM_SIZE * 2) + ITEM_SIZE;
    y = Math.random() * (HEIGHT - ITEM_SIZE * 2) + ITEM_SIZE;
  } while (Math.hypot(player.x - x, player.y - y) < 72 || y < 130);
  return { x, y };
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const collidesWithRect = (point: Vec, size: number, rect: Obstacle): boolean =>
  point.x + size > rect.x && point.x < rect.x + rect.w && point.y + size > rect.y && point.y < rect.y + rect.h;

const drawPixelCharacter = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  const pixel = size / 16;
  const draw = (dx: number, dy: number, color: string, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x + dx * pixel), Math.round(y + dy * pixel), Math.ceil(pixel * w), Math.ceil(pixel * h));
  };

  draw(4, 0, '#0b102b', 8, 1);
  draw(3, 1, '#0b102b', 10, 1);
  draw(4, 2, '#0b102b', 9, 1);
  draw(8, 3, '#0b102b', 5, 1);
  draw(7, 1, '#1d3b8f', 2, 2);

  draw(6, 3, '#f4bf8d', 5, 3);
  draw(7, 4, '#7f1d1d', 3, 1);

  draw(5, 6, '#f4bf8d', 1, 2);
  draw(10, 6, '#f4bf8d', 1, 2);
  draw(5, 8, '#f8f4eb', 6, 4);
  draw(4, 8, '#f4bf8d', 1, 4);
  draw(11, 8, '#f4bf8d', 1, 4);

  draw(6, 9, '#ef4444', 4, 1);
  draw(6, 10, '#1e3a8a', 4, 1);
  draw(6, 11, '#1e3a8a', 4, 1);

  draw(5, 12, '#1f2937', 3, 3);
  draw(8, 12, '#0f172a', 3, 3);

  draw(6, 15, '#f4bf8d', 1, 1);
  draw(9, 15, '#f4bf8d', 1, 1);
};

const drawSnack = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x - size / 4, y - size / 4, size / 2, size / 2);
};

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const playerRef = useRef<Vec>({ x: 32, y: HEIGHT - 66 });
  const obstaclesRef = useRef<Obstacle[]>(createObstacles());
  const itemRef = useRef<Vec>(randomItem(playerRef.current));
  const frameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(ROUND_TIME_SECONDS);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_SECONDS);
  const [status, setStatus] = useState<GameStatus>('running');

  const drawMap = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#7ec9ff';
    ctx.fillRect(0, 0, WIDTH, 120);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(70, 28, 76, 18);
    ctx.fillRect(260, 18, 92, 20);
    ctx.fillRect(490, 26, 108, 20);

    ctx.fillStyle = '#84cc16';
    ctx.fillRect(0, 120, WIDTH, 124);

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(18, 142, 108, 76);
    ctx.fillRect(28, 170, 80, 48);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(62, 182, 18, 36);
    ctx.fillStyle = '#111827';
    ctx.fillRect(28, 170, 80, 4);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(HOME_ZONE.x, HOME_ZONE.y, HOME_ZONE.w, HOME_ZONE.h);
    ctx.fillStyle = '#111827';
    ctx.fillRect(HOME_ZONE.x, HOME_ZONE.y, HOME_ZONE.w, 4);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(HOME_ZONE.x + 34, HOME_ZONE.y + 31, 22, 39);
    ctx.fillStyle = '#111827';
    ctx.fillRect(HOME_ZONE.x + 8, HOME_ZONE.y + 15, 16, 16);
    ctx.fillRect(HOME_ZONE.x + 66, HOME_ZONE.y + 15, 16, 16);

    ctx.fillStyle = '#6b7280';
    ctx.fillRect(0, 244, WIDTH, 150);
    ctx.fillStyle = '#f8fafc';
    for (let x = 18; x < WIDTH; x += 56) {
      ctx.fillRect(x, 316, 24, 4);
      ctx.fillRect(x + 10, 278, 24, 4);
      ctx.fillRect(x + 4, 354, 24, 4);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 394, WIDTH, 86);
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 394, WIDTH, 4);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(12, HEIGHT - 62, 128, 10);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(142, HEIGHT - 66, 8, 18);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawMap(ctx);

    const item = itemRef.current;
    drawSnack(ctx, item.x, item.y, ITEM_SIZE);

    for (const obstacle of obstaclesRef.current) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
      ctx.fillStyle = '#111827';
      ctx.fillRect(obstacle.x + 10, obstacle.y + obstacle.h - 4, 12, 4);
      ctx.fillRect(obstacle.x + obstacle.w - 22, obstacle.y + obstacle.h - 4, 12, 4);
    }

    const player = playerRef.current;
    drawPixelCharacter(ctx, player.x, player.y, PLAYER_SIZE);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`Score: ${scoreRef.current}`, 14, 24);
    ctx.fillText(`Time: ${Math.ceil(timeLeftRef.current)}s`, WIDTH - 102, 24);

    ctx.fillStyle = '#14532d';
    ctx.fillText("Scruffy Murphy's", 14, HEIGHT - 74);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText('Home', HOME_ZONE.x + 24, HOME_ZONE.y - 6);
  };

  const loseGame = () => {
    if (status !== 'running') return;
    setStatus('lost');
  };

  const winGame = () => {
    if (status !== 'running') return;
    setStatus('won');
    scoreRef.current += 50;
    setScore(scoreRef.current);
  };

  const restart = () => {
    playerRef.current = { x: 32, y: HEIGHT - 66 };
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

        if (collidesWithRect(playerRef.current, PLAYER_SIZE, {
          x: HOME_ZONE.x,
          y: HOME_ZONE.y,
          w: HOME_ZONE.w,
          h: HOME_ZONE.h,
          vx: 0,
          vy: 0
        })) {
          winGame();
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
            ? `You got sent back to Scruffy's. Final score: ${score}.`
            : status === 'won'
              ? `You made it home! Final score: ${score}.`
              : `Late-night walk home: grab snacks (+10) and cross safely.`}
        </p>
        <button
          type="button"
          onClick={restart}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
        >
          Restart
        </button>
      </div>
      <p className="text-xs text-slate-400">Make it from Scruffy Murphy's to your house before time runs out.</p>
    </div>
  );
}
