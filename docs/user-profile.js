/**
 * user-profile.js — KLC2 User Profile Session, Token Fetcher & SCORM Bridge
 * Primary Authentication: KLC2 Session Cookie via /office/api/auth/session
 * Fallbacks: Token Storage, Parent Window, SCORM Learner Data
 */

export class KLCUserProfileManager {
  constructor() {
    // Target Endpoint Sesi Utama KLC2 (Cookie Session)
    this.sessionEndpoints = [
      '/office/api/auth/session',
      'https://klc2.kemenkeu.go.id/office/api/auth/session',
      '/api/auth/session',
      'https://klc2.kemenkeu.go.id/api/auth/session',
      '/res/user/principal/me/profile',
      'https://klc2.kemenkeu.go.id/res/user/principal/me/profile',
      '/res/user/profile/me',
      '/res/user/me'
    ];

    this.pollIntervalMs = 30000;
    this.pollTimer = null;

    this.fallbackProfile = {
      name: 'Pegawai DJBC',
      userType: 'PEGAWAI DJBC',
      role: 'PEGAWAI DJBC',
      avatarUrl: '',
      nip: '-',
      email: '-'
    };
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  log(msg, obj = null) {
    console.log(`[UserProfile ${new Date().toLocaleTimeString()}] ${msg}`, obj || '');
  }

  async init() {
    this.log('Memulai inisialisasi UserProfile KLC2 Cookie Session...');

    // 1. Tampilkan profile tersimpan jika ada
    const savedProfile = this.getSavedProfile();
    if (savedProfile && savedProfile.name && savedProfile.name !== 'Peserta' && savedProfile.name !== 'Pegawai DJBC') {
      this.currentUser = savedProfile;
      this.isAuthenticated = true;
      this.render(savedProfile);
    } else {
      this.render(this.fallbackProfile);
    }

    // 2. Periksa URL Parameters (?token= / ?access_token=)
    if (typeof window !== 'undefined' && window.location && typeof URLSearchParams !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token') || urlParams.get('access_token');
      if (urlToken) {
        this.log('Token ditemukan di URL Parameter');
        this.saveToken(urlToken);
      }
    }

    // 3. Ekstrak data dari window.top / window.parent KLC2 jika ada
    this.checkParentWindowUserData();

    // 4. Periksa data dari SCORM API jika tersedia
    this.checkScormUserData();

    // 5. LAKUKAN PENGAMBILAN UTAMA VIA COOKIE SESSION (ENDPOINT /office/api/auth/session)
    let success = await this.fetchSessionFromKLC2();

    // 6. Jika Cookie Session belum berhasil, gunakan fallback token bertingkat
    if (!success) {
      const token = await this.obtainTokenFromKLC2();
      if (token) {
        success = await this.fetchProfileWithToken(token);
      }
    }

    // 7. Pasang listener navigasi & polling 30 detik
    this.setupNavigationListeners();
    this.start30SecPolling();
  }

  /**
   * MENGAMBIL USER PROFILE DARI SESSION COOKIE /office/api/auth/session (UTAMA)
   */
  async fetchSessionFromKLC2() {
    const activeToken = this.getStoredToken();

    for (const ep of this.sessionEndpoints) {
      try {
        this.log(`Mengirim request Cookie Session ke: ${ep}`);

        let controller = null;
        let signal = undefined;
        let timeoutId = null;

        if (typeof AbortController !== 'undefined') {
          controller = new AbortController();
          signal = controller.signal;
          timeoutId = setTimeout(() => controller.abort(), 4500);
        }

        const headers = {
          'Accept': 'application/json, text/plain, */*',
          'X-Requested-With': 'XMLHttpRequest'
        };

        if (activeToken) {
          headers['Authorization'] = activeToken.startsWith('Bearer') ? activeToken : `Bearer ${activeToken}`;
        }

        let requestUrl = ep;
        if (activeToken && !ep.includes('?')) {
          requestUrl = `${ep}?token=${encodeURIComponent(activeToken)}`;
        }

        if (typeof fetch === 'undefined') {
          if (timeoutId) clearTimeout(timeoutId);
          return false;
        }

        const response = await fetch(requestUrl, {
          method: 'GET',
          credentials: 'include', // Kunci untuk mengirimkan session cookie KLC2!
          headers: headers,
          signal: signal
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (response && response.ok) {
          const json = await response.json();
          this.log(`Response dari ${ep} diterima`);

          const profile = this.parseProfileData(json);
          if (profile && profile.name && profile.name !== 'Peserta' && profile.name !== 'Pegawai DJBC') {
            this.log(`SUKSES BERHASIL! User Profile didapatkan dari ${ep}:`, profile.name);

            // Ekstrak token jika ada di dalam payload sesi
            const extractedToken = json.accessToken || json.token || json.user?.token || json.data?.token;
            if (extractedToken) {
              this.saveToken(extractedToken);
            }

            this.saveProfileToStorage(profile);
            this.render(profile);
            return true;
          }
        } else if (response) {
          this.log(`HTTP ${response.status} dari ${ep}`);
        }
      } catch (err) {
        this.log(`Catatan fetch ${ep}:`, err.message);
      }
    }
    return false;
  }

  async fetchProfileWithToken(token) {
    if (!token) return false;
    return await this.fetchSessionFromKLC2();
  }

  checkParentWindowUserData() {
    try {
      if (typeof window !== 'undefined' && window.top && window.top !== window) {
        const topWin = window.top;
        const topUser = topWin.user || topWin.currentUser || topWin.USER_DATA || topWin.principal || topWin.profile;
        if (topUser) {
          const parsed = this.parseProfileData(topUser);
          if (parsed && parsed.name && parsed.name !== 'Peserta' && parsed.name !== 'Pegawai DJBC') {
            this.log('User profile ditemukan dari window.top:', parsed.name);
            this.saveProfileToStorage(parsed);
            this.render(parsed);
            return true;
          }
        }
      }
    } catch (e) {}
    return false;
  }

  checkScormUserData() {
    try {
      if (typeof window !== 'undefined' && window.scorm && typeof window.scorm.getValue === 'function') {
        const scormName = window.scorm.getValue('cmi.core.student_name');
        if (scormName && typeof scormName === 'string' && scormName.trim()) {
          // Format SCORM biasanya "Last, First" -> ubah jadi "First Last"
          let formattedName = scormName.trim();
          if (formattedName.includes(',')) {
            const parts = formattedName.split(',').map(s => s.trim());
            if (parts.length >= 2) {
              formattedName = `${parts[1]} ${parts[0]}`;
            }
          }
          const scormId = window.scorm.getValue('cmi.core.student_id') || '-';
          const profile = {
            name: formattedName,
            avatarUrl: '',
            userType: 'PEGAWAI DJBC',
            role: 'PEGAWAI DJBC',
            email: '-',
            nip: scormId
          };
          this.log('User data didapatkan dari SCORM LMS:', formattedName);
          if (!this.currentUser || !this.currentUser.name || this.currentUser.name === 'Pegawai DJBC') {
            this.saveProfileToStorage(profile);
            this.render(profile);
          }
        }
      }
    } catch (e) {}
  }

  async obtainTokenFromKLC2() {
    if (typeof window === 'undefined') return '';
    const urlParams = (window.location && window.location.search) ? new URLSearchParams(window.location.search) : null;
    let token = urlParams ? (urlParams.get('token') || urlParams.get('access_token')) : '';
    if (token) {
      this.saveToken(token);
      return token;
    }

    token = this.scanStoragesForToken();
    if (token) {
      this.saveToken(token);
      return token;
    }

    const cookieToken = this.getCookie('klc_token') || this.getCookie('access_token') || this.getCookie('token') || this.getCookie('next-auth.session-token');
    if (cookieToken) {
      this.saveToken(cookieToken);
      return cookieToken;
    }

    return this.getStoredToken();
  }

  scanStoragesForToken() {
    const storages = [];
    try { if (window.top && window.top.localStorage) storages.push(window.top.localStorage); } catch(e){}
    try { if (window.top && window.top.sessionStorage) storages.push(window.top.sessionStorage); } catch(e){}
    try { if (window.localStorage) storages.push(window.localStorage); } catch(e){}
    try { if (window.sessionStorage) storages.push(window.sessionStorage); } catch(e){}

    const knownKeys = ['klc_token', 'access_token', 'token', 'auth_token', 'bearer_token', 'jwt_token', 'user_token', 'id_token', 'session_token'];

    for (const store of storages) {
      for (const key of knownKeys) {
        try {
          const val = store.getItem(key);
          if (val && typeof val === 'string' && val.length > 10) {
            const clean = val.replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '').trim();
            if (clean) return clean;
          }
        } catch(e) {}
      }
    }

    for (const store of storages) {
      try {
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          const val = store.getItem(k);
          if (val && typeof val === 'string' && val.includes('eyJ')) {
            const jwtMatch = val.match(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/);
            if (jwtMatch) return jwtMatch[0];
          }
        }
      } catch(e) {}
    }

    return '';
  }

  saveToken(token) {
    if (!token) return;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem('klc_token', token);
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('klc_token', token);
      if (typeof window !== 'undefined' && window.top && window.top !== window) {
        try {
          window.top.localStorage.setItem('klc_token', token);
        } catch (e) {}
      }
      this.log('Token otentikasi disimpan.');
    } catch (e) {}
  }

  getStoredToken() {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token') || urlParams.get('access_token');
        if (urlToken) {
          this.saveToken(urlToken);
          return urlToken;
        }
      }

      const scanned = this.scanStoragesForToken();
      if (scanned) return scanned;

      return (typeof localStorage !== 'undefined' ? localStorage.getItem('klc_token') : '') ||
             (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('klc_token') : '') ||
             (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : '') || '';
    } catch (e) {
      return '';
    }
  }

  getCookie(name) {
    try {
      if (typeof document === 'undefined') return '';
      const cookieString = document.cookie || (window.top && window.top.document ? window.top.document.cookie : '');
      const match = cookieString.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) return decodeURIComponent(match[2]);
    } catch(e) {}
    return '';
  }

  /**
   * Mem-parser Objek Sesi / Profil yang dikirimkan oleh KLC2
   */
  parseProfileData(json) {
    if (!json) return null;

    // Mendukung format NextAuth session { user: { name, email, image, provider }, expires }
    const userObj = json.user || json.data || json.payload || json.principal || json.profile || json;
    if (!userObj) return null;

    let userName = userObj.name || userObj.fullName || userObj.full_name || userObj.nama || userObj.student_name || json.name || '';
    let userPhoto = userObj.image || userObj.picture || userObj.image_url || userObj.avatar || userObj.avatarUrl || userObj.avatar_url || userObj.photo || json.image || json.avatar || '';

    if (!userName) return null;

    if (userPhoto && !userPhoto.startsWith('http://') && !userPhoto.startsWith('https://') && !userPhoto.startsWith('data:')) {
      if (userPhoto.startsWith('/')) {
        userPhoto = `https://klc2.kemenkeu.go.id${userPhoto}`;
      } else {
        userPhoto = `https://klc2.kemenkeu.go.id/${userPhoto}`;
      }
    }

    // Ekstrak Jenis User dari field 'provider' (diubah menjadi UPPERCASE seluruhnya)
    let rawProvider = userObj.provider || json.provider || userObj.user_type || userObj.userType || userObj.type || 'PEGAWAI DJBC';
    let userType = String(rawProvider).toUpperCase();

    return {
      name: userName,
      avatarUrl: userPhoto,
      userType: userType,
      role: userType, // Untuk badge header
      email: userObj.email || json.email || '-',
      nip: userObj.nip || userObj.preferred_username || userObj.username || '-'
    };
  }

  saveProfileToStorage(profile) {
    try {
      if (!profile || !profile.name || profile.name === 'Peserta' || profile.name === 'Pegawai DJBC') return;
      this.isAuthenticated = true;
      this.currentUser = profile;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('klc_user_profile', JSON.stringify(profile));
      }
    } catch (e) {}
  }

  getSavedProfile() {
    try {
      if (typeof localStorage !== 'undefined') {
        const str = localStorage.getItem('klc_user_profile');
        if (str) return JSON.parse(str);
      }
    } catch (e) {}
    return null;
  }

  setupNavigationListeners() {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('hashchange', () => this.fetchSessionFromKLC2());
      window.addEventListener('popstate', () => this.fetchSessionFromKLC2());
      window.addEventListener('pageshow', () => this.fetchSessionFromKLC2());
    }
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.fetchSessionFromKLC2();
      });
    }
  }

  start30SecPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (typeof setInterval !== 'undefined') {
      this.pollTimer = setInterval(() => this.fetchSessionFromKLC2(), this.pollIntervalMs);
    }
  }

  render(profile) {
    if (typeof document === 'undefined') return;

    if (this.currentUser && this.currentUser.name && this.currentUser.name !== 'Peserta' && this.currentUser.name !== 'Pegawai DJBC' && (!profile || profile.name === 'Peserta' || profile.name === 'Pegawai DJBC')) {
      profile = this.currentUser;
    }

    const user = profile || this.fallbackProfile;

    if (user && user.name && user.name !== 'Peserta' && user.name !== 'Pegawai DJBC') {
      this.currentUser = user;
      this.isAuthenticated = true;
    }

    const profileWidgets = document.querySelectorAll('#user-profile-widget, .user-profile-widget, .user-profile-header');
    profileWidgets.forEach(w => {
      w.style.cursor = 'pointer';
      w.onclick = () => this.showProfileDetailModal(user);
    });

    const nameEls = document.querySelectorAll('#user-display-name, .user-display-name, .user-name');
    const roleEls = document.querySelectorAll('#user-display-role, .user-display-role, .user-role');
    const imgEls = document.querySelectorAll('#user-avatar-img, .user-avatar-img');
    const placeholderEls = document.querySelectorAll('#user-avatar-placeholder, .user-avatar-placeholder');
    const initialsEls = document.querySelectorAll('#user-avatar-initials, .user-avatar-initials');

    let initials = 'BC';
    if (user.name) {
      const parts = user.name.trim().split(' ').filter(Boolean);
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts.length === 1 && parts[0].length > 0) {
        initials = parts[0].substring(0, 2).toUpperCase();
      }
    }

    nameEls.forEach(el => { el.textContent = user.name || 'Pegawai DJBC'; });
    roleEls.forEach(el => { el.textContent = user.userType || user.role || 'PEGAWAI DJBC'; });
    initialsEls.forEach(el => { el.textContent = initials; });

    if (user.avatarUrl) {
      imgEls.forEach(img => {
        img.src = user.avatarUrl;
        img.style.display = 'block';
        img.onerror = () => {
          img.style.display = 'none';
          placeholderEls.forEach(p => {
            p.style.display = 'flex';
          });
        };
      });
      placeholderEls.forEach(p => { p.style.display = 'none'; });
    } else {
      imgEls.forEach(img => { img.style.display = 'none'; });
      placeholderEls.forEach(p => {
        p.style.display = 'flex';
      });
    }
  }

  showProfileDetailModal(profile) {
    if (typeof document === 'undefined') return;

    let modal = document.getElementById('klc-user-profile-detail-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'klc-user-profile-detail-modal';
      modal.style.cssText = 'position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.6); backdrop-filter:blur(6px); z-index:999999; padding:16px;';
      document.body.appendChild(modal);
    }

    const user = profile || this.fallbackProfile;
    const initialText = (user.name || 'BC').substring(0, 2).toUpperCase();

    modal.innerHTML = `
      <div style="background:linear-gradient(145deg, #0B3A6F 0%, #062347 100%); border:1px solid #D9B45B; border-radius:18px; padding:24px; max-width:360px; width:100%; color:#FFFFFF; box-shadow:0 20px 40px rgba(0,0,0,0.4); position:relative; font-family:'Poppins',sans-serif;">
        <button id="close-user-profile-detail-modal" style="position:absolute; top:12px; right:12px; background:none; border:none; color:rgba(255,255,255,0.7); font-size:22px; cursor:pointer; padding:4px 8px; line-height:1;" title="Tutup">&times;</button>
        <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
          <!-- 1. Foto Profil & Inisial Nama -->
          <div style="width:76px; height:76px; border-radius:50%; border:2.5px solid #D9B45B; overflow:hidden; margin-bottom:12px; box-shadow:0 4px 14px rgba(0,0,0,0.3); background:#0B3A6F; display:flex; align-items:center; justify-content:center;">
            ${user.avatarUrl ? `<img src="${user.avatarUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
            <span style="font-size:22px; font-weight:700; color:#D9B45B; ${user.avatarUrl ? 'display:none;' : ''}">${initialText}</span>
          </div>

          <!-- 2. Nama Lengkap -->
          <h3 style="font-size:16px; font-weight:700; color:#FFFFFF; margin-bottom:14px; line-height:1.3;">${user.name}</h3>

          <!-- 3. Email -->
          <div style="background:rgba(255,255,255,0.08); width:100%; padding:9px 14px; border-radius:10px; font-size:12px; color:#E2E8F0; margin-bottom:8px; border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:space-between;">
            <span style="color:rgba(255,255,255,0.6); font-weight:500;">Email</span>
            <span style="font-weight:600; color:#FFFFFF;">${user.email || '-'}</span>
          </div>

          <!-- 4. Detail NIP -->
          <div style="background:rgba(255,255,255,0.08); width:100%; padding:9px 14px; border-radius:10px; font-size:12px; color:#E2E8F0; margin-bottom:8px; border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:space-between;">
            <span style="color:rgba(255,255,255,0.6); font-weight:500;">NIP</span>
            <span style="font-weight:600; color:#FFFFFF;">${user.nip || '-'}</span>
          </div>

          <!-- 5. Jenis User (UPPERCASE) -->
          <div style="background:rgba(255,255,255,0.08); width:100%; padding:9px 14px; border-radius:10px; font-size:12px; color:#E2E8F0; margin-bottom:4px; border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:space-between;">
            <span style="color:rgba(255,255,255,0.6); font-weight:500;">Jenis User</span>
            <span style="font-weight:700; color:#D9B45B;">${(user.userType || user.provider || 'PEGAWAI DJBC').toUpperCase()}</span>
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

    const closeBtn = document.getElementById('close-user-profile-detail-modal');
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.style.display = 'none';
      };
    }
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    };
  }
}

export const userProfile = new KLCUserProfileManager();
if (typeof window !== 'undefined') {
  window.UserProfile = userProfile;
  window.KLCUserProfileManager = KLCUserProfileManager;
}

if (typeof window !== 'undefined') {
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('message', (event) => {
      if (event.data && (event.data.token || event.data.type === 'KLC_AUTH_TOKEN' || event.data.name)) {
        if (event.data.name) {
          const parsed = window.UserProfile.parseProfileData(event.data);
          if (parsed) {
            window.UserProfile.saveProfileToStorage(parsed);
            window.UserProfile.render(parsed);
          }
        } else {
          const token = event.data.token || event.data.payload;
          if (token) {
            window.UserProfile.saveToken(token);
            window.UserProfile.init();
          }
        }
      }
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading' && typeof document.addEventListener === 'function') {
      document.addEventListener('DOMContentLoaded', () => window.UserProfile.init());
    } else {
      window.UserProfile.init();
    }
  }
}
