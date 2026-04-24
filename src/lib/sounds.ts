// Синтез звуков через Web Audio API — никаких файлов не нужно

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return ctx;
}

function beep(freq: number, duration: number, type: OscillatorType = "square", gain = 0.15, delay = 0) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.connect(g);
    g.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    g.gain.setValueAtTime(gain, ac.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + duration);
  } catch (_) { /* silent fail */ }
}

export const sounds = {
  // Тетрис
  tetrisMove() { beep(220, 0.05, "square", 0.08); },
  tetrisRotate() { beep(330, 0.07, "square", 0.1); },
  tetrisLine() {
    beep(523, 0.1, "square", 0.15);
    beep(659, 0.1, "square", 0.15, 0.1);
    beep(784, 0.15, "square", 0.15, 0.2);
  },
  tetrisTetris() {
    [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.12, "square", 0.2, i * 0.08));
  },
  tetrisGameOver() {
    [400, 300, 200, 150].forEach((f, i) => beep(f, 0.15, "sawtooth", 0.2, i * 0.12));
  },
  tetrisDrop() { beep(150, 0.08, "square", 0.12); },

  // Динозавр
  dinoJump() { beep(440, 0.12, "sine", 0.12); beep(550, 0.08, "sine", 0.1, 0.06); },
  dinoDie() {
    beep(300, 0.1, "sawtooth", 0.2);
    beep(200, 0.15, "sawtooth", 0.2, 0.1);
    beep(100, 0.2, "sawtooth", 0.2, 0.2);
  },
  dinoScore() { beep(880, 0.05, "sine", 0.1); beep(1100, 0.05, "sine", 0.1, 0.05); },

  // Монетка
  coinFlip() {
    for (let i = 0; i < 6; i++) beep(600 + i * 80, 0.04, "sine", 0.1, i * 0.07);
  },
  coinWin() {
    [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.1, "sine", 0.15, i * 0.07));
  },
  coinLose() {
    beep(350, 0.15, "sawtooth", 0.15);
    beep(280, 0.2, "sawtooth", 0.15, 0.1);
  },
  coinEdge() {
    [800, 900, 1000, 1200, 1000, 900, 800].forEach((f, i) => beep(f, 0.06, "sine", 0.15, i * 0.06));
  },

  // Слова (WordGame)
  wordCorrect() { beep(660, 0.1, "sine", 0.15); beep(880, 0.12, "sine", 0.15, 0.08); },
  wordWrong() { beep(200, 0.15, "sawtooth", 0.15); },
  wordWin() { [523, 659, 784, 880, 1047].forEach((f, i) => beep(f, 0.1, "sine", 0.15, i * 0.07)); },

  // Эмодзи (EmojiGuess)
  emojiCorrect() { beep(880, 0.1, "sine", 0.15); beep(1100, 0.12, "sine", 0.15, 0.08); },
  emojiWrong() { beep(180, 0.15, "sawtooth", 0.15); },

  // Удача (LuckyButton)
  luckyClick() { beep(440, 0.08, "sine", 0.12); },
  luckyWin() { [700, 900, 1100, 1400].forEach((f, i) => beep(f, 0.1, "sine", 0.2, i * 0.06)); },
  luckyLose() { beep(250, 0.2, "sawtooth", 0.15); },
};
