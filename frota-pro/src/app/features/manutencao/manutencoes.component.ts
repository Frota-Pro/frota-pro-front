import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

type StatusManutencao =
  | 'ABERTA'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDA'
  | 'CANCELADA';

type TipoManutencao = 'PREVENTIVA' | 'CORRETIVA' | 'OUTRA';

interface CaminhaoMini {
  id: UUID;
  codigo: string;
  placa: string;
}

interface ItemManutencao {
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface Manutencao {
  id: UUID;
  codigo: string;
  descricao: string;
  dataInicioManutencao: string;
  dataFimManutencao?: string | null;
  tipoManutencao: TipoManutencao;
  statusManutencao: StatusManutencao;
  valor: number;
  observacoes?: string;
  caminhao: CaminhaoMini;
  itens: ItemManutencao[];
}

@Component({
  selector: 'app-manutencoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manutencoes.component.html',
  styleUrls: ['./manutencoes.component.css'],
})
export class ManutencoesComponent {
  filtroInicio = '';
  filtroFim = '';

  showModal = false;
  expanded: string | null = null;

  manutencoes: Manutencao[] = [
    {
      id: 'm1',
      codigo: 'OS-2025-001',
      descricao: 'Troca de embreagem',
      dataInicioManutencao: '2025-01-05',
      dataFimManutencao: null,
      tipoManutencao: 'CORRETIVA',
      statusManutencao: 'EM_ANDAMENTO',
      valor: 4800,
      caminhao: { id: 'c1', codigo: 'CAM-01', placa: 'ABC1D23' },
      itens: [
        { nome: 'Kit embreagem', quantidade: 1, valorUnitario: 4200, valorTotal: 4200 },
        { nome: 'Mão de obra', quantidade: 1, valorUnitario: 600, valorTotal: 600 },
      ],
    },
    {
      id: 'm2',
      codigo: 'OS-2025-002',
      descricao: 'Revisão preventiva',
      dataInicioManutencao: '2025-01-02',
      dataFimManutencao: '2025-01-03',
      tipoManutencao: 'PREVENTIVA',
      statusManutencao: 'CONCLUIDA',
      valor: 1200,
      caminhao: { id: 'c2', codigo: 'CAM-02', placa: 'XYZ9A87' },
      itens: [
        { nome: 'Filtro de óleo', quantidade: 1, valorUnitario: 120, valorTotal: 120 },
        { nome: 'Óleo motor', quantidade: 10, valorUnitario: 108, valorTotal: 1080 },
      ],
    },
  ];

  get manutencoesFiltradas() {
    const inicio = this.filtroInicio ? new Date(this.filtroInicio) : null;
    const fim = this.filtroFim ? new Date(this.filtroFim) : null;

    return this.manutencoes.filter((m) => {
      const dt = new Date(m.dataInicioManutencao);

      if (inicio && dt < inicio) return false;

      if (fim) {
        const fimDia = new Date(fim);
        fimDia.setHours(23, 59, 59, 999);
        if (dt > fimDia) return false;
      }

      return true;
    });
  }

  countByStatus(status: StatusManutencao) {
    return this.manutencoesFiltradas.filter((m) => m.statusManutencao === status).length;
  }

  toggleExpand(id: UUID) {
    this.expanded = this.expanded === id ? null : id;
  }

  isExpanded(id: UUID) {
    return this.expanded === id;
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  statusLabel(status: StatusManutencao) {
    switch (status) {
      case 'ABERTA':
        return 'Aberta';
      case 'EM_ANDAMENTO':
        return 'Em andamento';
      case 'CONCLUIDA':
        return 'Concluída';
      case 'CANCELADA':
        return 'Cancelada';
    }
  }
}
