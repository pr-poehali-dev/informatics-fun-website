import { useState } from "react";
import { sounds } from "@/lib/sounds";

type Side = "heads" | "tails" | "edge";
type Choice = "heads" | "tails";

const RESULTS: { value: Side; label: string; emoji: string; chance: number }[] = [
  { value: "heads", label: "Орёл",   emoji: "🦅", chance: 0.4975 },
  { value: "tails", label: "Решка",  emoji: "🪙", chance: 0.4975 },
  { value: "edge",  label: "Ребро!", emoji: "😱", chance: 0.005  },
];

function flip(): Side {
  const r = Math.random();
  if (r < 0.005) return "edge";
  if (r < 0.5025) return "heads";
  return "tails";
}

export default function CoinFlip() {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Side | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<{ choice: Choice; result: Side; win: boolean }[]>([]);
  const [wins, setWins] = useState(0);
  const [total, setTotal] = useState(0);

  const handleFlip = (c: Choice) => {
    if (spinning) return;
    sounds.coinFlip();
    setChoice(c);
    setResult(null);
    setSpinning(true);

    setTimeout(() => {
      const r = flip();
      const win = r === c;
      if (r === "edge") sounds.coinEdge();
      else if (win) sounds.coinWin();
      else sounds.coinLose();
      setResult(r);
      setSpinning(false);
      setHistory(h => [{ choice: c, result: r, win }, ...h].slice(0, 10));
      setTotal(t => t + 1);
      if (win) setWins(w => w + 1);
    }, 900);
  };

  const resultInfo = result ? RESULTS.find(r => r.value === result)! : null;
  const won = result && choice && result === choice;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Монета */}
      <div className="relative flex items-center justify-center" style={{ height: 130 }}>
        <div
          className={`flex items-center justify-center rounded-full border-4 text-5xl select-none transition-all duration-300
            ${spinning ? "animate-spin" : ""}
            ${result === "edge" ? "border-yellow-400 bg-yellow-50" : result === "heads" ? "border-blue-400 bg-blue-50" : result === "tails" ? "border-purple-400 bg-purple-50" : "border-border bg-card"}
          `}
          style={{ width: 110, height: 110, fontSize: 52 }}
        >
          {spinning ? "🪙" : result ? resultInfo!.emoji : "🪙"}
        </div>
      </div>

      {/* Результат */}
      <div className="text-center min-h-[52px]">
        {!spinning && result && (
          <div>
            <div className={`text-2xl font-black ${result === "edge" ? "text-yellow-500" : won ? "text-green-500" : "text-destructive"}`}>
              {result === "edge" ? "⚡ РЕБРО!" : won ? "✅ Победа!" : "❌ Проигрыш"}
            </div>
            <div className="text-muted-foreground text-sm mt-0.5">
              Выпало: {resultInfo!.label} {resultInfo!.emoji}
            </div>
          </div>
        )}
        {spinning && <div className="text-muted-foreground text-sm animate-pulse">Бросаю монетку...</div>}
        {!spinning && !result && <div className="text-muted-foreground text-sm">Выбери сторону чтобы бросить</div>}
      </div>

      {/* Кнопки */}
      <div className="flex gap-3">
        <button
          onClick={() => handleFlip("heads")}
          disabled={spinning}
          className={`flex flex-col items-center gap-1 px-8 py-3 rounded-xl border-2 font-bold text-base transition-all
            ${choice === "heads" && spinning ? "border-blue-400 bg-blue-50 scale-95" : "border-border bg-card hover:border-blue-400 hover:bg-blue-50"}
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="text-2xl">🦅</span>
          <span>Орёл</span>
        </button>
        <button
          onClick={() => handleFlip("tails")}
          disabled={spinning}
          className={`flex flex-col items-center gap-1 px-8 py-3 rounded-xl border-2 font-bold text-base transition-all
            ${choice === "tails" && spinning ? "border-purple-400 bg-purple-50 scale-95" : "border-border bg-card hover:border-purple-400 hover:bg-purple-50"}
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="text-2xl">🪙</span>
          <span>Решка</span>
        </button>
      </div>

      {/* Статистика */}
      {total > 0 && (
        <div className="flex gap-4 text-center">
          <div className="bg-card border border-border rounded-lg px-4 py-2">
            <div className="text-xs text-muted-foreground">Бросков</div>
            <div className="font-bold">{total}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-2">
            <div className="text-xs text-muted-foreground">Побед</div>
            <div className="font-bold text-green-500">{wins}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-2">
            <div className="text-xs text-muted-foreground">Процент</div>
            <div className="font-bold">{Math.round((wins / total) * 100)}%</div>
          </div>
        </div>
      )}

      {/* История */}
      {history.length > 0 && (
        <div className="w-full max-w-xs">
          <div className="text-xs text-muted-foreground mb-2 text-center">Последние броски</div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {history.map((h, i) => (
              <div key={i} className={`text-xs px-2 py-1 rounded-full border font-medium
                ${h.result === "edge" ? "border-yellow-400 bg-yellow-50 text-yellow-700" : h.win ? "border-green-400 bg-green-50 text-green-700" : "border-red-300 bg-red-50 text-red-600"}`}>
                {RESULTS.find(r => r.value === h.result)!.emoji} {h.win ? "✓" : "✗"}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[11px] text-muted-foreground opacity-60">Шанс ребра: 0.5%</div>
    </div>
  );
}