/**
 * SCORM 2004 (4th Edition) / SCORM 1.2 Wrapper Service for KLC2 Integration
 */

export class SCORMManager {
  constructor() {
    this.api = null;
    this.version = null; // '2004' or '1.2'
    this.isInitialized = false;
    this.learnerName = '';
    this.learnerId = '';
  }

  /**
   * Find SCORM API in current window or parent/opener hierarchy
   */
  findAPI(win) {
    let attempts = 0;
    let currentWin = win;

    while (currentWin && attempts < 10) {
      // Try SCORM 2004 first
      if (currentWin.API_1484_11) {
        this.version = '2004';
        return currentWin.API_1484_11;
      }
      // Try SCORM 1.2 fallback
      if (currentWin.API) {
        this.version = '1.2';
        return currentWin.API;
      }

      if (currentWin.parent && currentWin.parent !== currentWin) {
        currentWin = currentWin.parent;
      } else if (currentWin.opener) {
        currentWin = currentWin.opener;
      } else {
        break;
      }
      attempts++;
    }

    return null;
  }

  /**
   * Initialize SCORM session
   */
  init() {
    this.api = this.findAPI(window);

    if (!this.api) {
      console.warn('[SCORM] No SCORM API found. Running in standalone LMS simulation mode.');
      return false;
    }

    try {
      let result = false;
      if (this.version === '2004') {
        result = this.api.Initialize('');
      } else if (this.version === '1.2') {
        result = this.api.LMSInitialize('');
      }

      this.isInitialized = (result === 'true' || result === true);

      if (this.isInitialized) {
        this.fetchLearnerInfo();
        console.log(`[SCORM] Successfully initialized SCORM ${this.version} API.`);
      } else {
        console.error('[SCORM] API Initialize failed.');
      }
    } catch (e) {
      console.error('[SCORM] Exception during initialization:', e);
    }

    return this.isInitialized;
  }

  fetchLearnerInfo() {
    if (!this.isInitialized) return;

    if (this.version === '2004') {
      this.learnerName = this.getValue('cmi.learner_name');
      this.learnerId = this.getValue('cmi.learner_id');
    } else {
      this.learnerName = this.getValue('cmi.core.student_name');
      this.learnerId = this.getValue('cmi.core.student_id');
    }
  }

  getValue(element) {
    if (!this.isInitialized || !this.api) return '';
    try {
      if (this.version === '2004') {
        return this.api.GetValue(element);
      } else {
        return this.api.LMSGetValue(element);
      }
    } catch (e) {
      console.error(`[SCORM] GetValue failed for ${element}`, e);
      return '';
    }
  }

  setValue(element, value) {
    if (!this.isInitialized || !this.api) return false;
    try {
      let res;
      if (this.version === '2004') {
        res = this.api.SetValue(element, String(value));
      } else {
        res = this.api.LMSSetValue(element, String(value));
      }
      return (res === 'true' || res === true);
    } catch (e) {
      console.error(`[SCORM] SetValue failed for ${element}`, e);
      return false;
    }
  }

  commit() {
    if (!this.isInitialized || !this.api) return false;
    try {
      if (this.version === '2004') {
        return this.api.Commit('') === 'true';
      } else {
        return this.api.LMSCommit('') === 'true';
      }
    } catch (e) {
      console.error('[SCORM] Commit failed', e);
      return false;
    }
  }

  terminate() {
    if (!this.isInitialized || !this.api) return false;
    try {
      let res;
      if (this.version === '2004') {
        res = this.api.Terminate('');
      } else {
        res = this.api.LMSFinish('');
      }
      this.isInitialized = false;
      return (res === 'true' || res === true);
    } catch (e) {
      console.error('[SCORM] Terminate failed', e);
      return false;
    }
  }

  setBookmark(location) {
    if (this.version === '2004') {
      this.setValue('cmi.location', location);
    } else {
      this.setValue('cmi.core.lesson_location', location);
    }
    this.commit();
  }

  getBookmark() {
    if (this.version === '2004') {
      return this.getValue('cmi.location');
    } else {
      return this.getValue('cmi.core.lesson_location');
    }
  }

  setCompleted(scorePercent = 100) {
    if (this.version === '2004') {
      this.setValue('cmi.completion_status', 'completed');
      this.setValue('cmi.success_status', scorePercent >= 70 ? 'passed' : 'failed');
      this.setValue('cmi.score.scaled', (scorePercent / 100).toFixed(2));
      this.setValue('cmi.score.raw', scorePercent);
      this.setValue('cmi.score.min', '0');
      this.setValue('cmi.score.max', '100');
    } else {
      this.setValue('cmi.core.lesson_status', scorePercent >= 70 ? 'passed' : 'completed');
      this.setValue('cmi.core.score.raw', scorePercent);
    }
    this.commit();
  }
}

export const scorm = new SCORMManager();
