class TrainingScreen {
  constructor(app) {
    this.app = app;
    this.currentSymbol = null;
    this.selectedSymbols = [];
    this.correctAnswers = 0;
    this.totalQuestions = 0;
    this.mistakes = new Map();
    this.sessionStats = new Map();
    this.recentSymbols = [];
  }

  show(symbols) {
    this.selectedSymbols = symbols;
    this.correctAnswers = 0;
    this.totalQuestions = 0;
    this.mistakes.clear();
    this.sessionStats.clear();
    this.recentSymbols = [];

    const content = `
            <div class="training-container">
                <div class="stats-display">
                    <div>
                        <i class="fas fa-chart-bar"></i>
                        Правильно: <span id="correct-count">0</span>/<span id="total-count">0</span> 
                        (<span id="accuracy">0</span>%)
                    </div>
                </div>
                
                <div class="question-display" id="question-symbol"></div>
                
                <div class="symbol-info" id="symbol-info"></div>
                
                <input type="text" class="answer-input" id="answer-input" 
                       placeholder="Введите ромадзи (например ka)" 
                       autocomplete="off" autofocus>
                
                <div class="result-message" id="result-message"></div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="app.training.checkAnswer()">
                        <i class="fas fa-check"></i> Проверить
                    </button>
                    <button class="btn btn-warning" onclick="app.training.nextQuestion()">
                        <i class="fas fa-forward"></i> Следующий
                    </button>
                    <button class="btn btn-danger" onclick="app.training.finish()">
                        <i class="fas fa-stop"></i> Завершить
                    </button>

                </div>
            </div>
        `;

    this.app.render(content);
    document.getElementById("answer-input").focus();
    this.nextQuestion();
  }

  nextQuestion() {
    this.currentSymbol = this.getNextSymbol();
    if (!this.currentSymbol) {
      this.finish();
      return;
    }

    const progress = this.app.storage.getSymbolProgress(this.currentSymbol);
    const accuracy = ProgressUtils.getAccuracy(progress);
    const sessionCount = this.sessionStats.get(this.currentSymbol) || 0;

    document.getElementById("question-symbol").textContent = this.currentSymbol;
    document.getElementById("answer-input").value = "";
    document.getElementById("result-message").textContent = "";
    document.getElementById("answer-input").focus();

    document.getElementById("symbol-info").innerHTML = `
            <div>
                <i class="fas fa-chart-line"></i>
                Точность: <strong>${accuracy}%</strong> | 
                Всего попыток: <strong>${progress.total}</strong> | 
                В этой сессии: <strong>${sessionCount}</strong>
            </div>
        `;

    // Увеличиваем счетчик использования в сессии
    this.sessionStats.set(this.currentSymbol, sessionCount + 1);
    this.recentSymbols.push(this.currentSymbol);
    if (this.recentSymbols.length > 5) {
      this.recentSymbols.shift();
    }
  }

  getNextSymbol() {
    if (this.selectedSymbols.length === 0) return null;

    // Убираем последний символ из доступных
    const available = this.selectedSymbols.filter(
      (s) =>
        s !== this.currentSymbol && !this.recentSymbols.slice(-2).includes(s),
    );

    if (available.length === 0) {
      available.push(
        ...this.selectedSymbols.filter((s) => s !== this.currentSymbol),
      );
      if (available.length === 0) {
        available.push(...this.selectedSymbols);
      }
    }

    return ProgressUtils.getWeightedRandom(
      available,
      (symbol) => this.app.storage.getSymbolProgress(symbol),
      this.recentSymbols,
    );
  }

  checkAnswer() {
    const input = document.getElementById("answer-input");
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = this.getCurrentRomaji().toLowerCase();

    if (!userAnswer) {
      this.showResult("Введите ответ!", "result-incorrect");
      return;
    }

    this.totalQuestions++;
    const isCorrect = userAnswer === correctAnswer;

    if (isCorrect) {
      this.correctAnswers++;
      this.showResult(
        '<i class="fas fa-check-circle"></i> Правильно!',
        "result-correct",
      );
    } else {
      this.mistakes.set(
        this.currentSymbol,
        (this.mistakes.get(this.currentSymbol) || 0) + 1,
      );
      this.showResult(
        `<i class="fas fa-times-circle"></i> Неправильно! Правильно: ${correctAnswer}`,
        "result-incorrect",
      );
    }

    // Сохраняем прогресс
    this.app.storage.updateSymbolProgress(this.currentSymbol, isCorrect);

    // Обновляем статистику
    this.updateStats();

    // Автоматически переходим к следующему вопросу через 1.5 секунды
    setTimeout(() => this.nextQuestion(), 1500);
  }

  getCurrentRomaji() {
    const alphabet = this.app.currentAlphabet;
    const data = alphabet === "hiragana" ? AppData.hiragana : AppData.katakana;
    return data[this.currentSymbol];
  }

  showResult(message, className) {
    const resultEl = document.getElementById("result-message");
    resultEl.innerHTML = message;
    resultEl.className = `result-message ${className}`;
  }

  updateStats() {
    const accuracy =
      this.totalQuestions > 0
        ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
        : 0;

    document.getElementById("correct-count").textContent = this.correctAnswers;
    document.getElementById("total-count").textContent = this.totalQuestions;
    document.getElementById("accuracy").textContent = accuracy;
  }

  finish() {
    let statsText = `<h3>Результаты тренировки</h3><hr>`;
    statsText += `<p><strong>Всего вопросов:</strong> ${this.totalQuestions}</p>`;
    statsText += `<p><strong>Правильных ответов:</strong> ${this.correctAnswers}</p>`;

    const accuracy =
      this.totalQuestions > 0
        ? Math.round((this.correctAnswers / this.totalQuestions) * 100)
        : 0;
    statsText += `<p><strong>Процент правильных:</strong> ${accuracy}%</p>`;

    // Топ ошибок
    const topMistakes = Array.from(this.mistakes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topMistakes.length > 0) {
      statsText += `<hr><h4>Самые сложные символы:</h4><ul>`;
      topMistakes.forEach(([symbol, count]) => {
        const romaji = this.getRomajiForSymbol(symbol);
        statsText += `<li><strong>${symbol}</strong> (${romaji}) - ${count} ошибок</li>`;
      });
      statsText += `</ul>`;
    }

    this.showModal("Статистика тренировки", statsText);
  }

  getRomajiForSymbol(symbol) {
    const alphabet = this.app.currentAlphabet;
    const data = alphabet === "hiragana" ? AppData.hiragana : AppData.katakana;
    return data[symbol];
  }

  showModal(title, content) {
    const modalContainer = document.getElementById("modal-container");
    const modalOverlay = document.getElementById("modal-overlay");

    modalContainer.innerHTML = `
            <h2 class="modal-title">${title}</h2>
            <div class="modal-content">${content}</div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="app.showSelectionScreen(); Utils.hideModal();">
                    <i class="fas fa-redo"></i> Новая тренировка
                </button>
                <button class="btn btn-danger" onclick="Utils.hideModal(); app.showMainMenu();">
                    <i class="fas fa-home"></i> В главное меню
                </button>
            </div>
        `;

    modalContainer.style.display = "block";
    modalOverlay.style.display = "block";
  }

  showWritingReference() {
    const alphabet = app.currentAlphabet;
    const title =
      alphabet === "hiragana" ? "Таблица хираганы" : "Таблица катаканы";
    const imageUrl =
      alphabet === "hiragana"
        ? "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Table_hiragana-ru.svg/1200px-Table_hiragana-ru.svg.png"
        : "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Table_katakana.svg/1280px-Table_katakana.svg.png";

    const content = `
        <p style="margin-bottom: 1rem; color: var(--dark-text);">
            Изучайте не только чтение, но и правильное написание символов. 
            Обратите внимание на порядок черт и направление письма.
        </p>
        <div style="overflow-x: auto; max-height: 400px; border-radius: var(--border-radius);">
            <img src="${imageUrl}" 
                 alt="${title}" 
                 style="max-width: 100%; height: auto; border-radius: var(--border-radius);"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/800x400/cccccc/666666?text=Таблица+загружается...';">
        </div>
        <div style="margin-top: 1rem; text-align: center;">
            <button class="btn btn-warning" onclick="app.showSelectionScreen(); Utils.hideModal(); app.startWritingTraining();">
                <i class="fas fa-pen"></i> Перейти к тренировке письма
            </button>
        </div>
    `;

    const buttons = [
      {
        text: '<i class="fas fa-times"></i> Закрыть',
        class: "btn-danger",
        onclick: "Utils.hideModal()",
      },
    ];

    Utils.showModal(title, content, buttons);
  }
}
