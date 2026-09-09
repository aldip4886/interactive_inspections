import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export function LegacyModuleWrapper({ ViewClass, moduleId }) {
  const containerRef = useRef(null);
  const { refreshProgress } = useApp();

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const instance = new ViewClass(containerRef.current);
    instance.render().then(() => {
      refreshProgress();
    });
  }, [ViewClass, moduleId]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
}
