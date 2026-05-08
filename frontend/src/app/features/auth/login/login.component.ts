import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="login-wrapper">
      <!-- Dynamic Floating Clinical Artifacts -->
      <div class="glass-background">
        <div class="glass-icon icon-1"><mat-icon>local_hospital</mat-icon></div>
        <div class="glass-icon icon-2"><mat-icon>medication</mat-icon></div>
        <div class="glass-icon icon-3"><mat-icon>monitor_heart</mat-icon></div>
        <div class="glass-icon icon-4"><mat-icon>medical_services</mat-icon></div>
        <div class="glass-icon icon-5"><mat-icon>vaccines</mat-icon></div>
        <div class="glass-icon icon-6"><mat-icon>biotech</mat-icon></div>
        <div class="glass-icon icon-7"><mat-icon>healing</mat-icon></div>
        <div class="glass-icon icon-8"><mat-icon>stethoscope</mat-icon></div>
      </div>

      <div class="login-card fade-in">
        <div class="logo-section">
          <div class="logo-circle">
            <mat-icon>local_hospital</mat-icon>
          </div>
          <h1>TanCura</h1>
          <p>Clinical Orchestration Hub</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="input-group">
            <label>Email Address</label>
            <div class="pill-input">
              <mat-icon>email</mat-icon>
              <input type="email" formControlName="email" placeholder="name@tancura.io">
            </div>
          </div>

          <div class="input-group">
            <label>Password</label>
            <div class="pill-input">
              <mat-icon>lock</mat-icon>
              <input type="password" formControlName="password" placeholder="••••••••">
            </div>
          </div>

          @if (error()) {
            <div class="error-message">
              <mat-icon>error_outline</mat-icon>
              <span>{{ error() }}</span>
            </div>
          }

          <button type="submit" class="login-btn" [disabled]="loginForm.invalid || loading()">
            @if (loading()) {
              <mat-spinner diameter="24" color="accent"></mat-spinner>
            } @else {
              Access Workspace
            }
          </button>
        </form>

        <div class="demo-creds">
          <h4>Clinical Demo Credentials</h4>
          <p>Admin: <strong>admin&#64;tancura.io</strong></p>
          <p>Password: <strong>TanCura123!</strong></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: radial-gradient(circle at top right, #eff6ff, #f8fafc);
      position: relative; overflow: hidden; padding: 20px;
    }

    /* Glass Telemetry Background */
    .glass-background { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
    .glass-icon {
      position: absolute; width: 120px; height: 120px;
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 32px; display: flex; align-items: center; justify-content: center;
      color: var(--primary); opacity: 0.15;
      animation: float 20s infinite ease-in-out;
      box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07);
    }
    .glass-icon mat-icon { font-size: 56px; width: 56px; height: 56px; }

    .icon-1 { top: 10%; left: 10%; animation-delay: 0s; }
    .icon-2 { top: 20%; right: 15%; animation-delay: -5s; width: 80px; height: 80px; opacity: 0.1; }
    .icon-3 { bottom: 15%; left: 15%; animation-delay: -2s; width: 100px; height: 100px; }
    .icon-4 { bottom: 20%; right: 10%; animation-delay: -8s; }
    .icon-5 { top: 50%; left: 5%; animation-delay: -12s; width: 70px; height: 70px; opacity: 0.08; }
    .icon-6 { top: 45%; right: 5%; animation-delay: -15s; width: 90px; height: 90px; }
    .icon-7 { top: 5%; right: 40%; animation-delay: -3s; width: 60px; height: 60px; opacity: 0.05; }
    .icon-8 { bottom: 5%; left: 45%; animation-delay: -10s; width: 80px; height: 80px; opacity: 0.05; }

    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
      33% { transform: translateY(-30px) rotate(5deg) scale(1.05); }
      66% { transform: translateY(20px) rotate(-5deg) scale(0.95); }
    }
    
    .login-card {
      width: 440px; background: rgba(255, 255, 255, 0.85); 
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border-radius: 32px; padding: 48px;
      border: 1px solid rgba(255, 255, 255, 0.6); 
      box-shadow: 0 40px 100px rgba(15, 23, 42, 0.08);
      position: relative; z-index: 10;
    }
    
    .logo-section { text-align: center; margin-bottom: 40px; }
    .logo-circle {
      width: 56px; height: 56px; background: var(--primary);
      border-radius: 18px; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
    }
    .logo-circle mat-icon { color: #fff; font-size: 28px; width: 28px; height: 28px; }
    .logo-section h1 { font-size: 28px; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -1px; }
    .logo-section p { color: var(--text-muted); font-size: 15px; margin-top: 6px; font-weight: 500; }

    .input-group { margin-bottom: 20px; }
    .input-group label { display: block; font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px; margin-left: 4px; }
    
    .pill-input {
      display: flex; align-items: center; background: rgba(255,255,255,0.7);
      border: 1px solid #e2e8f0; border-radius: 16px; height: 52px;
      padding: 0 20px; gap: 12px; transition: var(--transition);
    }
    .pill-input:focus-within { background: #fff; border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-light); }
    .pill-input mat-icon { color: #94a3b8; font-size: 20px; width: 20px; height: 20px; }
    .pill-input input { background: transparent; border: none; outline: none; width: 100%; font-size: 15px; color: var(--text-main); font-weight: 600; }

    .error-message {
      background: rgba(255, 241, 242, 0.8); color: var(--error); border-radius: 12px;
      padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
      font-size: 13px; font-weight: 600; border: 1px solid rgba(244, 63, 94, 0.2);
    }

    .login-btn {
      width: 100%; height: 52px; background: var(--primary); color: #fff;
      border: none; border-radius: 16px; font-size: 16px; font-weight: 700;
      cursor: pointer; margin-top: 8px; transition: var(--transition);
      box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
      display: flex; align-items: center; justify-content: center;
    }
    .login-btn:hover { background: var(--primary-hover); transform: translateY(-2px); box-shadow: 0 15px 30px rgba(37, 99, 235, 0.3); }
    .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .demo-creds {
      margin-top: 32px; padding: 20px; background: rgba(255, 255, 255, 0.4);
      border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .demo-creds h4 { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; }
    .demo-creds p { font-size: 13px; color: var(--text-muted); margin: 4px 0; font-weight: 600; }
    .demo-creds strong { color: var(--text-main); }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  loading = signal(false);
  error = signal<string | null>(null);

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.loginForm.value as any).subscribe({
      next: (res) => {
        if (res.role === 'Admin') this.router.navigate(['/admin']);
        else if (res.role === 'Provider') this.router.navigate(['/claims']);
        else this.router.navigate(['/claims']);
      },
      error: (err) => {
        this.error.set(err.message || 'Invalid clinical credentials');
        this.loading.set(false);
      }
    });
  }
}
