/**
 * ==========================================================================
 * XRayMagnifier Component — DJBC Interactive Inspection Module
 * Dual-layer image viewer with real-time circular lens reveal (CSS clip-path)
 * ==========================================================================
 */

export class XRayMagnifier {
  constructor({
    container,
    normalSrc,
    xraySrc,
    initialRadius = 92,
    initialMode = 'lens',
    onPositionChange = null
  }) {
    this.container = container;
    this.normalSrc = normalSrc;
    this.xraySrc = xraySrc;
    this.radius = initialRadius;
    this.currentMode = initialMode;
    this.onPositionChange = onPositionChange;
    this.isPointerInside = false;

    this.initDOM();
    this.attachEvents();
    this.setMode(this.currentMode);
  }

  initDOM() {
    this.container.classList.add('xray-magnifier-stage');

    // Buat struktur layer gambar dan kursor lensa
    this.container.innerHTML = `
      <div class="xray-layers-wrap" id="xray-layers-wrap">
        <!-- Layer 1: Tampak Normal (Dasar) -->
        <img class="xray-layer xray-layer-normal" src="${this.normalSrc}" alt="Tampak Luar Normal" draggable="false" />
        
        <!-- Layer 2: Tampak Sinar-X (Di-masking via clip-path) -->
        <img class="xray-layer xray-layer-revealed" src="${this.xraySrc}" alt="Tampak X-Ray Tembus Pandang" draggable="false" />
      </div>

      <!-- Layer Hotspot Pin -->
      <div class="xray-hotspots-overlay" id="xray-hotspots-overlay"></div>

      <!-- Reticle Lensa Kaca Pembesar -->
      <div class="xray-reticle-lens" id="xray-reticle-lens">
        <div class="lens-crosshair-lines"></div>
        <div class="lens-target-circle"></div>
        <div class="lens-telemetry-badge font-code-tech">X-RAY LENS</div>
      </div>
    `;

    this.layerNormal = this.container.querySelector('.xray-layer-normal');
    this.layerRevealed = this.container.querySelector('.xray-layer-revealed');
    this.reticleLens = this.container.querySelector('#xray-reticle-lens');
    this.hotspotsOverlay = this.container.querySelector('#xray-hotspots-overlay');

    this.updateLensSize(this.radius);
  }

  attachEvents() {
    this.onMouseMove = (e) => this.handlePointerMove(e.clientX, e.clientY);
    this.onMouseEnter = () => {
      if (this.currentMode === 'lens') {
        this.isPointerInside = true;
        this.reticleLens.classList.add('active');
      }
    };
    this.onMouseLeave = () => {
      if (this.currentMode === 'lens') {
        this.isPointerInside = false;
        this.reticleLens.classList.remove('active');
        this.layerRevealed.style.clipPath = 'circle(0px at 50% 50%)';
        if (this.onPositionChange) this.onPositionChange(null, null);
      }
    };

    // Touch events for tablet/smartphone
    this.onTouchMove = (e) => {
      if (e.touches && e.touches.length > 0) {
        e.preventDefault();
        this.handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    this.onTouchEnd = () => {
      if (this.currentMode === 'lens') {
        this.isPointerInside = false;
        this.reticleLens.classList.remove('active');
        this.layerRevealed.style.clipPath = 'circle(0px at 50% 50%)';
        if (this.onPositionChange) this.onPositionChange(null, null);
      }
    };

    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('mouseenter', this.onMouseEnter);
    this.container.addEventListener('mouseleave', this.onMouseLeave);
    this.container.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.container.addEventListener('touchend', this.onTouchEnd);
  }

  handlePointerMove(clientX, clientY) {
    if (this.currentMode !== 'lens') return;

    const rect = this.container.getBoundingClientRect();
    const baseW = this.container.offsetWidth || rect.width || 1;
    const baseH = this.container.offsetHeight || rect.height || 1;
    const scaleX = rect.width / baseW || 1;
    const scaleY = rect.height / baseH || 1;
    const x = (clientX - rect.left) / scaleX;
    const y = (clientY - rect.top) / scaleY;

    if (x < 0 || x > baseW || y < 0 || y > baseH) {
      this.reticleLens.classList.remove('active');
      this.layerRevealed.style.clipPath = 'circle(0px at 50% 50%)';
      return;
    }

    this.reticleLens.classList.add('active');
    this.reticleLens.style.left = `${x}px`;
    this.reticleLens.style.top = `${y}px`;

    // Update clipping mask
    this.layerRevealed.style.clipPath = `circle(${this.radius}px at ${x}px ${y}px)`;

    // Callback persentase koordinat
    if (this.onPositionChange) {
      const pctX = (x / baseW) * 100;
      const pctY = (y / baseH) * 100;
      this.onPositionChange(pctX, pctY);
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    if (mode === 'lens') {
      this.layerNormal.style.opacity = '1';
      this.layerRevealed.style.opacity = '1';
      this.layerRevealed.style.clipPath = 'circle(0px at 50% 50%)';
      this.reticleLens.classList.remove('active');
    } else if (mode === 'xray') {
      this.layerNormal.style.opacity = '0';
      this.layerRevealed.style.opacity = '1';
      this.layerRevealed.style.clipPath = 'circle(150% at 50% 50%)';
      this.reticleLens.classList.remove('active');
    } else if (mode === 'normal') {
      this.layerNormal.style.opacity = '1';
      this.layerRevealed.style.opacity = '0';
      this.layerRevealed.style.clipPath = 'circle(0px at 50% 50%)';
      this.reticleLens.classList.remove('active');
    }
  }

  setRadius(newRadius) {
    this.radius = parseInt(newRadius, 10);
    this.updateLensSize(this.radius);
  }

  updateLensSize(r) {
    const diameter = r * 2;
    this.reticleLens.style.width = `${diameter}px`;
    this.reticleLens.style.height = `${diameter}px`;
  }

  getHotspotsContainer() {
    return this.hotspotsOverlay;
  }

  destroy() {
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('mouseenter', this.onMouseEnter);
    this.container.removeEventListener('mouseleave', this.onMouseLeave);
    this.container.removeEventListener('touchmove', this.onTouchMove);
    this.container.removeEventListener('touchend', this.onTouchEnd);
  }
}
