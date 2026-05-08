import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ClaimsService } from '../../../core/services/api.services';
import { ClaimMetrics } from '../../../shared/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatMenuModule, MatSnackBarModule, BaseChartDirective
  ],
  template: `
    <div class="dashboard-container fade-in">
      <!-- KPI Row -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="k-icon blue-k"><mat-icon>assignment</mat-icon></div>
          <span class="k-label">Total Claims</span>
          <span class="k-value">{{ metrics().totalClaims }}</span>
          <div class="k-trend up">
            <mat-icon>trending_up</mat-icon> 12% vs last month
          </div>
        </div>
        <div class="kpi-card">
          <div class="k-icon amber-k"><mat-icon>pending_actions</mat-icon></div>
          <span class="k-label">Pending Adjudication</span>
          <span class="k-value">{{ metrics().pending }}</span>
          <div class="k-trend down">
            <mat-icon>trending_down</mat-icon> 5% improvement
          </div>
        </div>
        <div class="kpi-card">
          <div class="k-icon green-k"><mat-icon>verified</mat-icon></div>
          <span class="k-label">Approved Claims</span>
          <span class="k-value">{{ metrics().approved }}</span>
          <div class="k-trend up">
            <mat-icon>trending_up</mat-icon> 8% increase
          </div>
        </div>
        <div class="kpi-card">
          <div class="k-icon rose-k"><mat-icon>account_balance_wallet</mat-icon></div>
          <span class="k-label">Total Paid Out</span>
          <span class="k-value">{{ metrics().totalAmountProcessed | currency }}</span>
          <div class="k-trend up">
            <mat-icon>trending_up</mat-icon> 15% increase
          </div>
        </div>
      </div>

      <div class="main-grid">
        <div class="left-col">
          <!-- Claims Volume Chart -->
          <div class="chart-container">
            <div class="c-header">
              <h3>Claims Performance (30 Days)</h3>
              <button mat-icon-button [matMenuTriggerFor]="chartMenu">
                <mat-icon>more_vert</mat-icon>
              </button>

              <mat-menu #chartMenu="matMenu" class="premium-menu">
                <button mat-menu-item (click)="exportChartData()">
                  <mat-icon>download</mat-icon>
                  <span>Export to CSV</span>
                </button>
                <button mat-menu-item (click)="toggleLegend()">
                  <mat-icon>{{ lineChartOptions!.plugins!.legend!.display ? 'visibility_off' : 'visibility' }}</mat-icon>
                  <span>{{ lineChartOptions!.plugins!.legend!.display ? 'Hide' : 'Show' }} Legend</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="refreshData()">
                  <mat-icon>refresh</mat-icon>
                  <span>Refresh Telemetry</span>
                </button>
              </mat-menu>
            </div>
            <div class="chart-wrapper">
              <canvas baseChart
                [data]="lineChartData"
                [options]="lineChartOptions"
                [type]="'line'">
              </canvas>
            </div>
          </div>

          <!-- Secondary Insight -->
          <div class="insight-card">
            <h3><mat-icon>insights</mat-icon> Orchestration Insights</h3>
            <div class="metrics-row">
              <div class="glass-card metric-widget">
                <span class="m-label">Average Processing Time</span>
                <span class="m-value">{{ metrics().avgProcessingHours }} Days</span>
              </div>
              <div class="glass-card metric-widget">
                <span class="m-label">Clinical Accuracy</span>
                <span class="m-value">{{ metrics().clinicalAccuracy }}%</span>
              </div>
              <div class="glass-card metric-widget">
                <span class="m-label">Network Efficiency</span>
                <span class="m-value">{{ metrics().networkEfficiency }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="activity-sidebar">
          <div class="glass-card feed-card">
            <div class="card-header"><h3>Intelligence Feed</h3></div>
            <div class="feed-content">
              <div class="feed-item">
                <div class="dot blue"></div>
                <div class="feed-body">
                  <p class="f-text">High-volume alert: 250+ claims from <strong>North Clinic</strong></p>
                  <span class="f-time">13 min ago</span>
                </div>
              </div>
              <div class="feed-item">
                <div class="dot cyan"></div>
                <div class="feed-body">
                  <p class="f-text"><strong>Dr. Alisha Sharma</strong> updated claim CLM-2024-PRC-01</p>
                  <span class="f-time">18 min ago</span>
                </div>
              </div>
              <div class="feed-item">
                <div class="dot amber"></div>
                <div class="feed-body">
                  <p class="f-text">Security: Successful admin login from 192.168.1.45</p>
                  <span class="f-time">45 min ago</span>
                </div>
              </div>
            </div>
          </div>

          <div class="glass-card progress-card">
            <h3>Monthly Target</h3>
            <div class="p-info">
              <span class="p-label">Claims Processed</span>
              <span class="p-val">84%</span>
            </div>
            <mat-progress-bar mode="determinate" value="84" class="p-bar"></mat-progress-bar>
            <p class="p-meta">2,100 / 2,500 clinical records</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { max-width: 1400px; margin: 0 auto; padding: 0 16px; }
    
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
    .kpi-card {
      background: #ffffff; border-radius: 20px; padding: 24px;
      border: 1px solid #e2e8f0; box-shadow: var(--shadow-md);
      transition: var(--transition); display: flex; flex-direction: column; 
      align-items: center; text-align: center; min-height: 180px; justify-content: center;
    }
    .kpi-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--primary); }
    
    .k-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 12px;
    }
    .k-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    
    .blue-k  { background: #eff6ff; color: #3b82f6; }
    .green-k { background: #ecfdf5; color: #10b981; }
    .amber-k { background: #fffbeb; color: #f59e0b; }
    .rose-k  { background: #fff1f2; color: #f43f5e; }

    .k-label { font-size: 12px; font-weight: 700; color: var(--text-muted); display: block; text-transform: uppercase; letter-spacing: 0.5px; }
    .k-value { font-size: 24px; font-weight: 800; color: var(--text-main); margin-top: 4px; display: block; font-family: 'Outfit'; }
    .k-trend { font-size: 10px; font-weight: 800; margin-top: 8px; display: flex; align-items: center; gap: 4px; }
    .up { color: #10b981; }
    .down { color: #f43f5e; }

    .main-grid { display: grid; grid-template-columns: 2.2fr 1fr; gap: 24px; }
    
    .chart-container {
      background: #ffffff; border-radius: 24px; padding: 24px;
      border: 1px solid #e2e8f0; box-shadow: var(--shadow-md);
      margin-bottom: 24px;
    }
    .c-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .c-header h3 { font-size: 18px; font-weight: 800; margin: 0; }
    
    .insight-card {
      background: #ffffff; border-radius: 24px; padding: 24px;
      border: 1px solid #e2e8f0; box-shadow: var(--shadow-md);
    }
    .insight-card h3 { font-size: 15px; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .insight-card h3 mat-icon { color: var(--primary); }

    .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .metric-widget {
      background: #f8fafc; border-radius: 14px; padding: 16px;
      border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 4px;
    }
    .m-label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    .m-value { font-size: 16px; font-weight: 800; color: var(--text-main); }

    .feed-card { background: #ffffff; border-radius: 24px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px; box-shadow: var(--shadow-md); }
    .card-header h3 { font-size: 17px; font-weight: 800; margin-bottom: 20px; }
    .feed-item { display: flex; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
    .feed-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
    .dot.blue { background: #3b82f6; }
    .dot.cyan { background: #06b6d4; }
    .dot.amber { background: #f59e0b; }
    .f-text { font-size: 13px; margin: 0; color: var(--text-main); line-height: 1.5; font-weight: 500; }
    .f-time { font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 4px; display: block; }

    .progress-card { background: #ffffff; border-radius: 24px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: var(--shadow-md); }
    .progress-card h3 { font-size: 16px; font-weight: 800; margin-bottom: 16px; }
    .p-info { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .p-label { font-size: 12px; font-weight: 700; color: var(--text-muted); }
    .p-val { font-size: 12px; font-weight: 800; color: var(--primary); }
    .p-bar { height: 6px; border-radius: 4px; margin-bottom: 12px; }
    .p-meta { font-size: 11px; color: var(--text-muted); font-weight: 600; text-align: center; margin: 0; }
  `]
})
export class DashboardComponent implements OnInit {
  private claimsService = inject(ClaimsService);
  private snackBar = inject(MatSnackBar);

  metrics = signal<ClaimMetrics>({
    totalClaims: 0, approved: 0, rejected: 0, pending: 0,
    totalAmountProcessed: 0, avgProcessingHours: 0, activePatients: 0,
    clinicalAccuracy: 0, networkEfficiency: 0, dailyBreakdown: []
  });

  public lineChartData: ChartData<'line'> = {
    labels: ['Oct 1', 'Oct 5', 'Oct 10', 'Oct 15', 'Oct 20', 'Oct 25', 'Oct 30'],
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55, 40],
        label: 'Approved',
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        data: [28, 48, 40, 19, 86, 27, 90],
        label: 'Rejected',
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#64748b', font: { weight: 'bold' } } }
    },
    scales: {
      y: { grid: { color: 'rgba(15, 23, 42, 0.05)' }, ticks: { color: '#64748b' } },
      x: { grid: { display: false }, ticks: { color: '#64748b' } }
    }
  };

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.claimsService.getStats().subscribe(m => {
      this.metrics.set(m);
      this.snackBar.open('Dashboard telemetry synchronized', 'Success', { duration: 2000 });
    });
  }

  toggleLegend() {
    if (this.lineChartOptions?.plugins?.legend) {
      this.lineChartOptions.plugins.legend.display = !this.lineChartOptions.plugins.legend.display;
      // Force chart update
      this.lineChartData = { ...this.lineChartData };
    }
  }

  exportChartData() {
    const headers = 'Date,Approved,Rejected\n';
    const rows = this.lineChartData.labels?.map((label, i) => {
      const appr = this.lineChartData.datasets[0].data[i];
      const rej = this.lineChartData.datasets[1].data[i];
      return `${label},${appr},${rej}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tancura_claims_performance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.snackBar.open('Claims performance ledger exported', 'CSV', { duration: 3000 });
  }
}
