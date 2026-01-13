import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleChartsModule, ChartType } from 'angular-google-charts';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RouterOutlet } from '@angular/router';

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
export class Dashboard {
  isClosed = false;

  // ✅ Submenus do print
  submenuOficinaAberto = true;        // no print ele fica aberto
  submenuIntegracoesAberto = false;
  submenuAdministracaoAberto = false;

  // (Opcional) Se você ainda usa Veículos em alguma parte antiga, deixe.
  // Se não usar mais, pode remover.
  submenuVeiculosAberto = false;

  ngOnInit() {
    this.atualizarGrafico();

    // 🔒 Sidebar inicia fechado em telas pequenas
    if (window.innerWidth <= 800) {
      this.isClosed = true;
      this.fecharTodosSubmenus();
    }

    // 🔒 Listener responsivo
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 800) {
        this.isClosed = true;
        this.fecharTodosSubmenus();
      }
    });
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

    // fecha submenus automaticamente se a sidebar fechar
    if (this.isClosed) {
      this.fecharTodosSubmenus();
    }
  }

  private fecharTodosSubmenus() {
    this.submenuOficinaAberto = false;
    this.submenuIntegracoesAberto = false;
    this.submenuAdministracaoAberto = false;
    this.submenuVeiculosAberto = false; // caso ainda exista
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

  // (Opcional legado)
  toggleSubmenuVeiculos() {
    if (this.isClosed) return;
    this.submenuVeiculosAberto = !this.submenuVeiculosAberto;
  }

  logout() {
    // coloque sua lógica real aqui (ex: AuthService.logout() + navigate)
    console.log('logout');
  }

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
}
