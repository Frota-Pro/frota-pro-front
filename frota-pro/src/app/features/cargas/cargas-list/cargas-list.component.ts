import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type StatusCarga = 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';

interface CargaVM {
  numero: string;        // ex: CARGA-001
  caminhao: string;      // ex: ABC-1234 (ou nome/modelo)
  motorista: string;     // ex: João Silva
  dataFat: string;       // ex: 09/01/2026 (string por enquanto)
  valor: number;         // ex: 15000
  status: StatusCarga;
}

@Component({
  selector: 'app-cargas-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cargas-list.component.html',
  styleUrls: ['./cargas-list.component.css'],
})
export class CargasListComponent {
  search = '';
  statusFilter: 'Todos' | StatusCarga = 'Todos';

  // Mock inicial (depois liga na API)
  cargas: CargaVM[] = [
    {
      numero: 'CARGA-001',
      caminhao: '-',
      motorista: '-',
      dataFat: '09/01/2026',
      valor: 15000,
      status: 'EM_ANDAMENTO',
    },
  ];

  get filtered(): CargaVM[] {
    const q = this.search.trim().toLowerCase();

    return this.cargas.filter(c => {
      const matchText =
        !q ||
        c.numero.toLowerCase().includes(q) ||
        c.caminhao.toLowerCase().includes(q) ||
        c.motorista.toLowerCase().includes(q);

      const matchStatus =
        this.statusFilter === 'Todos' ? true : c.status === this.statusFilter;

      return matchText && matchStatus;
    });
  }

  // Ações (depois liga em rotas/modais)
  novaCarga() {
    console.log('Nova Carga');
  }

  ver(c: CargaVM) {
    console.log('Ver', c);
  }

  editar(c: CargaVM) {
    console.log('Editar', c);
  }

  formatMoneyBRL(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  labelStatus(s: StatusCarga): string {
    if (s === 'EM_ANDAMENTO') return 'Em Andamento';
    if (s === 'FINALIZADA') return 'Finalizada';
    return 'Cancelada';
  }
}
