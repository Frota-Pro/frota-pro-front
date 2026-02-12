import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

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
          import('./features/dashboard/dashboard-home/dashboard-home.component/dashboard-home.component')
            .then((m) => m.DashboardHomeComponent),
      },

      // Motoristas
      {
        path: 'motoristas',
        loadComponent: () =>
          import('./features/motoristas/motoristas-list/motoristas-list.component')
            .then(m => m.MotoristasListComponent),
      },
      {
        path: 'motoristas/:codigo',
        loadComponent: () =>
          import('./features/motoristas/motorista-detalhe/motorista-detalhe.component')
            .then(m => m.MotoristaDetalheComponent),
      },

      // Caminhões
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

      // Cargas
      {
        path: 'cargas',
        loadComponent: () =>
          import('./features/cargas/cargas-list/cargas-list.component')
            .then(m => m.CargasListComponent),
      },
      {
        path: 'cargas/:numeroCarga',
        loadComponent: () =>
          import('./features/cargas/carga-detalhe/carga-detalhe.component')
            .then(m => m.CargaDetalheComponent),
      },

      // Metas
      {
        path: 'metas',
        loadComponent: () =>
          import('./features/metas/metas.component').then((m) => m.MetasComponent),
      },
      {
        path: 'metas/:id',
        loadComponent: () =>
          import('./features/metas/meta-detalhe/meta-detalhe.component')
            .then(m => m.MetaDetalheComponent),
      },

      // ✅ Relatórios
      {
        path: 'relatorios',
        loadComponent: () =>
          import('./features/relatorios/relatorios.component')
            .then((m) => m.RelatoriosComponent),
      },

      // Abastecimentos
      {
        path: 'abastecimentos',
        loadComponent: () =>
          import('./features/abastecimento/abastecimentos.component')
            .then((m) => m.AbastecimentosComponent),
      },

      // Oficina - Manutenções
      {
        path: 'manutencoes',
        loadComponent: () =>
          import('./features/oficina/manutencoes/manutencoes.component')
            .then((m) => m.ManutencoesComponent),
      },
      {
        path: 'manutencoes/:codigo',
        loadComponent: () =>
          import('./features/oficina/manutencao-detalhe/manutencao-detalhe.component')
            .then(m => m.ManutencaoDetalheComponent),
      },

      // Oficinas
      {
        path: 'oficinas',
        loadComponent: () =>
          import('./features/oficina/oficinas/oficinas.component')
            .then(m => m.OficinasComponent),
      },
      {
        path: 'oficinas/:codigo',
        loadComponent: () =>
          import('./features/oficina/oficina-detalhe/oficina-detalhe.component')
            .then(m => m.OficinaDetalheComponent),
      },

      // Pneus
      {
        path: 'pneus',
        loadComponent: () =>
          import('./features/oficina/pneus/pneus.component').then(m => m.PneusComponent),
      },
      {
        path: 'pneus/:codigo',
        loadComponent: () =>
          import('./features/oficina/pneu-detalhe/pneu-detalhe.component').then(m => m.PneuDetalheComponent),
      },

      // Integrações
      {
        path: 'integracoes/winthor',
        loadComponent: () =>
          import('./features/integracoes/winthor/winthor.component')
            .then(m => m.WinthorComponent),
      },
      // ❌ removido: integracoes/licencas

      // Administração
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/usuarios/usuarios.component')
            .then(m => m.UsuariosComponent)
      },

      // ❌ removido: admin/logs

      // fallback dentro do dashboard
      { path: '', redirectTo: 'dashboard-home', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard-home' },
    ],
  },

  // fallback geral
  { path: '**', redirectTo: 'login' },
];
