import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.css'],
})
export class RelatoriosComponent {
  
  filtro = {
    inicio: '',
    fim: '',
    tipoRelatorio: ''
  };

  relatorioGerado = false;
  tituloRelatorio = '';

  gerarRelatorio() {
    if (!this.filtro.inicio || !this.filtro.fim || !this.filtro.tipoRelatorio) {
      alert('Preencha todos os campos para gerar o relatório.');
      return;
    }

    this.tituloRelatorio = this.getTituloPorTipo(this.filtro.tipoRelatorio);
    this.relatorioGerado = true;

    // Aqui depois vai a chamada ao backend
  }

  getTituloPorTipo(tipo: string): string {
    switch (tipo) {
      case 'GASTO_COMBUSTIVEL':
        return 'Gasto por Tipo de Combustível';
      case 'RESUMO_CAMINHAO':
        return 'Resumo por Caminhão';
      case 'MANUTENCOES_CAMINHAO':
        return 'Manutenções do Caminhão';
      case 'VIDA_UTIL_PNEU':
        return 'Vida Útil do Pneu';
      case 'RELATORIO_MOTORISTA':
        return 'Relatório Mensal do Motorista';
      default:
        return 'Relatório';
    }
  }

  baixarRelatorio() {
    alert('Função de download será integrada após conectar ao backend.');
  }
}
