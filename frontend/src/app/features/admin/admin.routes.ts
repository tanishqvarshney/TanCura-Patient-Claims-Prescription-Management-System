import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'patients',
    loadComponent: () =>
      import('./directory/patients/patients.component').then(m => m.PatientsComponent)
  },
  {
    path: 'providers',
    loadComponent: () =>
      import('./directory/providers/providers.component').then(m => m.ProvidersComponent)
  }
];
