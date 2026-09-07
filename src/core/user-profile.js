/**
 * User Profile Manager for KLC2 (kemenkeu.go.id)
 * Integrated with xAPI Actor format generation & SCORM fallback
 */
export class KLCUserProfileManager {
  constructor() {
    this._profile = null;
    this._isLoaded = false;
    this._authMethod = 'UNINITIALIZED';
    
    this.DEFAULT_PROFILE = {
      username: 'pegawai_djbc',
      nip: '199001012015011001',
      name: 'Pegawai DJBC (Simulasi)',
      email: 'pegawai.djbc@kemenkeu.go.id',
      role: 'PEGAWAI',
      avatarUrl: '',
      unit: 'Direktorat Jenderal Bea dan Cukai',
      organisasi: 'Kementerian Keuangan RI'
    };
  }

  async init() {
    if (this._isLoaded) return this._profile;

    // Level 1: Fetch session from KLC API
    try {
      const resp = await fetch('/office/api/auth/session', { credentials: 'include' });
      if (resp.ok) {
        const sessionData = await resp.json();
        if (sessionData && (sessionData.user || sessionData.username || sessionData.name)) {
          const u = sessionData.user || sessionData;
          this._profile = {
            username: u.username || u.nip || u.email || 'pegawai_klc',
            nip: u.nip || u.username || '',
            name: u.name || u.nama || u.displayName || 'Pegawai DJBC',
            email: u.email || `${u.username || 'pegawai'}@kemenkeu.go.id`,
            role: (u.role || u.jabatan || 'PEGAWAI').toUpperCase(),
            avatarUrl: u.avatarUrl || u.avatar || u.foto || '',
            unit: u.unit || u.unitKerja || 'Direktorat Jenderal Bea dan Cukai',
            organisasi: u.organisasi || 'Kementerian Keuangan RI'
          };
          this._authMethod = 'SESSION_API';
          this._isLoaded = true;
          this.updateDOM();
          return this._profile;
        }
      }
    } catch (e) {
      // Ignore API fetch error (standalone mode)
    }

    // Level 2: URL Params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('username') || urlParams.has('nip')) {
      this._profile = {
        username: urlParams.get('username') || urlParams.get('nip'),
        nip: urlParams.get('nip') || urlParams.get('username'),
        name: urlParams.get('name') || urlParams.get('username') || 'Pegawai DJBC',
        email: urlParams.get('email') || 'pegawai@kemenkeu.go.id',
        role: (urlParams.get('role') || 'PEGAWAI').toUpperCase(),
        avatarUrl: urlParams.get('avatar') || '',
        unit: 'Direktorat Jenderal Bea dan Cukai',
        organisasi: 'Kementerian Keuangan RI'
      };
      this._authMethod = 'URL_PARAMS';
      this._isLoaded = true;
      this.updateDOM();
      return this._profile;
    }

    // Level 3: SCORM Learner Info Fallback
    const scormName = window.scormInstance ? window.scormInstance.learnerName : '';
    const scormId = window.scormInstance ? window.scormInstance.learnerId : '';
    if (scormName || scormId) {
      this._profile = {
        username: scormId || 'scorm_user',
        nip: scormId || '',
        name: scormName || 'Pegawai SCORM',
        email: `${scormId || 'pegawai'}@kemenkeu.go.id`,
        role: 'PEGAWAI',
        avatarUrl: '',
        unit: 'Direktorat Jenderal Bea dan Cukai',
        organisasi: 'Kementerian Keuangan RI'
      };
      this._authMethod = 'SCORM_API';
      this._isLoaded = true;
      this.updateDOM();
      return this._profile;
    }

    // Level 4: Fallback profile
    this._profile = { ...this.DEFAULT_PROFILE };
    this._authMethod = 'DEFAULT_FALLBACK';
    this._isLoaded = true;
    this.updateDOM();
    return this._profile;
  }

  getProfile() {
    return this._profile || this.DEFAULT_PROFILE;
  }

  getAuthMethod() {
    return this._authMethod;
  }

  getActorForXAPI() {
    const p = this.getProfile();
    return {
      objectType: 'Agent',
      name: p.name,
      mbox: `mailto:${p.email}`,
      account: {
        homePage: 'https://klc2.kemenkeu.go.id',
        name: p.username || p.nip
      }
    };
  }

  updateDOM() {
    const p = this.getProfile();
    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-display-role');
    const imgEl = document.getElementById('user-avatar-img');
    const placeholderEl = document.getElementById('user-avatar-placeholder');
    const initialsEl = document.getElementById('user-avatar-initials');

    if (nameEl) nameEl.textContent = p.name;
    if (roleEl) roleEl.textContent = `${p.role} — ${p.unit}`;

    if (p.avatarUrl && imgEl) {
      imgEl.src = p.avatarUrl;
      imgEl.style.display = 'block';
      if (placeholderEl) placeholderEl.style.display = 'none';
      if (initialsEl) initialsEl.style.display = 'none';
    } else if (initialsEl) {
      if (imgEl) imgEl.style.display = 'none';
      if (placeholderEl) placeholderEl.style.display = 'none';
      initialsEl.style.display = 'block';
      const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      initialsEl.textContent = initials || 'BC';
    }
  }
}

export const userProfile = new KLCUserProfileManager();
