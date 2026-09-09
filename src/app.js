import { scorm } from './core/scorm.js';
import { userProfile } from './core/user-profile.js';
import { lrsConfig } from './core/lrs-config.js';
import { AppRouter } from './core/router.js';
import { LRSConfigModal } from './components/lrs-config-modal.js';
import { courseProgress } from './core/progress.js';

export class App {
  static async init() {
    console.log('[App] Initializing Interactive Narcotics Concealment Inspection Simulator...');

    // 1. Initialize SCORM API
    scorm.init();

    // 2. Initialize User Profile & Course Progress Manager
    await userProfile.init();
    courseProgress.init();

    // 3. Setup LRS Button & Status Dot
    const lrsBtn = document.getElementById('lrs-config-btn');
    const lrsDot = document.getElementById('lrs-status-dot');

    if (lrsDot) {
      lrsDot.style.background = lrsConfig.isConfigured() ? '#34C759' : '#64748B';
    }

    if (lrsBtn) {
      lrsBtn.addEventListener('click', () => {
        const modal = new LRSConfigModal();
        modal.render();
      });
    }

    // 4. Sidebar Toggle Listener
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle-btn');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }

    // 5. Initialize Client Router
    const contentArea = document.getElementById('content-area');
    const router = new AppRouter(contentArea);
    router.init();

    // Unload event for SCORM Terminate
    window.addEventListener('beforeunload', () => {
      scorm.terminate();
    });
  }
}
