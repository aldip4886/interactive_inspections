import { BaseModuleView } from '../../core/base-module.js';

export class Modul1View extends BaseModuleView {
  constructor(container) {
    super(container, 'src/data/modul1-hotspots.json');
  }
}
