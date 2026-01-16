import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { CaminhaoApiService } from '../../../core/api/caminhao-api.service';
import { CategoriaCaminhaoApiService } from '../../../core/api/categoria-caminhao-api.service';
import { CaminhaoRequest, CaminhaoResponse, StatusCaminhao } from '../../../core/api/caminhao-api.models';
import { CategoriaCaminhaoResponse } from '../../../core/api/categoria-caminhao-api.models';

type StatusFiltro = 'TODOS' | StatusCaminhao;
type AtivoFiltro = 'TODOS' | 'ATIVOS' | 'INATIVOS';

interface CaminhaoForm {
  codigo?: string; // quando edição
  codigoExterno: string;
  descricao: string;
  modelo: string;
  marca: string;
  placa: string;
  cor: string;
  antt: string;
  renavan: string;
  chassi: string;
  tara: string;
  maxPeso: string;
  categoriaCodigo: string;
  // input date (yyyy-MM-dd)
  dtLicenciamentoISO: string;
}

@Component({
  selector: 'app-caminhoes-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './caminhoes-list.component.html',
  styleUrls: ['./caminhoes-list.component.css'],
})
export class CaminhoesListComponent implements OnInit {
  // filtros
  search = '';
  statusFilter: StatusFiltro = 'TODOS';
  ativoFilter: AtivoFiltro = 'ATIVOS';

  // paginação
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;

  // dados
  caminhoes: CaminhaoResponse[] = [];
  categorias: CategoriaCaminhaoResponse[] = [];

  // UI
  loading = false;
  errorMsg: string | null = null;

  // modal
  showModal = false;
  isEditing = false;
  form: CaminhaoForm = this.emptyForm();

  // enums de status para filtro (back)
  statusOpcoes: { value: StatusFiltro; label: string }[] = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'DISPONIVEL', label: 'Disponível' },
    { value: 'EM_ROTA', label: 'Em rota' },
    { value: 'SINCRONIZADA', label: 'Sincronizada' },
    { value: 'FINALIZADA', label: 'Finalizada' },
  ];

  constructor(
    private caminhaoApi: CaminhaoApiService,
    private categoriaApi: CategoriaCaminhaoApiService
  ) {}

  ngOnInit(): void {
    this.carregarCategorias();
    this.carregarPagina();
  }

  // -------------------------
  // Carregamento de dados
  // -------------------------
  carregarPagina(): void {
    this.loading = true;
    this.errorMsg = null;

    this.caminhaoApi
      .listar({ page: this.page, size: this.size, sort: 'descricao,asc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.caminhoes = res.content || [];
          this.totalElements = res.totalElements ?? 0;
          this.totalPages = res.totalPages ?? 0;
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'Não foi possível carregar os caminhões.';
        },
      });
  }

  carregarCategorias(): void {
    this.categoriaApi.listarTodas().subscribe({
      next: (page) => {
        this.categorias = (page.content || []).filter((c) => c.ativo !== false);
      },
      error: (err) => {
        console.warn('Falha ao carregar categorias', err);
        this.categorias = [];
      },
    });
  }

  // -------------------------
  // Filtros e helpers
  // -------------------------
  get filtered(): CaminhaoResponse[] {
    const q = (this.search || '').trim().toLowerCase();

    return (this.caminhoes || []).filter((c) => {
      const hay = [
        c.codigo,
        c.placa,
        c.modelo,
        c.marca,
        c.descricao,
        c.categoriaDescricao || '',
        c.categoriaCodigo || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchText = !q || hay.includes(q);

      const matchStatus =
        this.statusFilter === 'TODOS' ? true : (c.status || '').toUpperCase() === this.statusFilter;

      const matchAtivo =
        this.ativoFilter === 'TODOS'
          ? true
          : this.ativoFilter === 'ATIVOS'
            ? c.ativo
            : !c.ativo;

      return matchText && matchStatus && matchAtivo;
    });
  }

  statusLabel(status: string | null | undefined): string {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'DISPONIVEL':
        return 'Disponível';
      case 'EM_ROTA':
        return 'Em rota';
      case 'SINCRONIZADA':
        return 'Sincronizada';
      case 'FINALIZADA':
        return 'Finalizada';
      default:
        return status || '—';
    }
  }

  badgeClass(c: CaminhaoResponse): string {
    if (!c.ativo) return 'inactive';
    const s = (c.status || '').toUpperCase();
    if (s === 'DISPONIVEL') return 'ok';
    if (s === 'EM_ROTA') return 'warn';
    if (s === 'SINCRONIZADA') return 'info';
    return 'neutral';
  }

  // -------------------------
  // Paginação
  // -------------------------
  prevPage(): void {
    if (this.page <= 0) return;
    this.page -= 1;
    this.carregarPagina();
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) return;
    this.page += 1;
    this.carregarPagina();
  }

  setPageSize(n: number): void {
    this.size = n;
    this.page = 0;
    this.carregarPagina();
  }

  // -------------------------
  // Modal (criar/editar)
  // -------------------------
  openAddModal(): void {
    this.isEditing = false;
    this.form = this.emptyForm();
    this.showModal = true;
  }

  openEditModal(c: CaminhaoResponse): void {
    this.isEditing = true;
    this.form = this.fromResponseToForm(c);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.form = this.emptyForm();
  }

  salvar(): void {
    const payload = this.toRequest(this.form);

    if (!payload.descricao?.trim()) return alert('Informe a descrição.');
    if (!payload.modelo?.trim()) return alert('Informe o modelo.');
    if (!payload.marca?.trim()) return alert('Informe a marca.');
    if (!payload.placa?.trim()) return alert('Informe a placa.');

    this.loading = true;
    this.errorMsg = null;

    const req$ = this.isEditing && this.form.codigo
      ? this.caminhaoApi.atualizar(this.form.codigo, payload)
      : this.caminhaoApi.criar(payload);

    req$.pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        this.closeModal();
        this.carregarPagina();
      },
      error: (err) => {
        console.error(err);
        const msg = (err?.error && (err.error.message || err.error.error)) || null;
        this.errorMsg = msg || 'Não foi possível salvar o caminhão.';
        alert(this.errorMsg);
      },
    });
  }

  excluir(c: CaminhaoResponse): void {
    if (!confirm(`Deseja inativar o caminhão ${c.codigo} (${c.placa})?`)) return;

    this.loading = true;
    this.caminhaoApi
      .deletar(c.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.carregarPagina(),
        error: (err) => {
          console.error(err);
          alert('Não foi possível inativar o caminhão.');
        },
      });
  }

  // -------------------------
  // Conversões (API <-> Form)
  // -------------------------
  private emptyForm(): CaminhaoForm {
    return {
      codigoExterno: '',
      descricao: '',
      modelo: '',
      marca: '',
      placa: '',
      cor: '',
      antt: '',
      renavan: '',
      chassi: '',
      tara: '',
      maxPeso: '',
      categoriaCodigo: '',
      dtLicenciamentoISO: '',
    };
  }

  private fromResponseToForm(c: CaminhaoResponse): CaminhaoForm {
    return {
      codigo: c.codigo,
      codigoExterno: c.codigoExterno || '',
      descricao: c.descricao || '',
      modelo: c.modelo || '',
      marca: c.marca || '',
      placa: c.placa || '',
      cor: c.cor || '',
      antt: c.antt || '',
      renavan: c.renavan || '',
      chassi: c.chassi || '',
      tara: c.tara != null ? String(c.tara) : '',
      maxPeso: c.maxPeso != null ? String(c.maxPeso) : '',
      categoriaCodigo: c.categoriaCodigo || '',
      dtLicenciamentoISO: this.ddMMyyyyToISO(c.dtLicenciamento || ''),
    };
  }

  private toRequest(f: CaminhaoForm): CaminhaoRequest {
    return {
      codigoExterno: f.codigoExterno?.trim() || null,
      descricao: f.descricao?.trim(),
      modelo: f.modelo?.trim(),
      marca: f.marca?.trim(),
      placa: f.placa?.trim(),
      cor: f.cor?.trim() || null,
      antt: f.antt?.trim() || null,
      renavan: f.renavan?.trim() || null,
      chassi: f.chassi?.trim() || null,
      tara: this.toNumberOrNull(f.tara),
      maxPeso: this.toNumberOrNull(f.maxPeso),
      categoria: f.categoriaCodigo?.trim() ? f.categoriaCodigo.trim() : null,
      dtLicenciamento: f.dtLicenciamentoISO ? this.isoToDdMMyyyy(f.dtLicenciamentoISO) : null,
    };
  }

  private toNumberOrNull(v: string): number | null {
    const s = (v || '').trim().replace(',', '.');
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  private ddMMyyyyToISO(ddMMyyyy: string): string {
    const s = (ddMMyyyy || '').trim();
    const m = /^([0-3]\d)\/([01]\d)\/(\d{4})$/.exec(s);
    if (!m) return '';
    const dd = m[1];
    const mm = m[2];
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  private isoToDdMMyyyy(iso: string): string {
    const s = (iso || '').trim();
    const m = /^(\d{4})-([01]\d)-([0-3]\d)$/.exec(s);
    if (!m) return '';
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
}
