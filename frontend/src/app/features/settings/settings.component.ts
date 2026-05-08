import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService, UserSettings } from '../../core/services/settings.service';
import { ClaimsService } from '../../core/services/api.services';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, 
    MatSlideToggleModule, MatDividerModule, MatButtonModule, MatSnackBarModule
  ],
  template: `
    <div class="page-container fade-in">
      <div class="page-header">
        <div class="header-text">
          <h1>System Orchestration</h1>
          <p class="subtitle">Customize your clinical workspace and notification preferences</p>
        </div>
      </div>

      <div class="settings-grid">
        @if (settings(); as s) {
          <!-- Appearance -->
          <mat-card class="glass-card">
            <div class="card-header">
              <mat-icon>palette</mat-icon>
              <h3>Appearance & Branding</h3>
            </div>
            <mat-divider></mat-divider>
            <div class="card-content">
              <div class="setting-item">
                <div class="setting-text">
                  <span class="label">Dark Mode Intelligence</span>
                  <span class="desc">Enable dynamic high-contrast UI for low-light environments</span>
                </div>
                <mat-slide-toggle color="primary" [checked]="s.darkMode" 
                  (change)="toggleSetting('darkMode', $event.checked)"></mat-slide-toggle>
              </div>
              <div class="setting-item">
                <div class="setting-text">
                  <span class="label">Glassmorphism Level</span>
                  <span class="desc">Toggle the premium transparency and blur effects</span>
                </div>
                <mat-slide-toggle color="primary" [checked]="s.glassmorphism"
                  (change)="toggleSetting('glassmorphism', $event.checked)"></mat-slide-toggle>
              </div>
            </div>
          </mat-card>

          <!-- Notifications -->
          <mat-card class="glass-card">
            <div class="card-header">
              <mat-icon>notifications_active</mat-icon>
              <h3>Alert Telemetry</h3>
            </div>
            <mat-divider></mat-divider>
            <div class="card-content">
              <div class="setting-item">
                <div class="setting-text">
                  <span class="label">Claim Status Updates</span>
                  <span class="desc">Receive real-time alerts when a claim enters a new lifecycle state</span>
                </div>
                <mat-slide-toggle color="primary" [checked]="s.claimNotifications"
                  (change)="toggleSetting('claimNotifications', $event.checked)"></mat-slide-toggle>
              </div>
              <div class="setting-item">
                <div class="setting-text">
                  <span class="label">Fraud Detection Alerts</span>
                  <span class="desc">Instant notification for high-risk clinical patterns</span>
                </div>
                <mat-slide-toggle color="primary" [checked]="s.fraudAlerts"
                  (change)="toggleSetting('fraudAlerts', $event.checked)"></mat-slide-toggle>
              </div>
            </div>
          </mat-card>

          <!-- Security -->
          <mat-card class="glass-card">
            <div class="card-header">
              <mat-icon>security</mat-icon>
              <h3>Security & Compliance</h3>
            </div>
            <mat-divider></mat-divider>
            <div class="card-content">
              <div class="setting-item">
                <div class="setting-text">
                  <span class="label">Two-Factor Authentication</span>
                  <span class="desc">Secure your clinical credentials with biometrics or SMS</span>
                </div>
                <button mat-stroked-button color="primary" (click)="enable2FA()" [disabled]="s.twoFactorEnabled">
                  {{ s.twoFactorEnabled ? '2FA Active' : 'Enable 2FA' }}
                </button>
              </div>
              <div class="setting-item">
                <div class="setting-text">
                  <span class="label">Session Duration</span>
                  <span class="desc">Auto-logout after 30 minutes of inactivity</span>
                </div>
                <mat-slide-toggle color="primary" [checked]="s.autoLogout"
                  (change)="toggleSetting('autoLogout', $event.checked)"></mat-slide-toggle>
              </div>
            </div>
          </mat-card>
        }

        <!-- Data -->
        <mat-card class="glass-card">
          <div class="card-header">
            <mat-icon>storage</mat-icon>
            <h3>Data Management</h3>
          </div>
          <mat-divider></mat-divider>
          <div class="card-content">
            <div class="setting-item">
              <div class="setting-text">
                <span class="label">Export Clinical Ledger</span>
                <span class="desc">Download all claim records in encrypted CSV format</span>
              </div>
              <button mat-stroked-button (click)="exportLedger()">Export All</button>
            </div>
            <div class="setting-item">
              <div class="setting-text delete">
                <span class="label">Clear Persistent Cache</span>
                <span class="desc">Reset local storage and refresh clinical telemetry</span>
              </div>
              <button mat-button color="warn" (click)="clearCache()">Reset Data</button>
            </div>
          </div>
        </mat-card>
      </div>

      <div class="settings-footer">
        <span class="version">TanCura Platform v1.2.0-Production</span>
        <button mat-raised-button color="primary" class="save-btn" (click)="applyAll()">Apply Orchestration</button>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 32px; max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 32px; }
    h1 { font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 800; margin: 0; color: var(--text-main); }
    .subtitle { color: var(--text-muted); margin: 4px 0 0; font-size: 15px; font-weight: 500; }

    .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 24px; }
    .glass-card { 
      background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border); 
      box-shadow: var(--shadow-md); overflow: hidden;
    }

    .card-header { padding: 20px 24px; display: flex; align-items: center; gap: 12px; color: var(--primary); }
    .card-header mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .card-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-main); }

    .card-content { padding: 12px 24px; }
    .setting-item { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: 16px 0; border-bottom: 1px solid var(--border);
    }
    .setting-item:last-child { border-bottom: none; }
    
    .setting-text { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 15px; font-weight: 700; color: var(--text-main); }
    .desc { font-size: 13px; color: var(--text-muted); font-weight: 500; }

    .delete .label { color: var(--error); }

    .settings-footer { 
      margin-top: 48px; display: flex; justify-content: space-between; 
      align-items: center; padding-top: 24px; border-top: 1px solid var(--border);
    }
    .version { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    .save-btn { height: 48px; border-radius: 12px; padding: 0 32px; font-weight: 600; box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2); }

    @media (max-width: 600px) {
      .settings-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SettingsComponent {
  private settingsService = inject(SettingsService);
  private claimsService = inject(ClaimsService);
  private snackBar = inject(MatSnackBar);

  settings = this.settingsService.settings;

  toggleSetting(key: keyof UserSettings, value: boolean) {
    this.settingsService.updateSettings({ [key]: value });
    this.snackBar.open(`System orchestration updated: ${key}`, 'Synchronized', { duration: 2000 });
  }

  enable2FA() {
    this.settingsService.updateSettings({ twoFactorEnabled: true });
    this.snackBar.open('Security Orchestration: 2FA successfully activated', 'Authorized', { duration: 3000 });
  }

  exportLedger() {
    const claims = this.claimsService.mockClaims;
    if (!claims || claims.length === 0) {
      this.snackBar.open('No clinical records found to export', 'Retry', { duration: 3000 });
      return;
    }

    const headers = 'ClaimID,ClaimNumber,PatientName,ProviderName,ServiceDate,Amount,Status\n';
    const csv = claims.map(c => 
      `${c.claimId},${c.claimNumber},"${c.patientName}","${c.providerName || ''}",${c.serviceDate},${c.totalAmount},${c.status}`
    ).join('\n');

    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tancura_claims_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Clinical ledger exported successfully', 'Success', { duration: 3000 });
  }

  clearCache() {
    if (confirm('Are you sure you want to reset all clinical data? This will restore the system to its initial state.')) {
      localStorage.clear();
      window.location.reload();
    }
  }

  applyAll() {
    this.snackBar.open('Global clinical orchestration synchronized', 'Success', { duration: 3000 });
  }
}
