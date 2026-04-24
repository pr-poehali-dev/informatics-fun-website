CREATE TABLE memes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT,
  emoji TEXT NOT NULL DEFAULT '😂',
  tag TEXT NOT NULL DEFAULT 'общее',
  type TEXT NOT NULL DEFAULT 'meme',
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  meme_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  vote TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(meme_id, session_id)
);

INSERT INTO memes (title, text, emoji, tag, type) VALUES
('Когда встреча могла быть письмом', '— Минутку внимания!\n— (час спустя)...', '😩', 'работа', 'meme'),
('Программист в пятницу вечером', 'git push origin main --force', '💻', 'айти', 'meme'),
('Понедельник утром', 'Кофе — это не привычка, это личность', '☕', 'жизнь', 'meme'),
('Когда включил камеру случайно', '...а там ты в пижаме ешь суп', '😱', 'зум', 'meme'),
('Тренажёрный зал в январе', 'vs тренажёрный зал в феврале', '🏋️', 'спорт', 'meme'),
('Когда прочитал задачу 5 раз', '...и всё равно не понял', '🤔', 'учёба', 'meme'),
('Анекдот дня', '— Доктор, у меня проблемы с памятью!\n— Когда это началось?\n— Что началось?', '🎭', 'классика', 'joke'),
('Про диету', 'Начну диету с понедельника. Сегодня среда, но я имею в виду следующий понедельник.', '🍕', 'еда', 'joke'),
('Утро программиста', '99 маленьких багов в коде. Убери один — 127 маленьких багов в коде.', '🐛', 'айти', 'joke'),
('Про время', '— Как дела?\n— Как у часов: туда-сюда, туда-сюда...', '⏰', 'классика', 'joke'),
('Школьный', 'Учитель: — Иванов, ты почему опоздал?\n— Автобус уехал.\n— А на следующем?\n— Там не было места.', '📚', 'школа', 'joke'),
('Про погоду', 'Весна: тепло, солнечно, птицы поют.\nИ это только первые 2 дня апреля.', '🌧️', 'погода', 'joke');
