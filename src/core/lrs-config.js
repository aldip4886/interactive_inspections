/**
 * LRS Configuration Manager (localStorage backed)
 */
export class LRSConfigManager {
  constructor() {
    this.STORAGE_KEY = 'djbc_lrs_config';
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('[LRSConfig] Failed to load config', e);
    }
    return {
      endpoint: '',
      username: '',
      password: '',
      enabled: false
    };
  }

  saveConfig(endpoint, username, password, enabled = true) {
    // Ensure endpoint ends with trailing slash if provided
    let cleanEndpoint = (endpoint || '').trim();
    if (cleanEndpoint && !cleanEndpoint.endsWith('/')) {
      cleanEndpoint += '/';
    }

    this.config = {
      endpoint: cleanEndpoint,
      username: (username || '').trim(),
      password: (password || '').trim(),
      enabled: Boolean(enabled)
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('[LRSConfig] Failed to save config', e);
    }
    return this.config;
  }

  getConfig() {
    return { ...this.config };
  }

  isConfigured() {
    return Boolean(this.config.enabled && this.config.endpoint && this.config.username);
  }

  getAuthHeader() {
    if (!this.config.username || !this.config.password) return '';
    return 'Basic ' + btoa(`${this.config.username}:${this.config.password}`);
  }

  async testConnection(endpoint, username, password) {
    let url = (endpoint || '').trim();
    if (!url.endsWith('/')) url += '/';
    url += 'about';

    const headers = {
      'X-Experience-API-Version': '1.0.3'
    };

    if (username && password) {
      headers['Authorization'] = 'Basic ' + btoa(`${username}:${password}`);
    }

    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers
      });

      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        return { success: true, message: 'Koneksi ke LRS berhasil!', version: data.version || ['1.0.3'] };
      } else {
        return { success: false, message: `LRS merespon HTTP ${resp.status} (${resp.statusText})` };
      }
    } catch (err) {
      return { success: false, message: `Gagal menghubungi LRS: ${err.message}` };
    }
  }
}

export const lrsConfig = new LRSConfigManager();
