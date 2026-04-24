import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import Tetris from "@/components/games/Tetris";
import DinoGame from "@/components/games/DinoGame";
import CoinFlip from "@/components/games/CoinFlip";

const API = "https://functions.poehali.dev/8587ed17-e0c6-4cf1-a91d-bb16becc28ce";

// Уникальный ID сессии для лайков
function getSessionId() {
  let sid = localStorage.getItem("hahahub_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("hahahub_sid", sid);
  }
  return sid;
}

type Section = "home" | "memes" | "jokes" | "games" | "top" | "team";

interface ContentItem {
  id: number;
  title: string;
  text?: string | null;
  emoji: string;
  likes: number;
  dislikes: number;
  views: number;
  tag: string;
  type: string;
  user_vote?: string | null;
  image_url?: string | null;
  comment_count?: number;
}

interface Comment {
  id: number;
  author: string;
  text: string;
  created_at: string;
}

// --- Mini Games ---
function WordGame() {
  const words = ["СМЕШНО", "МЕМАСИК", "ПРИКОЛЫ", "ХАХАХА", "ЮМОР"];
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<"idle" | "win" | "lose">("idle");
  const scramble = (w: string) => w.split("").sort(() => Math.random() - 0.5).join("");
  const [scrambled, setScrambled] = useState(() => scramble(words[0]));

  const handleGuess = () => {
    if (input.toUpperCase() === words[current]) {
      import("@/lib/sounds").then(m => m.sounds.wordCorrect());
      setScore(s => s + 1);
      setStatus("win");
      setTimeout(() => {
        import("@/lib/sounds").then(m => m.sounds.wordWin());
        const next = (current + 1) % words.length;
        setCurrent(next);
        setScrambled(scramble(words[next]));
        setInput("");
        setStatus("idle");
      }, 800);
    } else {
      import("@/lib/sounds").then(m => m.sounds.wordWrong());
      setStatus("lose");
      setTimeout(() => setStatus("idle"), 600);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-5xl font-display font-bold tracking-widest text-foreground">
        {scrambled.split("").map((l, i) => (
          <span key={i} className="inline-block mx-1 animate-bounce-in" style={{ animationDelay: `${i * 0.05}s` }}>{l}</span>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">Угадай слово из букв выше</p>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && handleGuess()}
          placeholder="Введи слово..."
          maxLength={10}
          className="border border-border rounded-lg px-4 py-2 text-center font-display tracking-widest text-lg outline-none focus:ring-2 focus:ring-foreground/20 bg-white uppercase w-48"
        />
        <button onClick={handleGuess} className="bg-foreground text-background px-5 py-2 rounded-lg font-medium hover:bg-foreground/80 transition-colors">
          Готово
        </button>
      </div>
      {status === "win" && <p className="text-green-500 font-bold animate-bounce-in">✓ Верно!</p>}
      {status === "lose" && <p className="text-red-500 font-bold">✗ Неверно, попробуй ещё</p>}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name="Star" size={14} />
        <span>Очки: <strong className="text-foreground">{score}</strong></span>
      </div>
    </div>
  );
}

function EmojiGuess() {
  const puzzles = [
    { emojis: "🐱💻😩", answer: "КОТ", hint: "Кто это?" },
    { emojis: "☕🌅😴", answer: "УТРО", hint: "Что это?" },
    { emojis: "🍕❤️🔁", answer: "ЛЮБОВЬ", hint: "Что это?" },
    { emojis: "📱🤳🌅", answer: "СЭЛФИ", hint: "Что это?" },
  ];
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState(0);

  const check = () => {
    if (input.toUpperCase().includes(puzzles[idx].answer)) {
      import("@/lib/sounds").then(m => m.sounds.emojiCorrect());
      setSolved(true);
      setScore(s => s + 1);
    } else {
      import("@/lib/sounds").then(m => m.sounds.emojiWrong());
    }
  };

  const next = () => {
    setIdx((idx + 1) % puzzles.length);
    setInput("");
    setSolved(false);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-6xl tracking-widest animate-scale-in">{puzzles[idx].emojis}</div>
      <p className="text-muted-foreground text-sm">{puzzles[idx].hint}</p>
      {!solved ? (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && check()}
            placeholder="Твой ответ..."
            className="border border-border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-foreground/20 bg-white w-48"
          />
          <button onClick={check} className="bg-foreground text-background px-5 py-2 rounded-lg font-medium hover:bg-foreground/80 transition-colors">
            Ответить
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 animate-bounce-in">
          <p className="text-green-500 font-bold text-lg">🎉 Правильно!</p>
          <p className="text-muted-foreground text-sm">Ответ: <strong>{puzzles[idx].answer}</strong></p>
          <button onClick={next} className="bg-foreground text-background px-6 py-2 rounded-lg font-medium hover:bg-foreground/80 transition-colors">
            Следующий →
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name="Trophy" size={14} />
        <span>Очки: <strong className="text-foreground">{score}</strong></span>
      </div>
    </div>
  );
}

function LuckyButton() {
  const reactions = ["😂", "🤣", "💀", "😭", "🔥", "👀", "💯", "🎉", "🤡", "🫠", "👾", "🐸"];
  const messages = ["Тебе повезло!", "Редкая удача!", "Снова попробуй!", "Почти...", "Джекпот!", "Вот это удача!", "Ха! Не тут-то было.", "Звёзды сошлись!"];
  const [result, setResult] = useState<{ emoji: string; msg: string } | null>(null);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    import("@/lib/sounds").then(m => m.sounds.luckyClick());
    setSpinning(true);
    setResult(null);
    setTimeout(() => {
      const emoji = reactions[Math.floor(Math.random() * reactions.length)];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const isWin = ["Тебе повезло!", "Редкая удача!", "Джекпот!", "Вот это удача!", "Звёзды сошлись!"].includes(msg);
      import("@/lib/sounds").then(m => isWin ? m.sounds.luckyWin() : m.sounds.luckyLose());
      setResult({ emoji, msg });
      setSpinning(false);
    }, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className={`text-8xl transition-all duration-200 ${spinning ? "blur-sm scale-90 opacity-50" : "scale-100"}`}>
        {spinning ? "🎰" : (result ? result.emoji : "🎲")}
      </div>
      {result && !spinning && <p className="text-xl font-display font-bold animate-bounce-in">{result.msg}</p>}
      <button
        onClick={spin}
        disabled={spinning}
        className="bg-foreground text-background px-8 py-3 rounded-full font-display font-bold text-lg hover:bg-foreground/80 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {spinning ? "Крутится..." : "🍀 Испытать удачу"}
      </button>
      <p className="text-muted-foreground text-xs">Нажми и узнай, что тебя ждёт сегодня</p>
    </div>
  );
}

// --- Add Meme Form ---
function compressImage(file: File, maxW = 800): Promise<{ b64: string; ext: string }> {
  return new Promise((resolve) => {
    const isGif = file.type === "image/gif";
    if (isGif) {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = (reader.result as string).split(",")[1];
        resolve({ b64, ext: "gif" });
      };
      reader.readAsDataURL(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const b64 = canvas.toDataURL("image/jpeg", 0.72).split(",")[1];
      resolve({ b64, ext: "jpg" });
    };
    img.src = url;
  });
}

function AddMemeForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState("😂");
  const [tag, setTag] = useState("");
  const [type, setType] = useState<"meme" | "joke">("meme");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    let image_url: string | null = null;

    if (imageFile) {
      setUploadProgress("Сжимаем фото...");
      const { b64, ext } = await compressImage(imageFile);
      setUploadProgress("Загружаем...");
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": getSessionId() },
        body: JSON.stringify({ action: "upload_image", data: b64, ext }),
      });
      const data = await res.json();
      image_url = data.url || null;
      setUploadProgress("");
    }

    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": getSessionId() },
      body: JSON.stringify({ title, text, emoji, tag: tag || "общее", type, image_url }),
    });
    setLoading(false);
    setDone(true);
    setTitle(""); setText(""); setEmoji("😂"); setTag(""); setType("meme");
    removeImage();
    setTimeout(() => { setDone(false); setOpen(false); onAdded(); }, 1200);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full font-medium hover:bg-foreground/80 transition-all hover:scale-105"
      >
        <Icon name="Plus" size={16} />
        Добавить свой
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-6 animate-scale-in space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg">Новый мем / прикол</h3>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <Icon name="X" size={18} />
        </button>
      </div>

      <div className="flex gap-2">
        {(["meme", "joke"] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${type === t ? "bg-foreground text-background border-foreground" : "border-border text-foreground hover:border-foreground/40"}`}
          >
            {t === "meme" ? "😂 Мем" : "🎭 Прикол"}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          placeholder="😂"
          maxLength={4}
          className="border border-border rounded-xl px-3 py-2 text-2xl text-center w-16 outline-none focus:ring-2 focus:ring-foreground/20 bg-white"
        />
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Заголовок *"
          className="flex-1 border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-foreground/20 bg-white"
        />
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Текст мема или анекдота..."
        rows={3}
        className="w-full border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-foreground/20 bg-white resize-none text-sm"
      />

      <input
        value={tag}
        onChange={e => setTag(e.target.value)}
        placeholder="Тег (например: работа, айти...)"
        className="w-full border border-border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-foreground/20 bg-white text-sm"
      />

      {/* Загрузка фото/гиф */}
      {!imagePreview ? (
        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-xl px-4 py-3 text-sm text-muted-foreground hover:border-foreground/40 transition-colors">
          <Icon name="Image" size={16} />
          Прикрепить фото или GIF
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={imagePreview} alt="preview" className="w-full max-h-48 object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
          >✕</button>
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading || !title.trim()}
        className="w-full bg-foreground text-background py-2.5 rounded-xl font-medium hover:bg-foreground/80 transition-colors disabled:opacity-50"
      >
        {done ? "✓ Добавлено!" : loading ? (uploadProgress || "Сохраняем...") : "Опубликовать"}
      </button>
    </div>
  );
}

// --- Like Bar ---
function LikeBar({ item, onVote }: { item: ContentItem; onVote: (id: number, likes: number, dislikes: number, vote: string | null) => void }) {
  const [loading, setLoading] = useState(false);

  const vote = async (v: "like" | "dislike") => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": getSessionId() },
        body: JSON.stringify({ action: "vote", meme_id: item.id, vote: v }),
      });
      const data = await res.json();
      onVote(item.id, data.likes, data.dislikes, data.user_vote);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 mt-3">
      <button
        onClick={() => vote("like")}
        disabled={loading}
        className={`like-btn flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${item.user_vote === "like" ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground"}`}
      >
        <Icon name="ThumbsUp" size={13} />
        <span className="font-medium">{item.likes}</span>
      </button>
      <button
        onClick={() => vote("dislike")}
        disabled={loading}
        className={`like-btn flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${item.user_vote === "dislike" ? "bg-destructive text-white border-destructive" : "border-border hover:border-destructive/30 text-muted-foreground hover:text-destructive"}`}
      >
        <Icon name="ThumbsDown" size={13} />
        <span className="font-medium">{item.dislikes}</span>
      </button>
    </div>
  );
}

// --- Comments ---
function CommentSection({ memeId }: { memeId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}?comments_for=${memeId}`, {
        headers: { "X-Session-Id": getSessionId() },
      });
      const data = await res.json();
      setComments(data.comments || []);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": getSessionId() },
        body: JSON.stringify({ action: "comment", meme_id: memeId, text: t, author: author.trim() || "Аноним" }),
      });
      const data = await res.json();
      if (data.id) {
        setComments(c => [...c, data]);
        setText("");
      }
    } finally {
      setSending(false);
    }
  };

  if (!loaded) {
    return (
      <button onClick={load} disabled={loading}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
        <Icon name="MessageCircle" size={13} />
        {loading ? "Загрузка..." : `Комментарии${(comments.length || "") && ` (${comments.length})`}`}
      </button>
    );
  }

  return (
    <div className="mt-3 border-t border-border pt-3 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Icon name="MessageCircle" size={13} />
        Комментарии {comments.length > 0 && <span className="text-muted-foreground">({comments.length})</span>}
      </div>
      {comments.length === 0 && <p className="text-xs text-muted-foreground">Пока нет комментариев</p>}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {comments.map(c => (
          <div key={c.id} className="bg-secondary/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-semibold text-foreground">{c.author}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString("ru")}</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <input
          value={author}
          onChange={e => setAuthor(e.target.value)}
          placeholder="Имя (необязательно)"
          maxLength={30}
          className="w-full border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-foreground/20 bg-white"
        />
        <div className="flex gap-1.5">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Написать комментарий..."
            maxLength={500}
            className="flex-1 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-foreground/20 bg-white"
          />
          <button onClick={send} disabled={sending || !text.trim()}
            className="bg-foreground text-background px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-foreground/80 transition-colors">
            {sending ? "..." : "→"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Content Card ---
function ContentCard({ item, idx, onVote }: { item: ContentItem; idx: number; onVote: (id: number, likes: number, dislikes: number, vote: string | null) => void }) {
  return (
    <div
      className="card-hover bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 animate-fade-in opacity-0"
      style={{ animationDelay: `${idx * 0.06}s`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{item.emoji}</span>
        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium">#{item.tag}</span>
      </div>
      <h3 className="font-display font-semibold text-base text-foreground leading-snug">{item.title}</h3>
      {item.text && <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{item.text}</p>}
      {item.image_url && (
        <div className="rounded-xl overflow-hidden border border-border">
          <img src={item.image_url} alt={item.title} className="w-full max-h-64 object-cover" loading="lazy" />
        </div>
      )}
      <LikeBar item={item} onVote={onVote} />
      <CommentSection memeId={item.id} />
    </div>
  );
}

// --- Top Card ---
function TopCard({ item, rank }: { item: ContentItem; rank: number }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div
      className="card-hover bg-card border border-border rounded-2xl p-5 flex items-start gap-4 animate-fade-in opacity-0"
      style={{ animationDelay: `${rank * 0.08}s`, animationFillMode: "forwards" }}
    >
      <span className="text-2xl flex-shrink-0">{medals[rank] ?? `${rank + 1}`}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{item.emoji}</span>
          <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">#{item.tag}</span>
        </div>
        <h3 className="font-display font-semibold text-sm leading-snug truncate">{item.title}</h3>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Icon name="ThumbsUp" size={11} />{item.likes}</span>
        </div>
      </div>
    </div>
  );
}

// --- Main ---
export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [activeGame, setActiveGame] = useState<"word" | "emoji" | "lucky" | "tetris" | "dino" | "coin">("word");
  const [allMemes, setAllMemes] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: { "X-Session-Id": getSessionId() } });
      const data = await res.json();
      setAllMemes(data.memes || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMemes(); }, [fetchMemes]);

  const handleVote = (id: number, likes: number, dislikes: number, vote: string | null) => {
    setAllMemes(prev => prev.map(m => m.id === id ? { ...m, likes, dislikes, user_vote: vote } : m));
  };

  const memes = allMemes.filter(m => m.type === "meme");
  const jokes = allMemes.filter(m => m.type === "joke");
  const top = [...allMemes].sort((a, b) => b.likes - a.likes).slice(0, 6);

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: "home", label: "Главная", icon: "Home" },
    { id: "memes", label: "Мемы", icon: "Image" },
    { id: "jokes", label: "Приколы", icon: "Laugh" },
    { id: "games", label: "Игры", icon: "Gamepad2" },
    { id: "top", label: "Рейтинг", icon: "TrendingUp" },
    { id: "team", label: "Создатели", icon: "Users" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <button onClick={() => setSection("home")} className="flex items-center gap-2">
              <span className="text-2xl">😂</span>
              <span className="font-display font-bold text-xl tracking-tight text-foreground">
                ХаХа<span style={{ color: "hsl(var(--accent))" }}>Хаб</span>
              </span>
            </button>
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map(n => (
                <button key={n.id} onClick={() => setSection(n.id)}
                  className={`nav-link text-sm font-medium transition-colors pb-0.5 ${section === n.id ? "text-foreground active" : "text-muted-foreground hover:text-foreground"}`}>
                  {n.label}
                </button>
              ))}
            </nav>
            <div className="flex md:hidden items-center gap-1">
              {navItems.map(n => (
                <button key={n.id} onClick={() => setSection(n.id)} title={n.label}
                  className={`p-2 rounded-lg transition-colors ${section === n.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon name={n.icon as "Home"} size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* HOME */}
        {section === "home" && (
          <div className="space-y-12">
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center gap-2 bg-secondary text-muted-foreground text-xs px-3 py-1.5 rounded-full mb-2 animate-fade-in">
                <Icon name="Zap" size={11} />Свежий контент каждый день
              </div>
              <h1 className="font-display font-black text-5xl md:text-7xl text-foreground leading-none animate-fade-in" style={{ animationDelay: "0.05s" }}>
                МЕМЫ.<br /><span style={{ color: "hsl(var(--accent))" }}>ПРИКОЛЫ.</span><br />ВЕСЕЛЬЕ.
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
                Лучшее место для хорошего настроения. Оценивай контент, играй в игры, смейся.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2 animate-fade-in" style={{ animationDelay: "0.15s" }}>
                <button onClick={() => setSection("memes")} className="bg-foreground text-background px-6 py-2.5 rounded-full font-medium hover:bg-foreground/80 transition-all hover:scale-105">
                  Смотреть мемы
                </button>
                <button onClick={() => setSection("games")} className="border border-border px-6 py-2.5 rounded-full font-medium hover:border-foreground transition-all hover:scale-105 text-foreground">
                  Поиграть
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: "Image", val: memes.length.toString(), label: "Мемов" },
                { icon: "Laugh", val: jokes.length.toString(), label: "Приколов" },
                { icon: "ThumbsUp", val: allMemes.reduce((s, m) => s + m.likes, 0).toString(), label: "Лайков" },
              ].map((s, i) => (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-5 text-center animate-fade-in opacity-0"
                  style={{ animationDelay: `${0.2 + i * 0.06}s`, animationFillMode: "forwards" }}>
                  <Icon name={s.icon as "Image"} size={20} className="mx-auto mb-2 text-muted-foreground" />
                  <div className="font-display font-black text-3xl text-foreground">{s.val}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-5">
                <Icon name="Flame" size={16} style={{ color: "hsl(var(--accent))" }} />
                <h2 className="font-display font-bold text-xl">Горячие сегодня</h2>
              </div>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Загружаем...</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {top.slice(0, 3).map((item, i) => <ContentCard key={item.id} item={item} idx={i} onVote={handleVote} />)}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={() => setSection("games")} className="card-hover bg-foreground text-background rounded-2xl p-6 text-left space-y-2">
                <div className="text-3xl">🎮</div>
                <div className="font-display font-bold text-xl">Мини-игры</div>
                <p className="text-background/60 text-sm">Угадай слово, разгадай эмодзи-ребусы и испытай удачу</p>
              </button>
              <button onClick={() => setSection("top")} className="card-hover bg-card border border-border rounded-2xl p-6 text-left space-y-2">
                <div className="text-3xl">🏆</div>
                <div className="font-display font-bold text-xl text-foreground">Рейтинг</div>
                <p className="text-muted-foreground text-sm">Самый популярный контент по лайкам</p>
              </button>
            </div>
          </div>
        )}

        {/* MEMES */}
        {section === "memes" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl">😂</span>
                <div>
                  <h1 className="font-display font-black text-3xl">Мемы</h1>
                  <p className="text-muted-foreground text-sm">Свежие и актуальные</p>
                </div>
              </div>
              <AddMemeForm onAdded={fetchMemes} />
            </div>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Загружаем...</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {memes.map((item, i) => <ContentCard key={item.id} item={item} idx={i} onVote={handleVote} />)}
              </div>
            )}
          </div>
        )}

        {/* JOKES */}
        {section === "jokes" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎭</span>
                <div>
                  <h1 className="font-display font-black text-3xl">Приколы</h1>
                  <p className="text-muted-foreground text-sm">Лучшие анекдоты и истории</p>
                </div>
              </div>
              <AddMemeForm onAdded={fetchMemes} />
            </div>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Загружаем...</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {jokes.map((item, i) => <ContentCard key={item.id} item={item} idx={i} onVote={handleVote} />)}
              </div>
            )}
          </div>
        )}

        {/* GAMES */}
        {section === "games" && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">🎮</span>
              <div>
                <h1 className="font-display font-black text-3xl">Игры</h1>
                <p className="text-muted-foreground text-sm">Интерактивные развлечения</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {([
                { id: "word", label: "🔤 Слова", desc: "Собери слово из букв" },
                { id: "emoji", label: "😶 Эмодзи", desc: "Угадай по эмодзи" },
                { id: "lucky", label: "🍀 Удача", desc: "Испытай судьбу" },
                { id: "tetris", label: "🟦 Тетрис", desc: "Классический тетрис" },
                { id: "dino", label: "🦕 Динозавр", desc: "Хром динозаврик" },
                { id: "coin", label: "🪙 Монетка", desc: "Орёл, решка или ребро" },
              ] as { id: "word" | "emoji" | "lucky" | "tetris" | "dino" | "coin"; label: string; desc: string }[]).map(g => (
                <button key={g.id} onClick={() => setActiveGame(g.id)}
                  className={`flex-1 text-center py-3 px-2 rounded-xl border text-sm font-medium transition-colors ${activeGame === g.id ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/30 text-foreground"}`}>
                  <div>{g.label}</div>
                  <div className={`text-xs mt-0.5 ${activeGame === g.id ? "text-background/60" : "text-muted-foreground"}`}>{g.desc}</div>
                </button>
              ))}
            </div>
            <div className="bg-card border border-border rounded-2xl min-h-64 animate-scale-in">
              {activeGame === "word" && <WordGame />}
              {activeGame === "emoji" && <EmojiGuess />}
              {activeGame === "lucky" && <LuckyButton />}
              {activeGame === "tetris" && (
                <div className="p-4 flex justify-center">
                  <Tetris />
                </div>
              )}
              {activeGame === "dino" && (
                <div className="p-4 flex justify-center overflow-x-auto">
                  <DinoGame />
                </div>
              )}
              {activeGame === "coin" && (
                <div className="p-4">
                  <CoinFlip />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOP */}
        {section === "top" && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">🏆</span>
              <div>
                <h1 className="font-display font-black text-3xl">Рейтинг</h1>
                <p className="text-muted-foreground text-sm">Самый популярный контент</p>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Загружаем...</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {top.map((item, i) => <TopCard key={item.id} item={item} rank={i} />)}
              </div>
            )}
            <div className="text-center mt-10 text-muted-foreground text-xs py-4">
              Рейтинг формируется на основе реальных лайков
            </div>
          </div>
        )}

        {/* TEAM */}
        {section === "team" && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">👥</span>
              <div>
                <h1 className="font-display font-black text-3xl">Создатели</h1>
                <p className="text-muted-foreground text-sm">Люди, которые сделали это возможным</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-xl">
              {[
                { name: "Беляев Владислав", role: "Со-основатель", photo: "https://cdn.poehali.dev/projects/6ad2095d-97f6-4dd2-8055-f95e64d60317/bucket/120a854e-720f-4ebb-a737-65d6f36fa1ed.jpg" },
                { name: "Рудник Сергей", role: "Со-основатель", photo: "https://cdn.poehali.dev/projects/6ad2095d-97f6-4dd2-8055-f95e64d60317/bucket/d60dd28e-52c5-4407-8707-a75a6390ae4f.jpg" },
              ].map((person, i) => (
                <div key={person.name}
                  className="card-hover bg-card border border-border rounded-2xl p-6 flex items-center gap-5 animate-fade-in opacity-0"
                  style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "forwards" }}>
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                    {person.photo
                      ? <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
                      : <span>🚀</span>
                    }
                  </div>
                  <div>
                    <div className="font-display font-bold text-lg text-foreground">{person.name}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{person.role}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 bg-secondary rounded-2xl p-6 max-w-xl text-center animate-fade-in opacity-0" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
              <div className="text-3xl mb-3">😂</div>
              <p className="text-muted-foreground text-sm">Сделано с юмором и хорошим настроением</p>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>😂</span>
            <span className="font-display font-bold text-foreground">ХаХаХаб</span>
            <span>— место для хорошего настроения</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setSection("memes")} className="hover:text-foreground transition-colors">Мемы</button>
            <button onClick={() => setSection("jokes")} className="hover:text-foreground transition-colors">Приколы</button>
            <button onClick={() => setSection("games")} className="hover:text-foreground transition-colors">Игры</button>
          </div>
        </div>
      </footer>
    </div>
  );
}