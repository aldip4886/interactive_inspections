import { lrsConfig } from './lrs-config.js';
import { userProfile } from './user-profile.js';

/**
 * Standard xAPI Statement Builder and Sender
 */
export class XAPIEngine {
  constructor() {
    this.BASE_URL = window.location.origin + window.location.pathname;
  }

  getVerbs() {
    return {
      launched: { id: 'http://adlnet.gov/expapi/verbs/launched', display: { 'id-ID': 'memulai' } },
      initialized: { id: 'http://adlnet.gov/expapi/verbs/initialized', display: { 'id-ID': 'menginisialisasi' } },
      interacted: { id: 'http://adlnet.gov/expapi/verbs/interacted', display: { 'id-ID': 'berinteraksi' } },
      viewed: { id: 'http://id.tincanapi.com/verb/viewed', display: { 'id-ID': 'melihat' } },
      answered: { id: 'http://adlnet.gov/expapi/verbs/answered', display: { 'id-ID': 'menjawab' } },
      completed: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { 'id-ID': 'menyelesaikan' } },
      passed: { id: 'http://adlnet.gov/expapi/verbs/passed', display: { 'id-ID': 'lulus' } },
      failed: { id: 'http://adlnet.gov/expapi/verbs/failed', display: { 'id-ID': 'gagal' } }
    };
  }

  buildStatement({ verb, activityId, activityName, activityDesc, result, contextExtensions }) {
    const actor = userProfile.getActorForXAPI();

    const statement = {
      actor,
      verb,
      object: {
        objectType: 'Activity',
        id: `${this.BASE_URL}#/${activityId}`,
        definition: {
          name: { 'id-ID': activityName, 'en-US': activityName },
          description: { 'id-ID': activityDesc || activityName }
        }
      },
      timestamp: new Date().toISOString(),
      context: {
        registration: this.getRegistrationId(),
        contextActivities: {
          parent: [
            {
              id: `${this.BASE_URL}#/module-inspection-suite`,
              definition: { name: { 'id-ID': 'Modul Interaktif Penyelundupan Narkotika DJBC' } }
            }
          ]
        },
        extensions: {
          'http://klc2.kemenkeu.go.id/xapi/extensions/unit': userProfile.getProfile().unit,
          'http://klc2.kemenkeu.go.id/xapi/extensions/role': userProfile.getProfile().role,
          ...(contextExtensions || {})
        }
      }
    };

    if (result) {
      statement.result = result;
    }

    return statement;
  }

  getRegistrationId() {
    let reg = sessionStorage.getItem('xapi_registration_id');
    if (!reg) {
      reg = 'reg-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
      sessionStorage.setItem('xapi_registration_id', reg);
    }
    return reg;
  }

  async sendStatement(statement) {
    console.log('[xAPI Statement Generated]', statement);

    if (!lrsConfig.isConfigured()) {
      return { sent: false, reason: 'LRS not configured or disabled' };
    }

    const config = lrsConfig.getConfig();
    const endpoint = config.endpoint + 'statements';

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Experience-API-Version': '1.0.3',
          'Authorization': lrsConfig.getAuthHeader()
        },
        body: JSON.stringify(statement)
      });

      if (resp.ok) {
        console.log('[xAPI Statement Successfully Sent to LRS]');
        return { sent: true };
      } else {
        console.warn(`[xAPI Send Failed] HTTP ${resp.status}`, await resp.text().catch(() => ''));
        return { sent: false, reason: `HTTP ${resp.status}` };
      }
    } catch (e) {
      console.error('[xAPI Exception]', e);
      return { sent: false, reason: e.message };
    }
  }

  // Helper Statement Generators
  trackModuleView(moduleId, moduleName) {
    const verbs = this.getVerbs();
    const stmt = this.buildStatement({
      verb: verbs.launched,
      activityId: moduleId,
      activityName: `Modul Inspeksi: ${moduleName}`,
      activityDesc: `Peserta membuka halaman modul ${moduleName}`
    });
    this.sendStatement(stmt);
  }

  trackHotspotClick(moduleId, hotspotId, label, category) {
    const verbs = this.getVerbs();
    const stmt = this.buildStatement({
      verb: verbs.interacted,
      activityId: `${moduleId}/hotspot/${hotspotId}`,
      activityName: `Hotspot: ${label}`,
      activityDesc: `Peserta mengeklik hotspot ${label} pada modul ${moduleId}`,
      contextExtensions: {
        'http://klc2.kemenkeu.go.id/xapi/extensions/category': category,
        'http://klc2.kemenkeu.go.id/xapi/extensions/module': moduleId
      }
    });
    this.sendStatement(stmt);
  }

  trackQuizCompleted(score, passed, totalQuestions) {
    const verbs = this.getVerbs();
    const verb = passed ? verbs.passed : verbs.failed;
    const stmt = this.buildStatement({
      verb,
      activityId: 'evaluasi-narkotika-djbc',
      activityName: 'Ujian Evaluasi Modus Penyelundupan Narkotika',
      result: {
        score: {
          scaled: (score / 100).toFixed(2),
          raw: score,
          min: 0,
          max: 100
        },
        success: passed,
        completion: true
      }
    });
    this.sendStatement(stmt);
  }

  trackModuleProgress(moduleId, modulePct) {
    const moduleNames = {
      modul1: 'Modul 1: Penyelundupan Melalui Tubuh Kurir',
      modul2: 'Modul 2: Penyelundupan Melalui Barang Bawaan',
      modul3: 'Modul 3: Penyelundupan Melalui Barang Kiriman',
      modul4a: 'Modul 4A: Penyelundupan Melalui Kendaraan Darat (SUV)',
      modul4b: 'Modul 4B: Penyelundupan Melalui Kapal Laut Cargo',
      evaluasi: 'Ujian Evaluasi Modus Penyelundupan Narkotika'
    };
    const modTitle = moduleNames[moduleId] || `Modul ${moduleId}`;

    const verb = modulePct >= 100
      ? { id: 'http://adlnet.gov/expapi/verbs/completed', display: { 'id-ID': 'menyelesaikan', 'en-US': 'completed' } }
      : { id: 'http://adlnet.gov/expapi/verbs/progressed', display: { 'id-ID': 'mengalami kemajuan', 'en-US': 'progressed' } };

    const stmt = this.buildStatement({
      verb,
      activityId: `progress/${moduleId}`,
      activityName: `Progress ${modTitle}`,
      activityDesc: `Kemajuan penyelesaian ${modTitle} mencapai ${modulePct}%`,
      result: {
        score: {
          scaled: Number((modulePct / 100).toFixed(2)),
          raw: modulePct,
          min: 0,
          max: 100
        },
        completion: modulePct >= 100
      },
      contextExtensions: {
        'http://klc2.kemenkeu.go.id/xapi/extensions/module-id': moduleId,
        'http://klc2.kemenkeu.go.id/xapi/extensions/module-progress': modulePct
      }
    });

    return this.sendStatement(stmt);
  }

  trackCourseProgress(progressPct, moduleProgressMap) {
    const currentPct = progressPct !== undefined ? progressPct : (window.currentCourseProgressPct || 0);

    const verb = currentPct >= 100
      ? { id: 'http://adlnet.gov/expapi/verbs/completed', display: { 'id-ID': 'menyelesaikan', 'en-US': 'completed' } }
      : { id: 'http://adlnet.gov/expapi/verbs/progressed', display: { 'id-ID': 'mengalami kemajuan', 'en-US': 'progressed' } };

    const stmt = this.buildStatement({
      verb,
      activityId: 'course-progress-tracker',
      activityName: 'Progress Total Kursus Penyelundupan Narkotika DJBC',
      activityDesc: `Kemajuan total seluruh modul kursus peserta mencapai ${currentPct}%`,
      result: {
        score: {
          scaled: Number((currentPct / 100).toFixed(2)),
          raw: currentPct,
          min: 0,
          max: 100
        },
        completion: currentPct >= 100
      },
      contextExtensions: {
        'http://klc2.kemenkeu.go.id/xapi/extensions/course-progress': currentPct,
        ...(moduleProgressMap ? { 'http://klc2.kemenkeu.go.id/xapi/extensions/modules-progress': moduleProgressMap } : {})
      }
    });
    return this.sendStatement(stmt);
  }
}

export const xapi = new XAPIEngine();
