import { lrsConfig } from '../core/lrs-config.js';

export class LRSConfigModal {
  constructor() {
    this.container = document.getElementById('modal-root');
  }

  render() {
    const config = lrsConfig.getConfig();

    const html = `
      <div id="lrs-modal-backdrop" class="modal-backdrop open">
        <div class="modal-card animate-slide-up">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.3rem;">⚙️</span>
              <h3 style="margin: 0; font-size: 1.1rem; color: #FFF;">Pengaturan LRS / xAPI Analytics</h3>
            </div>
            <button id="close-lrs-modal-btn" class="btn-icon" style="width:32px; height:32px;">✕</button>
          </div>

          <form id="lrs-config-form">
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 16px;">
              Masukkan detail Learning Record Store (LRS) untuk mengirim analytics interaksi peserta secara real-time via xAPI.
            </p>

            <div class="form-group">
              <label for="lrs-endpoint">LRS Endpoint URL</label>
              <input type="url" id="lrs-endpoint" class="form-control" 
                     placeholder="https://lrs.kemenkeu.go.id/xAPI/" 
                     value="${config.endpoint || ''}" required>
            </div>

            <div class="form-group">
              <label for="lrs-username">LRS Basic Auth Username / Key</label>
              <input type="text" id="lrs-username" class="form-control" 
                     placeholder="Contoh: djbc_lms_key" 
                     value="${config.username || ''}" required>
            </div>

            <div class="form-group">
              <label for="lrs-password">LRS Basic Auth Password / Secret</label>
              <input type="password" id="lrs-password" class="form-control" 
                     placeholder="••••••••••••••••" 
                     value="${config.password || ''}" required>
            </div>

            <div class="form-group" style="flex-direction: row; align-items: center; gap: 10px; margin-top: 10px;">
              <input type="checkbox" id="lrs-enabled" ${config.enabled ? 'checked' : ''}>
              <label for="lrs-enabled" style="margin: 0; cursor: pointer;">Aktifkan Pengiriman xAPI Statement</label>
            </div>

            <div id="lrs-test-status" style="margin: 12px 0; font-size: 0.82rem; display: none; padding: 8px 12px; border-radius: 6px;"></div>

            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 20px;">
              <button type="button" id="test-lrs-btn" class="btn btn-outline">Uji Koneksi</button>
              <button type="submit" class="btn btn-gold">Simpan Pengaturan</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    const backdrop = document.getElementById('lrs-modal-backdrop');
    const closeBtn = document.getElementById('close-lrs-modal-btn');
    const form = document.getElementById('lrs-config-form');
    const testBtn = document.getElementById('test-lrs-btn');
    const statusDiv = document.getElementById('lrs-test-status');

    const closeModal = () => {
      backdrop.classList.remove('open');
      setTimeout(() => {
        this.container.innerHTML = '';
      }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    testBtn.addEventListener('click', async () => {
      const endpoint = document.getElementById('lrs-endpoint').value;
      const username = document.getElementById('lrs-username').value;
      const password = document.getElementById('lrs-password').value;

      statusDiv.style.display = 'block';
      statusDiv.style.background = 'rgba(255, 149, 0, 0.2)';
      statusDiv.style.color = '#FFB340';
      statusDiv.innerText = 'Menguji koneksi ke LRS...';

      const res = await lrsConfig.testConnection(endpoint, username, password);

      if (res.success) {
        statusDiv.style.background = 'rgba(52, 199, 89, 0.2)';
        statusDiv.style.color = '#5CD97D';
        statusDiv.innerText = res.message;
      } else {
        statusDiv.style.background = 'rgba(255, 59, 48, 0.2)';
        statusDiv.style.color = '#FF6B6B';
        statusDiv.innerText = res.message;
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const endpoint = document.getElementById('lrs-endpoint').value;
      const username = document.getElementById('lrs-username').value;
      const password = document.getElementById('lrs-password').value;
      const enabled = document.getElementById('lrs-enabled').checked;

      lrsConfig.saveConfig(endpoint, username, password, enabled);

      // Update dot status in header
      const statusDot = document.getElementById('lrs-status-dot');
      if (statusDot) {
        statusDot.style.background = enabled ? '#34C759' : '#64748B';
      }

      closeModal();
    });
  }
}
