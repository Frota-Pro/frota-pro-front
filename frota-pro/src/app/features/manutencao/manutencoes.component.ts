import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

type StatusOS = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

interface ItemOS {
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface Caminhao {
  placa: string;
}

interface Manutencao {
  id: number;
  descricao: string;
  tipoManutencao: string;
  statusManutencao: StatusOS;
  caminhao: Caminhao;
  dataInicioManutencao: string;
  dataFimManutencao?: string;
  itens: ItemOS[];
  valor: number;
}

@Component({
  selector: 'app-manutencoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manutencoes.component.html',
  styleUrls: ['./manutencoes.component.css']
})
export class ManutencoesComponent {

  /* =============================
     LISTA PRINCIPAL
  ==============================*/
  manutencoes: Manutencao[] = [
    {
      id: 1,
      descricao: 'Troca de óleo',
      tipoManutencao: 'PREVENTIVA',
      statusManutencao: 'EM_ANDAMENTO',
      caminhao: { placa: 'ABC-1234' },
      dataInicioManutencao: '2025-12-01',
      itens: [
        { nome: 'Óleo', quantidade: 10, valorUnitario: 30, valorTotal: 300 }
      ],
      valor: 300
    },
    {
      id: 2,
      descricao: 'Freio',
      tipoManutencao: 'CORRETIVA',
      statusManutencao: 'CONCLUIDA',
      caminhao: { placa: 'DEF-5678' },
      dataInicioManutencao: '2025-12-05',
      dataFimManutencao: '2025-12-06',
      itens: [
        { nome: 'Pastilha', quantidade: 4, valorUnitario: 120, valorTotal: 480 }
      ],
      valor: 480
    }
  ];

  /* =============================
     FILTRO DE DATA
  ==============================*/
  filtroInicio: string | null = null;
  filtroFim: string | null = null;

  manutencoesFiltradas(): Manutencao[] {
    const inicio = this.filtroInicio
      ? new Date(this.filtroInicio + 'T00:00:00')
      : null;

    const fim = this.filtroFim
      ? new Date(this.filtroFim + 'T23:59:59.999')
      : null;

    return this.manutencoes.filter((m) => {
      const dt = new Date(m.dataInicioManutencao + 'T12:00:00');

      if (inicio && dt < inicio) return false;
      if (fim && dt > fim) return false;

      return true;
    });
  }

  /* =============================
     CONTADORES STATUS
  ==============================*/
  countByStatus(status: StatusOS): number {
    return this.manutencoes.filter(m => m.statusManutencao === status).length;
  }

  statusLabel(status: StatusOS): string {
    return {
      ABERTA: 'Aberta',
      EM_ANDAMENTO: 'Em andamento',
      CONCLUIDA: 'Concluída',
      CANCELADA: 'Cancelada'
    }[status];
  }

  /* =============================
     EXPANSÃO DE CARD
  ==============================*/
  expandedId: number | null = null;

  toggleExpand(id: number) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  isExpanded(id: number): boolean {
    return this.expandedId === id;
  }

  /* =============================
     MODAL
  ==============================*/
  showModal = false;
  editando = false;

  form: Manutencao = this.createEmptyOS();

  openModal() {
    this.form = this.createEmptyOS();
    this.editando = false;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  editarOS(os: Manutencao) {
    this.form = JSON.parse(JSON.stringify(os));
    this.editando = true;
    this.showModal = true;
  }

  /* =============================
     SALVAR / CANCELAR / FINALIZAR
  ==============================*/
  salvarOS() {
    this.recalcularTotalOS();

    if (this.editando) {
      const idx = this.manutencoes.findIndex(m => m.id === this.form.id);
      if (idx !== -1) this.manutencoes[idx] = this.form;
    } else {
      this.form.id = Date.now();
      this.form.statusManutencao = 'ABERTA';
      this.manutencoes.unshift(this.form);
    }

    this.closeModal();
  }

  cancelarOS(os: Manutencao) {
    os.statusManutencao = 'CANCELADA';
  }

  finalizarOS(os: Manutencao) {
    os.statusManutencao = 'CONCLUIDA';
    os.dataFimManutencao = new Date().toISOString().slice(0, 10);
  }

  /* =============================
     ITENS
  ==============================*/
  addItem() {
    this.form.itens.push({
      nome: '',
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0
    });
  }

  recalcularItem(item: ItemOS) {
    item.valorTotal = item.quantidade * item.valorUnitario;
    this.recalcularTotalOS();
  }

  recalcularTotalOS() {
    this.form.valor = this.form.itens.reduce(
      (sum, i) => sum + i.valorTotal,
      0
    );
  }

  /* =============================
     FACTORY
  ==============================*/
  private createEmptyOS(): Manutencao {
    return {
      id: 0,
      descricao: '',
      tipoManutencao: 'PREVENTIVA',
      statusManutencao: 'ABERTA',
      caminhao: { placa: '' },
      dataInicioManutencao: '',
      itens: [],
      valor: 0
    };
  }
}
