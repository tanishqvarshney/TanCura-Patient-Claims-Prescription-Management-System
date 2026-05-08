import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuditLog, PagedResult } from '../../../shared/models/models';
import { AdminService } from '../../../core/services/api.services';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatTableModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatChipsModule,
    MatProgressBarModule, MatTooltipModule, DatePipe, SlicePipe,
    MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <div class="page-container fade-in">
      <div class="page-header">
        <div class="header-text">
          <h1>System Audit Trail</h1>
          <p class="subtitle">Immutable compliance ledger of all PHI access and clinical mutations</p>
        </div>
      </div>

      <div class="filter-grid mat-elevation-z2">
        <div class="filter-item">
          <label>Target Entity</label>
          <mat-form-field appearance="outline">
            <mat-select [formControl]="filters.controls.entityType">
              <mat-option value="">All Entities</mat-option>
              <mat-option value="Claim">Claims</mat-option>
              <mat-option value="Patient">Patients</mat-option>
              <mat-option value="Prescription">Prescriptions</mat-option>
              <mat-option value="User">User Accounts</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="filter-item">
          <label>Action Type</label>
          <mat-form-field appearance="outline">
            <mat-select [formControl]="filters.controls.action">
              <mat-option value="">All Actions</mat-option>
              <mat-option value="Added">Added</mat-option>
              <mat-option value="Modified">Modified</mat-option>
              <mat-option value="Deleted">Deleted</mat-option>
              <mat-option value="Login">Login</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="filter-item">
          <label>Date Range</label>
          <mat-form-field appearance="outline">
            <mat-date-range-input [formGroup]="range" [rangePicker]="picker">
              <input matStartDate formControlName="start" placeholder="Start date">
              <input matEndDate formControlName="end" placeholder="End date">
            </mat-date-range-input>
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-date-range-picker #picker></mat-date-range-picker>
          </mat-form-field>
        </div>

        <div class="filter-item search">
          <label>Actor / Originator</label>
          <mat-form-field appearance="outline">
            <input matInput [formControl]="filters.controls.userId" placeholder="Search User ID...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="loading-bar"></mat-progress-bar>
      }

      <div class="table-wrapper mat-elevation-z2">
        <div class="scroll-container">
          <table mat-table [dataSource]="dataSource" class="audit-table">

            <ng-container matColumnDef="timestamp">
              <th mat-header-cell *matHeaderCellDef>Timestamp (UTC)</th>
              <td mat-cell *matCellDef="let l" class="mono">{{ l.timestamp | date:'yyyy-MM-dd HH:mm:ss' : 'UTC' }}</td>
            </ng-container>

            <ng-container matColumnDef="userId">
              <th mat-header-cell *matHeaderCellDef>Originator</th>
              <td mat-cell *matCellDef="let l" class="mono truncate">
                <span class="id-text">{{ l.userId }}</span>
                <span class="role-badge">{{ l.userRole }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="action">
              <th mat-header-cell *matHeaderCellDef>Action</th>
              <td mat-cell *matCellDef="let l">
                <span class="action-badge" [class]="'action-' + l.action.toLowerCase()">
                  {{ l.action }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="targetEntity">
              <th mat-header-cell *matHeaderCellDef>Target Entity</th>
              <td mat-cell *matCellDef="let l">
                <span class="entity-badge">{{ l.targetEntity }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="entityId">
              <th mat-header-cell *matHeaderCellDef>Resource ID</th>
              <td mat-cell *matCellDef="let l" class="mono truncate" [matTooltip]="l.entityId">{{ l.entityId }}</td>
            </ng-container>

            <ng-container matColumnDef="ipAddress">
              <th mat-header-cell *matHeaderCellDef>Terminal IP</th>
              <td mat-cell *matCellDef="let l" class="mono ip-cell">{{ l.ipAddress || 'Internal System' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let l">
                <span class="status-indicator" [class.success]="l.status === 'Success'" [class.failure]="l.status === 'Failure'">
                  <mat-icon>{{ l.status === 'Success' ? 'check_circle' : 'error' }}</mat-icon>
                  {{ l.status }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: columns" class="log-row"></tr>

            <tr class="no-data-row" *matNoDataRow>
              <td [attr.colspan]="columns.length">
                <div class="empty-state">
                  <mat-icon>security</mat-icon>
                  <h3>No audit records found</h3>
                  <p>Adjust your filters or check back later for system activity.</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <mat-paginator
          class="premium-paginator"
          [length]="total()"
          [pageSize]="pageSize"
          [pageSizeOptions]="[20, 50, 100]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 32px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
    h1 { font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 800; margin: 0; }
    .subtitle { color: var(--text-muted); margin: 4px 0 0; font-size: 15px; font-weight: 500; }

    .filter-grid { 
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
      background: var(--bg-card-light); border-radius: 16px; margin-bottom: 24px; 
      padding: 24px; border: 1px solid rgba(255,255,255,0.4); backdrop-filter: blur(20px);
    }
    .filter-item { display: flex; flex-direction: column; gap: 8px; }
    .filter-item label { color: var(--text-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .filter-item mat-form-field { width: 100%; }

    /* Table Wrapper */
    .table-wrapper { 
      background: var(--bg-card-light); border-radius: 20px; overflow: hidden; 
      border: 1px solid rgba(255,255,255,0.4); backdrop-filter: blur(20px);
      box-shadow: var(--shadow-lg);
    }
    
    .scroll-container { overflow-x: auto; }
    .loading-bar { height: 3px; }
    
    .audit-table { width: 100%; border-collapse: separate; border-spacing: 0; background: transparent !important; }
    
    .mat-mdc-header-cell {
      padding: 16px 24px !important;
      background: rgba(15, 23, 42, 0.02) !important;
      color: var(--text-muted) !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.8px !important;
      border-bottom: 1px solid var(--border) !important;
    }

    .mat-mdc-cell { 
      padding: 16px 24px !important; 
      border-bottom: 1px solid var(--border) !important; 
      color: var(--text-main) !important; 
      font-size: 13px;
    }

    .mono { font-family: 'Outfit', monospace; font-weight: 500; font-size: 12px; }
    .truncate { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .log-row { transition: var(--transition); }
    .log-row:hover { background: rgba(15, 23, 42, 0.02) !important; }

    .id-text { font-weight: 700; display: block; }
    .role-badge { 
      font-size: 10px; font-weight: 800; text-transform: uppercase; 
      color: var(--primary); background: rgba(59, 130, 246, 0.1); 
      padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 4px;
    }

    .action-badge {
      padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700;
      background: rgba(15, 23, 42, 0.05); color: var(--text-on-light-muted);
    }
    .action-added { background: #f0fdf4; color: #16a34a; }
    .action-modified { background: #fff7ed; color: #f97316; }
    .action-approved { background: #eff6ff; color: #3b82f6; }
    .action-login { background: #f5f3ff; color: #7c3aed; }

    .entity-badge { font-weight: 600; color: var(--text-on-light-muted); }
    .status-indicator { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 12px; }
    .status-indicator mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .status-indicator.success { color: #10b981; }
    .status-indicator.failure { color: #ef4444; }

    .premium-paginator { 
      border-top: 1px solid rgba(15, 23, 42, 0.05); 
      background: transparent !important; 
      color: var(--text-on-light) !important; 
    }
  `]
})
export class AuditLogsComponent implements OnInit {
  private admin = inject(AdminService);

  columns = ['timestamp', 'userId', 'action', 'targetEntity', 'entityId', 'ipAddress', 'status'];
  dataSource = new MatTableDataSource<AuditLog>([]);
  total = signal(0);
  loading = signal(false);
  page = 1;
  pageSize = 20;

  filters = new FormGroup({
    entityType: new FormControl(''),
    action: new FormControl(''),
    userId: new FormControl('')
  });

  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null)
  });

  constructor() {
    this.filters.valueChanges.pipe(debounceTime(400), takeUntilDestroyed()).subscribe(() => { this.page = 1; this.loadLogs(); });
    this.range.valueChanges.pipe(debounceTime(400), takeUntilDestroyed()).subscribe(() => { this.page = 1; this.loadLogs(); });
  }

  ngOnInit() { this.loadLogs(); }

  loadLogs() {
    this.loading.set(true);
    this.admin.getAuditLogs({
      page: this.page,
      pageSize: this.pageSize,
      entityType: this.filters.value.entityType || undefined
    }).subscribe({
      next: r => { 
        let filtered = r.items;
        if (this.filters.value.action) filtered = filtered.filter(l => l.action === this.filters.value.action);
        if (this.filters.value.userId) filtered = filtered.filter(l => l.userId.toLowerCase().includes(this.filters.value.userId!.toLowerCase()));
        
        this.dataSource.data = filtered; 
        this.total.set(r.total); 
        this.loading.set(false); 
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }
}
