import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleChartsModule, ChartType } from 'angular-google-charts';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    GoogleChartsModule,
    FormsModule,
    RouterOutlet,
    RouterModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard {

  isClosed = false;

  ngOnInit() {
    this.atualizarGrafico();

    // 🔒 Garante que o sidebar fique fechado ao carregar em telas pequenas
    if (window.innerWidth <= 800) {
      this.isClosed = true;
    }

    // 🔒 Listener para fechar automaticamente ao redimensionar
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 800) {
        this.isClosed = true;
      }
    });
  }

  // 🔒 Toggle bloqueado quando tela <= 800px
  toggleSidebar() {
    if (window.innerWidth <= 800) {
      this.isClosed = true; // Fica sempre fechado
      return;
    }

    this.isClosed = !this.isClosed;
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
      colors: ['#1e3c72']
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
