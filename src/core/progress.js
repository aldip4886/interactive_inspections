import { scorm } from './scorm.js';
import { xapi } from './xapi.js';

/**
 * Course Progress Manager
 * Tracks overall course progress across Beranda, Modul 1-4b, and Evaluasi.
 * Syncs state to localStorage, SCORM LMS, and LRS via xAPI.
 */
export class CourseProgressManager {
  constructor() {
    this.STORAGE_KEY = 'elearning_narkotika_progress_v1';
    this.currentProgressPct = 0;
    
    // Module hotspot totals
    this.moduleTotals = {
      modul1: 8,
      modul2: 6,
      modul3: 6,
      modul4a: 6,
      modul4b: 6
    };

    this.state = {
      berandaVisited: false,
      visitedHotspots: {
        modul1: [],
        modul2: [],
        modul3: [],
        modul4a: [],
        modul4b: []
      },
      evaluasiCompleted: false,
      evaluasiScore: 0
    };
  }

  init() {
    this.loadState();
    const overallPct = this.getOverallProgress();
    this.currentProgressPct = overallPct;
    window.currentCourseProgressPct = overallPct;
    this.updateDOM();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn('[ProgressManager] Could not load stored progress:', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('[ProgressManager] Could not save progress:', e);
    }
    
    const overallPct = this.getOverallProgress();
    const prevPct = this.currentProgressPct;

    // Save and sync course progress percentage in variable
    this.currentProgressPct = overallPct;
    window.currentCourseProgressPct = overallPct;

    if (scorm && typeof scorm.setValue === 'function') {
      try {
        if (scorm.version === '2004') {
          scorm.setValue('cmi.score.scaled', (overallPct / 100).toFixed(2));
          scorm.setValue('cmi.score.raw', overallPct);
        } else {
          scorm.setValue('cmi.core.score.raw', overallPct);
        }
        if (overallPct >= 100) {
          scorm.setCompleted(overallPct);
        }
      } catch (err) {
        // ignore SCORM errors in standalone mode
      }
    }

    // Send xAPI statement to LRS whenever progress percentage updates
    if (overallPct !== prevPct && xapi && typeof xapi.trackCourseProgress === 'function') {
      xapi.trackCourseProgress(overallPct);
    }

    this.updateDOM();
  }

  recordModuleVisit(routeKey) {
    if (routeKey === 'beranda') {
      this.state.berandaVisited = true;
      this.saveState();
    }
  }

  recordHotspotVisit(moduleId, hotspotId) {
    if (!this.state.visitedHotspots[moduleId]) {
      this.state.visitedHotspots[moduleId] = [];
    }
    if (!this.state.visitedHotspots[moduleId].includes(hotspotId)) {
      this.state.visitedHotspots[moduleId].push(hotspotId);
      this.saveState();
    }
  }

  recordEvaluasiComplete(score) {
    this.state.evaluasiCompleted = true;
    this.state.evaluasiScore = Math.max(this.state.evaluasiScore || 0, score);
    this.saveState();
  }

  getModuleProgress(moduleId) {
    const total = this.moduleTotals[moduleId] || 6;
    const visited = (this.state.visitedHotspots[moduleId] || []).length;
    return Math.min(100, Math.round((visited / total) * 100));
  }

  getOverallProgress() {
    // Breakdown:
    // Beranda: 10%
    // Modul 1: 15%
    // Modul 2: 15%
    // Modul 3: 15%
    // Modul 4a: 15%
    // Modul 4b: 15%
    // Evaluasi: 15%
    let total = 0;
    if (this.state.berandaVisited) total += 10;

    const modKeys = ['modul1', 'modul2', 'modul3', 'modul4a', 'modul4b'];
    modKeys.forEach(m => {
      const pct = this.getModuleProgress(m);
      total += (pct / 100) * 15;
    });

    if (this.state.evaluasiCompleted) {
      const evalPct = Math.min(100, this.state.evaluasiScore || 70);
      total += (evalPct / 100) * 15;
    }

    return Math.min(100, Math.round(total));
  }

  updateDOM() {
    const overallPct = this.getOverallProgress();
    this.currentProgressPct = overallPct;
    window.currentCourseProgressPct = overallPct;

    // 1. Header Course Progress Widget
    const headerPctText = document.getElementById('course-progress-pct');
    const headerBarFill = document.getElementById('course-progress-bar-fill');
    const topProgressLine = document.getElementById('top-progress-line');

    if (headerPctText) headerPctText.textContent = `${overallPct}%`;
    if (headerBarFill) headerBarFill.style.width = `${overallPct}%`;
    if (topProgressLine) topProgressLine.style.width = `${overallPct}%`;

    // 2. Update page-specific progress elements if present
    const modKeys = ['modul1', 'modul2', 'modul3', 'modul4a', 'modul4b'];
    modKeys.forEach(m => {
      const modPct = this.getModuleProgress(m);
      const modText = document.getElementById(`${m}-progress-pct`);
      const modFill = document.getElementById(`${m}-progress-fill`);
      if (modText) modText.textContent = `${modPct}%`;
      if (modFill) modFill.style.width = `${modPct}%`;
    });
  }
}

export const courseProgress = new CourseProgressManager();
