/**
 * Bottom Carousel Component displaying thumbnails of hotspots for quick access
 */
export class Carousel {
  constructor(container, { onSelectHotspot }) {
    this.container = container;
    this.onSelectHotspot = onSelectHotspot;
    this.activeId = null;
  }

  render(hotspots, activeId = null) {
    this.activeId = activeId;

    if (!hotspots || hotspots.length === 0) {
      this.container.innerHTML = '';
      return;
    }

    const html = `
      <div class="bottom-carousel-bar">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; padding-right: 8px; white-space: nowrap;">
          DAFTAR HOTSPOT:
        </div>
        ${hotspots.map(h => {
          const isActive = h.id === activeId;
          return `
            <div class="carousel-thumb ${isActive ? 'active' : ''}" data-id="${h.id}">
              <img src="${h.mainImage}" alt="${h.label}" onerror="this.onerror=null; this.src='assets/images/central/m1_body_front_xray.png';">
              <div class="carousel-thumb-title">${h.label}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEvents(hotspots);
  }

  attachEvents(hotspots) {
    const thumbs = this.container.querySelectorAll('.carousel-thumb');
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const id = thumb.getAttribute('data-id');
        const item = hotspots.find(h => h.id === id);
        if (item && this.onSelectHotspot) {
          thumbs.forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          this.onSelectHotspot(item);
        }
      });
    });
  }
}
