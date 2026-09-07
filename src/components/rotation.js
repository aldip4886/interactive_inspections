/**
 * 360 Degree Interactive Rotation Control Component
 */
export class RotationControl {
  constructor(container, { onAngleChange }) {
    this.container = container;
    this.onAngleChange = onAngleChange;
    this.currentAngle = 0; // 0 - 359 degrees
    this.isDragging = false;
    this.startX = 0;
    this.startAngle = 0;
  }

  render(initialAngle = 0) {
    this.currentAngle = initialAngle;

    const html = `
      <div class="rotation-control-bar">
        <div class="angle-display">
          <span class="compass-icon">🧭</span>
          <span class="angle-text">${this.currentAngle}°</span>
          <span class="angle-label">${this.getAngleLabel(this.currentAngle)}</span>
        </div>

        <div class="angle-slider-wrapper">
          <input type="range" id="angle-range-slider" min="0" max="359" value="${this.currentAngle}" step="1" class="angle-range-slider">
        </div>

        <div class="angle-quick-btns">
          <button class="angle-btn ${this.isAngleActive(0) ? 'active' : ''}" data-angle="0">0° Depan</button>
          <button class="angle-btn ${this.isAngleActive(90) ? 'active' : ''}" data-angle="90">90° Kanan</button>
          <button class="angle-btn ${this.isAngleActive(180) ? 'active' : ''}" data-angle="180">180° Belakang</button>
          <button class="angle-btn ${this.isAngleActive(270) ? 'active' : ''}" data-angle="270">270° Kiri</button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents();
  }

  getAngleLabel(angle) {
    if (angle >= 315 || angle < 45) return 'Tampak Depan (0°)';
    if (angle >= 45 && angle < 135) return 'Tampak Samping Kanan (90°)';
    if (angle >= 135 && angle < 225) return 'Tampak Belakang (180°)';
    if (angle >= 225 && angle < 315) return 'Tampak Samping Kiri (270°)';
    return `${angle}°`;
  }

  isAngleActive(targetAngle) {
    const diff = Math.abs(this.currentAngle - targetAngle);
    return diff < 45 || diff > 315;
  }

  setAngle(angle) {
    let norm = (angle % 360 + 360) % 360;
    this.currentAngle = Math.round(norm);

    const slider = this.container.querySelector('#angle-range-slider');
    const angleText = this.container.querySelector('.angle-text');
    const angleLabel = this.container.querySelector('.angle-label');
    const btns = this.container.querySelectorAll('.angle-btn');

    if (slider) slider.value = this.currentAngle;
    if (angleText) angleText.textContent = `${this.currentAngle}°`;
    if (angleLabel) angleLabel.textContent = this.getAngleLabel(this.currentAngle);

    btns.forEach(btn => {
      const a = parseInt(btn.getAttribute('data-angle'), 10);
      if (this.isAngleActive(a)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (this.onAngleChange) {
      this.onAngleChange(this.currentAngle);
    }
  }

  attachEvents() {
    const slider = this.container.querySelector('#angle-range-slider');
    const btns = this.container.querySelectorAll('.angle-btn');

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.setAngle(val);
      });
    }

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const a = parseInt(btn.getAttribute('data-angle'), 10);
        this.setAngle(a);
      });
    });

    // Make viewport interactive drag to rotate
    const viewport = document.querySelector('.scene-viewport');
    if (viewport) {
      viewport.addEventListener('mousedown', (e) => {
        if (e.target.closest('.hotspot-marker') || e.target.closest('button')) return;
        this.isDragging = true;
        this.startX = e.clientX;
        this.startAngle = this.currentAngle;
        viewport.style.cursor = 'grabbing';
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.startX;
        // Sensitivity: 1px drag = 0.5 deg rotation
        const newAngle = this.startAngle + Math.round(deltaX * 0.5);
        this.setAngle(newAngle);
      });

      window.addEventListener('mouseup', () => {
        if (this.isDragging) {
          this.isDragging = false;
          if (viewport) viewport.style.cursor = 'default';
        }
      });
    }
  }
}
