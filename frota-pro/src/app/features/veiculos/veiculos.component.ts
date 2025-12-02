import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

interface CategoriaCaminhao {
  id: UUID;
  nome: string;
}

interface Caminhao {
  id: UUID;
  codigo: string;
  codigoExterno?: string;
  descricao?: string;
  modelo?: string;
  cor?: string;
  marca?: string;
  placa?: string;
  antt?: string;
  renavam?: string;
  chassi?: string;
  tara?: number;
  maxPeso?: number;
  dataLicenciamento?: string;
  seguro?: string;
  categoria?: CategoriaCaminhao | null;
  status?: string;
  ativo?: boolean;
}

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './veiculos.component.html',
  styleUrls: ['./veiculos.component.css'],
})
export class VeiculosComponent {

  searchTerm: string = '';

  // ✅ LISTA DE CATEGORIAS (TEMPORÁRIA)
  categorias: CategoriaCaminhao[] = [
    { id: 'cat-1', nome: 'Truck' },
    { id: 'cat-2', nome: 'VUC' },
    { id: 'cat-3', nome: 'Carreta' },
  ];

  veiculos: Caminhao[] = [
    {
      id: 'a1b2c3d4-0001',
      codigo: 'CAM-001',
      codigoExterno: 'EXT-9001',
      descricao: 'Caminhão baú 10 toneladas',
      modelo: 'FH 540',
      cor: 'Branco',
      marca: 'Volvo',
      placa: 'ABC1D23',
      antt: 'ANTT-001',
      renavam: 'RENAVAM-0001',
      chassi: 'CHASSI001',
      tara: 3500,
      maxPeso: 10000,
      dataLicenciamento: '2024-05-10',
      seguro: 'Seguradora X',
      categoria: { id: 'cat-1', nome: 'Truck' },
      status: 'DISPONIVEL',
      ativo: true,
    },
    {
      id: 'a1b2c3d4-0002',
      codigo: 'CAM-002',
      codigoExterno: 'EXT-9002',
      descricao: 'Vuc frigorífico',
      modelo: 'Delivery 8t',
      cor: 'Prata',
      marca: 'Mercedes',
      placa: 'XYZ9A87',
      antt: 'ANTT-002',
      renavam: 'RENAVAM-0002',
      chassi: 'CHASSI002',
      tara: 2500,
      maxPeso: 8000,
      dataLicenciamento: '2023-11-02',
      seguro: 'Seguradora Y',
      categoria: { id: 'cat-2', nome: 'VUC' },
      status: 'EM_MANUTENCAO',
      ativo: true,
    },
  ];

  // 🔽 EXPANSÃO
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

  // 🔍 FILTRO
  get veiculosFiltrados() {
    const t = (this.searchTerm || '').toLowerCase().trim();
    if (!t) return this.veiculos;
    return this.veiculos.filter(v =>
      (v.codigo || '').toLowerCase().includes(t) ||
      (v.placa || '').toLowerCase().includes(t)
    );
  }

  filterList<T extends { codigo?: string; placa?: string }>(lista: T[]) {
    const term = (this.searchTerm || '').toLowerCase().trim();
    if (!term) return lista;
    return lista.filter(item =>
      (item.codigo || '').toLowerCase().includes(term) ||
      (item.placa || '').toLowerCase().includes(term)
    );
  }

  // ✅ Atualiza a categoria — já recebe o objeto automaticamente pelo ngModel
  atualizarCategoria(veiculo: Caminhao) {
    console.log('Categoria alterada:', veiculo.categoria);
    // Aqui depois você pode salvar no backend
  }
}
