import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { CargaApiService } from '../../../core/api/carga-api.service';
import { ParadaCargaApiService } from '../../../core/api/parada-carga-api.service';
import { ArquivoApiService } from '../../../core/api/arquivo-api.service';

import { CargaResponse, ClienteCargaResponse } from '../../../core/api/carga-api.models';
import {
  AnexoParadaResponse,
  ParadaCargaRequest,
  ParadaCargaResponse
} from '../../../core/api/parada-carga-api.models';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
}

type AbastecimentoForm = {
  qtLitros: number | null;
  valorLitro: number | null;
  valorTotal: number | null;
  tipoCombustivel: string;
  formaPagamento: string;
  posto: string;
  cidade: string;
  uf: string;
  numNotaOuCupom: string;
};

type TrocaPneuForm = {
  pneu: string;
  eixoNumero: number | null;
  lado: string;
  posicao: string;
  kmOdometro: number | null;
  tipoTroca: string;
};

type ManutencaoForm = {
  descricao: string;
  dataInicioManutencao: string;
  dataFimManutencao: string;
  tipoManutencao: string;
  itensTrocados: string[];
  observacoes: string;
  valor: number | null;
  statusManutencao: string;
  oficinaId: string;
  trocasPneu: TrocaPneuForm[];
};

type ParadaForm = Partial<ParadaCargaRequest> & {
  abastecimento: AbastecimentoForm;
  manutencao: ManutencaoForm;
  itensTrocadosText: string;
};

@Component({
  selector: 'app-carga-detalhe',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './carga-detalhe.component.html',
  styleUrls: ['./carga-detalhe.component.css'],
})
export class CargaDetalheComponent implements OnInit {
  numeroCarga = '';

  loading = false;
  errorMsg: string | null = null;

  carga: CargaResponse | null = null;

  // ===== Toasts =====
  toasts: ToastItem[] = [];
  private toastSeq = 1;

  // ===== Paradas =====
  paradas: ParadaCargaResponse[] = [];
  loadingParadas = false;

  // ===== Ordem de entrega =====
  ordem: string[] = [];
  ordemDirty = false;
  savingOrdem = false;

  // ===== Observação motorista =====
  observacao = '';
  savingObs = false;

  // ===== Preview Parada =====
  showParadaModal = false;
  paradaSelecionada: ParadaCargaResponse | null = null;
  anexosParada: AnexoParadaResponse[] = [];
  loadingAnexos = false;
  anexoTipo = 'COMPROVANTE';
  anexoObs = '';
  anexoFile: File | null = null;

  // ===== Nova parada =====
  showNovaParadaModal = false;
  paradaForm: ParadaForm = {
    tipoParada: 'OUTROS',
    dtInicio: '',
    dtFim: '',
    cidade: '',
    local: '',
    kmOdometro: null,
    observacao: '',
    valorDespesa: null,
    descricaoDespesa: '',
    itensTrocadosText: '',
    abastecimento: {
      qtLitros: null,
      valorLitro: null,
      valorTotal: null,
      tipoCombustivel: '',
      formaPagamento: '',
      posto: '',
      cidade: '',
      uf: '',
      numNotaOuCupom: '',
    },
    manutencao: {
      descricao: '',
      dataInicioManutencao: '',
      dataFimManutencao: '',
      tipoManutencao: '',
      itensTrocados: [],
      observacoes: '',
      valor: null,
      statusManutencao: '',
      oficinaId: '',
      trocasPneu: [],
    },
  };
  savingParada = false;

  // ===== Preview arquivo =====
  previewUrl: string | null = null;
  previewMime: string | null = null;
  showArquivoModal = false;

  // ===== Regras =====
  readonly OBS_MIN = 5;
  readonly OBS_MAX = 800;
  readonly ANEXO_MAX_MB = 10;

  readonly TIPOS_COMBUSTIVEL = [
    'DIESEL_S10',
    'DIESEL_S500',
    'DIESEL_COMUM',
    'GASOLINA_COMUM',
    'GASOLINA_ADITIVADA',
    'GASOLINA_PREMIUM',
    'ETANOL',
    'ETANOL_ADITIVADO',
    'GNV',
    'ARLA32',
    'ELETRICO',
    'HIBRIDO',
  ];
  readonly FORMAS_PAGAMENTO = [
    'DINHEIRO',
    'CARTAO_DEBITO',
    'CARTAO_CREDITO',
    'PIX',
    'TRANSFERENCIA',
    'CHEQUE',
    'BOLETO',
    'VALE_COMBUSTIVEL',
    'CONVENIO',
    'FATURADO',
    'NOTA_DE_CREDITO',
    'OUTROS',
  ];
  readonly TIPOS_MANUTENCAO = ['PREVENTIVA', 'CORRETIVA'];
  readonly STATUS_MANUTENCAO = ['ABERTA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'];
  readonly TIPOS_TROCA_PNEU = ['INSTALACAO', 'REMOVER', 'RODIZIO', 'TROCA_MANUTENCAO', 'ENVIO_RECAPAGEM', 'RETORNO_RECAPAGEM', 'DESCARTE'];
  readonly LADOS_PNEU = ['ESQUERDO', 'DIREITO'];
  readonly POSICOES_PNEU = ['INTERNO', 'EXTERNO'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cargaApi: CargaApiService,
    private paradaApi: ParadaCargaApiService,
    private arquivoApi: ArquivoApiService
  ) {}

  // =========================
  // Toast helpers
  // =========================
  toast(type: ToastType, message: string, title?: string, timeoutMs = 3500): void {
    const id = this.toastSeq++;
    const item: ToastItem = { id, type, message, title };
    this.toasts = [item, ...this.toasts].slice(0, 5);

    window.setTimeout(() => this.dismissToast(id), timeoutMs);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  // =========================
  // Navegação / ciclo
  // =========================
  voltar(): void {
    this.router.navigate(['/dashboard/cargas']);
  }

  ngOnInit(): void {
    this.numeroCarga = this.route.snapshot.paramMap.get('numeroCarga') || '';
    if (!this.numeroCarga) {
      this.router.navigate(['/dashboard/cargas']);
      return;
    }
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.errorMsg = null;

    this.cargaApi.buscar(this.numeroCarga)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (c) => {
          this.carga = c;

          this.observacao = c.observacaoMotorista || '';

          const baseClientes = this.clientesUnicos(c.clientes || []);
          this.ordem =
            c.ordemEntregaClientes && c.ordemEntregaClientes.length > 0
              ? [...c.ordemEntregaClientes]
              : [...baseClientes];

          this.ordemDirty = false;

          this.carregarParadas();
        },
        error: (err) => {
          console.error(err);
          this.carga = null;
          this.paradas = [];
          this.errorMsg = 'Não foi possível carregar os detalhes da carga.';
          this.toast('error', 'Falha ao carregar detalhes da carga.', 'Erro');
        },
      });
  }

  carregarParadas(): void {
    this.loadingParadas = true;

    this.paradaApi
      .listarPorCarga(this.numeroCarga, { page: 0, size: 200, sort: 'dtInicio,desc' })
      .pipe(finalize(() => (this.loadingParadas = false)))
      .subscribe({
        next: (p) => (this.paradas = p.content || []),
        error: (err) => {
          console.error(err);
          this.paradas = [];
          this.toast('error', 'Não foi possível carregar as paradas.', 'Paradas');
        },
      });
  }

  // =========================
  // Clientes / Ordem
  // =========================
  clientesUnicos(clientes: ClienteCargaResponse[]): string[] {
    const set = new Set<string>();
    for (const c of clientes || []) {
      if (c?.cliente) set.add(c.cliente);
    }
    return Array.from(set);
  }

  moverCliente(idx: number, dir: -1 | 1): void {
    const next = idx + dir;
    if (next < 0 || next >= this.ordem.length) return;

    const copy = [...this.ordem];
    const tmp = copy[idx];
    copy[idx] = copy[next];
    copy[next] = tmp;

    this.ordem = copy;
    this.ordemDirty = true;
  }

  salvarOrdem(): void {
    if (!this.carga) return;

    if (!this.ordem || this.ordem.length === 0) {
      this.toast('warning', 'Não há clientes para salvar a ordem.', 'Ordem');
      return;
    }

    this.savingOrdem = true;

    this.cargaApi
      .atualizarOrdemEntrega(this.carga.numeroCarga, this.ordem)
      .pipe(finalize(() => (this.savingOrdem = false)))
      .subscribe({
        next: () => {
          this.ordemDirty = false;
          if (this.carga) this.carga.ordemEntregaClientes = [...this.ordem];
          this.toast('success', 'Ordem de entrega salva com sucesso.', 'Ordem');
        },
        error: (err) => {
          console.error(err);
          this.toast('error', 'Não foi possível salvar a ordem de entrega.', 'Ordem');
        },
      });
  }

  // =========================
  // Observação motorista
  // =========================
  obsTrimmed(): string {
    return (this.observacao || '').trim();
  }

  obsLen(): number {
    return this.obsTrimmed().length;
  }

  obsErro(): string | null {
    const len = this.obsLen();
    if (len === 0) return 'Informe uma observação para salvar.';
    if (len < this.OBS_MIN) return `A observação deve ter pelo menos ${this.OBS_MIN} caracteres.`;
    if (len > this.OBS_MAX) return `A observação deve ter no máximo ${this.OBS_MAX} caracteres.`;
    return null;
  }

  salvarObservacao(): void {
    if (!this.carga) return;

    const err = this.obsErro();
    if (err) {
      this.toast('warning', err, 'Validação');
      return;
    }

    const obs = this.obsTrimmed();

    this.savingObs = true;

    this.cargaApi
      .atualizarObservacaoMotorista(this.carga.numeroCarga, obs)
      .pipe(finalize(() => (this.savingObs = false)))
      .subscribe({
        next: () => {
          if (this.carga) this.carga.observacaoMotorista = obs;
          this.toast('success', 'Observação salva com sucesso.', 'Observação');
        },
        error: (err2) => {
          console.error(err2);
          this.toast('error', 'Não foi possível salvar a observação.', 'Observação');
        },
      });
  }

  // =========================
  // Modal Parada (preview)
  // =========================
  abrirParada(p: ParadaCargaResponse): void {
    this.showParadaModal = true;
    this.paradaSelecionada = p;
    this.anexosParada = [];
    this.anexoFile = null;
    this.anexoObs = '';
    this.loadingAnexos = true;

    this.paradaApi
      .listarAnexos(p.id)
      .pipe(finalize(() => (this.loadingAnexos = false)))
      .subscribe({
        next: (a) => (this.anexosParada = a || []),
        error: (err) => {
          console.error(err);
          this.anexosParada = [];
          this.toast('error', 'Não foi possível listar os anexos dessa parada.', 'Anexos');
        },
      });
  }

  fecharParada(): void {
    this.showParadaModal = false;
    this.paradaSelecionada = null;
    this.anexosParada = [];
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.anexoFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  uploadAnexoParada(): void {
    if (!this.paradaSelecionada) return;

    if (!this.anexoFile) {
      this.toast('warning', 'Selecione um arquivo para enviar.', 'Anexos');
      return;
    }

    const maxBytes = this.ANEXO_MAX_MB * 1024 * 1024;
    if (this.anexoFile.size > maxBytes) {
      this.toast('warning', `Arquivo muito grande. Máximo permitido: ${this.ANEXO_MAX_MB}MB.`, 'Anexos');
      return;
    }

    this.loadingAnexos = true;

    this.paradaApi
      .uploadAnexo(this.paradaSelecionada.id, this.anexoFile, this.anexoTipo, this.anexoObs)
      .pipe(finalize(() => (this.loadingAnexos = false)))
      .subscribe({
        next: () => {
          this.anexoFile = null;
          this.anexoObs = '';
          this.toast('success', 'Anexo enviado com sucesso.', 'Anexos');

          this.paradaApi.listarAnexos(this.paradaSelecionada!.id).subscribe({
            next: (a) => (this.anexosParada = a || []),
            error: () => null,
          });
        },
        error: (err) => {
          console.error(err);
          this.toast('error', 'Não foi possível enviar o anexo.', 'Anexos');
        },
      });
  }

  abrirPreviewArquivo(arquivoId: string, contentType?: string): void {
    this.arquivoApi.previewBlob(arquivoId).subscribe({
      next: (blob) => {
        this.previewMime = contentType || blob.type;
        this.previewUrl = URL.createObjectURL(blob);
        this.showArquivoModal = true;
      },
      error: (err) => {
        console.error(err);
        this.toast('error', 'Não foi possível abrir o preview do arquivo.', 'Arquivo');
      },
    });
  }

  fecharPreviewArquivo(): void {
    this.showArquivoModal = false;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
    this.previewMime = null;
  }

  downloadArquivo(arquivoId: string, nome?: string): void {
    this.arquivoApi.downloadBlob(arquivoId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nome || 'arquivo';
        a.click();
        URL.revokeObjectURL(url);
        this.toast('success', 'Download iniciado.', 'Arquivo');
      },
      error: (err) => {
        console.error(err);
        this.toast('error', 'Não foi possível baixar o arquivo.', 'Arquivo');
      },
    });
  }

  // =========================
  // Nova Parada
  // =========================
  abrirNovaParada(): void {
    this.showNovaParadaModal = true;

    const now = new Date();
    const isoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    this.paradaForm = {
      tipoParada: 'OUTROS',
      dtInicio: isoLocal,
      dtFim: '',
      cidade: '',
      local: '',
      kmOdometro: null,
      observacao: '',
      valorDespesa: null,
      descricaoDespesa: '',
      itensTrocadosText: '',
      abastecimento: {
        qtLitros: null,
        valorLitro: null,
        valorTotal: null,
        tipoCombustivel: '',
        formaPagamento: '',
        posto: '',
        cidade: '',
        uf: '',
        numNotaOuCupom: '',
      },
      manutencao: {
        descricao: '',
        dataInicioManutencao: '',
        dataFimManutencao: '',
        tipoManutencao: '',
        itensTrocados: [],
        observacoes: '',
        valor: null,
        statusManutencao: '',
        oficinaId: '',
        trocasPneu: [],
      },
    };
  }

  fecharNovaParada(): void {
    this.showNovaParadaModal = false;
  }

  private parseDateTimeLocal(v?: string | null): Date | null {
    if (!v) return null;
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  private toBackendDateTime(v?: string | null): string | null {
    if (!v) return null;
    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return null;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  }

  dtFimAntesDoInicio(): boolean {
    const ini = this.parseDateTimeLocal(String(this.paradaForm.dtInicio || ''));
    const fim = this.parseDateTimeLocal(String(this.paradaForm.dtFim || ''));
    if (!ini || !fim) return false;
    return fim.getTime() < ini.getTime();
  }

  // ======= FIX NG5002: regras que NÃO podem ficar no template com "as any" =======
  kmNegativo(): boolean {
    const v: any = (this.paradaForm as any)?.kmOdometro;
    if (v === null || v === undefined || v === '') return false;
    const n = Number(v);
    return Number.isFinite(n) && n < 0;
  }

  valorDespesaNegativo(): boolean {
    const v: any = (this.paradaForm as any)?.valorDespesa;
    if (v === null || v === undefined || v === '') return false;
    const n = Number(v);
    return Number.isFinite(n) && n < 0;
  }

  precisaDescricaoDespesa(): boolean {
    const v: any = (this.paradaForm as any)?.valorDespesa;
    if (v === null || v === undefined || v === '') return false;

    const n = Number(v);
    if (!Number.isFinite(n)) return false;

    const desc = String((this.paradaForm as any)?.descricaoDespesa || '').trim();
    return desc.length === 0;
  }

  validarParadaForm(): string[] {
    const erros: string[] = [];

    const tipo = String(this.paradaForm.tipoParada || '').trim();
    const dtInicio = String(this.paradaForm.dtInicio || '').trim();
    const dtFim = String(this.paradaForm.dtFim || '').trim();

    if (!tipo) erros.push('Informe o tipo da parada.');
    if (!dtInicio) erros.push('Informe a data/hora de início.');

    if (dtFim) {
      const ini = this.parseDateTimeLocal(dtInicio);
      const fim = this.parseDateTimeLocal(dtFim);
      if (!ini || !fim) erros.push('Data/hora inválida no início ou no fim.');
      else if (fim.getTime() < ini.getTime()) erros.push('A data/hora de fim não pode ser menor que o início.');
    }

    if (this.kmNegativo()) erros.push('KM (odômetro) não pode ser negativo.');
    if (this.valorDespesaNegativo()) erros.push('Valor da despesa não pode ser negativo.');
    if (this.precisaDescricaoDespesa()) erros.push('Ao informar um valor de despesa, informe também a descrição.');

    const obs = String(this.paradaForm.observacao || '');
    if (obs && obs.length > 800) erros.push('Observação da parada muito grande (máx. 800 caracteres).');

    if (String(this.paradaForm.tipoParada || '') === 'ABASTECIMENTO') {
      const a = this.paradaForm.abastecimento;
      if (!a.qtLitros || a.qtLitros <= 0) erros.push('Quantidade de litros é obrigatória.');
      if (!a.valorLitro || a.valorLitro <= 0) erros.push('Valor do litro é obrigatório.');
      if (!a.tipoCombustivel) erros.push('Tipo de combustível é obrigatório.');
      if (!a.formaPagamento) erros.push('Forma de pagamento é obrigatória.');
      if (a.posto && a.posto.length > 120) erros.push('Posto deve ter no máximo 120 caracteres.');
      if (a.cidade && a.cidade.length > 120) erros.push('Cidade deve ter no máximo 120 caracteres.');
      if (a.uf && !/^[A-Za-z]{2}$/.test(a.uf)) erros.push('UF inválida (ex: PB).');
      if (a.numNotaOuCupom && a.numNotaOuCupom.length > 60) erros.push('Nº nota/cupom deve ter no máximo 60 caracteres.');
    }

    if (String(this.paradaForm.tipoParada || '') === 'MANUTENCAO') {
      const m = this.paradaForm.manutencao;
      if (!m.descricao || m.descricao.trim().length < 3) erros.push('Descrição da manutenção é obrigatória.');
      if (m.descricao && m.descricao.length > 200) erros.push('Descrição deve ter até 200 caracteres.');
      if (!m.dataInicioManutencao) erros.push('Data de início da manutenção é obrigatória.');
      if (!m.tipoManutencao) erros.push('Tipo de manutenção é obrigatório.');
      if (!m.statusManutencao) erros.push('Status da manutenção é obrigatório.');
      if (m.observacoes && m.observacoes.length > 500) erros.push('Observações deve ter no máximo 500 caracteres.');
      if (m.valor != null && Number(m.valor) < 0) erros.push('Valor da manutenção deve ser >= 0.');

      const itens = (m.itensTrocados || []);
      if (itens.some((it: string) => (it || '').length > 120)) erros.push('Item trocado inválido (máx. 120).');

      for (const t of m.trocasPneu || []) {
        if (!t.pneu) erros.push('Pneu é obrigatório na troca.');
        if (!t.eixoNumero && t.eixoNumero !== 0) erros.push('Número do eixo é obrigatório na troca.');
        if (!t.lado) erros.push('Lado é obrigatório na troca.');
        if (!t.posicao) erros.push('Posição é obrigatória na troca.');
        if (t.kmOdometro == null || Number(t.kmOdometro) < 0) erros.push('KM do odômetro é obrigatório na troca.');
        if (!t.tipoTroca) erros.push('Tipo de troca é obrigatório na troca.');
        break;
      }
    }

    return erros;
  }

  isAbastecimento(): boolean {
    return String(this.paradaForm.tipoParada || '') === 'ABASTECIMENTO';
  }

  isManutencao(): boolean {
    return String(this.paradaForm.tipoParada || '') === 'MANUTENCAO';
  }

  onTipoParadaChange(): void {
    if (!this.isAbastecimento()) {
      this.paradaForm.abastecimento = {
        qtLitros: null,
        valorLitro: null,
        valorTotal: null,
        tipoCombustivel: '',
        formaPagamento: '',
        posto: '',
        cidade: '',
        uf: '',
        numNotaOuCupom: '',
      };
    }

    if (!this.isManutencao()) {
      this.paradaForm.manutencao = {
        descricao: '',
        dataInicioManutencao: '',
        dataFimManutencao: '',
        tipoManutencao: '',
        itensTrocados: [],
        observacoes: '',
        valor: null,
        statusManutencao: '',
        oficinaId: '',
        trocasPneu: [],
      };
      this.paradaForm.itensTrocadosText = '';
    }
  }

  addTrocaPneu(): void {
    this.paradaForm.manutencao.trocasPneu.push({
      pneu: '',
      eixoNumero: null,
      lado: '',
      posicao: '',
      kmOdometro: null,
      tipoTroca: '',
    });
  }

  removeTrocaPneu(idx: number): void {
    this.paradaForm.manutencao.trocasPneu.splice(idx, 1);
  }

  syncItensTrocados(): void {
    const raw = (this.paradaForm.itensTrocadosText || '').trim();
    if (!raw) {
      this.paradaForm.manutencao.itensTrocados = [];
      return;
    }
    this.paradaForm.manutencao.itensTrocados = raw
      .split(/[,\n;]+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  salvarParada(): void {
    if (!this.carga) return;

    const erros = this.validarParadaForm();
    if (erros.length > 0) {
      this.toast('warning', erros[0], 'Validação');
      return;
    }

    this.syncItensTrocados();

    const req: ParadaCargaRequest = {
      carga: this.carga.numeroCarga,
      tipoParada: String(this.paradaForm.tipoParada),
      dtInicio: this.toBackendDateTime(String(this.paradaForm.dtInicio)) || String(this.paradaForm.dtInicio),
      dtFim: this.toBackendDateTime(this.paradaForm.dtFim || null),
      cidade: this.paradaForm.cidade || null,
      local: this.paradaForm.local || null,
      kmOdometro: (this.paradaForm as any).kmOdometro ?? null,
      observacao: (this.paradaForm.observacao || '').trim() || null,
      valorDespesa: (this.paradaForm as any).valorDespesa ?? null,
      descricaoDespesa: (this.paradaForm.descricaoDespesa || '').trim() || null,
      abastecimento: this.isAbastecimento()
        ? {
          qtLitros: this.paradaForm.abastecimento.qtLitros,
          valorLitro: this.paradaForm.abastecimento.valorLitro,
          valorTotal: this.paradaForm.abastecimento.valorTotal,
          tipoCombustivel: this.paradaForm.abastecimento.tipoCombustivel || null,
          formaPagamento: this.paradaForm.abastecimento.formaPagamento || null,
          posto: this.paradaForm.abastecimento.posto?.trim() || null,
          cidade: this.paradaForm.abastecimento.cidade?.trim() || null,
          uf: this.paradaForm.abastecimento.uf?.trim() || null,
          numNotaOuCupom: this.paradaForm.abastecimento.numNotaOuCupom?.trim() || null,
        }
        : undefined,
      manutencao: this.isManutencao()
        ? {
          descricao: this.paradaForm.manutencao.descricao?.trim() || null,
          dataInicioManutencao: this.paradaForm.manutencao.dataInicioManutencao || null,
          dataFimManutencao: this.paradaForm.manutencao.dataFimManutencao || null,
          tipoManutencao: this.paradaForm.manutencao.tipoManutencao || null,
          itensTrocados: this.paradaForm.manutencao.itensTrocados || [],
          observacoes: this.paradaForm.manutencao.observacoes?.trim() || null,
          valor: this.paradaForm.manutencao.valor ?? null,
          statusManutencao: this.paradaForm.manutencao.statusManutencao || null,
          oficinaId: this.paradaForm.manutencao.oficinaId?.trim() || null,
          trocasPneu: this.paradaForm.manutencao.trocasPneu || [],
        }
        : undefined,
    };

    this.savingParada = true;

    this.paradaApi
      .criar(req)
      .pipe(finalize(() => (this.savingParada = false)))
      .subscribe({
        next: () => {
          this.showNovaParadaModal = false;
          this.toast('success', 'Parada cadastrada com sucesso.', 'Paradas');
          this.carregarParadas();
        },
        error: (err) => {
          console.error(err);
          this.toast('error', 'Não foi possível cadastrar a parada.', 'Paradas');
        },
      });
  }

  // =========================
  // Helpers
  // =========================
  formatMoneyBRL(v?: number | string | null): string {
    if (v === null || v === undefined) {
      return (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    let n: number;

    if (typeof v === 'number') {
      n = v;
    } else {
      const raw = v
        .trim()
        .replace(/\s/g, '')
        .replace(/^R\$/i, '')
        .replace(/\./g, '')
        .replace(',', '.');

      n = Number(raw);
    }

    if (!Number.isFinite(n)) n = 0;

    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  labelStatus(status: string): string {
    switch (status) {
      case 'EM_ROTA':
        return 'Em rota';
      case 'FINALIZADA':
        return 'Finalizada';
      case 'DISPONIVEL':
        return 'Disponível';
      default:
        return status;
    }
  }
}
