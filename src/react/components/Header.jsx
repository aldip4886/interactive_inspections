import React from 'react';
import { useApp } from '../context/AppContext';
import { userProfile } from '../../core/user-profile.js';

export function Header() {
  const { profile, overallProgress, currentRoute, sidebarCollapsed, setSidebarCollapsed } = useApp();

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
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleProfileClick = () => {
    userProfile.showProfileDetailModal(profile);
  };

  const avatarSrc = profile?.avatarUrl || profile?.picture;
  const nameDisplay = profile?.name || 'Pegawai';
  const roleDisplay = (profile?.nip && profile.nip !== '-')
    ? `NIP. ${profile.nip}`
    : (profile?.userType || profile?.role || 'Pegawai Kementerian Keuangan');

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
          <span className="progress-title">PROGRESS</span>
          <span id="course-progress-pct" className="progress-value font-code-tech">{overallProgress}%</span>
          <div className="progress-track">
            <div id="course-progress-bar-fill" className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>

        {/* KLC User Profile Widget */}
        <div
          id="user-profile-widget"
          className="user-profile-widget"
          onClick={handleProfileClick}
          style={{ cursor: 'pointer' }}
          title="Klik untuk melihat detail profil KLC2"
        >
          <div className="user-avatar-container">
            {avatarSrc ? (
              <img
                id="user-avatar-img"
                className="user-avatar-img"
                src={avatarSrc}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const initialsEl = e.target.nextElementSibling;
                  if (initialsEl) initialsEl.style.display = 'flex';
                }}
              />
            ) : null}
            <span
              id="user-avatar-initials"
              className="user-avatar-initials"
              style={{ display: avatarSrc ? 'none' : 'flex' }}
            >
              {getInitials(nameDisplay)}
            </span>
          </div>
          <div className="user-info-text">
            <span id="user-display-name" className="user-display-name">{nameDisplay}</span>
            <span id="user-display-role" className="user-display-role">{roleDisplay}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

