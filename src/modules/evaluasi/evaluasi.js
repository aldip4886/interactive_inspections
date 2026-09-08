import { scorm } from '../../core/scorm.js';
import { xapi } from '../../core/xapi.js';

export class EvaluasiView {
  constructor(container) {
    this.container = container;
    this.quizData = null;
    this.currentIndex = 0;
    this.userAnswers = [];
    this.isSubmitted = false;
  }

  async loadQuestions() {
    try {
      const resp = await fetch('src/data/evaluasi-questions.json');
      this.quizData = await resp.json();
    } catch (e) {
      console.error('[Evaluasi] Failed to load quiz JSON', e);
    }
  }

  async render() {
    if (!this.quizData) {
      await this.loadQuestions();
    }
    if (!this.quizData) return;

    this.currentIndex = 0;
    this.userAnswers = new Array(this.quizData.questions.length).fill(null);
    this.isSubmitted = false;

    this.renderQuestionScreen();

    xapi.trackModuleView('evaluasi', 'Ujian Evaluasi Modus Penyelundupan Narkotika');
  }

  renderQuestionScreen() {
    const q = this.quizData.questions[this.currentIndex];
    const total = this.quizData.questions.length;
    const selectedAnswer = this.userAnswers[this.currentIndex];

    const html = `
      <div style="width: 100%; height: 100%; overflow-y: auto; padding: var(--container-padding); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="card" style="width: 100%; max-width: 820px; padding: 40px;">
          
          <!-- Header Progress -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid var(--color-outline-variant); padding-bottom: 16px;">
            <div>
              <span class="badge badge-gold">${q.category}</span>
              <span style="font-size: var(--font-size-label-md); color: var(--color-on-surface-variant); margin-left: 8px;">Soal ${this.currentIndex + 1} dari ${total}</span>
            </div>
            <div style="font-size: var(--font-size-label-md); font-weight: 700; color: var(--color-primary-container);">
              Batas Kelulusan: ${this.quizData.passingScorePercent}%
            </div>
          </div>

          <!-- Question Prompt -->
          <h3 style="font-size: var(--font-size-title-lg); color: var(--color-primary-container); line-height: 1.5; margin-bottom: 28px;">
            ${q.question}
          </h3>

          <!-- Options List -->
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px;">
            ${q.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              return `
                <div class="option-card ${isSelected ? 'selected' : ''}" data-index="${idx}">
                  <div class="option-indicator">${String.fromCharCode(65 + idx)}</div>
                  <div style="font-size: var(--font-size-body-md); color: var(--color-on-surface); font-weight: 500;">${opt}</div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Navigation Footer -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--color-outline-variant); padding-top: 24px;">
            <button id="prev-question-btn" class="btn btn-ghost" ${this.currentIndex === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
              &larr; Sebelumnya
            </button>

            ${this.currentIndex < total - 1 ? `
              <button id="next-question-btn" class="btn btn-secondary btn-lg">
                Berikutnya &rarr;
              </button>
            ` : `
              <button id="submit-quiz-btn" class="btn btn-secondary btn-lg">
                Selesaikan Ujian ✅
              </button>
            `}
          </div>

        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachQuestionEvents();
  }

  attachQuestionEvents() {
    const optionCards = this.container.querySelectorAll('.option-card');
    optionCards.forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-index'), 10);
        this.userAnswers[this.currentIndex] = idx;
        this.renderQuestionScreen();
      });
    });

    const prevBtn = this.container.querySelector('#prev-question-btn');
    if (prevBtn && this.currentIndex > 0) {
      prevBtn.addEventListener('click', () => {
        this.currentIndex--;
        this.renderQuestionScreen();
      });
    }

    const nextBtn = this.container.querySelector('#next-question-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.userAnswers[this.currentIndex] === null) {
          alert('Pilih salah satu jawaban sebelum melanjutkan!');
          return;
        }
        this.currentIndex++;
        this.renderQuestionScreen();
      });
    }

    const submitBtn = this.container.querySelector('#submit-quiz-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (this.userAnswers[this.currentIndex] === null) {
          alert('Pilih salah satu jawaban sebelum menyelesaikan ujian!');
          return;
        }
        this.calculateResult();
      });
    }
  }

  calculateResult() {
    let correctCount = 0;
    const questions = this.quizData.questions;

    questions.forEach((q, idx) => {
      if (this.userAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const total = questions.length;
    const scorePercent = Math.round((correctCount / total) * 100);
    const passed = scorePercent >= this.quizData.passingScorePercent;

    // Send SCORM & xAPI completion
    scorm.setCompleted(scorePercent);
    xapi.trackQuizCompleted(scorePercent, passed, total);

    this.renderResultScreen(scorePercent, passed, correctCount, total);
  }

  renderResultScreen(scorePercent, passed, correctCount, total) {
    const html = `
      <div style="width: 100%; height: 100%; overflow-y: auto; padding: var(--container-padding); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div class="card" style="width: 100%; max-width: 680px; padding: 48px; text-align: center;">
          
          <div style="font-size: 4.5rem; margin-bottom: 12px;">
            ${passed ? '🏆' : '⚠️'}
          </div>

          <h2 style="font-size: var(--font-size-headline-lg); color: var(--color-primary-container); margin-bottom: 8px;">
            ${passed ? 'Selamat! Anda Lulus Ujian Evaluasi' : 'Belum Mencapai Batas Kelulusan'}
          </h2>

          <div style="font-size: 3.5rem; font-weight: 800; color: ${passed ? 'var(--color-success)' : 'var(--color-error)'}; margin: 16px 0;">
            ${scorePercent}%
          </div>

          <p style="font-size: var(--font-size-body-lg); color: var(--color-on-surface-variant); margin-bottom: 32px; line-height: 1.6;">
            Anda menjawab benar <strong>${correctCount}</strong> dari <strong>${total}</strong> soal skenario.<br>
            Batas kelulusan minimum: ${this.quizData.passingScorePercent}%. Hasil kelulusan SCORM telah otomatis disimpan ke KLC.
          </p>

          <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <button id="retake-quiz-btn" class="btn btn-ghost btn-lg">
              🔄 Ulangi Ujian
            </button>
            <a href="#/beranda" class="btn btn-secondary btn-lg">
              🏠 Kembali ke Beranda
            </a>
          </div>

        </div>
      </div>
    `;

    this.container.innerHTML = html;

    const retakeBtn = this.container.querySelector('#retake-quiz-btn');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => this.render());
    }
  }
}
