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
        path: 'caminhoes/:codigo',
        loadComponent: () =>
          import('./features/caminhoes/caminhao-detalhe/caminhao-detalhe.component')
            .then(m => m.CaminhaoDetalheComponent),
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
          import('./features/oficina/manutencoes/manutencoes.component').then((m) => m.ManutencoesComponent),
      },

      {
        path: 'oficinas',
        loadComponent: () =>
          import('./features/oficina/oficinas/oficinas.component')
            .then(m => m.OficinasComponent),
      },

      {
        path: 'pneus-vida-util',
        loadComponent: () =>
          import('./features/oficina/pneus-vida-util/pneus-vida-util.component')
            .then(m => m.PneusVidaUtilComponent),
      },

      {
        path: 'integracoes/winthor',
        loadComponent: () =>
          import('./features/integracoes/winthor/winthor.component')
            .then(m => m.WinthorComponent),
      },

      {
        path: 'integracoes/licencas',
        loadComponent: () =>
          import('./features/integracoes/licencas/licencas.component').then(m => m.LicencasComponent),
      },

      {
        path: 'admin/usuarios',
        loadComponent: () =>
          import('./features/admin/usuarios/usuarios.component').then(m => m.UsuariosComponent),
      },

      {
        path: 'admin/logs',
        loadComponent: () =>
          import('./features/admin/logs/logs.component').then(m => m.LogsComponent),
      },


    ],
  },
];
