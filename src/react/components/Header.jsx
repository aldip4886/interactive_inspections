import React from 'react';
import { useApp } from '../context/AppContext';

export function Header() {
  const { profile, overallProgress, currentRoute, sidebarCollapsed, setSidebarCollapsed, isLrsConfigured } = useApp();

  const titles = {
    beranda: 'Beranda & Panduan',
    modul1: 'Modul 1: Penyelundupan Melalui Tubuh Kurir',
    modul2: 'Modul 2: Penyelundupan Melalui Barang Bawaan',
    modul3: 'Modul 3: Penyelundupan Melalui Barang Kiriman',
    modul4a: 'Modul 4A: Penyelundupan Melalui Kendaraan Darat (SUV)',
    modul4b: 'Modul 4B: Penyelundupan Melalui Kapal Laut Cargo',
    evaluasi: 'Ujian Evaluasi Modus Penyelundupan Narkotika'
  };

  const getInitials = (name) => {
    if (!name) return 'BC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header id="main-header">
      <div className="header-left">
        <button
          id="sidebar-toggle-btn"
          className="btn-icon"
          title="Toggle Sidebar"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>
        <div className="breadcrumb">
          <span id="page-title" className="active-page">
            {titles[currentRoute] || 'Modul Inspeksi DJBC'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Course Progress Bar Widget */}
        <div id="course-header-progress-widget" className="course-header-progress-widget">
          <span className="progress-title">PROGRESS KURSUS:</span>
          <span id="course-progress-pct" className="progress-value font-code-tech">{overallProgress}%</span>
          <div className="progress-track">
            <div id="course-progress-bar-fill" className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>

        {/* LRS Connection Config Button */}
        <button
          id="lrs-config-btn"
          className="btn-icon"
          title="Pengaturan LRS / xAPI Analytics"
          style={{ position: 'relative' }}
          onClick={() => alert('LRS / xAPI Analytics sudah terhubung secara default.')}
        >
          ⚙️
          <span
            id="lrs-status-dot"
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLrsConfigured ? '#34C759' : '#64748B'
            }}
          ></span>
        </button>

        {/* KLC User Profile Widget */}
        <div id="user-profile-widget">
          <div className="user-avatar-container">
            {profile?.avatarUrl ? (
              <img id="user-avatar-img" src={profile.avatarUrl} alt="Avatar" />
            ) : (
              <span id="user-avatar-initials">{getInitials(profile?.name)}</span>
            )}
          </div>
          <div className="user-info-text">
            <span id="user-display-name">{profile?.name || 'Pegawai DJBC'}</span>
            <span id="user-display-role">{profile?.unit || 'Direktorat Jenderal Bea dan Cukai'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
