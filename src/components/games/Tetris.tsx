import { useEffect, useRef, useState, useCallback } from "react";

const COLS = 10;
const ROWS = 20;
const B = 20; // block size px

const COLORS = [
  "", "#00f0f0", "#f0a000", "#a000f0", "#f00000", "#00f000", "#0000f0", "#f0f000"
];

const SHAPES = [
  [],
  [[1,1,1,1]],
  [[2,2],[2,2]],
  [[0,3,0],[3,3,3]],
  [[4,0],[4,0],[4,4]],
  [[0,5],[0,5],[5,5]],
  [[6,6,0],[0,6,6]],
  [[0,7,7],[7,7,0]],
];

// Оригинальный тетрис: скорость по уровням (мс на тик)
const LEVEL_SPEED = [800, 720, 630, 550, 470, 380, 300, 220, 150, 100, 80];

function getSpeed(level: number) {
  return LEVEL_SPEED[Math.min(level, LEVEL_SPEED.length - 1)];
}

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function rotate(shape: number[][]) {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

export default function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef(createBoard());
  const pieceRef = useRef({ shape: SHAPES[1], x: 3, y: 0, type: 1 });
  const nextTypeRef = useRef(2);
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);

  const randType = () => Math.floor(Math.random() * 7) + 1;

  const drawNext = useCallback(() => {
    const c = nextCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, 0, c.width, c.height);
    const shape = SHAPES[nextTypeRef.current];
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    shape.forEach((row, dy) => row.forEach((v, dx) => {
      if (v) {
        ctx.fillStyle = COLORS[nextTypeRef.current];
        ctx.fillRect((offX + dx) * B + 1, (offY + dy) * B + 1, B - 2, B - 2);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect((offX + dx) * B + 1, (offY + dy) * B + 1, B - 2, 3);
      }
    }));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, 0, COLS * B, ROWS * B);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * B, 0); ctx.lineTo(x * B, ROWS * B); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * B); ctx.lineTo(COLS * B, y * B); ctx.stroke(); }

    // Board
    boardRef.current.forEach((row, y) => row.forEach((v, x) => {
      if (!v) return;
      ctx.fillStyle = COLORS[v];
      ctx.fillRect(x * B + 1, y * B + 1, B - 2, B - 2);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(x * B + 1, y * B + 1, B - 2, 3);
    }));

    // Ghost piece
    const p = pieceRef.current;
    let ghostY = p.y;
    while (!collides(p.shape, p.x, ghostY + 1)) ghostY++;
    if (ghostY !== p.y) {
      p.shape.forEach((row, dy) => row.forEach((v, dx) => {
        if (!v) return;
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect((p.x + dx) * B + 1, (ghostY + dy) * B + 1, B - 2, B - 2);
      }));
    }

    // Active piece
    p.shape.forEach((row, dy) => row.forEach((v, dx) => {
      if (!v) return;
      ctx.fillStyle = COLORS[p.type];
      ctx.fillRect((p.x + dx) * B + 1, (p.y + dy) * B + 1, B - 2, B - 2);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect((p.x + dx) * B + 1, (p.y + dy) * B + 1, B - 2, 3);
    }));

    drawNext();
  }, [drawNext]);

  const collides = (shape: number[][], nx: number, ny: number) =>
    shape.some((row, dy) => row.some((v, dx) => {
      if (!v) return false;
      const cx = nx + dx, cy = ny + dy;
      return cx < 0 || cx >= COLS || cy >= ROWS || (cy >= 0 && boardRef.current[cy][cx]);
    }));

  const scheduleInterval = useCallback((lv: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      const p = pieceRef.current;
      if (!collides(p.shape, p.x, p.y + 1)) {
        pieceRef.current = { ...p, y: p.y + 1 };
        draw();
      } else {
        lock();
      }
    }, getSpeed(lv));
  }, []); // eslint-disable-line

  const lock = useCallback(() => {
    const p = pieceRef.current;
    p.shape.forEach((row, dy) => row.forEach((v, dx) => {
      if (v && p.y + dy >= 0) boardRef.current[p.y + dy][p.x + dx] = p.type;
    }));

    let cleared = 0;
    boardRef.current = boardRef.current.filter(row => {
      if (row.every(v => v)) { cleared++; return false; }
      return true;
    });
    while (boardRef.current.length < ROWS) boardRef.current.unshift(Array(COLS).fill(0));

    if (cleared) {
      const pts = [0, 100, 300, 500, 800][cleared] * (levelRef.current + 1);
      scoreRef.current += pts;
      linesRef.current += cleared;
      const newLevel = Math.floor(linesRef.current / 10);
      if (newLevel !== levelRef.current) {
        levelRef.current = newLevel;
        setLevel(newLevel);
        scheduleInterval(newLevel);
      }
      setScore(scoreRef.current);
      setLines(linesRef.current);
    }

    const nextType = nextTypeRef.current;
    nextTypeRef.current = randType();
    const newPiece = { shape: SHAPES[nextType], x: 3, y: 0, type: nextType };
    if (collides(newPiece.shape, newPiece.x, newPiece.y)) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      pieceRef.current = newPiece;
      draw();
      setGameOver(true);
    } else {
      pieceRef.current = newPiece;
      draw();
    }
  }, [draw, scheduleInterval]);

  const startGame = useCallback(() => {
    boardRef.current = createBoard();
    const t = randType();
    nextTypeRef.current = randType();
    pieceRef.current = { shape: SHAPES[t], x: 3, y: 0, type: t };
    scoreRef.current = 0;
    linesRef.current = 0;
    levelRef.current = 0;
    setScore(0);
    setLines(0);
    setLevel(0);
    setGameOver(false);
    setPaused(false);
    pausedRef.current = false;
    setStarted(true);
    draw();
    scheduleInterval(0);
  }, [draw, scheduleInterval]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started || gameOver || pausedRef.current) return;
      const p = pieceRef.current;
      if (e.key === "ArrowLeft") {
        if (!collides(p.shape, p.x - 1, p.y)) { pieceRef.current = { ...p, x: p.x - 1 }; draw(); }
      } else if (e.key === "ArrowRight") {
        if (!collides(p.shape, p.x + 1, p.y)) { pieceRef.current = { ...p, x: p.x + 1 }; draw(); }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!collides(p.shape, p.x, p.y + 1)) { pieceRef.current = { ...p, y: p.y + 1 }; draw(); }
        else lock();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const r = rotate(p.shape);
        if (!collides(r, p.x, p.y)) { pieceRef.current = { ...p, shape: r }; draw(); }
      } else if (e.key === " ") {
        e.preventDefault();
        let ny = p.y;
        while (!collides(p.shape, p.x, ny + 1)) ny++;
        pieceRef.current = { ...p, y: ny };
        lock();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, gameOver, lock, draw]);

  const togglePause = () => {
    if (!started || gameOver) return;
    const np = !pausedRef.current;
    pausedRef.current = np;
    setPaused(np);
  };

  const doRotate = () => { const p = pieceRef.current; const r = rotate(p.shape); if (!collides(r, p.x, p.y)) { pieceRef.current = { ...p, shape: r }; draw(); } };
  const doLeft = () => { const p = pieceRef.current; if (!collides(p.shape, p.x - 1, p.y)) { pieceRef.current = { ...p, x: p.x - 1 }; draw(); } };
  const doRight = () => { const p = pieceRef.current; if (!collides(p.shape, p.x + 1, p.y)) { pieceRef.current = { ...p, x: p.x + 1 }; draw(); } };
  const doDown = () => { const p = pieceRef.current; if (!collides(p.shape, p.x, p.y + 1)) { pieceRef.current = { ...p, y: p.y + 1 }; draw(); } else lock(); };
  const doHard = () => { const p = pieceRef.current; let ny = p.y; while (!collides(p.shape, p.x, ny + 1)) ny++; pieceRef.current = { ...p, y: ny }; lock(); };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-3 items-start">
        <canvas ref={canvasRef} width={COLS * B} height={ROWS * B}
          className="border border-border rounded-md" style={{ background: "#0f0f0f" }} />
        <div className="flex flex-col gap-2" style={{ minWidth: 80 }}>
          <div className="bg-card border border-border rounded-md p-2 text-center">
            <div className="text-[10px] text-muted-foreground">Счёт</div>
            <div className="text-base font-bold">{score}</div>
          </div>
          <div className="bg-card border border-border rounded-md p-2 text-center">
            <div className="text-[10px] text-muted-foreground">Уровень</div>
            <div className="text-base font-bold">{level}</div>
          </div>
          <div className="bg-card border border-border rounded-md p-2 text-center">
            <div className="text-[10px] text-muted-foreground">Линии</div>
            <div className="text-base font-bold">{lines}</div>
          </div>
          <div className="bg-card border border-border rounded-md p-2 text-center">
            <div className="text-[10px] text-muted-foreground mb-1">Следующий</div>
            <canvas ref={nextCanvasRef} width={4 * B} height={4 * B} style={{ background: "#0f0f0f", borderRadius: 4 }} />
          </div>
          <div className="text-[10px] text-muted-foreground hidden md:block mt-1 space-y-0.5">
            <div>← → движение</div>
            <div>↑ поворот</div>
            <div>↓ быстрее</div>
            <div>Пробел сброс</div>
          </div>
        </div>
      </div>

      {/* Мобильное управление */}
      <div className="flex flex-col items-center gap-1.5 md:hidden">
        <button onPointerDown={doRotate} className="bg-card border border-border rounded-lg px-8 py-2 text-sm font-medium active:bg-muted">↑ Повернуть</button>
        <div className="flex gap-2">
          <button onPointerDown={doLeft} className="bg-card border border-border rounded-lg px-5 py-2 text-base font-medium active:bg-muted">←</button>
          <button onPointerDown={doDown} className="bg-card border border-border rounded-lg px-5 py-2 text-base font-medium active:bg-muted">↓</button>
          <button onPointerDown={doRight} className="bg-card border border-border rounded-lg px-5 py-2 text-base font-medium active:bg-muted">→</button>
        </div>
        <button onPointerDown={doHard} className="bg-card border border-border rounded-lg px-8 py-2 text-sm font-medium active:bg-muted">⬇ Сброс</button>
      </div>

      <div className="flex gap-2">
        <button onClick={startGame}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-1.5 text-sm font-medium">
          {!started || gameOver ? "Начать" : "Заново"}
        </button>
        {started && !gameOver && (
          <button onClick={togglePause}
            className="bg-card border border-border rounded-lg px-4 py-1.5 text-sm font-medium">
            {paused ? "▶ Продолжить" : "⏸ Пауза"}
          </button>
        )}
      </div>

      {gameOver && <div className="text-destructive font-bold">Игра окончена! Счёт: {score}</div>}
      {paused && <div className="text-muted-foreground text-sm">⏸ Пауза</div>}
    </div>
  );
}
