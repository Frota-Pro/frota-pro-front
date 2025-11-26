import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type UUID = string;

interface Motorista {
  id: UUID;
  codigo: string;
  codigoExterno?: string;
  nome: string;
  email?: string;
  dataNascimento?: string;
  cnh?: string;
  validadeCnh?: string;
  status?: string;
  ativo?: boolean;
}

interface Ajudante {
  id: UUID;
  codigo: string;
  codigoExterno?: string;
  nome: string;
  status?: string;
  ativo?: boolean;
}

interface Mecanico {
  id: UUID;
  codigo: string;
  nome: string;
  oficina?: { id: UUID; nome: string } | null;
  ativo?: boolean;
}

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './colaboradores.component.html',
  styleUrls: ['./colaboradores.component.css'],
})
export class ColaboradoresComponent {

  // 🔍 Campo de pesquisa
  searchTerm: string = '';

  // ============================
  // 📌 LISTAS MOCKADAS
  // ============================

  motoristas: Motorista[] = [
    {
      id: '9f1a1d5a-1a1a-4c3a-9d1f-000000000001',
      codigo: 'MTR-001',
      codigoExterno: 'EXT-1001',
      nome: 'Carlos Silva',
      email: 'carlos.silva@example.com',
      dataNascimento: '1985-03-15',
      cnh: '12345678901',
      validadeCnh: '2027-12-31',
      status: 'DISPONIVEL',
      ativo: true,
    },
    {
      id: '9f1a1d5a-1a1a-4c3a-9d1f-000000000002',
      codigo: 'MTR-002',
      nome: 'Mariana Costa',
      email: 'mariana.costa@example.com',
      dataNascimento: '1990-08-22',
      cnh: '98765432100',
      validadeCnh: '2026-06-30',
      status: 'EM_ROTA',
      ativo: true,
    },
  ];

  ajudantes: Ajudante[] = [
    {
      id: '2b2b2b2b-2222-4444-8888-000000000001',
      codigo: 'AJD-001',
      codigoExterno: 'EX-A-01',
      nome: 'Rogério Alves',
      status: 'DISPONIVEL',
      ativo: true,
    },
    {
      id: '2b2b2b2b-2222-4444-8888-000000000002',
      codigo: 'AJD-002',
      nome: 'Ana Pereira',
      status: 'EM_SERVICO',
      ativo: true,
    },
  ];

  mecanicos: Mecanico[] = [
    {
      id: '3c3c3c3c-3333-6666-9999-000000000001',
      codigo: 'MEC-001',
      nome: 'Roberto Lima',
      oficina: { id: 'of-01', nome: 'Oficina Central' },
      ativo: true,
    },
    {
      id: '3c3c3c3c-3333-6666-9999-000000000002',
      codigo: 'MEC-002',
      nome: 'Sônia Rodrigues',
      oficina: null,
      ativo: true,
    },
  ];

  // ============================
  // 🔄 EXPANSÃO
  // ============================

  expanded = new Set<string>();

  toggleExpand(tipo: 'motorista' | 'ajudante' | 'mecanico', id: UUID) {
    const key = `${tipo}-${id}`;
    this.expanded.has(key)
      ? this.expanded.delete(key)
      : this.expanded.add(key);
  }

  isExpanded(tipo: 'motorista' | 'ajudante' | 'mecanico', id: UUID) {
    return this.expanded.has(`${tipo}-${id}`);
  }

  trackById(index: number, item: { id: UUID }) {
    return item.id;
  }

  // ============================
  // 🔍 FILTROS (nome OU código)
  // ============================
  // Getters modernos (usados se seu HTML referir motoristasFiltrados, etc.)
  get motoristasFiltrados() {
    const t = this.searchTerm?.toLowerCase().trim() || '';
    if (!t) return this.motoristas;
    return this.motoristas.filter(m =>
      (m.nome || '').toLowerCase().includes(t) ||
      (m.codigo || '').toLowerCase().includes(t)
    );
  }

  get ajudantesFiltrados() {
    const t = this.searchTerm?.toLowerCase().trim() || '';
    if (!t) return this.ajudantes;
    return this.ajudantes.filter(a =>
      (a.nome || '').toLowerCase().includes(t) ||
      (a.codigo || '').toLowerCase().includes(t)
    );
  }

  get mecanicosFiltrados() {
    const t = this.searchTerm?.toLowerCase().trim() || '';
    if (!t) return this.mecanicos;
    return this.mecanicos.filter(m =>
      (m.nome || '').toLowerCase().includes(t) ||
      (m.codigo || '').toLowerCase().includes(t)
    );
  }

  // Método genérico compatível com templates que ainda usam filterList(...)
  // Ex.: *ngFor="let me of filterList(mecanicos)"
  filterList<T extends { nome?: string; codigo?: string }>(lista: T[]): T[] {
    const term = this.searchTerm?.toLowerCase().trim() || '';
    if (!term) return lista;
    return lista.filter(item =>
      (item.nome || '').toLowerCase().includes(term) ||
      (item.codigo || '').toLowerCase().includes(term)
    );
  }
}
