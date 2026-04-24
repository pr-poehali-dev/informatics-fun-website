import { useEffect, useRef, useState, useCallback } from "react";

const COLS = 10;
const ROWS = 20;
const BLOCK = 28;

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

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function rotate(shape: number[][]) {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

export default function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef(createBoard());
  const pieceRef = useRef({ shape: SHAPES[1], x: 3, y: 0, type: 1 });
  const nextRef = useRef(1);
  const scoreRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const randType = () => Math.floor(Math.random() * 7) + 1;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);

    boardRef.current.forEach((row, y) => row.forEach((v, x) => {
      if (v) {
        ctx.fillStyle = COLORS[v];
        ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, 4);
      }
    }));

    const p = pieceRef.current;
    p.shape.forEach((row, dy) => row.forEach((v, dx) => {
      if (v) {
        ctx.fillStyle = COLORS[p.type];
        ctx.fillRect((p.x + dx) * BLOCK + 1, (p.y + dy) * BLOCK + 1, BLOCK - 2, BLOCK - 2);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect((p.x + dx) * BLOCK + 1, (p.y + dy) * BLOCK + 1, BLOCK - 2, 4);
      }
    }));

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * BLOCK, 0); ctx.lineTo(x * BLOCK, ROWS * BLOCK); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * BLOCK); ctx.lineTo(COLS * BLOCK, y * BLOCK); ctx.stroke(); }
  }, []);

  const collides = (shape: number[][], nx: number, ny: number) => {
    return shape.some((row, dy) => row.some((v, dx) => {
      if (!v) return false;
      const nx2 = nx + dx, ny2 = ny + dy;
      return nx2 < 0 || nx2 >= COLS || ny2 >= ROWS || (ny2 >= 0 && boardRef.current[ny2][nx2]);
    }));
  };

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
      const pts = [0, 100, 300, 500, 800][cleared] || 800;
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setLines(l => l + cleared);
    }

    const nextType = nextRef.current;
    nextRef.current = randType();
    const newPiece = { shape: SHAPES[nextType], x: 3, y: 0, type: nextType };
    if (collides(newPiece.shape, newPiece.x, newPiece.y)) {
      setGameOver(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      pieceRef.current = newPiece;
    }
    draw();
  }, [draw]);

  const drop = useCallback(() => {
    if (pausedRef.current) return;
    const p = pieceRef.current;
    if (!collides(p.shape, p.x, p.y + 1)) {
      pieceRef.current = { ...p, y: p.y + 1 };
    } else {
      lock();
    }
    draw();
  }, [lock, draw]);

  const startGame = useCallback(() => {
    boardRef.current = createBoard();
    const t = randType();
    nextRef.current = randType();
    pieceRef.current = { shape: SHAPES[t], x: 3, y: 0, type: t };
    scoreRef.current = 0;
    setScore(0);
    setLines(0);
    setGameOver(false);
    setPaused(false);
    pausedRef.current = false;
    setStarted(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(drop, 500);
    draw();
  }, [drop, draw]);

  useEffect(() => {
    if (started && !gameOver) {
      intervalRef.current = setInterval(drop, 500);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [started, gameOver, drop]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!started || gameOver || pausedRef.current) return;
      const p = pieceRef.current;
      if (e.key === "ArrowLeft" && !collides(p.shape, p.x - 1, p.y)) {
        pieceRef.current = { ...p, x: p.x - 1 }; draw();
      } else if (e.key === "ArrowRight" && !collides(p.shape, p.x + 1, p.y)) {
        pieceRef.current = { ...p, x: p.x + 1 }; draw();
      } else if (e.key === "ArrowDown") {
        drop();
      } else if (e.key === "ArrowUp") {
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
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, gameOver, drop, lock, draw]);

  const togglePause = () => {
    if (!started || gameOver) return;
    const np = !pausedRef.current;
    pausedRef.current = np;
    setPaused(np);
  };

  const moveLeft = () => { const p = pieceRef.current; if (!collides(p.shape, p.x - 1, p.y)) { pieceRef.current = { ...p, x: p.x - 1 }; draw(); } };
  const moveRight = () => { const p = pieceRef.current; if (!collides(p.shape, p.x + 1, p.y)) { pieceRef.current = { ...p, x: p.x + 1 }; draw(); } };
  const moveDown = () => drop();
  const rotateP = () => { const p = pieceRef.current; const r = rotate(p.shape); if (!collides(r, p.x, p.y)) { pieceRef.current = { ...p, shape: r }; draw(); } };
  const hardDrop = () => { const p = pieceRef.current; let ny = p.y; while (!collides(p.shape, p.x, ny + 1)) ny++; pieceRef.current = { ...p, y: ny }; lock(); };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 items-start">
        <canvas
          ref={canvasRef}
          width={COLS * BLOCK}
          height={ROWS * BLOCK}
          className="border border-border rounded-lg"
          style={{ background: "#0f0f0f" }}
        />
        <div className="flex flex-col gap-3 min-w-[110px]">
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Счёт</div>
            <div className="text-xl font-bold text-foreground">{score}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground">Линии</div>
            <div className="text-xl font-bold text-foreground">{lines}</div>
          </div>
          <div className="text-xs text-muted-foreground mt-2 hidden md:block">
            <div>← → движение</div>
            <div>↑ поворот</div>
            <div>↓ вниз</div>
            <div>Пробел — сброс</div>
          </div>
        </div>
      </div>

      {/* Мобильные кнопки управления */}
      <div className="flex flex-col items-center gap-2 md:hidden">
        <button onClick={rotateP} className="bg-card border border-border rounded-lg px-6 py-2 text-sm font-medium">↑ Повернуть</button>
        <div className="flex gap-2">
          <button onClick={moveLeft} className="bg-card border border-border rounded-lg px-5 py-2 text-sm font-medium">←</button>
          <button onClick={moveDown} className="bg-card border border-border rounded-lg px-5 py-2 text-sm font-medium">↓</button>
          <button onClick={moveRight} className="bg-card border border-border rounded-lg px-5 py-2 text-sm font-medium">→</button>
        </div>
        <button onClick={hardDrop} className="bg-card border border-border rounded-lg px-6 py-2 text-sm font-medium">Сброс</button>
      </div>

      <div className="flex gap-2">
        <button onClick={startGame} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">
          {gameOver || !started ? "Начать игру" : "Заново"}
        </button>
        {started && !gameOver && (
          <button onClick={togglePause} className="bg-card border border-border rounded-lg px-4 py-2 text-sm font-medium">
            {paused ? "▶ Продолжить" : "⏸ Пауза"}
          </button>
        )}
      </div>

      {gameOver && <div className="text-destructive font-bold text-lg">Игра окончена! Счёт: {score}</div>}
      {paused && <div className="text-muted-foreground font-medium">⏸ Пауза</div>}
    </div>
  );
}
