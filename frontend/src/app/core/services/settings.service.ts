import { Injectable, signal, effect } from '@angular/core';

export interface UserSettings {
  darkMode: boolean;
  glassmorphism: boolean;
  claimNotifications: boolean;
  fraudAlerts: boolean;
  twoFactorEnabled: boolean;
  autoLogout: boolean;
}

const STORAGE_KEY = 'tancura_v1_settings';

const DEFAULT_SETTINGS: UserSettings = {
  darkMode: false,
  glassmorphism: true,
  claimNotifications: true,
  fraudAlerts: true,
  twoFactorEnabled: false,
  autoLogout: true
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  settings = signal<UserSettings>(this.loadSettings());

  constructor() {
    // Synchronize settings to body classes and localStorage
    effect(() => {
      const s = this.settings();
      this.saveSettings(s);
      this.applySettings(s);
    });
  }

  updateSettings(partial: Partial<UserSettings>) {
    this.settings.update(s => ({ ...s, ...partial }));
  }

  private loadSettings(): UserSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private saveSettings(settings: UserSettings) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }

  private applySettings(settings: UserSettings) {
    if (typeof window === 'undefined') return;
    
    // Apply Dark Mode
    if (settings.darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    // Apply Glassmorphism
    if (settings.glassmorphism) {
      document.body.classList.add('glass-effect');
    } else {
      document.body.classList.remove('glass-effect');
    }
  }
}
