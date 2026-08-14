import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { MultaApiService } from '../../core/api/multa-api.service';
import {
  GravidadeMulta,
  MultaAnexoResponse,
  MultaRequest,
  MultaResponse,
  ResponsavelPagamentoMulta,
  StatusPagamentoMulta,
  TipoAnexoMulta,
} from '../../core/api/multa-api.models';
import { CaminhaoApiService } from '../../core/api/caminhao-api.service';
import { CaminhaoResponse } from '../../core/api/caminhao-api.models';
import { MotoristaApiService } from '../../core/api/motorista-api.service';
import { MotoristaResponse } from '../../core/api/motorista-api.models';
import { ToastService } from '../../shared/ui/toast/toast.service';

const FORM_VAZIO: MultaRequest = {
  caminhao: '',
  motorista: '',
  dataInfracao: '',
  orgaoAutuador: '',
  numeroAit: '',
  descricaoInfracao: '',
  gravidade: null,
  pontos: null,
  valor: 0,
  dataVencimentoPagamento: '',
  dataLimiteRecurso: '',
  responsavelPagamento: 'EMPRESA',
  observacao: '',
};

@Component({
  selector: 'app-multas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './multas.component.html',
  styleUrls: ['./multas.component.css'],
})
export class MultasComponent implements OnInit, OnDestroy {

  readonly GRAVIDADES: GravidadeMulta[] = ['LEVE', 'MEDIA', 'GRAVE', 'GRAVISSIMA'];
  readonly STATUS: StatusPagamentoMulta[] = ['PENDENTE', 'PAGO', 'RECURSO_PROTOCOLADO', 'CANCELADA'];
  readonly RESPONSAVEIS: ResponsavelPagamentoMulta[] = ['EMPRESA', 'MOTORISTA'];

  // filtros
  filtroCaminhao = '';
  filtroMotorista = '';
  filtroStatus: StatusPagamentoMulta | '' = '';
  filtroInicio = '';
  filtroFim = '';

  // paginação
  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;

  loading = false;
  errorMsg: string | null = null;
  rows: MultaResponse[] = [];

  // combos / autocomplete
  caminhoes: CaminhaoResponse[] = [];
  motoristas: MotoristaResponse[] = [];
  showSugCaminhao = false;
  showSugMotorista = false;
  readonly sugestoesMax = 8;
  private autocompleteBlurTimer: any = null;

  // modal cadastro/edição
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  saving = false;
  form: MultaRequest = { ...FORM_VAZIO };

  // modal anexos
  showAnexosModal = false;
  multaAnexos: MultaResponse | null = null;
  anexos: MultaAnexoResponse[] = [];
  loadingAnexos = false;
  tipoAnexoUpload: TipoAnexoMulta = 'NOTIFICACAO';
  anexoFile: File | null = null;
  uploadingAnexo = false;

  constructor(
    private api: MultaApiService,
    private caminhaoApi: CaminhaoApiService,
    private motoristaApi: MotoristaApiService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.preloadCombos();
    this.carregarPagina();
  }

  ngOnDestroy(): void {
    if (this.autocompleteBlurTimer) {
      clearTimeout(this.autocompleteBlurTimer);
      this.autocompleteBlurTimer = null;
    }
  }

  private preloadCombos(): void {
    this.caminhaoApi.listar({ page: 0, size: 200, sort: 'codigo,asc', ativo: true }).subscribe({
      next: (res) => (this.caminhoes = res.content || []),
      error: () => (this.caminhoes = []),
    });
    this.motoristaApi.listar({ page: 0, size: 200, sort: 'codigo,asc', ativo: true }).subscribe({
      next: (res) => (this.motoristas = res.content || []),
      error: () => (this.motoristas = []),
    });
  }

  // =========================
  // Listagem / filtros
  // =========================
  carregarPagina(page?: number): void {
    if (page != null) this.page = page;

    this.loading = true;
    this.errorMsg = null;

    this.api.listar({
      page: this.page,
      size: this.size,
      sort: 'dataInfracao,desc',
      caminhao: this.filtroCaminhao.trim() || null,
      motorista: this.filtroMotorista.trim() || null,
      status: (this.filtroStatus || null) as StatusPagamentoMulta | null,
      inicio: this.filtroInicio || null,
      fim: this.filtroFim || null,
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.rows = res.content || [];
          this.totalPages = res.totalPages ?? 0;
          this.totalElements = res.totalElements ?? 0;
        },
        error: (err) => (this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar as multas.')),
      });
  }

  aplicarFiltros(): void {
    this.page = 0;
    this.carregarPagina();
  }

  limparFiltros(): void {
    this.filtroCaminhao = '';
    this.filtroMotorista = '';
    this.filtroStatus = '';
    this.filtroInicio = '';
    this.filtroFim = '';
    this.aplicarFiltros();
  }

  // =========================
  // Autocomplete (filtro)
  // =========================
  get sugestoesCaminhao(): CaminhaoResponse[] {
    const q = (this.filtroCaminhao || '').trim().toLowerCase();
    if (!q) return [];
    return (this.caminhoes || [])
      .filter((c) => {
        const hay = [c.codigo, c.codigoExterno, c.placa, c.descricao].map((x) => String(x || '').toLowerCase()).join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  get sugestoesMotorista(): MotoristaResponse[] {
    const q = (this.filtroMotorista || '').trim().toLowerCase();
    if (!q) return [];
    return (this.motoristas || [])
      .filter((m) => {
        const hay = [m.codigo, m.codigoExterno, m.nome].map((x) => String(x || '').toLowerCase()).join(' | ');
        return hay.includes(q);
      })
      .slice(0, this.sugestoesMax);
  }

  onFocusCaminhao(): void { this.showSugCaminhao = true; this.showSugMotorista = false; }
  onFocusMotorista(): void { this.showSugMotorista = true; this.showSugCaminhao = false; }

  onBlurSugestao(): void {
    if (this.autocompleteBlurTimer) clearTimeout(this.autocompleteBlurTimer);
    this.autocompleteBlurTimer = setTimeout(() => {
      this.showSugCaminhao = false;
      this.showSugMotorista = false;
    }, 140);
  }

  selecionarCaminhaoFiltro(c: CaminhaoResponse): void {
    this.filtroCaminhao = c.codigo;
    this.showSugCaminhao = false;
    this.aplicarFiltros();
  }

  selecionarMotoristaFiltro(m: MotoristaResponse): void {
    this.filtroMotorista = m.codigo;
    this.showSugMotorista = false;
    this.aplicarFiltros();
  }

  // =========================
  // Modal cadastro/edição
  // =========================
  abrirNova(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form = { ...FORM_VAZIO };
    this.showModal = true;
  }

  abrirEdicao(m: MultaResponse): void {
    this.isEditing = true;
    this.editingId = m.id;
    this.form = {
      caminhao: m.codigoCaminhao,
      motorista: m.codigoMotorista || '',
      dataInfracao: m.dataInfracao,
      orgaoAutuador: m.orgaoAutuador || '',
      numeroAit: m.numeroAit || '',
      descricaoInfracao: m.descricaoInfracao || '',
      gravidade: m.gravidade || null,
      pontos: m.pontos ?? null,
      valor: m.valor,
      dataVencimentoPagamento: m.dataVencimentoPagamento || '',
      dataLimiteRecurso: m.dataLimiteRecurso || '',
      responsavelPagamento: m.responsavelPagamento,
      observacao: m.observacao || '',
    };
    this.showModal = true;
  }

  fecharModal(): void {
    if (this.saving) return;
    this.showModal = false;
  }

  salvar(): void {
    const erros = this.validarForm();
    if (erros.length) {
      this.toast.warn(erros[0], 'Validação');
      return;
    }

    const payload: MultaRequest = {
      ...this.form,
      caminhao: this.form.caminhao.trim(),
      motorista: (this.form.motorista || '').trim() || null,
      orgaoAutuador: (this.form.orgaoAutuador || '').trim() || null,
      numeroAit: (this.form.numeroAit || '').trim() || null,
      descricaoInfracao: (this.form.descricaoInfracao || '').trim() || null,
      dataVencimentoPagamento: this.form.dataVencimentoPagamento || null,
      dataLimiteRecurso: this.form.dataLimiteRecurso || null,
      observacao: (this.form.observacao || '').trim() || null,
    };

    this.saving = true;

    const req$ = this.isEditing && this.editingId
      ? this.api.atualizar(this.editingId, payload)
      : this.api.criar(payload);

    req$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.toast.success(this.isEditing ? 'Multa atualizada com sucesso.' : 'Multa cadastrada com sucesso.');
          this.showModal = false;
          this.carregarPagina();
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível salvar a multa.')),
      });
  }

  private validarForm(): string[] {
    const erros: string[] = [];
    if (!this.form.caminhao || !this.form.caminhao.trim()) erros.push('Informe o caminhão.');
    if (!this.form.dataInfracao) erros.push('Informe a data da infração.');
    if (this.form.valor == null || this.form.valor <= 0) erros.push('Informe um valor maior que zero.');
    if (!this.form.responsavelPagamento) erros.push('Informe o responsável pelo pagamento.');

    if (this.form.dataVencimentoPagamento && this.form.dataInfracao
      && this.form.dataVencimentoPagamento < this.form.dataInfracao) {
      erros.push('O vencimento do pagamento não pode ser antes da data da infração.');
    }
    if (this.form.dataLimiteRecurso && this.form.dataInfracao
      && this.form.dataLimiteRecurso < this.form.dataInfracao) {
      erros.push('O limite do recurso não pode ser antes da data da infração.');
    }

    return erros;
  }

  // =========================
  // Status
  // =========================
  atualizarStatus(m: MultaResponse, status: StatusPagamentoMulta): void {
    if (m.statusPagamento === status) return;

    this.api.atualizarStatus(m.id, status)
      .subscribe({
        next: (atualizada) => {
          const idx = this.rows.findIndex((r) => r.id === m.id);
          if (idx >= 0) this.rows[idx] = atualizada;
          this.toast.success('Status atualizado com sucesso.');
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível atualizar o status.')),
      });
  }

  // =========================
  // Excluir
  // =========================
  excluir(m: MultaResponse): void {
    if (!confirm(`Deseja excluir a multa do caminhão ${m.codigoCaminhao} (${this.formatDateBr(m.dataInfracao)})?`)) return;

    this.api.deletar(m.id).subscribe({
      next: () => {
        this.toast.success('Multa excluída com sucesso.');
        this.carregarPagina();
      },
      error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível excluir a multa.')),
    });
  }

  // =========================
  // Anexos
  // =========================
  abrirAnexos(m: MultaResponse): void {
    this.multaAnexos = m;
    this.anexos = [];
    this.anexoFile = null;
    this.tipoAnexoUpload = 'NOTIFICACAO';
    this.showAnexosModal = true;
    this.carregarAnexos();
  }

  fecharAnexos(): void {
    this.showAnexosModal = false;
    this.multaAnexos = null;
    this.anexos = [];
  }

  carregarAnexos(): void {
    if (!this.multaAnexos) return;
    this.loadingAnexos = true;

    this.api.listarAnexos(this.multaAnexos.id)
      .pipe(finalize(() => (this.loadingAnexos = false)))
      .subscribe({
        next: (res) => (this.anexos = res || []),
        error: (err) => {
          this.anexos = [];
          this.toast.error(extrairMensagemErro(err, 'Não foi possível carregar os anexos.'));
        },
      });
  }

  onAnexoSelecionado(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.anexoFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  uploadAnexo(): void {
    if (!this.multaAnexos) return;
    if (!this.anexoFile) {
      this.toast.warn('Selecione um arquivo para enviar.');
      return;
    }

    this.uploadingAnexo = true;

    this.api.uploadAnexo(this.multaAnexos.id, this.anexoFile, this.tipoAnexoUpload)
      .pipe(finalize(() => (this.uploadingAnexo = false)))
      .subscribe({
        next: () => {
          this.anexoFile = null;
          this.toast.success('Anexo enviado com sucesso.');
          this.carregarAnexos();
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível enviar o anexo.')),
      });
  }

  // =========================
  // Helpers de exibição
  // =========================
  labelGravidade(g?: GravidadeMulta | null): string {
    switch (g) {
      case 'LEVE': return 'Leve';
      case 'MEDIA': return 'Média';
      case 'GRAVE': return 'Grave';
      case 'GRAVISSIMA': return 'Gravíssima';
      default: return '—';
    }
  }

  labelStatus(s: StatusPagamentoMulta): string {
    switch (s) {
      case 'PENDENTE': return 'Pendente';
      case 'PAGO': return 'Pago';
      case 'RECURSO_PROTOCOLADO': return 'Recurso protocolado';
      case 'CANCELADA': return 'Cancelada';
      default: return s;
    }
  }

  labelResponsavel(r: ResponsavelPagamentoMulta): string {
    return r === 'MOTORISTA' ? 'Motorista' : 'Empresa';
  }

  statusClass(s: StatusPagamentoMulta): string {
    switch (s) {
      case 'PAGO': return 'badge ok';
      case 'CANCELADA': return 'badge neutral';
      case 'RECURSO_PROTOCOLADO': return 'badge info';
      default: return 'badge warn';
    }
  }

  prazoProximo(data?: string | null): boolean {
    if (!data) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataPrazo = new Date(data + 'T00:00:00');
    const diffDias = Math.ceil((dataPrazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias >= 0 && diffDias <= 5;
  }

  formatDateBr(value?: string | null): string {
    if (!value) return '—';
    const [y, m, d] = value.slice(0, 10).split('-');
    if (!y || !m || !d) return value;
    return `${d}/${m}/${y}`;
  }

  formatMoneyBRL(v?: number | null): string {
    return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
