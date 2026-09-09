import React from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BerandaView } from './views/BerandaView';
import { LegacyModuleWrapper } from './components/LegacyModuleWrapper';

import { Modul1View } from '../modules/modul1/modul1.js';
import { Modul2View } from '../modules/modul2/modul2.js';
import { Modul3View } from '../modules/modul3/modul3.js';
import { Modul4aView } from '../modules/modul4a/modul4a.js';
import { Modul4bView } from '../modules/modul4b/modul4b.js';
import { EvaluasiView } from '../modules/evaluasi/evaluasi.js';

export function App() {
  const { currentRoute, overallProgress } = useApp();

  const renderContent = () => {
    switch (currentRoute) {
      case 'beranda':
        return <BerandaView />;
      case 'modul1':
        return <LegacyModuleWrapper ViewClass={Modul1View} moduleId="modul1" />;
      case 'modul2':
        return <LegacyModuleWrapper ViewClass={Modul2View} moduleId="modul2" />;
      case 'modul3':
        return <LegacyModuleWrapper ViewClass={Modul3View} moduleId="modul3" />;
      case 'modul4a':
        return <LegacyModuleWrapper ViewClass={Modul4aView} moduleId="modul4a" />;
      case 'modul4b':
        return <LegacyModuleWrapper ViewClass={Modul4bView} moduleId="modul4b" />;
      case 'evaluasi':
        return <LegacyModuleWrapper ViewClass={EvaluasiView} moduleId="evaluasi" />;
      default:
        return <BerandaView />;
    }
  };

  return (
    <div id="app-container">
      <Sidebar />
      <main id="main-wrapper">
        <Header />
        {/* Sticky Top Gold Progress Fill Line */}
        <div className="top-progress-line-container">
          <div id="top-progress-line" className="top-progress-line" style={{ width: `${overallProgress}%` }}></div>
        </div>
        {/* Content Area */}
        <div id="content-area">
          {renderContent()}
        </div>
      </main>
      <div id="modal-root"></div>
    </div>
  );
}
