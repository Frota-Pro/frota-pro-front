import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard').then(
        (m) => m.Dashboard
      ),

    children: [
      {
        path: 'dashboard-home',
        loadComponent: () =>
          import(
            './features/dashboard/dashboard-home/dashboard-home.component/dashboard-home.component'
          ).then((m) => m.DashboardHomeComponent),
      },

      {
        path: 'colaboradores',
        loadComponent: () =>
          import('./features/colaboradores/colaboradores.component').then(
            (m) => m.ColaboradoresComponent
          ),
      },

      {
        path: 'veiculos',
        loadComponent: () =>
          import('./features/veiculos/veiculos.component').then(
            (m) => m.VeiculosComponent
          ),
      },


    ],
  },
];
