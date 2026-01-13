import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard),

    children: [
      {
        path: 'dashboard-home',
        loadComponent: () =>
          import(
            './features/dashboard/dashboard-home/dashboard-home.component/dashboard-home.component'
          ).then((m) => m.DashboardHomeComponent),
      },

      {
        path: 'motoristas',
        loadComponent: () =>
          import('./features/motoristas/motoristas-list/motoristas-list.component')
            .then(m => m.MotoristasListComponent),
      },

      {
        path: 'caminhoes',
        loadComponent: () =>
          import('./features/caminhoes/caminhoes-list/caminhoes-list.component')
            .then(m => m.CaminhoesListComponent),
      },

      {
        path: 'cargas',
        loadComponent: () =>
          import('./features/cargas/cargas-list/cargas-list.component')
            .then(m => m.CargasListComponent),
      },

      {
        path: 'metas',
        loadComponent: () =>
          import('./features/metas/metas.component').then((m) => m.MetasComponent),
      },

      {
        path: 'relatorios',
        loadComponent: () =>
          import('./features/relatorios/relatorios.component').then((m) => m.RelatoriosComponent),
      },

      {
        path: 'abastecimentos',
        loadComponent: () =>
          import('./features/abastecimento/abastecimentos.component').then(
            (m) => m.AbastecimentosComponent
          ),
      },

      {
        path: 'manutencoes',
        loadComponent: () =>
          import('./features/manutencao/manutencoes.component').then((m) => m.ManutencoesComponent),
      },
    ],
  },
];
