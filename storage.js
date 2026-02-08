// =============================================================================
// Кандзи по умолчанию — всегда в списке, вместе с кандзи из localStorage.
// Добавляйте сюда новые объекты в формате: { kanji: "字", russian: "перевод", kana: " reading" }.
// =============================================================================
const DEFAULT_KANJI = [
  { kanji: "一", russian: "один", kana: "いち, ひと" },
  { kanji: "二", russian: "два", kana: "に, ふた" },
  { kanji: "三", russian: "три", kana: "さん, み" },
  { kanji: "四", russian: "четыре", kana: "し, よ" },
  { kanji: "五", russian: "пять", kana: "ご, いつ" },
  { kanji: "六", russian: "шесть", kana: "ろく, む" },
  { kanji: "七", russian: "семь", kana: "しち, なな" },
  { kanji: "八", russian: "восемь", kana: "はち, や" },
  { kanji: "九", russian: "девять", kana: "きゅう, ここの" },
  { kanji: "十", russian: "десять", kana: "じゅう, とお" },
];

class StorageManager {
  constructor() {
    this.PROGRESS_KEY = "japanese_progress";
    this.WORDS_KEY = "japanese_words";
    this.SESSION_KEY = "last_session";
    this.progress = this.loadProgress();
    this.wordProgress = this.loadWordProgress();
    this.words = this.loadWords();
    this.kanjiList = this.loadKanjiList();
    this.kanjiProgress = this.loadKanjiProgress();
  }

  loadProgress() {
    try {
      const data = localStorage.getItem(this.PROGRESS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Ошибка загрузки прогресса:", e);
      return {};
    }
  }

  saveProgress() {
    try {
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.error("Ошибка сохранения прогресса:", e);
    }
  }

  loadWordProgress() {
    try {
      const data = localStorage.getItem(`${this.WORDS_KEY}_progress`);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Ошибка загрузки прогресса слов:", e);
      return {};
    }
  }

  saveWordProgress() {
    try {
      localStorage.setItem(
        `${this.WORDS_KEY}_progress`,
        JSON.stringify(this.wordProgress),
      );
    } catch (e) {
      console.error("Ошибка сохранения прогресса слов:", e);
    }
  }

  loadWords() {
    try {
      const data = localStorage.getItem(this.WORDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Ошибка загрузки слов:", e);
      return [];
    }
  }

  saveWords() {
    try {
      localStorage.setItem(this.WORDS_KEY, JSON.stringify(this.words));
    } catch (e) {
      console.error("Ошибка сохранения слов:", e);
    }
  }

  loadKanjiList() {
    try {
      const defaultKanjiSet = new Set(DEFAULT_KANJI.map((k) => k.kanji));
      let stored = [];
      const data = localStorage.getItem("japanese_kanji");
      if (data) {
        stored = JSON.parse(data);
      }
      // Всегда: сначала кандзи по умолчанию, затем из localStorage (без дубликатов по kanji)
      const merged = [
        ...DEFAULT_KANJI,
        ...stored.filter((k) => !defaultKanjiSet.has(k.kanji)),
      ];
      return merged;
    } catch (e) {
      console.error("Ошибка загрузки кандзи:", e);
      return [...DEFAULT_KANJI];
    }
  }

  loadKanjiProgress() {
    try {
      const data = localStorage.getItem("japanese_kanji_progress");
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Ошибка загрузки прогресса кандзи:", e);
      return {};
    }
  }

  saveKanjiList() {
    try {
      localStorage.setItem("japanese_kanji", JSON.stringify(this.kanjiList));
    } catch (e) {
      console.error("Ошибка сохранения кандзи:", e);
    }
  }

  saveKanjiProgress() {
    try {
      localStorage.setItem(
        "japanese_kanji_progress",
        JSON.stringify(this.kanjiProgress),
      );
    } catch (e) {
      console.error("Ошибка сохранения прогресса кандзи:", e);
    }
  }

  addKanji(kanji, russian, kana) {
    const newKanji = { kanji, russian, kana };
    this.kanjiList.push(newKanji);
    this.saveKanjiList();
  }

  updateKanji(index, kanji, russian, kana) {
    if (index >= 0 && index < this.kanjiList.length) {
      this.kanjiList[index] = { kanji, russian, kana };
      this.saveKanjiList();
    }
  }

  deleteKanji(index) {
    if (index >= 0 && index < this.kanjiList.length) {
      const kanji = this.kanjiList[index];
      delete this.kanjiProgress[kanji.kanji];
      this.kanjiList.splice(index, 1);
      this.saveKanjiList();
      this.saveKanjiProgress();
    }
  }

  getKanjiProgress(kanji) {
    if (!this.kanjiProgress[kanji]) {
      this.kanjiProgress[kanji] = {
        correct: 0,
        total: 0,
        lastCorrect: false,
        lastUsed: 0,
      };
    }
    return this.kanjiProgress[kanji];
  }

  updateKanjiProgress(kanji, isCorrect) {
    const progress = this.getKanjiProgress(kanji);
    progress.total++;
    progress.correct += isCorrect ? 1 : 0;
    progress.lastCorrect = isCorrect;
    progress.lastUsed = Date.now();
    this.saveKanjiProgress();
  }

  saveSession(symbols = [], words = [], kanji = []) {
    try {
      const session = {
        symbols,
        words,
        kanji,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.error("Ошибка сохранения сессии:", e);
    }
  }

  loadSession() {
    try {
      const data = localStorage.getItem(this.SESSION_KEY);
      if (!data) return { symbols: [], words: [], kanji: [] };

      const session = JSON.parse(data);
      // Проверяем, что сессия не старше 7 дней
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (session.timestamp < weekAgo) {
        return { symbols: [], words: [], kanji: [] };
      }
      return session;
    } catch (e) {
      console.error("Ошибка загрузки сессии:", e);
      return { symbols: [], words: [], kanji: [] };
    }
  }

  getSymbolProgress(symbol) {
    if (!this.progress[symbol]) {
      this.progress[symbol] = {
        correct: 0,
        total: 0,
        lastCorrect: false,
        lastUsed: 0,
      };
    }
    return this.progress[symbol];
  }

  updateSymbolProgress(symbol, isCorrect) {
    const progress = this.getSymbolProgress(symbol);
    progress.total++;
    progress.correct += isCorrect ? 1 : 0;
    progress.lastCorrect = isCorrect;
    progress.lastUsed = Date.now();
    this.saveProgress();
  }

  getWordProgress(word) {
    if (!this.wordProgress[word]) {
      this.wordProgress[word] = {
        correct: 0,
        total: 0,
        lastCorrect: false,
        lastUsed: 0,
      };
    }
    return this.wordProgress[word];
  }

  updateWordProgress(word, isCorrect) {
    const progress = this.getWordProgress(word);
    progress.total++;
    progress.correct += isCorrect ? 1 : 0;
    progress.lastCorrect = isCorrect;
    progress.lastUsed = Date.now();
    this.saveWordProgress();
  }

  addWord(japanese, russian, romaji = "") {
    const newWord = { japanese, russian, romaji };
    this.words.push(newWord);
    this.saveWords();
  }

  updateWord(index, japanese, russian, romaji) {
    if (index >= 0 && index < this.words.length) {
      this.words[index] = { japanese, russian, romaji };
      this.saveWords();
    }
  }

  deleteWord(index) {
    if (index >= 0 && index < this.words.length) {
      const word = this.words[index];
      delete this.wordProgress[word.japanese];
      this.words.splice(index, 1);
      this.saveWords();
      this.saveWordProgress();
    }
  }

  resetProgress() {
    this.progress = {};
    this.wordProgress = {};
    this.kanjiProgress = {}; // Добавьте эту строку
    this.saveProgress();
    this.saveWordProgress();
    this.saveKanjiProgress(); // Добавьте эту строку
  }

  getStats() {
    const stats = {
      totalSymbols: Object.keys(this.progress).length,
      totalWords: this.words.length,
      totalKanji: this.kanjiList.length, // Добавьте эту строку
      hiragana: this.getAlphabetStats("hiragana"),
      katakana: this.getAlphabetStats("katakana"),
      words: this.getWordsStats(),
      kanji: this.getKanjiStats(), // Добавьте эту строку
    };
    return stats;
  }

  getKanjiStats() {
    let correct = 0;
    let total = 0;

    Object.values(this.kanjiProgress).forEach((progress) => {
      correct += progress.correct;
      total += progress.total;
    });

    return {
      correct,
      total,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
    };
  }

  getAlphabetStats(alphabet) {
    const data = alphabet === "hiragana" ? AppData.hiragana : AppData.katakana;
    let correct = 0;
    let total = 0;

    Object.keys(data).forEach((symbol) => {
      const progress = this.getSymbolProgress(symbol);
      correct += progress.correct;
      total += progress.total;
    });

    return {
      correct,
      total,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
    };
  }

  getWordsStats() {
    let correct = 0;
    let total = 0;

    Object.values(this.wordProgress).forEach((progress) => {
      correct += progress.correct;
      total += progress.total;
    });

    return {
      correct,
      total,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
    };
  }
  searchKanji(query) {
    if (!query) return this.kanjiList;

    const q = query.toLowerCase().trim();
    return this.kanjiList.filter(
      (kanji) =>
        kanji.kanji.includes(q) ||
        kanji.russian.toLowerCase().includes(q) ||
        kanji.kana.toLowerCase().includes(q),
    );
  }
}

// Утилиты для работы с прогрессом
const ProgressUtils = {
  getAccuracy(progress) {
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.correct / progress.total) * 100);
  },

  getProgressColor(accuracy) {
    if (accuracy >= 80) return "progress-high";
    if (accuracy >= 60) return "progress-medium";
    return "progress-low";
  },

  getWeightedRandom(items, getProgress, recentItems = [], weightsFn = null) {
    if (items.length === 0) return null;

    const weights = items.map((item, index) => {
      if (weightsFn) return weightsFn(item, index);

      const progress = getProgress(item);
      let weight = 1.0;

      // Учитываем точность
      if (progress.total > 0) {
        const accuracy = progress.correct / progress.total;
        if (accuracy < 0.3) weight *= 3.0;
        else if (accuracy < 0.6) weight *= 2.0;
        else if (accuracy > 0.9) weight *= 0.5;
      }

      // Учитываем время с последнего использования
      if (progress.lastUsed > 0) {
        const hoursSince = (Date.now() - progress.lastUsed) / (1000 * 60 * 60);
        if (hoursSince > 12) {
          const timeBoost = Math.min(Math.log(hoursSince / 12 + 1), 2.0);
          weight *= 1.0 + timeBoost;
        }
      }

      // Уменьшаем вес для недавно использованных
      if (recentItems.includes(item)) {
        weight *= 0.3;
      }

      return weight;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[0];
  },

  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  },
};
