import React, { createContext, useContext, useState, useEffect } from 'react';
import { scorm } from '../../core/scorm.js';
import { courseProgress } from '../../core/progress.js';
import { userProfile } from '../../core/user-profile.js';
import { lrsConfig } from '../../core/lrs-config.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(userProfile.getProfile() || userProfile.DEFAULT_PROFILE);
  const [overallProgress, setOverallProgress] = useState(courseProgress.getOverallProgress() || 0);
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    return hash || scorm.getBookmark() || 'beranda';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLrsConfigured, setIsLrsConfigured] = useState(lrsConfig.isConfigured());

  useEffect(() => {
    scorm.init();
    userProfile.init().then(p => {
      if (p) setProfile(p);
    });
    courseProgress.init();
    setOverallProgress(courseProgress.getOverallProgress());

    const onHashChange = () => {
      const route = window.location.hash.replace(/^#\/?/, '') || 'beranda';
      setCurrentRoute(route);
      scorm.setBookmark(route);
      courseProgress.recordModuleVisit(route);
      setOverallProgress(courseProgress.getOverallProgress());
    };

    window.addEventListener('hashchange', onHashChange);
    const onBeforeUnload = () => scorm.terminate();
    window.addEventListener('beforeunload', onBeforeUnload);

    if (!window.location.hash) {
      const bookmark = scorm.getBookmark() || 'beranda';
      window.location.hash = `#/${bookmark}`;
    }

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  const navigate = (route) => {
    window.location.hash = `#/${route}`;
  };

  const refreshProgress = () => {
    const pct = courseProgress.getOverallProgress();
    setOverallProgress(pct);
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        overallProgress,
        currentRoute,
        navigate,
        sidebarCollapsed,
        setSidebarCollapsed,
        isLrsConfigured,
        setIsLrsConfigured,
        refreshProgress
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
