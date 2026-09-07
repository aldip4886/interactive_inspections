import { BerandaView } from '../modules/beranda/beranda.js';
import { Modul1View } from '../modules/modul1/modul1.js';
import { Modul2View } from '../modules/modul2/modul2.js';
import { Modul3View } from '../modules/modul3/modul3.js';
import { Modul4aView } from '../modules/modul4a/modul4a.js';
import { Modul4bView } from '../modules/modul4b/modul4b.js';
import { EvaluasiView } from '../modules/evaluasi/evaluasi.js';
import { scorm } from './scorm.js';

export class AppRouter {
  constructor(contentContainer) {
    this.container = contentContainer;
    this.routes = {
      'beranda': BerandaView,
      'modul1': Modul1View,
      'modul2': Modul2View,
      'modul3': Modul3View,
      'modul4a': Modul4aView,
      'modul4b': Modul4bView,
      'evaluasi': EvaluasiView
    };
    this.currentViewInstance = null;
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());

    // Restore last bookmark if available from SCORM
    const bookmark = scorm.getBookmark();
    if (bookmark && this.routes[bookmark] && !window.location.hash) {
      window.location.hash = `#/${bookmark}`;
    } else if (!window.location.hash) {
      window.location.hash = '#/beranda';
    }

    this.handleRoute();
  }

  async handleRoute() {
    const rawHash = window.location.hash.replace(/^#\//, '') || 'beranda';
    const routeKey = rawHash.toLowerCase();

    const ViewClass = this.routes[routeKey] || BerandaView;

    // Update active nav state in sidebar
    this.updateSidebarActive(routeKey);

    // Save SCORM bookmark
    scorm.setBookmark(routeKey);

    // Render View
    this.currentViewInstance = new ViewClass(this.container);
    await this.currentViewInstance.render();

    // Scroll to top
    this.container.scrollTop = 0;
  }

  updateSidebarActive(routeKey) {
    const navItems = document.querySelectorAll('#sidebar .nav-item');
    navItems.forEach(item => {
      const itemRoute = item.getAttribute('data-route');
      if (itemRoute === routeKey) {
        item.classList.add('active');
        item.style.color = 'var(--accent-gold)';
        item.style.background = 'var(--bg-dark-600)';
      } else {
        item.classList.remove('active');
        item.style.color = 'var(--text-secondary)';
        item.style.background = 'transparent';
      }
    });

    const pageTitle = document.getElementById('page-title');
    const titles = {
      'beranda': 'Beranda & Panduan Inspeksi',
      'modul1': 'Modul 1: Penyelundupan Melalui Tubuh Kurir',
      'modul2': 'Modul 2: Penyelundupan Melalui Barang Bawaan',
      'modul3': 'Modul 3: Penyelundupan Melalui Barang Kiriman',
      'modul4a': 'Modul 4A: Penyelundupan Melalui Kendaraan Darat (SUV)',
      'modul4b': 'Modul 4B: Penyelundupan Melalui Kapal Laut Cargo',
      'evaluasi': 'Ujian Evaluasi Modus Penyelundupan Narkotika'
    };
    if (pageTitle) {
      pageTitle.textContent = titles[routeKey] || 'Modul Inspeksi DJBC';
    }
  }
}
