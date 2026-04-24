import { useState } from "react";
import Icon from "@/components/ui/icon";

type Section = "home" | "memes" | "jokes" | "games" | "top";

interface ContentItem {
  id: number;
  title: string;
  text?: string;
  emoji: string;
  likes: number;
  dislikes: number;
  views: number;
  tag: string;
}

const MEMES: ContentItem[] = [
  { id: 1, title: "Когда встреча могла быть письмом", emoji: "😩", text: "— Минутку внимания!\n— (час спустя)...", likes: 1204, dislikes: 32, views: 8420, tag: "работа" },
  { id: 2, title: "Программист в пятницу вечером", emoji: "💻", text: "git push origin main --force", likes: 987, dislikes: 15, views: 6100, tag: "айти" },
  { id: 3, title: "Понедельник утром", emoji: "☕", text: "Кофе — это не привычка, это личность", likes: 2341, dislikes: 44, views: 14200, tag: "жизнь" },
  { id: 4, title: "Когда включил камеру случайно", emoji: "😱", text: "...а там ты в пижаме ешь суп", likes: 1876, dislikes: 28, views: 10500, tag: "зум" },
  { id: 5, title: "Тренажёрный зал в январе", emoji: "🏋️", text: "vs тренажёрный зал в феврале", likes: 3012, dislikes: 67, views: 19800, tag: "спорт" },
  { id: 6, title: "Когда прочитал задачу 5 раз", emoji: "🤔", text: "...и всё равно не понял", likes: 756, dislikes: 8, views: 4300, tag: "учёба" },
];

const JOKES: ContentItem[] = [
  { id: 7, title: "Анекдот дня", emoji: "🎭", text: "— Доктор, у меня проблемы с памятью!\n— Когда это началось?\n— Что началось?", likes: 4521, dislikes: 89, views: 28000, tag: "классика" },
  { id: 8, title: "Про диету", emoji: "🍕", text: "Начну диету с понедельника. Сегодня среда, но я имею в виду следующий понедельник.", likes: 3198, dislikes: 54, views: 21000, tag: "еда" },
  { id: 9, title: "Утро программиста", emoji: "🐛", text: "99 маленьких багов в коде. Убери один — 127 маленьких багов в коде.", likes: 5874, dislikes: 102, views: 35000, tag: "айти" },
  { id: 10, title: "Про время", emoji: "⏰", text: "— Как дела?\n— Как у часов: туда-сюда, туда-сюда...", likes: 2234, dislikes: 41, views: 15400, tag: "классика" },
  { id: 11, title: "Школьный", emoji: "📚", text: "Учитель: — Иванов, ты почему опоздал?\n— Автобус уехал.\n— А на следующем?\n— Там не было места.", likes: 1987, dislikes: 33, views: 12800, tag: "школа" },
  { id: 12, title: "Про погоду", emoji: "🌧️", text: "Весна: тепло, солнечно, птицы поют.\nИ это только первые 2 дня апреля.", likes: 2654, dislikes: 48, views: 17200, tag: "погода" },
];

const TOP_CONTENT: ContentItem[] = [...MEMES, ...JOKES]
  .sort((a, b) => b.likes - a.likes)
  .slice(0, 6);

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
      setScore(s => s + 1);
      setStatus("win");
      setTimeout(() => {
        const next = (current + 1) % words.length;
        setCurrent(next);
        setScrambled(scramble(words[next]));
        setInput("");
        setStatus("idle");
      }, 800);
    } else {
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
        <button
          onClick={handleGuess}
          className="bg-foreground text-background px-5 py-2 rounded-lg font-medium hover:bg-foreground/80 transition-colors"
        >
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
      setSolved(true);
      setScore(s => s + 1);
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
          <button
            onClick={check}
            className="bg-foreground text-background px-5 py-2 rounded-lg font-medium hover:bg-foreground/80 transition-colors"
          >
            Ответить
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 animate-bounce-in">
          <p className="text-green-500 font-bold text-lg">🎉 Правильно!</p>
          <p className="text-muted-foreground text-sm">Ответ: <strong>{puzzles[idx].answer}</strong></p>
          <button
            onClick={next}
            className="bg-foreground text-background px-6 py-2 rounded-lg font-medium hover:bg-foreground/80 transition-colors"
          >
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
  const messages = [
    "Тебе повезло!",
    "Редкая удача!",
    "Снова попробуй!",
    "Почти...",
    "Джекпот!",
    "Вот это удача!",
    "Ха! Не тут-то было.",
    "Звёзды сошлись!",
  ];
  const [result, setResult] = useState<{ emoji: string; msg: string } | null>(null);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    setSpinning(true);
    setResult(null);
    setTimeout(() => {
      setResult({
        emoji: reactions[Math.floor(Math.random() * reactions.length)],
        msg: messages[Math.floor(Math.random() * messages.length)],
      });
      setSpinning(false);
    }, 800);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className={`text-8xl transition-all duration-200 ${spinning ? "blur-sm scale-90 opacity-50" : "scale-100"}`}>
        {spinning ? "🎰" : (result ? result.emoji : "🎲")}
      </div>
      {result && !spinning && (
        <p className="text-xl font-display font-bold animate-bounce-in">{result.msg}</p>
      )}
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

// --- Like/Dislike Component ---
function LikeBar({ item }: { item: ContentItem }) {
  const [likes, setLikes] = useState(item.likes);
  const [dislikes, setDislikes] = useState(item.dislikes);
  const [voted, setVoted] = useState<"like" | "dislike" | null>(null);

  const handleLike = () => {
    if (voted === "like") {
      setLikes(l => l - 1);
      setVoted(null);
    } else {
      setLikes(l => l + 1);
      if (voted === "dislike") setDislikes(d => d - 1);
      setVoted("like");
    }
  };

  const handleDislike = () => {
    if (voted === "dislike") {
      setDislikes(d => d - 1);
      setVoted(null);
    } else {
      setDislikes(d => d + 1);
      if (voted === "like") setLikes(l => l - 1);
      setVoted("dislike");
    }
  };

  return (
    <div className="flex items-center gap-3 mt-3">
      <button
        onClick={handleLike}
        className={`like-btn flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${voted === "like" ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground"}`}
      >
        <Icon name="ThumbsUp" size={13} />
        <span className="font-medium">{likes.toLocaleString()}</span>
      </button>
      <button
        onClick={handleDislike}
        className={`like-btn flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${voted === "dislike" ? "bg-destructive text-white border-destructive" : "border-border hover:border-destructive/30 text-muted-foreground hover:text-destructive"}`}
      >
        <Icon name="ThumbsDown" size={13} />
        <span className="font-medium">{dislikes.toLocaleString()}</span>
      </button>
      <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
        <Icon name="Eye" size={11} />
        {item.views.toLocaleString()}
      </span>
    </div>
  );
}

// --- Content Card ---
function ContentCard({ item, idx }: { item: ContentItem; idx: number }) {
  return (
    <div
      className="card-hover bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 animate-fade-in opacity-0"
      style={{ animationDelay: `${idx * 0.06}s`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{item.emoji}</span>
        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium">
          #{item.tag}
        </span>
      </div>
      <h3 className="font-display font-semibold text-base text-foreground leading-snug">{item.title}</h3>
      {item.text && (
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{item.text}</p>
      )}
      <LikeBar item={item} />
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
          <span className="flex items-center gap-1"><Icon name="ThumbsUp" size={11} />{item.likes.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{item.views.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// --- Main ---
export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [activeGame, setActiveGame] = useState<"word" | "emoji" | "lucky">("word");

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: "home", label: "Главная", icon: "Home" },
    { id: "memes", label: "Мемы", icon: "Image" },
    { id: "jokes", label: "Приколы", icon: "Laugh" },
    { id: "games", label: "Игры", icon: "Gamepad2" },
    { id: "top", label: "Рейтинг", icon: "TrendingUp" },
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

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map(n => (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className={`nav-link text-sm font-medium transition-colors pb-0.5 ${section === n.id ? "text-foreground active" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {n.label}
                </button>
              ))}
            </nav>

            {/* Mobile nav */}
            <div className="flex md:hidden items-center gap-1">
              {navItems.map(n => (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className={`p-2 rounded-lg transition-colors ${section === n.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                  title={n.label}
                >
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
            {/* Hero */}
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center gap-2 bg-secondary text-muted-foreground text-xs px-3 py-1.5 rounded-full mb-2 animate-fade-in">
                <Icon name="Zap" size={11} />
                Свежий контент каждый день
              </div>
              <h1 className="font-display font-black text-5xl md:text-7xl text-foreground leading-none animate-fade-in" style={{ animationDelay: "0.05s" }}>
                МЕМЫ.<br />
                <span style={{ color: "hsl(var(--accent))" }}>ПРИКОЛЫ.</span><br />
                ВЕСЕЛЬЕ.
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
                Лучшее место для хорошего настроения. Оценивай контент, играй в игры, смейся.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2 animate-fade-in" style={{ animationDelay: "0.15s" }}>
                <button
                  onClick={() => setSection("memes")}
                  className="bg-foreground text-background px-6 py-2.5 rounded-full font-medium hover:bg-foreground/80 transition-all hover:scale-105"
                >
                  Смотреть мемы
                </button>
                <button
                  onClick={() => setSection("games")}
                  className="border border-border px-6 py-2.5 rounded-full font-medium hover:border-foreground transition-all hover:scale-105 text-foreground"
                >
                  Поиграть
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: "Image", val: "124", label: "Мема" },
                { icon: "Laugh", val: "89", label: "Приколов" },
                { icon: "ThumbsUp", val: "48K", label: "Лайков" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="bg-card border border-border rounded-2xl p-5 text-center animate-fade-in opacity-0"
                  style={{ animationDelay: `${0.2 + i * 0.06}s`, animationFillMode: "forwards" }}
                >
                  <Icon name={s.icon as "Image"} size={20} className="mx-auto mb-2 text-muted-foreground" />
                  <div className="font-display font-black text-3xl text-foreground">{s.val}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Featured */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Icon name="Flame" size={16} style={{ color: "hsl(var(--accent))" }} />
                <h2 className="font-display font-bold text-xl">Горячие сегодня</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TOP_CONTENT.slice(0, 3).map((item, i) => (
                  <ContentCard key={item.id} item={item} idx={i} />
                ))}
              </div>
            </div>

            {/* CTA Sections */}
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => setSection("games")}
                className="card-hover bg-foreground text-background rounded-2xl p-6 text-left space-y-2"
              >
                <div className="text-3xl">🎮</div>
                <div className="font-display font-bold text-xl">Мини-игры</div>
                <p className="text-background/60 text-sm">Угадай слово, разгадай эмодзи-ребусы и испытай удачу</p>
              </button>
              <button
                onClick={() => setSection("top")}
                className="card-hover bg-card border border-border rounded-2xl p-6 text-left space-y-2"
              >
                <div className="text-3xl">🏆</div>
                <div className="font-display font-bold text-xl text-foreground">Рейтинг</div>
                <p className="text-muted-foreground text-sm">Самый популярный контент по лайкам и просмотрам</p>
              </button>
            </div>
          </div>
        )}

        {/* MEMES */}
        {section === "memes" && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">😂</span>
              <div>
                <h1 className="font-display font-black text-3xl">Мемы</h1>
                <p className="text-muted-foreground text-sm">Свежие и актуальные</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MEMES.map((item, i) => <ContentCard key={item.id} item={item} idx={i} />)}
            </div>
          </div>
        )}

        {/* JOKES */}
        {section === "jokes" && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">🎭</span>
              <div>
                <h1 className="font-display font-black text-3xl">Приколы</h1>
                <p className="text-muted-foreground text-sm">Лучшие анекдоты и истории</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {JOKES.map((item, i) => <ContentCard key={item.id} item={item} idx={i} />)}
            </div>
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

            <div className="flex gap-2 mb-6">
              {([
                { id: "word", label: "🔤 Слова", desc: "Собери слово из букв" },
                { id: "emoji", label: "😶 Эмодзи", desc: "Угадай по эмодзи" },
                { id: "lucky", label: "🍀 Удача", desc: "Испытай судьбу" },
              ] as { id: "word" | "emoji" | "lucky"; label: string; desc: string }[]).map(g => (
                <button
                  key={g.id}
                  onClick={() => setActiveGame(g.id)}
                  className={`flex-1 text-center py-3 px-2 rounded-xl border text-sm font-medium transition-colors ${activeGame === g.id ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/30 text-foreground"}`}
                >
                  <div>{g.label}</div>
                  <div className={`text-xs mt-0.5 ${activeGame === g.id ? "text-background/60" : "text-muted-foreground"}`}>{g.desc}</div>
                </button>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl min-h-64 animate-scale-in">
              {activeGame === "word" && <WordGame />}
              {activeGame === "emoji" && <EmojiGuess />}
              {activeGame === "lucky" && <LuckyButton />}
            </div>
          </div>
        )}

        {/* TOP / RATING */}
        {section === "top" && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">🏆</span>
              <div>
                <h1 className="font-display font-black text-3xl">Рейтинг</h1>
                <p className="text-muted-foreground text-sm">Самый популярный контент</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {TOP_CONTENT.map((item, i) => <TopCard key={item.id} item={item} rank={i} />)}
            </div>

            <div className="text-center mt-10 text-muted-foreground text-xs py-4">
              Рейтинг формируется на основе лайков и просмотров
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
