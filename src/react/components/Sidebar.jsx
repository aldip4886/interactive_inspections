import React from 'react';
import { useApp } from '../context/AppContext';

export function Sidebar() {
  const { currentRoute, sidebarCollapsed, navigate } = useApp();

  const navItems = [
    {
      id: 'beranda',
      label: 'Beranda & Panduan',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      )
    },
    { type: 'header', label: 'KATEGORI MODUL' },
    {
      id: 'modul1',
      label: '1. Tubuh Kurir',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )
    },
    {
      id: 'modul2',
      label: '2. Barang Bawaan',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 6h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-3h2v3h-2V3z" />
        </svg>
      )
    },
    {
      id: 'modul3',
      label: '3. Barang Kiriman',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.1-.89-2-2-2zm-6 0h-4V4h4v2z" />
        </svg>
      )
    },
    {
      id: 'modul4a',
      label: '4A. Kendaraan (SUV)',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
        </svg>
      )
    },
    {
      id: 'modul4b',
      label: '4B. Kapal Laut Cargo',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.64 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.04-.78s-.31-.42-.56-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.34.42c-.25.08-.46.26-.56.5s-.12.52-.04.78L3.95 19zM11 3h2v1h-2V3zM6 6h12v4.29l-6 1.89-6-1.89V6z" />
        </svg>
      )
    },
    { type: 'header', label: 'EVALUASI' },
    {
      id: 'evaluasi',
      label: 'Ujian Evaluasi',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      )
    }
  ];

  return (
    <aside id="sidebar" className={sidebarCollapsed ? 'collapsed' : ''}>
      <div className="sidebar-header">
        <div className="sidebar-logo">BC</div>
        <div className="sidebar-title-group">
          <div className="sidebar-title">PUSDIKLAT</div>
          <div className="sidebar-subtitle">BEA DAN CUKAI</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.type === 'header') {
            return (
              <div
                key={idx}
                className="sidebar-category-header"
                style={{
                  marginTop: '16px',
                  padding: '0 16px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--color-on-primary-container)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                {item.label}
              </div>
            );
          }

          const isActive = currentRoute === item.id;
          return (
            <a
              key={item.id}
              href={`#/${item.id}`}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.id);
              }}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="customs-badge-card">
          <img
            src="assets/mockup/sidebar_customs_bg.png"
            alt="Customs Border Protection"
            className="customs-footer-img"
          />
        </div>
      </div>
    </aside>
  );
}
