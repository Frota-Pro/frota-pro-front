import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

interface MotoristaMini {
  id: UUID;
  nome: string;
  codigo?: string;
}
interface CaminhaoMini {
  id: UUID;
  placa?: string;
  codigo?: string;
}
interface AjudanteMini {
  id: UUID;
  nome: string;
  codigo?: string;
}
interface RotaMini {
  id: UUID;
  nome?: string;
}

interface Carga {
  id: UUID;
  numeroCarga: string;
  numeroCargaExterno?: string;
  dtFaturamento?: string;
  dtSaida?: string;
  dtPrevista?: string;
  dtChegada?: string;
  pesoCarga?: number;
  kmInicial?: number;
  kmFinal?: number;
  clientes?: any[];
  notas?: any[];
  statusCarga?: string;
  motorista?: MotoristaMini | null;
  ajudantes?: AjudanteMini[];
  caminhao?: CaminhaoMini | null;
  rota?: RotaMini | null;
  paradas?: any[];
}

@Component({
  selector: 'app-cargas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cargas.component.html',
  styleUrls: ['./cargas.component.css'],
})
export class CargasComponent {
  // campo de busca
  searchTerm: string = '';

  // exemplo de dados (será substituído pelo backend)
  cargas: Carga[] = [
    {
      id: 'carga-001',
      numeroCarga: 'CR-1001',
      numeroCargaExterno: 'EXT-1001',
      dtFaturamento: '2025-11-20',
      dtSaida: '2025-11-21',
      dtPrevista: '2025-11-25',
      dtChegada: undefined,
      pesoCarga: 12500.345,
      kmInicial: 12000,
      kmFinal: undefined,
      statusCarga: 'EM_ROTA',
      motorista: { id: 'm-1', nome: 'Carlos Silva', codigo: 'MTR-001' },
      ajudantes: [{ id: 'a-1', nome: 'Rogério Alves', codigo: 'AJD-001' }],
      caminhao: { id: 'v-1', placa: 'ABC1D23', codigo: 'CAM-001' },
      rota: { id: 'r-1', nome: 'Rota Sul' },
      clientes: [{ nome: 'Cliente A' }],
      notas: [{ nota: 'NF-123' }],
      paradas: [],
    },
    {
      id: 'carga-002',
      numeroCarga: 'CR-1002',
      numeroCargaExterno: '234',
      dtFaturamento: '2025-11-18',
      dtSaida: '2025-11-19',
      dtPrevista: '2025-11-21',
      dtChegada: '2025-11-21',
      pesoCarga: 4200,
      kmInicial: 20000,
      kmFinal: 20120,
      statusCarga: 'ENTREGUE',
      motorista: { id: 'm-2', nome: 'Mariana Costa', codigo: 'MTR-002' },
      ajudantes: [],
      caminhao: { id: 'v-2', placa: 'XYZ9A87', codigo: 'CAM-002' },
      rota: { id: 'r-2', nome: 'Rota Norte' },
      clientes: [{ nome: 'Cliente B' }],
      notas: [{ nota: 'NF-987' }],
      paradas: [],
    },
  ];
  listarClientes(c: Carga) {
    return (c.clientes || []).map((cl) => cl?.nome || cl).join(', ');
  }

  listarNotas(c: Carga) {
    return (c.notas || []).map((n) => n?.nota || n).join(', ');
  }

  // controla qual carga está expandida
  expanded: string | null = null;

  toggleExpand(id: UUID) {
    this.expanded = this.expanded === id ? null : id;
  }

  isExpanded(id: UUID) {
    return this.expanded === id;
  }

  trackById(index: number, item: { id: UUID }) {
    return item.id;
  }

  // filtro por número ou número externo
  get cargasFiltradas() {
    const t = (this.searchTerm || '').toLowerCase().trim();
    if (!t) return this.cargas;

    return this.cargas.filter(
      (c) =>
        (c.numeroCarga || '').toLowerCase().includes(t) ||
        (c.numeroCargaExterno || '').toLowerCase().includes(t)
    );
  }

  // formata lista de clientes para uso no template
  formatClientes(c: Carga): string {
    if (!c.clientes || c.clientes.length === 0) return '';
    return c.clientes.map((cl: any) => cl.nome || cl).join(', ');
  }

  // formata lista de notas
  formatNotas(c: Carga): string {
    if (!c.notas || c.notas.length === 0) return '';
    return c.notas.map((n: any) => n.nota || n).join(', ');
  }

  // utilitário: cálculo de km total
  calcularKmTotal(c: Carga) {
    if (c.kmInicial == null || c.kmFinal == null) return 0;
    return Math.max(c.kmFinal - c.kmInicial, 0);
  }

  // utilitário: atraso em dias
  calcularAtrasoDias(c: Carga) {
    if (!c.dtPrevista || !c.dtChegada) return 0;

    const prev = new Date(c.dtPrevista);
    const cheg = new Date(c.dtChegada);

    const diff = Math.floor((cheg.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 0);
  }
}
