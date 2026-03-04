import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleChartsModule, ChartType } from 'angular-google-charts';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthMeResponse } from '../../../core/auth/auth-user.model';
import { AuthUserService } from '../../../core/auth/auth-user.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    GoogleChartsModule,
    FormsModule,
    RouterOutlet,
    RouterModule,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {
  user$!: Observable<AuthMeResponse | null>;

  constructor(
    public authUser: AuthUserService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.user$ = this.authUser.user$;
  }

  isClosed = false;

  // ✅ Submenus do print
  submenuOficinaAberto = true;
  submenuIntegracoesAberto = false;
  submenuAdministracaoAberto = false;

  submenuVeiculosAberto = false;

  // --------------------------
  // DADOS DO DASHBOARD
  // --------------------------
  statusFrota = {
    total: 25,
    emRota: 8,
    manutencao: 3,
  };

  notificacoes = [
    { tipo: 'alerta', mensagem: 'Caminhão ABC-1234 está há 5 dias sem movimentação.' },
    { tipo: 'risco', mensagem: 'Caminhão XYZ-8899 excedeu o limite de km diário.' },
    { tipo: 'aviso', mensagem: 'Caminhão FGH-5521 está há 12 dias na oficina.' },
  ];

  periodoSelecionado = 7;

  chart = {
    type: ChartType.ColumnChart,
    columns: ['Dia', 'Cargas'],
    data: [] as any[],
    options: {
      legend: { position: 'none' },
      backgroundColor: 'transparent',
      colors: ['#1e3c72'],
    },
  };

  ngOnInit() {
    // ✅ carrega usuário logado (nome + perfil) pra sidebar/header
    this.authUser.loadMe().subscribe({
      error: () => {
        // se quiser tratar: token inválido, redirecionar login etc.
      },
    });

    this.atualizarGrafico();

    // 🔒 Sidebar inicia fechado em telas pequenas
    if (window.innerWidth <= 800) {
      this.isClosed = true;
      this.fecharTodosSubmenus();
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth <= 800) {
        this.isClosed = true;
        this.fecharTodosSubmenus();
      }
    });
  }

  atualizarGrafico() {
    const dados: any[] = [];
    const dias = this.periodoSelecionado;
    const hoje = new Date();

    for (let i = dias - 1; i >= 0; i--) {
      const data = new Date();
      data.setDate(hoje.getDate() - i);

      const dia = data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });

      const cargas = Math.floor(Math.random() * 20) + 1;
      dados.push([dia, cargas]);
    }

    this.chart.data = dados;
  }

  // --------------------------
  // SIDEBAR TOGGLE
  // --------------------------
  toggleSidebar() {
    if (window.innerWidth <= 800) {
      this.isClosed = true;
      this.fecharTodosSubmenus();
      return;
    }

    this.isClosed = !this.isClosed;

    if (this.isClosed) {
      this.fecharTodosSubmenus();
    }
  }

  private fecharTodosSubmenus() {
    this.submenuOficinaAberto = false;
    this.submenuIntegracoesAberto = false;
    this.submenuAdministracaoAberto = false;
    this.submenuVeiculosAberto = false;
  }

  // --------------------------
  // SUBMENUS (não abre se sidebar fechada)
  // --------------------------
  toggleSubmenuOficina() {
    if (this.isClosed) return;
    this.submenuOficinaAberto = !this.submenuOficinaAberto;
  }

  toggleSubmenuIntegracoes() {
    if (this.isClosed) return;
    this.submenuIntegracoesAberto = !this.submenuIntegracoesAberto;
  }

  toggleSubmenuAdministracao() {
    if (this.isClosed) return;
    this.submenuAdministracaoAberto = !this.submenuAdministracaoAberto;
  }

  toggleSubmenuVeiculos() {
    if (this.isClosed) return;
    this.submenuVeiculosAberto = !this.submenuVeiculosAberto;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.authUser.clear();
        this.router.navigateByUrl('/login', { replaceUrl: true }).finally(() => {
          window.location.replace('/login');
        });
      },
      error: () => {
        this.authUser.clear();
        this.router.navigateByUrl('/login', { replaceUrl: true }).finally(() => {
          window.location.replace('/login');
        });
      },
    });
  }
}
