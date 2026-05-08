import { Component, OnInit, inject, signal, OnDestroy, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClaimsService } from '../../../core/services/api.services';
import { SearchService } from '../../../core/services/search.service';
import { ClaimSummary, ClaimMetrics, ClaimStatus } from '../../../shared/models/models';
import { Subject, takeUntil, debounceTime, switchMap, finalize, tap } from 'rxjs';

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container fade-in">
      <!-- Top Stats Bar -->
      <div class="stats-bar">
        <div class="stat-card">
          <div class="s-icon blue"><mat-icon>assignment</mat-icon></div>
          <div class="s-info">
            <span class="s-label">Total Claims</span>
            <span class="s-value">{{ stats().totalClaims }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="s-icon amber"><mat-icon>pending_actions</mat-icon></div>
          <div class="s-info">
            <span class="s-label">Pending Review</span>
            <span class="s-value">{{ stats().pending }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="s-icon green"><mat-icon>check_circle</mat-icon></div>
          <div class="s-info">
            <span class="s-label">Total Paid</span>
            <span class="s-value">{{ stats().approved }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="s-icon rose"><mat-icon>payments</mat-icon></div>
          <div class="s-info">
            <span class="s-label">Paid Amount</span>
            <span class="s-value">{{ stats().totalAmountProcessed | currency }}</span>
          </div>
        </div>
      </div>

      <!-- Claims Ledger -->
      <div class="ledger-card">
        <div class="ledger-header">
          <div class="h-left">
            <h2>Clinical Ledger</h2>
            <p class="h-subtitle">Orchestrating {{ claims().length }} active records</p>
          </div>
          
          <div class="ledger-actions">
            <div class="filter-pill">
              <mat-icon>filter_list</mat-icon>
              <select [(ngModel)]="statusFilter" (change)="loadClaims()">
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <button mat-raised-button color="primary" routerLink="/claims/submit" class="create-btn">
              <mat-icon>add</mat-icon> New Claim
            </button>
          </div>
        </div>

        <div class="table-container">
          @if (loading()) {
            <div class="table-loader">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else {
            <table class="claim-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Patient Name</th>
                  <th>Service Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (claim of claims(); track claim.claimId) {
                  <tr class="claim-row">
                    <td><span class="claim-no">{{ claim.claimNumber }}</span></td>
                    <td><span class="patient-cell">{{ claim.patientName }}</span></td>
                    <td>{{ claim.serviceDate | date }}</td>
                    <td><span class="amount-cell">{{ claim.totalAmount | currency }}</span></td>
                    <td>
                      <span class="status-pill" [class]="'status-' + claim.status.toLowerCase()">
                        {{ claim.status }}
                      </span>
                    </td>
                    <td>
                      <a mat-icon-button [routerLink]="['/claims', claim.claimId]" class="action-btn">
                        <mat-icon>visibility</mat-icon>
                      </a>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="empty-state">
                      <mat-icon>search_off</mat-icon>
                      <p>No claims found matching the criteria</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>

        <!-- Pagination Bar -->
        <div class="ledger-footer">
          <div class="pagination-info">
            Showing <strong>{{ claims().length }}</strong> of <strong>{{ total() }}</strong> clinical records
          </div>
          <div class="pagination-actions">
            <button mat-icon-button [disabled]="currentPage() === 1" (click)="prevPage()">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span class="page-indicator">Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button mat-icon-button [disabled]="currentPage() >= totalPages()" (click)="nextPage()">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    
    .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
    .stat-card {
      background: #ffffff; border-radius: 20px; padding: 24px;
      border: 1px solid #e2e8f0; box-shadow: var(--shadow-md);
      display: flex; align-items: center; gap: 20px; transition: var(--transition);
    }
    .stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .s-icon {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .s-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    
    .blue  { background: #eff6ff; color: #3b82f6; }
    .green { background: #ecfdf5; color: #10b981; }
    .amber { background: #fffbeb; color: #f59e0b; }
    .rose  { background: #fff1f2; color: #f43f5e; }

    .s-info { display: flex; flex-direction: column; }
    .s-label { font-size: 13px; font-weight: 600; color: var(--text-muted); }
    .s-value { font-size: 24px; font-weight: 800; color: var(--text-main); }

    .ledger-card {
      background: #ffffff; border-radius: 24px; padding: 0;
      border: 1px solid #e2e8f0; box-shadow: var(--shadow-lg);
      overflow: hidden;
    }
    .ledger-header { padding: 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .h-left h2 { font-size: 22px; font-weight: 800; margin: 0; }
    .h-subtitle { margin: 4px 0 0; color: var(--text-muted); font-size: 13px; }
    
    .ledger-actions { display: flex; gap: 16px; align-items: center; }
    .filter-pill {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9999px;
      height: 44px; padding: 0 16px; display: flex; align-items: center; gap: 8px;
    }
    .filter-pill mat-icon { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; }
    .filter-pill select { background: transparent; border: none; outline: none; font-size: 14px; font-weight: 600; color: var(--text-main); cursor: pointer; }
    .create-btn { border-radius: 12px !important; height: 44px; font-weight: 700; }

    .table-container { min-height: 400px; position: relative; }
    .table-loader { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.7); z-index: 10; }

    .claim-table { width: 100%; border-collapse: collapse; }
    .claim-table th { padding: 20px 32px; text-align: left; font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
    .claim-table td { padding: 20px 32px; font-size: 14px; color: var(--text-main); border-bottom: 1px solid #f8fafc; }
    .claim-row:hover td { background: #f8fafc; }
    
    .claim-no { font-weight: 700; color: var(--primary); }
    .patient-cell { font-weight: 600; }
    .amount-cell { font-weight: 800; color: var(--text-main); }

    .status-pill {
      display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 9999px;
      font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .status-pending   { background: #fef3c7; color: #92400e; }
    .status-approved  { background: #dcfce7; color: #166534; }
    .status-rejected  { background: #fee2e2; color: #991b1b; }
    .status-paid      { background: #f3e8ff; color: #6b21a8; }
    .status-processing { background: #e2e8f0; color: #475569; }

    .action-btn { color: #94a3b8; transition: var(--transition); }
    .action-btn:hover { color: var(--primary); background: var(--primary-light); }

    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.2; }
    .empty-state p { font-size: 16px; font-weight: 500; }

    .ledger-footer { padding: 16px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .pagination-info { font-size: 13px; color: var(--text-muted); }
    .pagination-actions { display: flex; align-items: center; gap: 12px; }
    .page-indicator { font-size: 13px; font-weight: 700; color: var(--text-main); }
  `]
})
export class ClaimsListComponent implements OnInit, OnDestroy {
  private claimsService = inject(ClaimsService);
  private searchService = inject(SearchService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  claims = signal<ClaimSummary[]>([]);
  stats = signal<ClaimMetrics>({
    totalClaims: 0, approved: 0, rejected: 0, pending: 0,
    totalAmountProcessed: 0, avgProcessingHours: 0, activePatients: 0,
    clinicalAccuracy: 0, networkEfficiency: 0, dailyBreakdown: []
  });
  loading = signal(true);
  statusFilter = 'All';
  total = signal(0);
  currentPage = signal(1);
  pageSize = 50;
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize) || 1);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      tap(() => this.loading.set(true)),
      switchMap(q => {
        const params: any = { page: this.currentPage(), pageSize: this.pageSize };
        if (this.statusFilter !== 'All') params.status = this.statusFilter;
        if (q) params.search = q;
        return this.claimsService.getClaims(params).pipe(
          finalize(() => this.loading.set(false))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.claims.set(result.items);
      this.total.set(result.total);
    });

    // Bridge signal to subject correctly using effect()
    effect(() => {
      const q = this.searchService.query();
      this.searchSubject.next(q);
    });
  }

  ngOnInit() {
    this.loadStats();
    this.searchSubject.next(this.searchService.query());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClaims() {
    this.currentPage.set(1);
    this.searchSubject.next(this.searchService.query());
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadClaimsPage();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadClaimsPage();
    }
  }

  private loadClaimsPage() {
    this.searchSubject.next(this.searchService.query());
  }

  loadStats() {
    this.claimsService.getStats().subscribe(s => this.stats.set(s));
  }
}
