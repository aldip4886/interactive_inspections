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
      <div style="width: 100%; height: 100%; overflow-y: auto; padding: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="width: 100%; max-width: 780px; background: var(--bg-dark-800); border: 1px solid var(--surface-glass-border); border-radius: var(--radius-xl); padding: 32px; box-shadow: var(--shadow-lg);">
          
          <!-- Header Progress -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid var(--surface-glass-border); padding-bottom: 16px;">
            <div>
              <span class="badge badge-gold">${q.category}</span>
              <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 8px;">Soal ${this.currentIndex + 1} dari ${total}</span>
            </div>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--accent-gold);">
              Batas Kelulusan: ${this.quizData.passingScorePercent}%
            </div>
          </div>

          <!-- Question Prompt -->
          <h3 style="font-size: 1.15rem; color: #FFF; line-height: 1.5; margin-bottom: 24px;">
            ${q.question}
          </h3>

          <!-- Options List -->
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px;">
            ${q.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              return `
                <button class="btn btn-outline quiz-option-btn ${isSelected ? 'active-gold' : ''}" 
                        data-index="${idx}"
                        style="justify-content: flex-start; text-align: left; padding: 14px 18px; ${isSelected ? 'border-color: var(--accent-gold); background: rgba(245,166,35,0.15);' : ''}">
                  <span style="width: 26px; height: 26px; border-radius: 50%; background: ${isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)'}; color: ${isSelected ? '#000' : '#FFF'}; font-weight: 700; font-size: 0.8rem; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 10px;">
                    ${String.fromCharCode(65 + idx)}
                  </span>
                  <span style="font-size: 0.92rem;">${opt}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Navigation Footer -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--surface-glass-border); padding-top: 20px;">
            <button id="prev-question-btn" class="btn btn-outline" ${this.currentIndex === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
              &larr; Sebelumnya
            </button>

            ${this.currentIndex < total - 1 ? `
              <button id="next-question-btn" class="btn btn-gold">
                Berikutnya &rarr;
              </button>
            ` : `
              <button id="submit-quiz-btn" class="btn btn-gold">
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
    const optionBtns = this.container.querySelectorAll('.quiz-option-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
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
      <div style="width: 100%; height: 100%; overflow-y: auto; padding: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="width: 100%; max-width: 650px; background: var(--bg-dark-800); border: 1px solid var(--surface-glass-border); border-radius: var(--radius-xl); padding: 40px; text-align: center; box-shadow: var(--shadow-lg);">
          
          <div style="font-size: 4rem; margin-bottom: 12px;">
            ${passed ? '🏆' : '⚠️'}
          </div>

          <h2 style="font-size: 1.8rem; color: #FFF; margin-bottom: 8px;">
            ${passed ? 'Selamat! Anda Lulus Evaluasi' : 'Belum Mencapai Batas Kelulusan'}
          </h2>

          <div style="font-size: 3rem; font-weight: 800; color: ${passed ? '#34C759' : '#FF3B30'}; margin: 16px 0;">
            ${scorePercent}%
          </div>

          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 24px;">
            Anda menjawab benar <strong>${correctCount}</strong> dari <strong>${total}</strong> soal scenario.<br>
            Batas kelulusan minimum: ${this.quizData.passingScorePercent}%. Status kelulusan SCORM telah dicatat ke KLC.
          </p>

          <div style="display: flex; gap: 16px; justify-content: center;">
            <button id="retake-quiz-btn" class="btn btn-outline">
              🔄 Ulangi Ujian
            </button>
            <a href="#/beranda" class="btn btn-gold">
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
