import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { courseProgress } from '../../core/progress';
import { xapi } from '../../core/xapi';
import modul1Data from '../../data/modul1-interactive-hotspots.json';

export function Modul1View() {
  const { refreshProgress } = useApp();
  const [moduleData] = useState(modul1Data);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(1.35);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [activeTab, setActiveTab] = useState('tab-modus');
  const [currentPage, setCurrentPage] = useState(0);
  const [visitedHotspots, setVisitedHotspots] = useState(() => new Set(courseProgress.state?.visitedHotspots?.modul1 || []));
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const ANGLES = [0, 90, 180, 270];
  const autoPlayRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const isModalDraggingRef = useRef(false);
  const modalDragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    xapi.trackModuleView('modul1', 'Modul 1: Penyelundupan Melalui Tubuh Kurir (React)');
    courseProgress.recordModuleVisit('modul1');
    refreshProgress();
  }, []);

  // Auto-play 360 loop
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentAngle(prev => {
          const idx = ANGLES.indexOf(prev);
          return ANGLES[(idx + 1) % ANGLES.length];
        });
      }, 1600);
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying]);

  const handleAngleRotate = () => {
    setIsAutoPlaying(false);
    const idx = ANGLES.indexOf(currentAngle);
    setCurrentAngle(ANGLES[(idx + 1) % ANGLES.length]);
  };

  const handleAnglePrev = () => {
    setIsAutoPlaying(false);
    const idx = ANGLES.indexOf(currentAngle);
    setCurrentAngle(ANGLES[(idx - 1 + ANGLES.length) % ANGLES.length]);
  };

  const handleAngleNext = () => {
    setIsAutoPlaying(false);
    const idx = ANGLES.indexOf(currentAngle);
    setCurrentAngle(ANGLES[(idx + 1) % ANGLES.length]);
  };

  const handleZoom = (val) => {
    setCurrentZoom(Math.min(Math.max(val, 0.75), 2.2));
  };

  // Hotspot Click
  const handleHotspotClick = (hs, syncAngle = false) => {
    setSelectedHotspot(hs);
    setActiveTab('tab-modus');
    setCurrentPage(0);
    setModalPos({ x: 0, y: 0 });
    setVisitedHotspots(prev => {
      const next = new Set(prev);
      next.add(hs.id);
      return next;
    });
    courseProgress.recordHotspotVisit('modul1', hs.id);
    xapi.trackHotspotClick('modul1', hs.id, hs.label, hs.categoryLabel);
    refreshProgress();

    if (syncAngle && hs.visibleAngles && !hs.visibleAngles.includes(currentAngle)) {
      setCurrentAngle(hs.primaryAngle ?? hs.visibleAngles[0] ?? 0);
    }
  };

  // Modal Dragging
  const handleModalPointerDown = (e) => {
    if (e.target.closest('button')) return;
    isModalDraggingRef.current = true;
    modalDragStartRef.current = {
      x: e.clientX - modalPos.x,
      y: e.clientY - modalPos.y
    };

    const onPointerMove = (moveEvent) => {
      if (!isModalDraggingRef.current) return;
      setModalPos({
        x: moveEvent.clientX - modalDragStartRef.current.x,
        y: moveEvent.clientY - modalDragStartRef.current.y
      });
    };

    const onPointerUp = () => {
      isModalDraggingRef.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Canvas Drag/Swipe
  const handleCanvasPointerDown = (e) => {
    if (e.target.closest('.body-hotspot-pin') || e.target.closest('button') || e.target.closest('#hotspot-modal-card')) return;
    setIsAutoPlaying(false);
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
  };

  const handleCanvasPointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    if (Math.abs(deltaX) > 40) {
      const idx = ANGLES.indexOf(currentAngle);
      if (deltaX < 0) {
        setCurrentAngle(ANGLES[(idx + 1) % ANGLES.length]);
      } else {
        setCurrentAngle(ANGLES[(idx - 1 + ANGLES.length) % ANGLES.length]);
      }
      startXRef.current = e.clientX;
    }
  };

  const handleCanvasPointerUp = () => {
    isDraggingRef.current = false;
  };

  const currentAngleInfo = moduleData?.viewAngles?.find(a => a.angle === currentAngle) || {
    label: 'Tampak Depan',
    sub: 'Organ Pencernaan & Strapping Depan',
    image: 'assets/body_views/body_view_0_front.png'
  };

  const currentHotspots = (moduleData?.hotspots || []).filter(hs => hs.visibleAngles?.includes(currentAngle));
  const progressPct = courseProgress.getModuleProgress('modul1');

  const pages = [
    { id: 'tab-modus', num: 1, title: 'Modus Operandi' },
    { id: 'tab-photos', num: 2, title: 'Foto Bukti' },
    { id: 'tab-detection', num: 3, title: 'SOP & Ciri' },
    { id: 'tab-risk', num: 4, title: 'Risiko' }
  ];

  return (
    <div id="modul1-app-root">
      <div id="modul1-viewport">
        {/* Sub Header Bar (Stitch Forensic Strip) */}
        <div id="modul1-top-bar" className="modul1-top-bar">
          <div className="nav-left">
            <div className="header-breadcrumb">
              <span className="modul-code-badge font-code-tech">MODUL 01</span>
              <span className="course-main-title">Pemeriksaan Tubuh Kurir (Body Concealment)</span>
              <span className="breadcrumb-separator">•</span>
              <span className="modul-ref-tag font-code-tech">PMK-188/2021 & S-39/BC/2023</span>
            </div>
          </div>

          <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="sensor-state-chip font-code-tech">
              <span className="sensor-dot live"></span>
              <span>BODY SCANNER: AKTIF</span>
            </div>

            <div className="module-progress-widget">
              <div className="progress-info-row">
                <span className="progress-title">Hotspot Terverifikasi:</span>
                <span id="progress-percentage-text" className="progress-value font-code-tech">{progressPct}%</span>
              </div>
              <div className="progress-track">
                <div id="progress-fill-bar" className="progress-fill" style={{ width: `${progressPct}%` }}></div>
              </div>
            </div>

            <div className="angle-instruction-tag">
              <span className="instruction-dot">●</span>
              <span>Klik hotspot bernomor untuk menganalisis modus operandi & bukti forensik</span>
            </div>

            <button
              className="quiz-nav-pill-btn"
              id="btn-open-quiz"
              title="Latihan Soal Penilaian Kompetensi"
              onClick={() => {
                setShowQuiz(true);
                setQuizIndex(0);
                setQuizScore(0);
                setSelectedOption(null);
                setShowResult(false);
              }}
            >
              <span className="pill-icon">📝</span>
              <span>Kuis Penilaian</span>
            </button>
          </div>
        </div>

        {/* Rotatable Body Stage */}
        <div className="rotatable-body-view">

          {/* Body Canvas Wrapper with Forensic Grid & HUD Overlay */}
          <div
            className="body-canvas-wrapper"
            id="body-canvas-wrapper"
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
          >
            {/* Technical Forensic Grid Background Overlay */}
            <div className="forensic-grid-background" aria-hidden="true"></div>

            {/* HUD Telemetry Watermark Overlay */}
            <div className="forensic-hud-telemetry" aria-hidden="true">
              <div className="forensic-hud-top-left font-code-tech">
                <div className="hud-line-sub">SUBJEK ID: SUSPECT-JKT-9921 / PRIA / 34 TH</div>
              </div>
              <div className="forensic-hud-top-right font-code-tech">
                <div className="hud-line-azimuth" id="hud-azimuth-text">
                  ROTASI AKTIF: AZIMUTH {String(currentAngle).padStart(3, '0')}° | TILT +00.0°
                </div>
                <div className="hud-line-status">SENSOR: FULL-BODY TRANSMISSION X-RAY</div>
              </div>
            </div>

            {/* Central Active Body Image with Hotspots Layer */}
            <div
              className="body-image-container"
              id="body-image-container"
              style={{
                transform: `scale(${currentZoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease',
                '--body-zoom': currentZoom,
                '--tooltip-counter-scale': (1 / currentZoom).toFixed(4)
              }}
            >
              <img
                src={currentAngleInfo.image}
                alt="Anatomi Tubuh Peraga Manusia"
                id="main-body-img"
                className="main-body-img"
              />
              <div className="body-pedestal-platform"></div>

              {/* Hotspots Layer */}
              <div id="hotspots-layer" className="hotspots-layer">
                {currentHotspots.map(hs => {
                  const coords = hs.coordsByAngle?.[String(currentAngle)] || { x: 50, y: 50 };
                  const isVisited = visitedHotspots.has(hs.id);
                  const isActive = selectedHotspot?.id === hs.id;
                  const cleanName = (hs.label || '').replace(/^\d+\.\s*/, '');

                  const isTopArea = coords.y < 18;
                  return (
                    <div
                      key={hs.id}
                      className={`body-hotspot-pin ${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''} ${isTopArea ? 'tooltip-bottom' : ''}`}
                      style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleHotspotClick(hs);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="pin-point">
                        <div className="pin-pulse-ring"></div>
                      </div>
                      <div className="pin-tooltip" role="tooltip">
                        <span className="pin-tooltip-num font-code-tech">{hs.badgeNum}</span>
                        <span className="pin-tooltip-name">{cleanName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stitch Floating HUD Segmented Pill Controls Dock */}
            <div className="pedestal-rotation-dock" id="pedestal-rotation-dock">
              <div className="pedestal-carousel-controls">
                <button
                  id="btn-rotate-angle"
                  className="hud-pill-action-btn"
                  title="Putar Sudut Anatomi"
                  onClick={handleAngleRotate}
                >
                  <span className="hud-btn-icon">↻</span>
                  <span className="hud-btn-text">PUTAR SUDUT</span>
                  <span id="hud-current-angle-label" className="hud-angle-indicator font-code-tech">{currentAngle}°</span>
                </button>

                <div className="hud-pill-divider"></div>

                <button
                  id="btn-carousel-prev"
                  className="pedestal-ctrl-btn"
                  title="Sudut Sebelumnya"
                  onClick={handleAnglePrev}
                >
                  ‹
                </button>
                <button
                  id="btn-carousel-play"
                  className={`pedestal-ctrl-btn btn-play ${isAutoPlaying ? 'playing' : ''}`}
                  title="Auto-play rotasi kontinu 360°"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                >
                  <span id="play-pause-icon">{isAutoPlaying ? '⏸' : '▶'}</span>
                </button>
                <button
                  id="btn-carousel-next"
                  className="pedestal-ctrl-btn"
                  title="Sudut Berikutnya"
                  onClick={handleAngleNext}
                >
                  ›
                </button>

                <div className="hud-pill-divider"></div>

                <button
                  id="btn-zoom-out"
                  className="pedestal-ctrl-btn hud-zoom-btn"
                  title="Perkecil Zoom"
                  onClick={() => handleZoom(currentZoom - 0.15)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <span id="zoom-level-text" className="zoom-level-badge font-code-tech">{Math.round(currentZoom * 100)}%</span>
                <button
                  id="btn-zoom-in"
                  className="pedestal-ctrl-btn hud-zoom-btn"
                  title="Perbesar Zoom"
                  onClick={() => handleZoom(currentZoom + 0.15)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button
                  id="btn-zoom-reset"
                  className="pedestal-ctrl-btn hud-zoom-btn reset-btn"
                  title="Reset Zoom (135%)"
                  onClick={() => handleZoom(1.35)}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                </button>
              </div>

              <div className="pedestal-rotate-hint">
                <span>⟲ Drag atau usap pada tubuh untuk rotasi bebas 360° ⟳</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FLOATING HOTSPOT CALLOUT CARD ─── */}
      {selectedHotspot && (
        <div id="hotspot-card-modal-overlay" className="modal-overlay" role="dialog" aria-modal="true">
          <div
            id="hotspot-modal-card"
            className="modal-card tabbed-hotspot-modal hotspot-callout-card"
            style={{
              transform: `translate(${modalPos.x}px, ${modalPos.y}px)`
            }}
          >
            {/* Modal Header */}
            <div
              className="modal-header tabbed-modal-header"
              onPointerDown={handleModalPointerDown}
              title="Tahan dan geser untuk memindahkan kartu"
            >
              <div className="modal-header-left">
                <div className="detail-badge-row">
                  <span className="floating-card-drag-indicator" title="Geser posisi kartu">⋮⋮</span>
                  <span className="detail-tag-badge font-code-tech">MODUS #{String(selectedHotspot.badgeNum).padStart(2, '0')}</span>
                </div>
                <h3 className="detail-title">{selectedHotspot.label}</h3>
                <p className="detail-subtitle">{selectedHotspot.tag || selectedHotspot.shortName || selectedHotspot.label}</p>
              </div>

              <div className="modal-header-right">
                <div className="card-quick-nav">
                  <button
                    id="btn-prev-hotspot"
                    className="card-nav-arrow-btn"
                    title="Modus Sebelumnya"
                    onClick={() => {
                      const allHotspots = moduleData?.hotspots || [];
                      const idx = allHotspots.findIndex(h => h.id === selectedHotspot.id);
                      const prevIdx = (idx - 1 + allHotspots.length) % allHotspots.length;
                      handleHotspotClick(allHotspots[prevIdx], true);
                    }}
                  >
                    ←
                  </button>
                  <span id="card-nav-counter" className="card-nav-counter font-code-tech">
                    {selectedHotspot.badgeNum || ((moduleData?.hotspots || []).findIndex(h => h.id === selectedHotspot.id) + 1)} / {moduleData?.hotspots?.length || 8}
                  </span>
                  <button
                    id="btn-next-hotspot"
                    className="card-nav-arrow-btn"
                    title="Modus Berikutnya"
                    onClick={() => {
                      const allHotspots = moduleData?.hotspots || [];
                      const idx = allHotspots.findIndex(h => h.id === selectedHotspot.id);
                      const nextIdx = (idx + 1) % allHotspots.length;
                      handleHotspotClick(allHotspots[nextIdx], true);
                    }}
                  >
                    →
                  </button>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setSelectedHotspot(null)}
                  aria-label="Tutup Kartu"
                  title="Tutup Kartu"
                >
                  ✕
                </button>
              </div>
            </div>

                  {/* Tab Navigation */}
                  <div className="card-tabs-nav">
                    {pages.map((p, idx) => (
                      <button
                        key={p.id}
                        className={`tab-btn ${activeTab === p.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab(p.id);
                          setCurrentPage(idx);
                        }}
                      >
                        <span className="tab-icon">
                          {idx === 0 ? '📋' : idx === 1 ? '📷' : idx === 2 ? '🔍' : '🚨'}
                        </span>
                        <span className="tab-label">{p.title}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  <div className="tab-content-container">
                    {activeTab === 'tab-modus' && (
                      <div className="tab-pane active">
                        <div className="detail-media-row">
                          <div
                            className="detail-illustration-box"
                            style={{ cursor: 'pointer' }}
                            title="Klik untuk melihat gambar ukuran penuh"
                            onClick={() => {
                              const src = selectedHotspot.mainIllustration || selectedHotspot.illustrationImage || selectedHotspot.thumb || 'assets/mockup/card_digestive_main.png';
                              setPreviewImage({ src, title: selectedHotspot.label });
                            }}
                          >
                            <img
                              src={selectedHotspot.mainIllustration || selectedHotspot.illustrationImage || selectedHotspot.thumb || 'assets/mockup/card_digestive_main.png'}
                              alt="Visual"
                              className="detail-main-img"
                              onError={(e) => {
                                e.currentTarget.src = 'assets/mockup/card_digestive_main.png';
                              }}
                            />
                          </div>
                          <div className="detail-desc-box">
                            <p className="detail-desc-text">{selectedHotspot.description}</p>
                          </div>
                        </div>

                        <div className="modus-params-grid">
                          <div className="param-box">
                            <span className="param-label font-code-tech">Metode:</span>
                            <p className="param-val">{selectedHotspot.tag || selectedHotspot.categoryLabel || 'Modus Penyembunyian Tubuh'}</p>
                          </div>
                          <div className="param-box">
                            <span className="param-label font-code-tech">Lokasi:</span>
                            <p className="param-val">{selectedHotspot.bodyLocation || 'Tubuh Kurir'}</p>
                          </div>
                          <div className="param-box">
                            <span className="param-label font-code-tech">Narkotika:</span>
                            <p className="param-val">
                              {Array.isArray(selectedHotspot.drugTypes)
                                ? selectedHotspot.drugTypes.join(', ')
                                : (selectedHotspot.drugTypes || 'Narkotika Golongan I')}
                            </p>
                          </div>
                          <div className="param-box">
                            <span className="param-label font-code-tech">Kemasan:</span>
                            <p className="param-val">{selectedHotspot.packagingTechnique || selectedHotspot.packaging || 'Kemasan khusus kedap air'}</p>
                          </div>
                        </div>

                        <div className="deep-modus-note">
                          <span className="note-label font-code-tech">Detail Teknis Modus:</span>
                          <p className="note-text">{selectedHotspot.modusDetail || selectedHotspot.technicalDetails || selectedHotspot.description}</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'tab-photos' && (
                      <div className="tab-pane active">
                        <div className="photos-tab-header">
                          <span className="photos-tab-title">Barang Bukti Sitaan & Citra Forensik:</span>
                          <span className="photos-tab-hint" style={{ fontSize: '11px', color: '#FDBB24', marginLeft: '8px' }}>Klik gambar untuk melihat resolusi penuh</span>
                        </div>
                        <div className="findings-thumbnails-grid">
                          {(selectedHotspot.findings && selectedHotspot.findings.length > 0) ? (
                            selectedHotspot.findings.map((f, i) => (
                              <div
                                key={i}
                                className="evidence-card"
                                style={{ background: '#072238', border: '1px solid rgba(253, 187, 36, 0.4)', borderRadius: '8px', padding: '10px', cursor: 'pointer' }}
                                title={`Klik untuk memperbesar: ${f.caption || f.title || 'Bukti'}`}
                                onClick={() => {
                                  setPreviewImage({
                                    src: f.full || f.image || f.thumb || 'assets/mockup/finding_capsules.jpg',
                                    title: `${f.caption || f.title || selectedHotspot.label} — [${f.tag || 'Barang Bukti'}]`
                                  });
                                }}
                              >
                                <img
                                  src={f.thumb || f.full || f.image || 'assets/mockup/finding_capsules.jpg'}
                                  alt={f.caption || f.title || 'Bukti'}
                                  style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '4px' }}
                                  onError={(e) => {
                                    e.currentTarget.src = 'assets/mockup/finding_capsules.jpg';
                                  }}
                                />
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#FDBB24', display: 'block', marginTop: '6px' }}>
                                  {f.tag || f.title || 'Barang Bukti Sitaan'}
                                </span>
                                <p style={{ fontSize: '10px', color: '#CBD5E1', margin: 0 }}>{f.caption || 'Dokumentasi penindakan'}</p>
                              </div>
                            ))
                          ) : (
                            <p style={{ fontSize: '12px', color: '#64748B', padding: '12px' }}>Dokumentasi foto barang bukti sedang dimuat.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'tab-detection' && (
                      <div className="tab-pane active">
                        <div className="detection-two-columns">
                          <div className="info-block-col block-warning">
                            <div className="block-header">
                              <span className="block-icon">⚠️</span>
                              <span className="block-title">Indikator Tingkah Laku & Fisik</span>
                            </div>
                            <ul className="block-list">
                              {(selectedHotspot.indicators || selectedHotspot.detectionIndicators || [
                                'Tersangka menunjukkan kegelisahan ekstrem',
                                'Gerak-gerik mencurigakan saat wawancara'
                              ]).map((ind, i) => (
                                <li key={i}>{ind}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="info-block-col block-procedure">
                            <div className="block-header">
                              <span className="block-icon"></span>
                              <span className="block-title">Standar Prosedur Pemeriksaan (SOP)</span>
                            </div>
                            <ul className="block-list">
                              {(selectedHotspot.detection || selectedHotspot.inspectionProcedures || [
                                'Lakukan pemeriksaan badan secara menyeluruh',
                                'Koordinasikan dengan dokter medis bila diduga body packing'
                              ]).map((p, i) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'tab-risk' && (
                      <div className="tab-pane active">
                        <div className="risk-meter-widget">
                          <div className="risk-meter-header">
                            <span className="risk-meter-title">Tingkat Bahaya Penyelundupan:</span>
                            <span className="risk-meter-score font-code-tech">
                              {(selectedHotspot.riskLevel || 'Tinggi').toUpperCase()} ({selectedHotspot.riskScore || 80}/100)
                            </span>
                          </div>
                          <div className="risk-meter-bar-track">
                            <div className="risk-meter-bar-fill" style={{ width: `${selectedHotspot.riskScore || 80}%` }}></div>
                          </div>
                        </div>

                        <div className="hazard-alert-box hazard-medical">
                          <div className="hazard-icon">🚨</div>
                          <div className="hazard-content">
                            <span className="hazard-title">Bahaya Medis Darurat Tersangka:</span>
                            <p className="hazard-desc">
                              {selectedHotspot.medicalRisk || selectedHotspot.riskIndicators?.medicalEmergency || 'Bahaya ruptur (pecah pembungkus) menyebabkan penyerapan dosis masif yang mematikan dalam hitungan menit.'}
                            </p>
                          </div>
                        </div>

                        <div className="hazard-alert-box hazard-officer">
                          <div className="hazard-icon">🛡️</div>
                          <div className="hazard-content">
                            <span className="hazard-title">Protokol Keselamatan Petugas:</span>
                            <p className="hazard-desc">
                              {selectedHotspot.inspectionNote || selectedHotspot.riskIndicators?.officerSafety || 'SOP Resmi DJBC: Gunakan sarung tangan nitril dan hindari intervensi manual tanpa pendampingan tim medis.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pagination Bar */}
                  <div className="card-pagination-bar">
                    <button
                      className="card-page-nav-btn"
                      disabled={currentPage === 0}
                      onClick={() => {
                        const next = Math.max(0, currentPage - 1);
                        setCurrentPage(next);
                        setActiveTab(pages[next].id);
                      }}
                    >
                      Prev
                    </button>

                    <div className="card-page-pills">
                      {pages.map((p, i) => (
                        <button
                          key={p.id}
                          className={`page-pill ${currentPage === i ? 'active' : ''}`}
                          onClick={() => {
                            setCurrentPage(i);
                            setActiveTab(p.id);
                          }}
                        >
                          {p.num}
                        </button>
                      ))}
                    </div>

                    <span className="card-page-info font-code-tech">Hal {currentPage + 1} / {pages.length}</span>

                    <button
                      className="card-page-nav-btn"
                      disabled={currentPage === pages.length - 1}
                      onClick={() => {
                        const next = Math.min(pages.length - 1, currentPage + 1);
                        setCurrentPage(next);
                        setActiveTab(pages[next].id);
                      }}
                    >
                      Lanjut
                    </button>

                    <button
                      className="card-close-pill-btn"
                      onClick={() => setSelectedHotspot(null)}
                    >
                      ✕ Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}

      {/* ─── QUIZ MODAL ─── */}
      {showQuiz && (
        <div className="modal-overlay" style={{ zIndex: 999999 }}>
          <div className="modal-card" style={{ maxWidth: '620px', padding: '28px' }}>
            {!showResult ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="badge badge-gold font-code-tech">MODUL 1: KUIS</span>
                  <button className="modal-close-btn" onClick={() => setShowQuiz(false)}>✕</button>
                </div>
                <h3 style={{ color: 'var(--color-primary-navy)', fontSize: '16px', marginBottom: '16px' }}>
                  Soal {quizIndex + 1}: Apa risiko utama pecahnya kemasan narkotika pada metode body packing di lambung?
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {[
                    'Kondisi overdosis fatal mendadak dalam hitungan menit akibat absorpsi masif zat aktif.',
                    'Hanya menyebabkan mual ringan tanpa efek samping mematikan.',
                    'Dapat dicerna secara alami oleh asam lambung tanpa penyerapan.',
                    'Narkotika mengkristal dan keluar sendiri secara bertahap.'
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: selectedOption === idx ? '2px solid var(--color-primary-navy)' : '1px solid #E2E8F0',
                        background: selectedOption === idx ? 'rgba(11, 58, 111, 0.08)' : '#FFFFFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      {String.fromCharCode(65 + idx)}. {opt}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    className="btn btn-primary"
                    disabled={selectedOption === null}
                    onClick={() => {
                      if (selectedOption === 0) setQuizScore(prev => prev + 100);
                      setShowResult(true);
                    }}
                  >
                    Selesai & Lihat Hasil
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
                <h2 style={{ color: 'var(--color-primary-navy)' }}>Hasil Penilaian Kuis</h2>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-gold)', margin: '16px 0' }}>
                  {quizScore} / 100
                </div>
                <p style={{ color: '#475569', marginBottom: '24px' }}>
                  {quizScore >= 80 ? 'Kompetensi Terpenuhi! Anda memahami penanganan medis darurat body packing.' : 'Perlu pendalaman materi mengenai risiko medis body concealment.'}
                </p>
                <button className="btn btn-primary" onClick={() => setShowQuiz(false)}>
                  Kembali ke Pembelajaran
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* High-Res Forensic Photo Lightbox Modal Popup */}
      {previewImage && (
        <div
          className="m4a-image-popup-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
        >
          <div className="m4a-image-popup-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="m4a-img-popup-close"
              aria-label="Tutup Preview"
              title="Tutup Preview (Esc)"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>
            <div className="m4a-img-popup-frame">
              <img src={previewImage.src} alt={previewImage.title || 'Foto Forensik'} />
            </div>
            <div className="m4a-img-popup-caption">
              <span>{previewImage.title || 'Dokumentasi Penindakan DJBC'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
