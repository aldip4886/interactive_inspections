/**
 * Info Panel Drawer Component for displaying detailed inspection findings
 */
export class InfoPanel {
  constructor(drawerElement) {
    this.drawer = drawerElement;
    this.currentData = null;
  }

  show(hotspotData) {
    this.currentData = hotspotData;

    const badgeClass = hotspotData.badgeType ? `badge-${hotspotData.badgeType}` : 'badge-danger';

    const riskItemsHtml = (hotspotData.riskIndicators || []).map(item => `
      <div class="risk-item">
        <span>⚠️</span>
        <div>${item}</div>
      </div>
    `).join('');

    const actionItemsHtml = (hotspotData.inspectionActions || []).map(item => `
      <div class="action-item">
        <span>🔍</span>
        <div>${item}</div>
      </div>
    `).join('');

    const html = `
      <div class="drawer-header">
        <div>
          <span class="badge ${badgeClass}" style="margin-bottom: 8px;">${hotspotData.badge || 'MODUS PENYELUNDUPAN'}</span>
          <h3 style="margin: 0; font-size: var(--font-size-title-lg); color: var(--color-primary-container); line-height: 1.3;">${hotspotData.label}</h3>
        </div>
        <button id="close-info-drawer-btn" class="btn-icon" style="width:34px; height:34px; flex-shrink: 0;">✕</button>
      </div>

      <div class="drawer-body">
        <!-- Hotspot Main Realistic Image -->
        <div class="drawer-image-container">
          <img src="${hotspotData.mainImage}" alt="${hotspotData.label}" 
               onerror="this.onerror=null; this.src='assets/images/central/m1_body_front_xray.png';">
          <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,25,60,0.85); color: #FFF; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">
            Visual Modus Realistis
          </div>
        </div>

        <!-- Deskripsi Modus -->
        <div>
          <h4 style="font-size: var(--font-size-label-md); font-weight: 700; color: var(--color-primary-container); margin-bottom: 6px;">DESKRIPSI MODUS PENYELUNDUPAN</h4>
          <p style="font-size: var(--font-size-body-md); color: var(--color-on-surface); line-height: 1.6;">${hotspotData.description}</p>
        </div>

        <!-- Indikator Resiko / Anomali -->
        <div>
          <h4 style="font-size: var(--font-size-label-md); font-weight: 700; color: var(--color-warning); margin-bottom: 6px;">INDIKATOR RISIKO & ANOMALI (RED FLAGS)</h4>
          <div class="risk-list">
            ${riskItemsHtml}
          </div>
        </div>

        <!-- Tindakan Inspeksi DJBC -->
        <div>
          <h4 style="font-size: var(--font-size-label-md); font-weight: 700; color: var(--color-info-risk); margin-bottom: 6px;">SOP TINDAKAN INSPEKSI BEA CUKAI</h4>
          <div class="action-list">
            ${actionItemsHtml}
          </div>
        </div>
      </div>
    `;

    this.drawer.innerHTML = html;
    this.drawer.classList.add('open');

    // Attach close listener
    const closeBtn = this.drawer.querySelector('#close-info-drawer-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
  }

  hide() {
    this.drawer.classList.remove('open');
  }
}
