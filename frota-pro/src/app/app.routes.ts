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
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'dashboard',
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
        path: 'colaboradores',
        loadComponent: () =>
          import('./features/colaboradores/colaboradores.component').then(
            (m) => m.ColaboradoresComponent
          ),
      },

      {
        path: 'veiculos',
        loadComponent: () =>
          import('./features/veiculos/veiculos.component').then((m) => m.VeiculosComponent),
      },

      {
        path: 'categorias',
        loadComponent: () =>
          import('./features/veiculos/categorias/categorias.component').then(
            (m) => m.CategoriasComponent
          ),
      },

      {
        path: 'cargas',
        loadComponent: () =>
          import('./features/cargas/cargas.component').then((m) => m.CargasComponent),
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
          import('./features/manutencao/manutencao.component').then((m) => m.ManuntencaoComponent),
      },
    ],
  },
];
