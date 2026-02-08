// Утилиты для работы с UI
const Utils = {
  showModal(title, content, buttons = []) {
    const modalContainer = document.getElementById("modal-container");
    const modalOverlay = document.getElementById("modal-overlay");

    const buttonsHTML = buttons
      .map(
        (btn) =>
          `<button class="btn ${btn.class || ""}" onclick="${btn.onclick}">${btn.text}</button>`,
      )
      .join("");

    modalContainer.innerHTML = `
            <h2 class="modal-title">${title}</h2>
            <div class="modal-content">${content}</div>
            <div class="modal-actions">${buttonsHTML}</div>
        `;

    modalContainer.style.display = "block";
    modalOverlay.style.display = "block";
  },

  hideModal() {
    const modalContainer = document.getElementById("modal-container");
    const modalOverlay = document.getElementById("modal-overlay");
    modalContainer.style.display = "none";
    modalOverlay.style.display = "none";
  },

  showAlert(message, type = "info") {
    // Удаляем предыдущие алерты
    const oldAlerts = document.querySelectorAll(".alert-notification");
    oldAlerts.forEach((alert) => alert.remove());

    const alertDiv = document.createElement("div");
    alertDiv.className = `alert-notification alert-${type}`;
    alertDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
                <span>${message}</span>
            </div>
        `;

    alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === "success" ? "#27ae60" : type === "error" ? "#e74c3c" : "#3498db"};
            color: white;
            border-radius: var(--border-radius);
            z-index: 10000;
            animation: alertSlideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-weight: 500;
            min-width: 250px;
            max-width: 400px;
        `;

    document.body.appendChild(alertDiv);

    // Добавляем анимации
    if (!document.querySelector("#alert-animations")) {
      const style = document.createElement("style");
      style.id = "alert-animations";
      style.textContent = `
                @keyframes alertSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes alertSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      alertDiv.style.animation = "alertSlideOut 0.3s ease";
      setTimeout(() => {
        if (alertDiv.parentNode) {
          document.body.removeChild(alertDiv);
        }
      }, 300);
    }, 3000);
  },

  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  },

  getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  },
};

// Главный класс приложения
class JapaneseTrainerApp {
  constructor() {
    this.storage = new StorageManager();
    this.currentAlphabet = "hiragana";

    // Инициализация компонентов
    this.selection = new SelectionScreen(this);
    this.training = new TrainingScreen(this);
    this.writing = new WritingTrainingScreen(this);
    this.kanji = new KanjiScreen(this); // Новый компонент для кандзи
    this.stats = new StatsScreen(this);

    this.init();
  }

  init() {
    this.render = (content) => {
      const main = document.getElementById("app-main");
      main.innerHTML = content;
    };

    // Показываем главное меню
    this.showMainMenu();
  }

  showMainMenu() {
    const content = `
            <div class="main-menu">
                <h1 class="page-title">
                    <i class="fas fa-language"></i>
                    Тренажер японской письменности
                </h1>
                
                <div class="menu-grid">
                    <div class="menu-card" onclick="app.showSelectionScreen()">
                        <div class="menu-icon">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <div class="menu-title">Свободная тренировка</div>
                        <div class="menu-description">
                            Тренируйте чтение символов хираганы и катаканы. 
                            Угадывайте ромадзи по представленным символам.
                        </div>
                    </div>
                    
                    <div class="menu-card" onclick="app.startWritingTrainingFromMenu()">
                        <div class="menu-icon">
                            <i class="fas fa-pen-nib"></i>
                        </div>
                        <div class="menu-title">Тренировка письма</div>
                        <div class="menu-description">
                            Учитесь писать символы по памяти. 
                            Пишите в тетради, затем сверяйтесь с правильным ответом.
                        </div>
                    </div>
                    
                    <div class="menu-card" onclick="app.showKanjiScreen()">
                        <div class="menu-icon">
                            <i class="fas fa-scroll"></i>
                        </div>
                        <div class="menu-title">Тренировка кандзи</div>
                        <div class="menu-description">
                            Изучайте японские иероглифы и их перевод. 
                            Добавляйте свои кандзи и отслеживайте прогресс.
                        </div>
                    </div>
                    
                    <div class="menu-card" onclick="app.repeatLastSession()">
                        <div class="menu-icon">
                            <i class="fas fa-redo-alt"></i>
                        </div>
                        <div class="menu-title">Повторить сессию</div>
                        <div class="menu-description">
                            Продолжите с того места, где остановились. 
                            Повторите последнюю тренировку или упражнение.
                        </div>
                    </div>
                    
                    <div class="menu-card" onclick="app.showStatsScreen()">
                        <div class="menu-icon">
                            <i class="fas fa-chart-pie"></i>
                        </div>
                        <div class="menu-title">Статистика прогресса</div>
                        <div class="menu-description">
                            Просматривайте подробную статистику вашего обучения. 
                            Отслеживайте улучшения и выявляйте сложные места.
                        </div>
                    </div>
                    
                    <div class="menu-card" onclick="app.showHelp()">
                        <div class="menu-icon">
                            <i class="fas fa-question-circle"></i>
                        </div>
                        <div class="menu-title">Справка и помощь</div>
                        <div class="menu-description">
                            Узнайте больше о японской письменности. 
                            Получите советы по эффективному обучению.
                        </div>
                    </div>
                </div>
            </div>
        `;

    this.render(content);
  }

  showSelectionScreen() {
    this.selection.show();
  }

  startTraining() {
    const symbols = this.selection.getSelectedSymbols();
    if (symbols.length === 0) {
      Utils.showAlert("Выберите хотя бы один символ для тренировки!", "error");
      return;
    }

    // Сохраняем сессию
    this.storage.saveSession(symbols, []);

    this.training.show(symbols);
  }

  startWritingTraining() {
    const symbols = this.selection.getSelectedSymbols();
    if (symbols.length === 0) {
      Utils.showAlert(
        "Выберите хотя бы один символ для тренировки письма!",
        "error",
      );
      return;
    }

    this.storage.saveSession(symbols, []);
    this.writing.show(symbols);
  }

  startWritingTrainingFromMenu() {
    this.showSelectionScreen();
  }

  showKanjiScreen() {
    this.kanji.show();
  }

  repeatLastSession() {
    const session = this.storage.loadSession();

    if (session.symbols.length > 0) {
      this.selection.selectedSymbols = new Set(session.symbols);
      this.startTraining();
    } else if (session.kanji && session.kanji.length > 0) {
      // Продолжить тренировку кандзи
      this.startKanjiTraining(session.kanji);
    } else {
      Utils.showAlert(
        "Нет данных о последней сессии. Начните новую тренировку!",
        "error",
      );
      this.showMainMenu();
    }
  }

  startKanjiTraining(kanjiItems) {
    if (kanjiItems.length === 0) {
      Utils.showAlert("Выберите хотя бы один кандзи для тренировки!", "error");
      return;
    }

    // Сохраняем сессию (теперь передаем kanji вместо words)
    this.storage.saveSession([], [], kanjiItems);

    // Создаем и показываем экран тренировки кандзи
    this.showKanjiTrainingScreen(kanjiItems);
  }

  showKanjiTrainingScreen(kanjiItems) {
    this.currentKanji = kanjiItems;
    this.kanjiTrainingStats = {
      correct: 0,
      total: 0,
      currentIndex: 0,
      direction: null,
      currentKanji: null,
      recentKanji: [],
    };

    this.nextKanjiQuestion();
  }

  nextKanjiQuestion() {
    // Если дошли до конца, начинаем заново
    if (this.kanjiTrainingStats.currentIndex >= this.currentKanji.length) {
      this.kanjiTrainingStats.currentIndex = 0;
    }

    // Выбираем кандзи
    const kanji = this.currentKanji[this.kanjiTrainingStats.currentIndex];
    this.kanjiTrainingStats.currentKanji = kanji;
    this.kanjiTrainingStats.direction =
      Math.random() > 0.5 ? "ja_to_ru" : "ru_to_ja";

    const question =
      this.kanjiTrainingStats.direction === "ja_to_ru"
        ? kanji.kanji
        : kanji.russian;

    const content = `
            <div class="training-container">
                <div class="stats-display">
                    <div>
                        <i class="fas fa-chart-bar"></i>
                        Правильно: ${this.kanjiTrainingStats.correct}/${this.kanjiTrainingStats.total} 
                        (${
                          this.kanjiTrainingStats.total > 0
                            ? Math.round(
                                (this.kanjiTrainingStats.correct /
                                  this.kanjiTrainingStats.total) *
                                  100,
                              )
                            : 0
                        }%)
                    </div>
                </div>
                
                <div class="question-display">${question}</div>
                
                <div class="symbol-info">
                    <div>
                        <i class="fas fa-arrow-right"></i>
                        ${
                          this.kanjiTrainingStats.direction === "ja_to_ru"
                            ? "Переведите на русский"
                            : "Напишите кандзи"
                        }
                    </div>
                </div>
                
                <input type="text" class="answer-input" id="kanji-answer-input" 
                       placeholder="${
                         this.kanjiTrainingStats.direction === "ja_to_ru"
                           ? "Введите перевод"
                           : "Введите кандзи"
                       }" 
                       autocomplete="off" autofocus>
                
                <div class="result-message" id="kanji-result-message"></div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="app.checkKanjiAnswer()">
                        <i class="fas fa-check"></i> Проверить
                    </button>
                    <button class="btn btn-warning" onclick="app.nextKanjiQuestion()">
                        <i class="fas fa-forward"></i> Следующий
                    </button>
                    <button class="btn btn-danger" onclick="app.finishKanjiTraining()">
                        <i class="fas fa-stop"></i> Завершить
                    </button>
                </div>
            </div>
        `;

    this.render(content);
    document.getElementById("kanji-answer-input").focus();

    // Добавляем в недавние кандзи
    this.kanjiTrainingStats.recentKanji.push(kanji.kanji);
    if (this.kanjiTrainingStats.recentKanji.length > 5) {
      this.kanjiTrainingStats.recentKanji.shift();
    }
  }

  checkKanjiAnswer() {
    const input = document.getElementById("kanji-answer-input");
    const userAnswer = input.value.trim().toLowerCase();
    const kanji = this.kanjiTrainingStats.currentKanji;

    if (!userAnswer) {
      this.showKanjiResult("Введите ответ!", "result-incorrect");
      return;
    }

    this.kanjiTrainingStats.total++;
    let isCorrect = false;

    if (this.kanjiTrainingStats.direction === "ja_to_ru") {
      // Проверка перевода с японского на русский
      const correctTranslations = kanji.russian
        .toLowerCase()
        .split(",")
        .map((t) => t.trim());
      isCorrect = correctTranslations.some(
        (translation) =>
          userAnswer.includes(translation) || translation.includes(userAnswer),
      );
    } else {
      // Проверка написания кандзи с русского на японский
      // Пользователь может ввести кандзи или кану
      const userAnswerNorm = userAnswer.replace(/\s+/g, "");
      const correctKanji = kanji.kanji;
      const correctKana = kanji.kana.toLowerCase();

      // Проверяем совпадение с кандзи
      if (userAnswerNorm === correctKanji) {
        isCorrect = true;
      }
      // Или проверяем совпадение с каной (для гибкости)
      else if (correctKana && userAnswerNorm === correctKana) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      this.kanjiTrainingStats.correct++;
      this.showKanjiResult(
        '<i class="fas fa-check-circle"></i> Правильно!',
        "result-correct",
      );
    } else {
      const correctAnswer =
        this.kanjiTrainingStats.direction === "ja_to_ru"
          ? kanji.russian
          : kanji.kanji + (kanji.kana ? ` (${kanji.kana})` : "");
      this.showKanjiResult(
        `<i class="fas fa-times-circle"></i> Неправильно! Правильно: ${correctAnswer}`,
        "result-incorrect",
      );
    }

    // Сохраняем прогресс
    this.storage.updateKanjiProgress(kanji.kanji, isCorrect);

    // Переходим к следующему вопросу
    this.kanjiTrainingStats.currentIndex++;
    setTimeout(() => this.nextKanjiQuestion(), 1500);
  }

  showKanjiResult(message, className) {
    const resultEl = document.getElementById("kanji-result-message");
    resultEl.innerHTML = message;
    resultEl.className = `result-message ${className}`;
  }

  finishKanjiTraining() {
    const accuracy =
      this.kanjiTrainingStats.total > 0
        ? Math.round(
            (this.kanjiTrainingStats.correct / this.kanjiTrainingStats.total) *
              100,
          )
        : 0;

    let statsText = `<h3>Результаты тренировки кандзи</h3><hr>`;
    statsText += `<p><strong>Всего вопросов:</strong> ${this.kanjiTrainingStats.total}</p>`;
    statsText += `<p><strong>Правильных ответов:</strong> ${this.kanjiTrainingStats.correct}</p>`;
    statsText += `<p><strong>Процент правильных:</strong> ${accuracy}%</p>`;

    Utils.showModal("Статистика тренировки кандзи", statsText, [
      {
        text: '<i class="fas fa-redo"></i> Новая тренировка',
        class: "btn-primary",
        onclick: "app.showKanjiScreen(); Utils.hideModal();",
      },
      {
        text: '<i class="fas fa-home"></i> В главное меню',
        class: "btn-danger",
        onclick: "Utils.hideModal(); app.showMainMenu();",
      },
    ]);
  }

  showStatsScreen() {
    this.stats.show();
  }

  switchAlphabet(alphabet) {
    this.currentAlphabet = alphabet;
    this.selection.show();
  }

  resetProgress() {
    if (
      confirm(
        "Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить.",
      )
    ) {
      this.storage.resetProgress();
      Utils.showAlert("Весь прогресс успешно сброшен!", "success");
      this.showMainMenu();
    }
  }

  showHelp() {
    const helpContent = `
            <h3 style="color: var(--secondary-color); margin-bottom: 1.5rem;">Помощь по использованию тренажера</h3>
            
            <div style="margin-bottom: 2rem;">
                <h4><i class="fas fa-book"></i> Свободная тренировка</h4>
                <p>Выберите символы хираганы или катаканы, которые хотите тренировать. Затем угадывайте их ромадзи-написание.</p>
            </div>
            
            <div style="margin-bottom: 2rem;">
                <h4><i class="fas fa-pen"></i> Тренировка письма</h4>
                <p>Практикуйте написание символов. Пишите символы в тетради по памяти, затем сверяйтесь с правильным ответом.</p>
            </div>
            
            <div style="margin-bottom: 2rem;">
                <h4><i class="fas fa-scroll"></i> Тренировка кандзи</h4>
                <p>Изучайте японские иероглифы (кандзи). Добавляйте кандзи с переводом и каной, затем тренируйтесь в их запоминании.</p>
                <ul style="padding-left: 1.5rem;">
                    <li><strong>Кандзи:</strong> Сам иероглиф (например: 日)</li>
                    <li><strong>Перевод:</strong> Значение на русском (например: солнце, день)</li>
                    <li><strong>Кана:</strong> Чтение хираганой/катаканой (например: ひ, にち)</li>
                </ul>
            </div>
        `;

    Utils.showModal("Справка и помощь", helpContent, [
      {
        text: '<i class="fas fa-times"></i> Закрыть',
        class: "btn-danger",
        onclick: "Utils.hideModal()",
      },
    ]);
  }
}

// Создаем глобальный экземпляр приложения
window.app = new JapaneseTrainerApp();

// В конец файла app.js, после window.app = new JapaneseTrainerApp();
window.addEventListener("DOMContentLoaded", function () {
  // Обработчик для ошибок загрузки изображений
  document.addEventListener(
    "error",
    function (e) {
      if (e.target.tagName === "IMG" && e.target.src.includes("wikimedia")) {
        e.target.onerror = null;
        e.target.src =
          "https://via.placeholder.com/800x600/cccccc/666666?text=Таблица+не+загрузилась.+Проверьте+интернет.";
        e.target.style.border = "2px dashed #ccc";
      }
    },
    true,
  );

  // Enter — подтвердить ответ, Esc — завершить тренировку
  document.addEventListener("keydown", function (e) {
    const answerInput = document.getElementById("answer-input");
    const kanjiAnswerInput = document.getElementById("kanji-answer-input");
    const answerSection = document.getElementById("answer-section");
    const checkSection = document.getElementById("check-section");
    const active = document.activeElement;

    if (e.key === "Escape") {
      if (answerInput) {
        e.preventDefault();
        app.training.finish();
      } else if (kanjiAnswerInput) {
        e.preventDefault();
        app.finishKanjiTraining();
      } else if (document.getElementById("question-romaji")) {
        e.preventDefault();
        app.writing.finish();
      }
      return;
    }

    if (e.key !== "Enter") return;

    if (active === answerInput && answerInput) {
      e.preventDefault();
      app.training.checkAnswer();
      return;
    }
    if (active === kanjiAnswerInput && kanjiAnswerInput) {
      e.preventDefault();
      app.checkKanjiAnswer();
      return;
    }
    // Тренировка письма: Enter — «Показать ответ» или «Да, правильно»
    if (document.getElementById("question-romaji")) {
      if (answerSection && answerSection.style.display === "block") {
        e.preventDefault();
        app.writing.submitAnswer(true);
      } else if (checkSection && checkSection.style.display !== "none") {
        e.preventDefault();
        app.writing.showAnswer();
      }
    }
  });
});

window.Utils = Utils; // Делаем утилиты глобально доступными
