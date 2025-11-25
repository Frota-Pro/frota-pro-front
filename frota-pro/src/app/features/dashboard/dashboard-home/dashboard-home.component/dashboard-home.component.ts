import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleChartsModule, ChartType } from 'angular-google-charts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleChartsModule],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css'],
})
export class DashboardHomeComponent {
  isClosed = false;
    toggleSidebar() {
      this.isClosed = !this.isClosed;
    }
  
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
  
    ngOnInit() {
      this.atualizarGrafico();
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
}
