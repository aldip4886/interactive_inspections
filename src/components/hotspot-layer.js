/**
 * Interactive Hotspot Layer Component
 */
export class HotspotLayer {
  constructor(container, { onHotspotClick }) {
    this.container = container;
    this.onHotspotClick = onHotspotClick;
    this.visitedSet = new Set();
    this.activeFilter = 'all';
    this.activeView = 'front';
    this.hotspots = [];
  }

  render(hotspots, activeView = 'front', activeFilter = 'all', currentAngle = 0) {
    this.hotspots = hotspots;
    this.activeView = activeView;
    this.activeFilter = activeFilter;

    // Filter hotspots matching current view, category, and 360 degree angle
    const visibleHotspots = hotspots.filter(h => {
      const matchView = h.view ? (h.view === activeView) : true;
      const matchFilter = (activeFilter === 'all') || (h.category === activeFilter);
      
      let matchAngle = true;
      if (h.angleMin !== undefined && h.angleMax !== undefined) {
        if (h.angleMin <= h.angleMax) {
          matchAngle = currentAngle >= h.angleMin && currentAngle <= h.angleMax;
        } else {
          // Crosses 360/0 wrap around
          matchAngle = currentAngle >= h.angleMin || currentAngle <= h.angleMax;
        }
      }
      return matchView && matchFilter && matchAngle;
    });


    this.container.innerHTML = visibleHotspots.map(h => {
      const isVisited = this.visitedSet.has(h.id);
      return `
        <div class="hotspot-marker ${isVisited ? 'visited' : ''} animate-fade-in" 
             data-id="${h.id}" 
             style="left: ${h.position.x}%; top: ${h.position.y}%;">
          <div class="hotspot-pulse"></div>
          <div class="hotspot-inner"></div>
          <div class="hotspot-tooltip">${h.label}</div>
        </div>
      `;
    }).join('');

    this.attachEvents();
  }

  attachEvents() {
    const markers = this.container.querySelectorAll('.hotspot-marker');
    markers.forEach(marker => {
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = marker.getAttribute('data-id');
        this.visitedSet.add(id);
        marker.classList.add('visited');

        const data = this.hotspots.find(h => h.id === id);
        if (data && this.onHotspotClick) {
          this.onHotspotClick(data);
        }
      });
    });
  }

  markVisited(id) {
    this.visitedSet.add(id);
    const marker = this.container.querySelector(`.hotspot-marker[data-id="${id}"]`);
    if (marker) marker.classList.add('visited');
  }

  getVisitedCount() {
    return this.visitedSet.size;
  }
}
