import { scorm } from '../../core/scorm.js';
import { xapi } from '../../core/xapi.js';
import { courseProgress } from '../../core/progress.js';

export class EvaluasiView {
  constructor(container) {
    this.container = container;
    this.quizData = null;
    this.currentIndex = 0;
    this.userAnswers = [];
    this.screenState = 'intro'; // 'intro', 'quiz', 'result'
    this.timerSeconds = 600; // 10 minutes default
    this.timerInterval = null;
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

    this.screenState = 'intro';
    this.currentIndex = 0;
    this.userAnswers = new Array(this.quizData.questions.length).fill(null);
    this.stopTimer();

    this.renderIntroScreen();

    xapi.trackModuleView('evaluasi', 'Ujian Evaluasi Modus Penyelundupan Narkotika');
  }

  /* ─── 1. INTRO LANDING SCREEN ─── */
  renderIntroScreen() {
    const totalQ = this.quizData?.questions?.length || 5;
    const passingPct = this.quizData?.passingScorePercent || 70;
    const timeLimit = this.quizData?.timeLimitMinutes || 10;

    const html = `
      <div class="evaluasi-page-wrapper">
        <div class="evaluasi-intro-card">
          
          <div class="evaluasi-intro-header">
            <div class="evaluasi-intro-icon">🛡️</div>
            <div>
              <span class="badge badge-gold" style="margin-bottom: 6px; display: inline-block;">Sertifikasi Penindakan DJBC</span>
              <h2 class="evaluasi-intro-title">${this.quizData?.quizTitle || 'Ujian Evaluasi Modus Penyelundupan Narkotika'}</h2>
              <p class="evaluasi-intro-subtitle">Pusat Asesmen Kompetensi Teknis Inspeksi & Identifikasi Narkotika Bea Cukai</p>
            </div>
          </div>

          <div class="evaluasi-rules-grid">
            <div class="rule-box-item">
              <span class="rule-box-icon">⏱️</span>
              <div class="rule-box-content">
                <h4>Batas Waktu</h4>
                <p>Alokasi waktu total <strong>${timeLimit} menit</strong> untuk menjawab ${totalQ} soal skenario.</p>
              </div>
            </div>

            <div class="rule-box-item">
              <span class="rule-box-icon">🎯</span>
              <div class="rule-box-content">
                <h4>Batas Kelulusan</h4>
                <p>Nilai kelulusan minimal <strong>${passingPct}%</strong> (minimal menjawab benar 4 dari ${totalQ} soal).</p>
              </div>
            </div>

            <div class="rule-box-item">
              <span class="rule-box-icon">📜</span>
              <div class="rule-box-content">
                <h4>Sinkronisasi SCORM LMS</h4>
                <p>Hasil kelulusan dan skor akhir otomatis dicatat pada KLC LMS & LRS xAPI.</p>
              </div>
            </div>

            <div class="rule-box-item">
              <span class="rule-box-icon">🔍</span>
              <div class="rule-box-content">
                <h4>Studi Kasus Riil</h4>
                <p>Materi ujian diangkat dari modus operandi penindakan riil Modul 1 sampai Modul 4b.</p>
              </div>
            </div>
          </div>

          <div class="evaluasi-intro-actions">
            <a href="#/beranda" class="btn btn-ghost">
              ← Kembali ke Beranda
            </a>
            <button id="start-exam-btn" class="btn btn-primary" style="background: linear-gradient(135deg, #2563EB, #1D4ED8); border: none; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); padding: 10px 22px;">
              🚀 Mulai Ujian Evaluasi
            </button>
          </div>

        </div>
      </div>
    `;

    this.container.innerHTML = html;

    const startBtn = this.container.querySelector('#start-exam-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startQuiz());
    }
  }

  /* ─── 2. START QUIZ & TIMER ─── */
  startQuiz() {
    this.screenState = 'quiz';
    this.currentIndex = 0;
    this.userAnswers = new Array(this.quizData.questions.length).fill(null);
    this.timerSeconds = (this.quizData?.timeLimitMinutes || 10) * 60;

    this.startTimer();
    this.renderQuestionScreen();
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      this.updateTimerUI();

      if (this.timerSeconds <= 0) {
        this.stopTimer();
        alert('Batas waktu ujian telah habis! Jawaban Anda akan otomatis dikirim.');
        this.calculateResult();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  updateTimerUI() {
    const timerEl = this.container.querySelector('#evaluasi-timer');
    if (timerEl) {
      timerEl.textContent = `⏱️ ${this.formatTime(this.timerSeconds)}`;
      if (this.timerSeconds < 120) {
        timerEl.classList.add('urgent');
      } else {
        timerEl.classList.remove('urgent');
      }
    }
  }

  /* ─── 3. QUESTION EXAM SCREEN ─── */
  renderQuestionScreen() {
    const q = this.quizData.questions[this.currentIndex];
    const total = this.quizData.questions.length;
    const selectedAnswer = this.userAnswers[this.currentIndex];

    const categoryIcons = {
      'Tubuh Kurir': '🧍',
      'Barang Bawaan': '🧳',
      'Barang Kiriman': '📦',
      'Kendaraan Darat': '🚗',
      'Sarana Laut': '🚢'
    };
    const catIcon = categoryIcons[q.category] || '🔍';

    const html = `
      <div class="evaluasi-page-wrapper">
        <div class="evaluasi-quiz-card">
          
          <!-- Top Toolbar & Timer -->
          <div class="evaluasi-top-toolbar">
            <div class="evaluasi-meta-left">
              <span class="evaluasi-cat-badge">${catIcon} ${q.category}</span>
              <span class="evaluasi-question-counter">Soal ${this.currentIndex + 1} dari ${total}</span>
            </div>
            <div id="evaluasi-timer" class="evaluasi-timer-pill ${this.timerSeconds < 120 ? 'urgent' : ''}">
              ⏱️ ${this.formatTime(this.timerSeconds)}
            </div>
          </div>

          <!-- Question Map Navigation -->
          <div class="evaluasi-question-map">
            ${this.quizData.questions.map((_, idx) => {
              const isAnswered = this.userAnswers[idx] !== null;
              const isActive = idx === this.currentIndex;
              let cls = 'qmap-btn';
              if (isActive) cls += ' active';
              else if (isAnswered) cls += ' answered';
              return `<button class="${cls}" data-qindex="${idx}">${idx + 1}</button>`;
            }).join('')}
          </div>

          <!-- Question Prompt -->
          <h3 class="evaluasi-question-prompt">
            ${q.question}
          </h3>

          <!-- Option Cards -->
          <div class="evaluasi-options-list">
            ${q.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              return `
                <div class="eval-option-item ${isSelected ? 'selected' : ''}" data-optindex="${idx}" role="button" tabindex="0">
                  <div class="eval-option-badge">${String.fromCharCode(65 + idx)}</div>
                  <div class="eval-option-text">${opt}</div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Bottom Navigation -->
          <div class="evaluasi-bottom-nav">
            <button id="prev-question-btn" class="btn btn-ghost" ${this.currentIndex === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
              ← Sebelumnya
            </button>

            <div style="display: flex; gap: 10px;">
              ${this.currentIndex < total - 1 ? `
                <button id="next-question-btn" class="btn btn-secondary" style="padding: 10px 20px;">
                  Berikutnya →
                </button>
              ` : `
                <button id="submit-quiz-btn" class="btn btn-primary" style="background: linear-gradient(135deg, #10B981, #059669); border: none; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); padding: 10px 22px;">
                  Selesaikan Ujian ✅
                </button>
              `}
            </div>
          </div>

        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachQuestionEvents();
  }

  attachQuestionEvents() {
    // Option Card Selection
    const optionCards = this.container.querySelectorAll('.eval-option-item');
    optionCards.forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-optindex'), 10);
        this.userAnswers[this.currentIndex] = idx;
        const answeredCount = this.userAnswers.filter(a => a !== null).length;
        const totalCount = this.quizData?.questions?.length || 5;
        courseProgress.recordEvaluasiProgress(answeredCount, totalCount);
        this.renderQuestionScreen();
      });
    });

    // Question Map Navigation Jump
    const mapBtns = this.container.querySelectorAll('.qmap-btn');
    mapBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetIdx = parseInt(btn.getAttribute('data-qindex'), 10);
        this.currentIndex = targetIdx;
        this.renderQuestionScreen();
      });
    });

    // Previous Button
    const prevBtn = this.container.querySelector('#prev-question-btn');
    if (prevBtn && this.currentIndex > 0) {
      prevBtn.addEventListener('click', () => {
        this.currentIndex--;
        this.renderQuestionScreen();
      });
    }

    // Next Button
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

    // Submit Button
    const submitBtn = this.container.querySelector('#submit-quiz-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const unansweredCount = this.userAnswers.filter(a => a === null).length;
        if (unansweredCount > 0) {
          if (!confirm(`Masih ada ${unansweredCount} soal yang belum dijawab. Apakah Anda yakin ingin menyelesaikan ujian sekarang?`)) {
            return;
          }
        }
        this.calculateResult();
      });
    }
  }

  /* ─── 4. CALCULATE RESULT ─── */
  calculateResult() {
    this.stopTimer();

    let correctCount = 0;
    const questions = this.quizData.questions;

    questions.forEach((q, idx) => {
      if (this.userAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const total = questions.length;
    const scorePercent = Math.round((correctCount / total) * 100);
    const passed = scorePercent >= (this.quizData.passingScorePercent || 70);

    // Sync to SCORM, CourseProgress, and xAPI LRS
    scorm.setCompleted(scorePercent);
    courseProgress.recordEvaluasiComplete(scorePercent);
    xapi.trackQuizCompleted(scorePercent, passed, total);

    this.renderResultScreen(scorePercent, passed, correctCount, total);
  }

  /* ─── 5. RESULT & ANSWER REVIEW SCREEN ─── */
  renderResultScreen(scorePercent, passed, correctCount, total) {
    const questions = this.quizData.questions;

    const html = `
      <div class="evaluasi-page-wrapper">
        <div class="evaluasi-result-card">
          
          <!-- Result Status Banner -->
          <div class="result-banner">
            <div class="result-status-icon">
              ${passed ? '🏆' : '⚠️'}
            </div>
            <h2 class="result-status-title ${passed ? 'passed' : 'failed'}">
              ${passed ? 'Selamat! Anda Lulus Ujian Evaluasi' : 'Belum Mencapai Batas Kelulusan'}
            </h2>
            <div class="result-score-display ${passed ? 'passed' : 'failed'}">
              ${scorePercent}%
            </div>
            <p style="font-size: var(--font-size-body-lg); color: #CBD5E1; max-width: 620px; margin: 0 auto; line-height: 1.6;">
              Anda menjawab benar <strong>${correctCount}</strong> dari <strong>${total}</strong> soal skenario penindakan.<br>
              Batas minimum kelulusan: ${this.quizData.passingScorePercent}%.
            </p>
            <div class="result-scorm-badge">
              <span>${passed ? '✅' : '⚠️'} Status SCORM LMS: <strong>${passed ? 'PASSED (LULUS)' : 'FAILED (BELUM LULUS)'}</strong></span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 36px;">
            <button id="retake-quiz-btn" class="btn btn-ghost btn-lg">
              🔄 Ulangi Ujian
            </button>
            <a href="#/beranda" class="btn btn-secondary btn-lg">
              🏠 Kembali ke Beranda
            </a>
          </div>

          <!-- Detailed Answer Review Section -->
          <div class="evaluasi-review-section">
            <h3 class="review-section-title">
              📋 Pembahasan & Analisis SOP Penindakan
            </h3>

            ${questions.map((q, idx) => {
              const userAns = this.userAnswers[idx];
              const isCorrect = userAns === q.correctIndex;
              const userOptText = userAns !== null ? q.options[userAns] : 'Tidak dijawab';
              const correctOptText = q.options[q.correctIndex];

              return `
                <div class="review-item-card ${isCorrect ? 'is-correct' : 'is-wrong'}">
                  <div class="review-item-header">
                    <div>
                      <div class="review-q-num">Soal ${idx + 1} • ${q.category}</div>
                      <div class="review-q-text">${q.question}</div>
                    </div>
                    <span class="review-result-tag ${isCorrect ? 'correct' : 'wrong'}">
                      ${isCorrect ? 'BENAR (+20)' : 'SALAH (0)'}
                    </span>
                  </div>

                  <div class="review-item-body">
                    <div class="review-ans-row">
                      <div class="ans-line">
                        <span class="ans-label">Jawaban Anda:</span>
                        <span class="ans-value ${isCorrect ? 'correct-val' : 'user-wrong'}">
                          ${userAns !== null ? String.fromCharCode(65 + userAns) + '. ' : ''}${userOptText}
                        </span>
                      </div>
                      ${!isCorrect ? `
                        <div class="ans-line">
                          <span class="ans-label">Jawaban Kunci SOP:</span>
                          <span class="ans-value correct-val">
                            ${String.fromCharCode(65 + q.correctIndex)}. ${correctOptText}
                          </span>
                        </div>
                      ` : ''}
                    </div>

                    <div class="review-explanation-box">
                      <strong>Analisis SOP:</strong> ${q.explanation || 'Pembahasan standar prosedur operasi DJBC.'}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}

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
