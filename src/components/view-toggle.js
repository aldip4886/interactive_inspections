/**
 * View Toggle Component for switching Central Scene variants (e.g. X-Ray vs Normal)
 */
export class ViewToggle {
  constructor(container, { onViewChange }) {
    this.container = container;
    this.onViewChange = onViewChange;
    this.currentViewKey = '';
  }

  render(viewsObject, activeKey) {
    this.currentViewKey = activeKey;
    const keys = Object.keys(viewsObject || {});

    if (keys.length <= 1) {
      this.container.innerHTML = '';
      return;
    }

    const html = `
      <div class="view-mode-toggle">
        ${keys.map(key => {
          const item = viewsObject[key];
          const isActive = key === activeKey;
          return `
            <button class="view-mode-btn ${isActive ? 'active' : ''}" data-key="${key}">
              ${item.label || key.toUpperCase()}
            </button>
          `;
        }).join('')}
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    const btns = this.container.querySelectorAll('.view-mode-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        if (key && key !== this.currentViewKey) {
          this.currentViewKey = key;
          btns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (this.onViewChange) this.onViewChange(key);
        }
      });
    });
  }
}
