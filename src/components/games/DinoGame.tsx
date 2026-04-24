import { useEffect, useRef, useState, useCallback } from "react";

const W = 600;
const H = 150;
const GROUND = 120;
const DINO_W = 40;
const DINO_H = 50;
const DINO_X = 60;

type Cactus = { x: number; w: number; h: number };
type Cloud = { x: number; y: number };

export default function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const dinoY = useRef(GROUND - DINO_H);
  const velY = useRef(0);
  const onGround = useRef(true);
  const cactuses = useRef<Cactus[]>([]);
  const clouds = useRef<Cloud[]>([{ x: 200, y: 30 }, { x: 450, y: 20 }]);
  const speed = useRef(4);
  const scoreVal = useRef(0);
  const frameCount = useRef(0);
  const dinoLeg = useRef(0);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const runningRef = useRef(false);

  const jump = useCallback(() => {
    if (onGround.current) {
      velY.current = -13;
      onGround.current = false;
    }
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, W, H);

    // Sky
    ctx.fillStyle = "#f7f7f7";
    ctx.fillRect(0, 0, W, H);

    // Clouds
    ctx.fillStyle = "#e0e0e0";
    clouds.current.forEach(c => {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 30, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(c.x + 20, c.y - 6, 22, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ground
    ctx.fillStyle = "#555";
    ctx.fillRect(0, GROUND, W, 2);
    ctx.fillStyle = "#ccc";
    ctx.fillRect(0, GROUND + 2, W, 1);

    // Dino
    const dy = dinoY.current;
    ctx.fillStyle = "#555";
    // body
    ctx.fillRect(DINO_X, dy, DINO_W, DINO_H - 12);
    // head
    ctx.fillRect(DINO_X + 10, dy - 16, 26, 20);
    // eye
    ctx.fillStyle = "#f7f7f7";
    ctx.fillRect(DINO_X + 28, dy - 12, 6, 6);
    ctx.fillStyle = "#222";
    ctx.fillRect(DINO_X + 30, dy - 11, 3, 3);
    // mouth
    ctx.fillStyle = "#555";
    ctx.fillRect(DINO_X + 32, dy - 4, 6, 2);
    // legs
    ctx.fillStyle = "#555";
    const legOff = onGround.current ? (dinoLeg.current < 10 ? 0 : 8) : 4;
    ctx.fillRect(DINO_X + 6, dy + DINO_H - 12, 8, 12 + legOff);
    ctx.fillRect(DINO_X + 22, dy + DINO_H - 12, 8, 12 - legOff);

    // Cactuses
    ctx.fillStyle = "#2a7a2a";
    cactuses.current.forEach(c => {
      ctx.fillRect(c.x, GROUND - c.h, c.w, c.h);
      ctx.fillRect(c.x - 8, GROUND - c.h + 15, 8, 12);
      ctx.fillRect(c.x + c.w, GROUND - c.h + 20, 8, 10);
    });

    // Score
    ctx.fillStyle = "#555";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.floor(scoreVal.current)}`, W - 10, 24);
    ctx.textAlign = "left";
    ctx.fillStyle = "#999";
    ctx.font = "13px monospace";
    ctx.fillText(`Рекорд: ${Math.floor(best)}`, 10, 24);
  }, [best]);

  const gameLoop = useCallback(() => {
    if (!runningRef.current) return;

    frameCount.current++;
    dinoLeg.current = (dinoLeg.current + 1) % 20;

    // Physics
    if (!onGround.current) {
      velY.current += 0.7;
      dinoY.current += velY.current;
      if (dinoY.current >= GROUND - DINO_H) {
        dinoY.current = GROUND - DINO_H;
        velY.current = 0;
        onGround.current = true;
      }
    }

    // Speed increase
    speed.current = 4 + scoreVal.current / 300;

    // Clouds
    clouds.current.forEach(c => { c.x -= 0.8; });
    clouds.current = clouds.current.filter(c => c.x > -80);
    if (frameCount.current % 120 === 0) clouds.current.push({ x: W + 40, y: 20 + Math.random() * 30 });

    // Cactuses
    cactuses.current.forEach(c => { c.x -= speed.current; });
    cactuses.current = cactuses.current.filter(c => c.x > -50);
    const spawnInterval = Math.max(60, 110 - scoreVal.current / 20);
    if (frameCount.current % Math.floor(spawnInterval) === 0) {
      const h = 30 + Math.floor(Math.random() * 30);
      cactuses.current.push({ x: W + 20, w: 14, h });
    }

    // Collision
    const dx = DINO_X, dy = dinoY.current;
    for (const c of cactuses.current) {
      if (dx + DINO_W - 6 > c.x + 4 && dx + 6 < c.x + c.w - 4 && dy + DINO_H - 4 > GROUND - c.h) {
        runningRef.current = false;
        setBest(b => Math.max(b, Math.floor(scoreVal.current)));
        setGameOver(true);
        drawFrame();
        return;
      }
    }

    scoreVal.current += 0.15;
    if (frameCount.current % 10 === 0) setScore(Math.floor(scoreVal.current));

    drawFrame();
    animRef.current = requestAnimationFrame(gameLoop);
  }, [drawFrame]);

  const startGame = useCallback(() => {
    dinoY.current = GROUND - DINO_H;
    velY.current = 0;
    onGround.current = true;
    cactuses.current = [];
    clouds.current = [{ x: 200, y: 30 }, { x: 450, y: 20 }];
    speed.current = 4;
    scoreVal.current = 0;
    frameCount.current = 0;
    setScore(0);
    setGameOver(false);
    setStarted(true);
    runningRef.current = true;
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    drawFrame();
    return () => cancelAnimationFrame(animRef.current);
  }, [drawFrame]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!started || gameOver) startGame();
        else jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, gameOver, startGame, jump]);

  const handleTap = () => {
    if (!started || gameOver) startGame();
    else jump();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative cursor-pointer select-none"
        onClick={handleTap}
        style={{ touchAction: "none" }}
        onTouchStart={(e) => { e.preventDefault(); handleTap(); }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="border border-border rounded-lg"
          style={{ maxWidth: "100%", background: "#f7f7f7", display: "block" }}
        />
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 rounded-lg">
            <div className="text-2xl mb-1">🦕</div>
            <div className="font-bold text-gray-700">Нажми чтобы начать</div>
            <div className="text-sm text-gray-500">Пробел / тап — прыжок</div>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 rounded-lg">
            <div className="font-bold text-gray-700 text-lg">Игра окончена!</div>
            <div className="text-gray-600 text-sm mb-1">Счёт: {score}</div>
            <div className="text-gray-500 text-sm">Нажми чтобы играть снова</div>
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground">Пробел или тап — прыжок</div>
    </div>
  );
}
