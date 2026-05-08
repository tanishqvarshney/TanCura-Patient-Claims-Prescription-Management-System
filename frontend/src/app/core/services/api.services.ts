import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { of, delay, Observable } from 'rxjs';
import {
  AuditLog,
  ClaimDetail, ClaimMetrics, ClaimStatus, ClaimSummary, FormularyResult,
  PagedResult, SubmitClaimRequest, SubmitClaimResponse
} from '../../shared/models/models';
import { AuditService } from './audit.service';
import { environment } from '../../../environments/environment';

// Shared State Orchestration
const INITIAL_MOCK_CLAIMS: ClaimSummary[] = [
  { claimId: 'c1', claimNumber: 'CLN-2023-001', patientName: 'John Doe', providerName: 'Northwest Medical Group', serviceDate: '2023-10-15', totalAmount: 450.00, status: 'Approved' },
  { claimId: 'c2', claimNumber: 'CLN-2023-002', patientName: 'Jane Smith', providerName: 'City General Hospital', serviceDate: '2023-10-18', totalAmount: 1200.50, status: 'Pending' },
  { claimId: 'c3', claimNumber: 'CLN-2023-003', patientName: 'Robert Brown', providerName: 'Valley Health Center', serviceDate: '2023-10-20', totalAmount: 320.00, status: 'Rejected' },
  { claimId: 'c4', claimNumber: 'CLN-2023-004', patientName: 'Emily Davis', providerName: 'Northwest Medical Group', serviceDate: '2023-10-22', totalAmount: 890.00, status: 'Paid' },
  { claimId: 'c5', claimNumber: 'CLN-2023-005', patientName: 'Michael Wilson', providerName: 'Lakeside Clinic', serviceDate: '2023-10-25', totalAmount: 150.75, status: 'Processing' },
  { claimId: 'c6', claimNumber: 'CLN-2023-006', patientName: 'Sarah Miller', providerName: 'City General Hospital', serviceDate: '2023-10-26', totalAmount: 2100.00, status: 'Pending' },
  { claimId: 'c7', claimNumber: 'CLN-2023-007', patientName: 'James Taylor', providerName: 'Valley Health Center', serviceDate: '2023-10-27', totalAmount: 55.00, status: 'Approved' },
  { claimId: 'c8', claimNumber: 'CLN-2023-008', patientName: 'Linda Anderson', providerName: 'Northwest Medical Group', serviceDate: '2023-10-28', totalAmount: 730.00, status: 'Paid' },
  { claimId: 'c9', claimNumber: 'CLN-2023-009', patientName: 'Emily Davis', providerName: 'Lakeside Clinic', serviceDate: '2023-10-29', totalAmount: 1100.00, status: 'Approved' },
  { claimId: 'c10', claimNumber: 'CLN-2023-010', patientName: 'Michael Wilson', providerName: 'City General Hospital', serviceDate: '2023-10-30', totalAmount: 2500.00, status: 'Pending' },
  { claimId: 'c11', claimNumber: 'CLN-2023-011', patientName: 'Sarah Miller', providerName: 'Valley Health Center', serviceDate: '2023-11-01', totalAmount: 420.00, status: 'Rejected' },
  { claimId: 'c12', claimNumber: 'CLN-2023-012', patientName: 'David Garcia', providerName: 'Northwest Medical Group', serviceDate: '2023-11-02', totalAmount: 150.00, status: 'Paid' },
  { claimId: 'c13', claimNumber: 'CLN-2023-013', patientName: 'Jessica Taylor', providerName: 'Lakeside Clinic', serviceDate: '2023-11-03', totalAmount: 680.00, status: 'Approved' },
  { claimId: 'c14', claimNumber: 'CLN-2023-014', patientName: 'Christopher Anderson', providerName: 'City General Hospital', serviceDate: '2023-11-04', totalAmount: 3200.00, status: 'Processing' },
  { claimId: 'c15', claimNumber: 'CLN-2023-015', patientName: 'Ashley Thomas', providerName: 'Valley Health Center', serviceDate: '2023-11-05', totalAmount: 50.00, status: 'Paid' },
  { claimId: 'c16', claimNumber: 'CLN-2023-016', patientName: 'James Jackson', providerName: 'Northwest Medical Group', serviceDate: '2023-11-06', totalAmount: 900.00, status: 'Pending' },
  { claimId: 'c17', claimNumber: 'CLN-2023-017', patientName: 'Mary White', providerName: 'Lakeside Clinic', serviceDate: '2023-11-07', totalAmount: 120.00, status: 'Approved' },
  { claimId: 'c18', claimNumber: 'CLN-2023-018', patientName: 'Robert Harris', providerName: 'City General Hospital', serviceDate: '2023-11-08', totalAmount: 4500.00, status: 'Rejected' },
  { claimId: 'c19', claimNumber: 'CLN-2023-019', patientName: 'Patricia Martin', providerName: 'Valley Health Center', serviceDate: '2023-11-09', totalAmount: 340.00, status: 'Paid' },
  { claimId: 'c20', claimNumber: 'CLN-2023-020', patientName: 'Joseph Thompson', providerName: 'Northwest Medical Group', serviceDate: '2023-11-10', totalAmount: 760.00, status: 'Approved' },
  { claimId: 'c21', claimNumber: 'CLN-2023-021', patientName: 'Jennifer Moore', providerName: 'Lakeside Clinic', serviceDate: '2023-11-11', totalAmount: 230.00, status: 'Pending' },
  { claimId: 'c22', claimNumber: 'CLN-2023-022', patientName: 'William Young', providerName: 'City General Hospital', serviceDate: '2023-11-12', totalAmount: 1100.00, status: 'Rejected' },
  { claimId: 'c23', claimNumber: 'CLN-2023-023', patientName: 'Elizabeth Allen', providerName: 'Valley Health Center', serviceDate: '2023-11-13', totalAmount: 550.00, status: 'Paid' },
  { claimId: 'c24', claimNumber: 'CLN-2023-024', patientName: 'Thomas King', providerName: 'Northwest Medical Group', serviceDate: '2023-11-14', totalAmount: 1200.00, status: 'Rejected' },
  { claimId: 'c25', claimNumber: 'CLN-2023-025', patientName: 'Susan Wright', providerName: 'Lakeside Clinic', serviceDate: '2023-11-15', totalAmount: 310.00, status: 'Approved' },
  { claimId: 'c26', claimNumber: 'CLN-2023-026', patientName: 'Charles Lopez', providerName: 'City General Hospital', serviceDate: '2023-11-16', totalAmount: 2800.00, status: 'Rejected' },
  { claimId: 'c27', claimNumber: 'CLN-2023-027', patientName: 'Margaret Hill', providerName: 'Valley Health Center', serviceDate: '2023-11-17', totalAmount: 45.00, status: 'Paid' },
  { claimId: 'c28', claimNumber: 'CLN-2023-028', patientName: 'Steven Scott', providerName: 'Northwest Medical Group', serviceDate: '2023-11-18', totalAmount: 890.00, status: 'Approved' }
];

const STORAGE_KEY = 'tancura_v3_claims_store';

function loadFromStorage(): ClaimSummary[] {
  if (typeof window === 'undefined') return [...INITIAL_MOCK_CLAIMS];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('ClaimsService: Failed to load claims from storage', e);
  }
  return [...INITIAL_MOCK_CLAIMS];
}

function saveToStorage(claims: ClaimSummary[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
  } catch (e) {
    console.error('ClaimsService: Failed to save to storage', e);
  }
}

@Injectable({ providedIn: 'root' })
export class ClaimsService {
  private http = inject(HttpClient);
  private auditService = inject(AuditService);
  private base = `${environment.apiUrl}/claims`;

  // Use persistent storage
  public mockClaims = loadFromStorage();

  submitClaim(request: SubmitClaimRequest) {
    console.log('ClaimsService: Mocking claim submission', request);
    const claimId = 'c-mock-' + Math.floor(Math.random() * 1000);
    const claimNumber = 'CLN-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const newClaim: ClaimSummary = {
      claimId,
      claimNumber,
      patientName: request.patientName, 
      providerName: request.providerName,
      serviceDate: request.serviceDate,
      totalAmount: request.totalAmount,
      status: 'Pending',
      lineItems: request.lineItems.map(item => ({
        ...item,
        lineTotal: item.quantity * item.unitCost
      }))
    };

    const response: SubmitClaimResponse = {
      claimId,
      claimNumber,
      status: 'Pending',
      submittedDate: new Date().toISOString(),
      validationResults: {
        eligibilityPassed: true,
        duplicateFound: false,
        coverageLimitPassed: true,
        isValid: true
      }
    };

    this.mockClaims = [newClaim, ...this.mockClaims];
    saveToStorage(this.mockClaims);
    this.auditService.log('Added', 'Claim', claimId);
    
    return of(response).pipe(delay(1000));
  }

  getClaim(id: string) {
    const claim = this.mockClaims.find(c => c.claimId === id);
    if (claim) {
      const detail: ClaimDetail = {
        ...claim,
        providerName: claim.providerName || 'Northwest Medical Group',
        submittedDate: new Date().toISOString(),
        lineItems: claim.lineItems || [
          { procedureCode: '99213', quantity: 1, unitCost: 150.00, lineTotal: 150.00 },
          { procedureCode: '85025', quantity: 1, unitCost: 300.00, lineTotal: 300.00 }
        ]
      };
      return of(detail).pipe(delay(500));
    }
    return this.http.get<ClaimDetail>(`${this.base}/${id}`);
  }

  getClaims(params: { page?: number; pageSize?: number; status?: string; search?: string; patientId?: string }) {
    console.log('ClaimsService: Fetching claims with params:', params);
    
    let filtered = [...this.mockClaims];
    
    if (params.status) {
      filtered = filtered.filter(c => c.status === params.status);
    }

    if (params.patientId) {
      filtered = filtered.filter(c => c.patientName === 'John Doe');
    }
    
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.patientName.toLowerCase().includes(q) || 
        c.claimNumber.toLowerCase().includes(q)
      );
    }

    const start = ((params.page ?? 1) - 1) * (params.pageSize ?? 50);
    const end = start + (params.pageSize ?? 50);
    
    const result: PagedResult<ClaimSummary> = {
      items: filtered.slice(start, end),
      total: filtered.length,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10
    };
    
    return of(result).pipe(delay(600));
  }

  getStats(): Observable<ClaimMetrics> {
    const claims = this.mockClaims;
    const totalClaims = claims.length;
    const approved = claims.filter(c => c.status === 'Approved' || c.status === 'Paid').length;
    const rejected = claims.filter(c => c.status === 'Rejected').length;
    const pending = claims.filter(c => c.status === 'Pending' || c.status === 'Processing').length;
    const totalAmount = claims.reduce((sum, c) => sum + c.totalAmount, 0);

    return of({
      totalClaims,
      approved,
      rejected,
      pending,
      totalAmountProcessed: totalAmount,
      avgProcessingHours: 4.2,
      activePatients: 1240,
      clinicalAccuracy: 99.8,
      networkEfficiency: 94.5,
      dailyBreakdown: this.generateDailyBreakdown(claims)
    }).pipe(delay(300));
  }

  private generateDailyBreakdown(claims: ClaimSummary[]) {
    const dates = [...new Set(claims.map(c => c.serviceDate))].sort();
    return dates.slice(-7).map(date => ({
      date,
      submitted: claims.filter(c => c.serviceDate === date).length,
      approved: claims.filter(c => c.serviceDate === date && (c.status === 'Approved' || c.status === 'Paid')).length,
      rejected: claims.filter(c => c.serviceDate === date && c.status === 'Rejected').length
    }));
  }

  getPatientClaims(patientId: string) {
    const filtered = this.mockClaims.filter(c => c.patientName === 'John Doe');
    const result: PagedResult<ClaimSummary> = {
      items: filtered,
      total: filtered.length,
      page: 1,
      pageSize: 10
    };
    return of(result).pipe(delay(400));
  }

  updateClaimStatus(claimId: string, status: ClaimStatus, rejectionReason?: string) {
    const idx = this.mockClaims.findIndex(c => c.claimId === claimId);
    if (idx !== -1) {
      const claim = this.mockClaims[idx];
      this.mockClaims[idx] = { ...claim, status };
      saveToStorage(this.mockClaims);
      this.auditService.log('Modified', 'Claim', claimId);
      return of({ success: true }).pipe(delay(400));
    }
    return of({ success: false }).pipe(delay(400));
  }
}

@Injectable({ providedIn: 'root' })
export class PharmacyService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/pharmacy`;

  getFormulary(ndcCode: string) {
    return this.http.get<FormularyResult>(`${this.base}/formulary/${ndcCode}`);
  }

  searchFormulary(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return of([]);

    const drugs: FormularyResult[] = [
      { ndcCode: '0001-01', drugName: 'Lipitor', dosage: 'Tablet', strength: '20mg', tier: 1, tierLabel: 'Generic (atorvastatin)', copay: 10.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0001-02', drugName: 'Crestor', dosage: 'Tablet', strength: '10mg', tier: 2, tierLabel: 'Preferred Brand (rosuvastatin)', copay: 25.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0001-03', drugName: 'Zocor', dosage: 'Tablet', strength: '40mg', tier: 1, tierLabel: 'Generic (simvastatin)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0001-04', drugName: 'Pravachol', dosage: 'Tablet', strength: '20mg', tier: 1, tierLabel: 'Generic (pravastatin)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0002-01', drugName: 'Lisinopril', dosage: 'Tablet', strength: '10mg', tier: 1, tierLabel: 'Generic', copay: 0.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0002-02', drugName: 'Losartan', dosage: 'Tablet', strength: '50mg', tier: 1, tierLabel: 'Generic (Cozaar)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0002-03', drugName: 'Amlodipine', dosage: 'Tablet', strength: '5mg', tier: 1, tierLabel: 'Generic (Norvasc)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0002-04', drugName: 'Metoprolol Succinate', dosage: 'ER Tablet', strength: '50mg', tier: 1, tierLabel: 'Generic (Toprol XL)', copay: 10.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0002-05', drugName: 'Atenolol', dosage: 'Tablet', strength: '25mg', tier: 1, tierLabel: 'Generic (Tenormin)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0003-01', drugName: 'Metformin', dosage: 'Tablet', strength: '500mg', tier: 1, tierLabel: 'Generic (Glucophage)', copay: 0.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0003-02', drugName: 'Glipizide', dosage: 'Tablet', strength: '5mg', tier: 1, tierLabel: 'Generic', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0003-03', drugName: 'Januvia', dosage: 'Tablet', strength: '100mg', tier: 2, tierLabel: 'Preferred Brand', copay: 35.00, requiresPriorAuth: true, alternatives: [] },
      { ndcCode: '0003-04', drugName: 'Ozempic', dosage: 'Pen', strength: '1mg/dose', tier: 2, tierLabel: 'Preferred Brand', copay: 50.00, requiresPriorAuth: true, alternatives: [] },
      { ndcCode: '0003-05', drugName: 'Jardiance', dosage: 'Tablet', strength: '25mg', tier: 2, tierLabel: 'Preferred Brand', copay: 40.00, requiresPriorAuth: true, alternatives: [] },
      { ndcCode: '0003-06', drugName: 'Humalog', dosage: 'KwikPen', strength: '100 units/mL', tier: 2, tierLabel: 'Preferred Brand', copay: 35.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0004-01', drugName: 'Amoxicillin', dosage: 'Capsule', strength: '500mg', tier: 1, tierLabel: 'Generic', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0004-02', drugName: 'Azithromycin', dosage: 'Tablet', strength: '250mg', tier: 1, tierLabel: 'Generic (Z-Pak)', copay: 10.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0004-03', drugName: 'Ciprofloxacin', dosage: 'Tablet', strength: '500mg', tier: 1, tierLabel: 'Generic', copay: 10.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0004-04', drugName: 'Doxycycline', dosage: 'Capsule', strength: '100mg', tier: 1, tierLabel: 'Generic', copay: 10.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0004-05', drugName: 'Cephalexin', dosage: 'Capsule', strength: '500mg', tier: 1, tierLabel: 'Generic (Keflex)', copay: 10.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0005-01', drugName: 'Ibuprofen', dosage: 'Tablet', strength: '800mg', tier: 1, tierLabel: 'Generic (Motrin)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0005-02', drugName: 'Naproxen', dosage: 'Tablet', strength: '500mg', tier: 1, tierLabel: 'Generic (Naprosyn)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0005-03', drugName: 'Tramadol', dosage: 'Tablet', strength: '50mg', tier: 1, tierLabel: 'Generic (Ultram)', copay: 10.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0005-04', drugName: 'Acetaminophen-Codeine', dosage: 'Tablet', strength: '300-30mg', tier: 1, tierLabel: 'Generic (Tylenol #3)', copay: 10.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0006-01', drugName: 'Sertraline', dosage: 'Tablet', strength: '50mg', tier: 1, tierLabel: 'Generic (Zoloft)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0006-02', drugName: 'Fluoxetine', dosage: 'Capsule', strength: '20mg', tier: 1, tierLabel: 'Generic (Prozac)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0006-03', drugName: 'Escitalopram', dosage: 'Tablet', strength: '10mg', tier: 1, tierLabel: 'Generic (Lexapro)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0006-04', drugName: 'Bupropion XL', dosage: 'Tablet', strength: '150mg', tier: 1, tierLabel: 'Generic (Wellbutrin XL)', copay: 10.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0006-05', drugName: 'Alprazolam', dosage: 'Tablet', strength: '0.5mg', tier: 1, tierLabel: 'Generic (Xanax)', copay: 10.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0007-01', drugName: 'Omeprazole', dosage: 'DR Capsule', strength: '20mg', tier: 1, tierLabel: 'Generic (Prilosec)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0007-02', drugName: 'Pantoprazole', dosage: 'DR Tablet', strength: '40mg', tier: 1, tierLabel: 'Generic (Protonix)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0007-03', drugName: 'Famotidine', dosage: 'Tablet', strength: '20mg', tier: 1, tierLabel: 'Generic (Pepcid)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0008-01', drugName: 'Albuterol', dosage: 'HFA Inhaler', strength: '90mcg', tier: 1, tierLabel: 'Generic (ProAir)', copay: 15.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0008-02', drugName: 'Fluticasone Propionate', dosage: 'Nasal Spray', strength: '50mcg', tier: 1, tierLabel: 'Generic (Flonase)', copay: 10.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0008-03', drugName: 'Montelukast', dosage: 'Tablet', strength: '10mg', tier: 1, tierLabel: 'Generic (Singulair)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0008-04', drugName: 'Advair Diskus', dosage: 'Inhaler', strength: '250/50mcg', tier: 3, tierLabel: 'Non-Preferred Brand', copay: 60.00, requiresPriorAuth: true, alternatives: [] },
      { ndcCode: '0009-01', drugName: 'Levothyroxine', dosage: 'Tablet', strength: '50mcg', tier: 1, tierLabel: 'Generic (Synthroid)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0010-01', drugName: 'Warfarin', dosage: 'Tablet', strength: '5mg', tier: 1, tierLabel: 'Generic (Coumadin)', copay: 5.00, requiresPriorAuth: false, alternatives: [] },
      { ndcCode: '0010-02', drugName: 'Eliquis', dosage: 'Tablet', strength: '5mg', tier: 2, tierLabel: 'Preferred Brand', copay: 45.00, requiresPriorAuth: true, alternatives: [] },
      { ndcCode: '0010-03', drugName: 'Xarelto', dosage: 'Tablet', strength: '20mg', tier: 2, tierLabel: 'Preferred Brand', copay: 45.00, requiresPriorAuth: true, alternatives: [] },
      { ndcCode: '0010-04', drugName: 'Plavix', dosage: 'Tablet', strength: '75mg', tier: 1, tierLabel: 'Generic (clopidogrel)', copay: 10.00, requiresPriorAuth: false, alternatives: [] }
    ];

    const filtered = drugs.filter(d => 
      d.drugName.toLowerCase().includes(q) || 
      d.tierLabel.toLowerCase().includes(q) || 
      d.ndcCode.includes(q)
    ).sort((a, b) => {
      const aExact = a.drugName.toLowerCase().startsWith(q);
      const bExact = b.drugName.toLowerCase().startsWith(q);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.drugName.localeCompare(b.drugName);
    });

    return of(filtered).pipe(delay(400));
  }
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private claimsService = inject(ClaimsService);
  private auditService = inject(AuditService);
  private base = `${environment.apiUrl}/admin`;

  getMetrics(from?: string, to?: string) {
    const claims = this.claimsService.mockClaims;
    const totalClaims = claims.length;
    const approved = claims.filter(c => c.status === 'Approved' || c.status === 'Paid').length;
    const rejected = claims.filter(c => c.status === 'Rejected').length;
    const pending = claims.filter(c => c.status === 'Pending' || c.status === 'Processing').length;
    const totalAmount = claims.reduce((sum, c) => sum + c.totalAmount, 0);

    const mockMetrics: ClaimMetrics = {
      totalClaims,
      approved,
      rejected,
      pending,
      totalAmountProcessed: totalAmount,
      avgProcessingHours: 4.2,
      activePatients: 78452,
      clinicalAccuracy: 99.8,
      networkEfficiency: 94.5,
      dailyBreakdown: [
        { date: '2023-10-20', submitted: 45, approved: 30, rejected: 5 },
        { date: '2023-10-21', submitted: 52, approved: 35, rejected: 8 },
        { date: '2023-10-22', submitted: 38, approved: 25, rejected: 3 },
        { date: '2023-10-23', submitted: 60, approved: 45, rejected: 10 },
        { date: '2023-10-24', submitted: 42, approved: 28, rejected: 4 }
      ]
    };
    return of(mockMetrics).pipe(delay(800));
  }

  getAuditLogs(params: { page: number, pageSize: number, entityType?: string }): Observable<PagedResult<AuditLog>> {
    const allLogs = this.auditService.getAuditLogs();
    const filtered = params.entityType 
      ? allLogs.filter(l => l.targetEntity === params.entityType)
      : allLogs;

    const start = (params.page - 1) * params.pageSize;
    const pagedLogs = filtered.slice(start, start + params.pageSize);

    const result: PagedResult<AuditLog> = {
      items: pagedLogs,
      total: filtered.length,
      page: params.page,
      pageSize: params.pageSize
    };
    
    return of(result).pipe(delay(500));
  }

  logAction(log: Partial<AuditLog>): Observable<void> {
    console.log('AdminService: Logging system event:', log);
    return of(undefined).pipe(delay(200));
  }
}
