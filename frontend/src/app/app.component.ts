import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './core/auth/auth.service';
import { SearchService } from './core/services/search.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatDividerModule
  ],
  template: `
    @if (auth.isAuthenticated) {
      <mat-sidenav-container class="app-container">
        <!-- Sidebar -->
        <mat-sidenav mode="side" opened class="sidenav" [class.collapsed]="collapsed()">
          <div class="sidenav-logo">
            <div class="logo-circle">
              <mat-icon>local_hospital</mat-icon>
            </div>
            @if (!collapsed()) {
              <span class="logo-text text-gradient">TanCura</span>
            }
          </div>

          <mat-nav-list class="nav-list">
            @for (item of visibleNavItems(); track item.route) {
              <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link" 
                 class="nav-item" [matTooltip]="collapsed() ? item.label : ''" matTooltipPosition="right">
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                @if (!collapsed()) {
                  <span class="nav-label">{{ item.label }}</span>
                }
              </a>
            }
          </mat-nav-list>

          <div class="sidebar-footer">
            <button mat-icon-button class="toggle-btn" (click)="collapsed.set(!collapsed())">
              <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
            </button>
          </div>
        </mat-sidenav>

        <!-- Main Content -->
        <mat-sidenav-content class="main-content-wrapper">
          <div class="toolbar-sticky-container">
            <mat-toolbar class="toolbar">
              <div class="search-pill">
                <mat-icon>search</mat-icon>
                <input type="text" placeholder="Search claims, patients, providers..."
                  (input)="onSearch($event)">
              </div>
              
              <span class="toolbar-spacer"></span>

              <div class="user-actions">
                <button mat-icon-button class="icon-btn" [matMenuTriggerFor]="notificationsMenu">
                  <mat-icon [class.has-notifications]="true">notifications_none</mat-icon>
                </button>
                <button mat-icon-button class="icon-btn" routerLink="/settings">
                  <mat-icon>settings</mat-icon>
                </button>
                
                <button mat-button [matMenuTriggerFor]="userMenu" class="user-pill">
                  @if (auth.currentUser(); as u) {
                    <div class="user-meta">
                      <span class="user-name">{{ u.email.split('@')[0] }}</span>
                      <span class="user-role">{{ u.role }}</span>
                    </div>
                    <div class="avatar">
                      {{ u.email[0].toUpperCase() }}
                    </div>
                  }
                </button>
              </div>

              <mat-menu #notificationsMenu="matMenu" class="premium-menu notification-menu">
                <div class="menu-header" mat-menu-item disabled>
                  <mat-icon>notifications_active</mat-icon>
                  <span>Clinical Alerts</span>
                </div>
                <mat-divider></mat-divider>
                <div class="notification-item" mat-menu-item>
                  <div class="notif-icon approved"><mat-icon>check_circle</mat-icon></div>
                  <div class="notif-text">
                    <span class="notif-title">Claim CLN-2023-002 Approved</span>
                    <span class="notif-time">2 minutes ago</span>
                  </div>
                </div>
                <div class="notification-item" mat-menu-item>
                  <div class="notif-icon warning"><mat-icon>warning</mat-icon></div>
                  <div class="notif-text">
                    <span class="notif-title">Security Audit Log Generated</span>
                    <span class="notif-time">15 minutes ago</span>
                  </div>
                </div>
                <div class="notification-item" mat-menu-item>
                  <div class="notif-icon pending"><mat-icon>hourglass_empty</mat-icon></div>
                  <div class="notif-text">
                    <span class="notif-title">New Patient Enrollment Pending</span>
                    <span class="notif-time">1 hour ago</span>
                  </div>
                </div>
                <mat-divider></mat-divider>
                <button mat-menu-item class="see-all-btn">
                  <span>View All Telemetry</span>
                </button>
              </mat-menu>

              <mat-menu #userMenu="matMenu" class="premium-menu profile-menu">
                <div class="menu-header">
                  <mat-icon>account_circle</mat-icon>
                  <span>Administrative Control</span>
                </div>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="auth.logout()">
                  <mat-icon>logout</mat-icon> <span>Sign Out</span>
                </button>
              </mat-menu>
            </mat-toolbar>
          </div>

          <!-- Router outlet -->
          <div class="content-area slide-up">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }
    .app-container { height: 100vh; background: var(--bg-main); border: none !important; }
    
    mat-sidenav-container { background: var(--bg-main); }
    mat-sidenav-content { 
      display: flex; flex-direction: column; 
      height: 100vh; overflow-y: auto;
      background: var(--bg-main);
    }

    .sidenav {
      width: 280px; border: none !important; background: var(--bg-side);
      box-shadow: 4px 0 24px rgba(15, 23, 42, 0.05); transition: var(--transition);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .sidenav.collapsed { width: 88px; }

    .sidenav-logo {
      height: 80px; display: flex; align-items: center; gap: 16px;
      padding: 0 24px; margin-bottom: 24px;
    }
    .logo-circle {
      width: 40px; height: 40px; background: var(--primary);
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2); flex-shrink: 0;
    }
    .logo-circle mat-icon { color: #fff; font-size: 24px; width: 24px; height: 24px; }
    .logo-text { font-size: 24px; font-weight: 800; letter-spacing: -1px; }

    .nav-list { padding: 0 12px; flex: 1; }
    .nav-item {
      height: 52px !important; border-radius: 12px !important;
      margin-bottom: 4px !important; transition: var(--transition);
      color: var(--text-muted) !important;
    }
    .nav-item:hover { background: var(--bg-main) !important; color: var(--text-main) !important; }
    .active-link { background: var(--primary-light) !important; color: var(--primary) !important; font-weight: 700 !important; }
    
    .nav-label { font-size: 15px; font-weight: 500; }
    .nav-item mat-icon { font-size: 22px; width: 22px; height: 22px; margin-right: 12px; }

    .sidebar-footer {
      padding: 20px; border-top: 1px solid var(--border);
      display: flex; justify-content: center;
    }
    .toggle-btn { background: var(--bg-main); color: var(--text-muted); }

    .main-content-wrapper { background: var(--bg-main); }
    .toolbar-sticky-container { position: sticky; top: 0; z-index: 100; background: var(--bg-main); }
    .toolbar { background: transparent !important; height: 80px; padding: 0 32px; border: none !important; }
    .toolbar-spacer { flex: 1 1 auto; }

    .search-pill {
      background: var(--bg-surface); border-radius: 9999px; height: 48px; width: 340px;
      display: flex; align-items: center; padding: 0 20px; gap: 12px;
      border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .search-pill mat-icon { color: var(--text-muted); font-size: 20px; width: 20px; height: 20px; }
    .search-pill input { background: transparent; border: none; outline: none; width: 100%; font-size: 14px; color: var(--text-main); }

    .user-actions { display: flex; align-items: center; gap: 8px; }
    .icon-btn { color: #94a3b8; }
    .user-pill {
      display: flex; align-items: center; gap: 12px;
      padding: 0 4px 0 16px !important; border-radius: 16px;
      height: 48px; transition: var(--transition);
      background: rgba(255, 255, 255, 0.5); border: 1px solid var(--border);
    }
    .user-pill:hover { background: #fff; box-shadow: var(--shadow-sm); }
    
    .user-meta { display: flex; flex-direction: column; align-items: flex-end; text-align: right; }
    .user-name { font-size: 13px; font-weight: 700; color: var(--text-main); line-height: 1.2; }
    .user-role { font-size: 10px; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; }

    .avatar {
      width: 40px; height: 40px; border-radius: 12px; background: var(--primary);
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 14px; box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
    }

    .profile-menu { min-width: 200px; }
    .menu-header { 
      padding: 16px 20px; display: flex; align-items: center; gap: 10px;
      color: var(--text-muted); pointer-events: none;
    }
    .menu-header span { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .menu-header mat-icon { font-size: 18px; width: 18px; height: 18px; opacity: 0.5; }

    .content-area { padding: 32px; padding-top: 0; flex: 1; }

    .notification-menu { width: 320px; }
    .notification-item { display: flex; align-items: center; gap: 16px; padding: 12px 16px !important; height: auto !important; }
    .notif-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .notif-icon mat-icon { font-size: 20px; width: 20px; height: 20px; margin: 0 !important; }
    .notif-icon.approved { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .notif-icon.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .notif-icon.pending { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    
    .notif-text { display: flex; flex-direction: column; gap: 2px; }
    .notif-title { font-size: 13px; font-weight: 700; color: var(--text-main); white-space: normal; line-height: 1.4; }
    .notif-time { font-size: 11px; color: var(--text-muted); font-weight: 500; }
    
    .see-all-btn { text-align: center; color: var(--primary) !important; font-weight: 700 !important; font-size: 12px; }
    
    .has-notifications { position: relative; }
    .has-notifications::after {
      content: ''; position: absolute; top: 2px; right: 2px;
      width: 8px; height: 8px; background: var(--error);
      border-radius: 50%; border: 2px solid var(--bg-main);
    }
  `]
})
export class AppComponent {
  private router = inject(Router);
  private searchService = inject(SearchService);
  auth = inject(AuthService);
  collapsed = signal(false);

  onSearch(event: Event) {
    const q = (event.target as HTMLInputElement).value;
    this.searchService.updateQuery(q);
    
    const currentUrl = this.router.url;
    const isSearchable = currentUrl.startsWith('/claims') || currentUrl.startsWith('/pharmacy');
    
    console.log('AppComponent: onSearch query:', q, 'url:', currentUrl, 'isSearchable:', isSearchable);

    if (q && !isSearchable) {
      console.log('AppComponent: Redirecting to /claims for global search');
      this.router.navigate(['/claims']);
    }
  }

  private navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/admin', roles: ['Admin'] },
    { icon: 'description', label: 'My Claims', route: '/claims', roles: ['Admin', 'Provider', 'Patient'] },
    { icon: 'medical_services', label: 'Provider Network', route: '/admin/providers', roles: ['Admin'] },
    { icon: 'people', label: 'Patient Directory', route: '/admin/patients', roles: ['Admin'] },
    { icon: 'medication', label: 'Drug Formulary', route: '/pharmacy', roles: ['Admin', 'Provider', 'Patient'] },
    { icon: 'settings', label: 'Settings', route: '/settings', roles: ['Admin', 'Provider', 'Patient'] }
  ];

  visibleNavItems = computed(() => {
    const role = this.auth.currentUser()?.role;
    if (!role) return [];
    return this.navItems.filter(item => item.roles.includes(role));
  });
}
