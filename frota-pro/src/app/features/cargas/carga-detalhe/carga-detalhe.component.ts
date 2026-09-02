import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../../core/utils/api-error.util';
import { CargaApiService } from '../../../core/api/carga-api.service';
import { MotoristaApiService } from '../../../core/api/motorista-api.service';
import { MotoristaResponse } from '../../../core/api/motorista-api.models';
import { ParadaCargaApiService } from '../../../core/api/parada-carga-api.service';
import { ArquivoApiService } from '../../../core/api/arquivo-api.service';
import { EixoApiService } from '../../../core/api/eixo-api.service';
import { EixoCaminhaoResponse } from '../../../core/api/eixo-api.models';
import { NotaFiscalApiService } from '../../../core/api/nota-fiscal-api.service';
import { NotaFiscalResumoResponse } from '../../../core/api/nota-fiscal-api.models';
import { DevolucaoTransferenciaApiService } from '../../../core/api/devolucao-transferencia-api.service';
import { DevolucaoResponse, ResumoDescontoCargaResponse, TransferenciaResponse } from '../../../core/api/devolucao-transferencia-api.models';
import { formatKgFromTon, parseNumberLike } from '../../../shared/utils/weight';

import {
  CargaResponse,
  ClienteCargaResponse,
  NotaFiscalArquivoResponse,
  numeroCargaSecundario,
  numeroCargaSecundarioLabel,
} from '../../../core/api/carga-api.models';
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
  mediaKmLitro: number | null;
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

interface GrupoClientesPorCidade {
  cidade: string;
  semRoteirizacao: boolean;
  clientes: ClienteCargaResponse[];
}

@Component({
  selector: 'app-carga-detalhe',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './carga-detalhe.component.html',
  styleUrls: ['./carga-detalhe.component.css'],
})
export class CargaDetalheComponent implements OnInit {
  protected readonly numeroCargaSecundario = numeroCargaSecundario;
  protected readonly numeroCargaSecundarioLabel = numeroCargaSecundarioLabel;

  numeroCarga = '';

  loading = false;
  errorMsg: string | null = null;

  carga: CargaResponse | null = null;

  // ===== Clientes e Notas (agrupado por cidade) =====
  cidadeSelecionada: string | null = null;

  // ===== Cadastro manual de notas fiscais (upload de XML) =====
  arquivosNotaXmlSelecionados: File[] = [];
  enviandoNotasXml = false;

  // ===== Toasts =====
  toasts: ToastItem[] = [];
  private toastSeq = 1;

  // ===== Paradas =====
  paradas: ParadaCargaResponse[] = [];
  loadingParadas = false;
  eixosCaminhao: EixoCaminhaoResponse[] = [];
  loadingEixos = false;

  // ===== Ordem de entrega =====
  ordem: string[] = [];
  ordemDirty = false;
  savingOrdem = false;

  // ===== Observação motorista =====
  observacao = '';
  savingObs = false;

  // ===== Transferir motorista =====
  // Carga faturada pra um motorista no WinThor, mas outro foi quem
  // realmente saiu com ela (MDF-e/minuta não mudam pra refletir isso).
  showTransferirMotoristaModal = false;
  motoristasParaTransferencia: MotoristaResponse[] = [];
  motoristasParaTransferenciaLoading = false;
  codigoMotoristaTransferencia = '';
  savingTransferirMotorista = false;

  // ===== Preview Parada =====
  showParadaModal = false;
  paradaSelecionada: ParadaCargaResponse | null = null;
  anexosParada: AnexoParadaResponse[] = [];
  loadingAnexos = false;
  anexoTipo = 'COMPROVANTE';
  anexoObs = '';
  anexoFile: File | null = null;

  // ===== Excluir parada (confirmação inline no modal de detalhes) =====
  confirmandoExclusaoParada = false;
  excluindoParada = false;

  // ===== Nova parada / edição de parada =====
  showNovaParadaModal = false;
  /** null = cadastrando parada nova; preenchido = editando essa parada existente. */
  paradaEditandoId: string | null = null;
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
      mediaKmLitro: null,
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

  // ===== Notas fiscais (cliente) =====
  showNotasFiscaisModal = false;
  clienteNotasFiscais: string | null = null;
  notasFiscais: NotaFiscalResumoResponse[] = [];
  loadingNotasFiscais = false;
  notasFiscaisErro: string | null = null;
  baixandoNota: { numeroNota: number; tipo: 'xml' | 'pdf' } | null = null;
  notaEmailAlvo: NotaFiscalResumoResponse | null = null;
  notaEmailDestinatario = '';
  enviandoEmailNota = false;

  // ===== Devolução (detalhe) =====
  showDevolucaoModal = false;
  devolucoes: DevolucaoResponse[] = [];
  loadingDevolucoes = false;
  devolucoesErro: string | null = null;

  // ===== Transferência (detalhe) =====
  showTransferenciaModal = false;
  transferencias: TransferenciaResponse[] = [];
  loadingTransferencias = false;
  transferenciasErro: string | null = null;

  // ===== Resumo de desconto (devolução + transferência combinados) =====
  resumoDesconto: ResumoDescontoCargaResponse | null = null;
  loadingResumoDesconto = false;

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
    private motoristaApi: MotoristaApiService,
    private paradaApi: ParadaCargaApiService,
    private arquivoApi: ArquivoApiService,
    private eixoApi: EixoApiService,
    private notaFiscalApi: NotaFiscalApiService,
    private devolucaoTransferenciaApi: DevolucaoTransferenciaApiService
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
    this.cidadeSelecionada = null;

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
          this.carregarResumoDesconto();
        },
        error: (err) => {
          console.error(err);
          this.carga = null;
          this.paradas = [];
          this.errorMsg = this.mensagemErro(err, 'Não foi possível carregar os detalhes da carga.');
          this.toast('error', this.errorMsg, 'Erro');
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
          this.toast('error', this.mensagemErro(err, 'Não foi possível carregar as paradas.'), 'Paradas');
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

  /** Clientes agrupados por cidade — cidades sem cliente roteirizado ficam marcadas. */
  get clientesAgrupadosPorCidade(): GrupoClientesPorCidade[] {
    const clientes = this.carga?.clientes || [];
    const naoRoteirizados = new Set(this.carga?.clientesNaoRoteirizados || []);

    const porCidade = new Map<string, ClienteCargaResponse[]>();
    for (const c of clientes) {
      const cidade = (c.cidade || '').trim() || 'Sem cidade';
      if (!porCidade.has(cidade)) porCidade.set(cidade, []);
      porCidade.get(cidade)!.push(c);
    }

    const grupos: GrupoClientesPorCidade[] = Array.from(porCidade.entries()).map(([cidade, clis]) => ({
      cidade,
      semRoteirizacao: clis.length > 0 && clis.every((c) => naoRoteirizados.has(c.cliente)),
      clientes: clis,
    }));

    grupos.sort((a, b) => {
      if (a.cidade === 'Sem cidade') return 1;
      if (b.cidade === 'Sem cidade') return -1;
      return a.cidade.localeCompare(b.cidade, 'pt-BR');
    });

    return grupos;
  }

  get grupoCidadeSelecionado(): GrupoClientesPorCidade | null {
    if (!this.cidadeSelecionada) return null;
    return this.clientesAgrupadosPorCidade.find((g) => g.cidade === this.cidadeSelecionada) || null;
  }

  selecionarCidade(cidade: string): void {
    this.cidadeSelecionada = cidade;
  }

  voltarParaCidades(): void {
    this.cidadeSelecionada = null;
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
          this.toast('error', this.mensagemErro(err, 'Não foi possível salvar a ordem de entrega.'), 'Ordem');
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
          this.toast('error', this.mensagemErro(err2, 'Não foi possível salvar a observação.'), 'Observação');
        },
      });
  }

  // =========================
  // Transferir motorista
  // =========================
  // Carga faturada pra um motorista no WinThor, mas outro foi quem
  // realmente saiu com ela (o MDF-e/minuta não mudam pra refletir isso).
  abrirTransferirMotoristaModal(): void {
    this.codigoMotoristaTransferencia = '';
    this.showTransferirMotoristaModal = true;

    if (this.motoristasParaTransferencia.length === 0) {
      this.motoristasParaTransferenciaLoading = true;
      this.motoristaApi
        .listar({ page: 0, size: 1000, sort: 'nome,asc', ativo: true })
        .pipe(finalize(() => (this.motoristasParaTransferenciaLoading = false)))
        .subscribe({
          next: (res) => (this.motoristasParaTransferencia = res.content || []),
          error: (err) => {
            console.error(err);
            this.toast('error', this.mensagemErro(err, 'Não foi possível carregar a lista de motoristas.'), 'Transferir motorista');
          },
        });
    }
  }

  fecharTransferirMotoristaModal(): void {
    if (this.savingTransferirMotorista) return;
    this.showTransferirMotoristaModal = false;
    this.codigoMotoristaTransferencia = '';
  }

  transferirMotorista(): void {
    if (!this.carga) return;

    const codigoMotorista = this.codigoMotoristaTransferencia.trim();
    if (!codigoMotorista) {
      return this.toast('warning', 'Selecione o motorista que saiu com a carga.', 'Transferir motorista');
    }

    this.savingTransferirMotorista = true;

    this.cargaApi
      .transferirMotorista(this.carga.numeroCarga, { codigoMotorista })
      .pipe(finalize(() => (this.savingTransferirMotorista = false)))
      .subscribe({
        next: () => {
          this.showTransferirMotoristaModal = false;
          this.codigoMotoristaTransferencia = '';
          this.toast('success', 'Motorista da carga atualizado.', 'Transferir motorista');
          this.carregar();
        },
        error: (err) => {
          console.error(err);
          this.toast('error', this.mensagemErro(err, 'Não foi possível transferir a carga para outro motorista.'), 'Transferir motorista');
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
    this.confirmandoExclusaoParada = false;
    this.loadingAnexos = true;

    this.paradaApi
      .listarAnexos(p.id)
      .pipe(finalize(() => (this.loadingAnexos = false)))
      .subscribe({
        next: (a) => (this.anexosParada = a || []),
        error: (err) => {
          console.error(err);
          this.anexosParada = [];
          this.toast('error', this.mensagemErro(err, 'Não foi possível listar os anexos dessa parada.'), 'Anexos');
        },
      });
  }

  fecharParada(): void {
    this.showParadaModal = false;
    this.paradaSelecionada = null;
    this.anexosParada = [];
    this.confirmandoExclusaoParada = false;
  }

  /** Carga ainda em aberto (não finalizada) — mesma regra que o back aplica pra liberar edição/exclusão de parada. */
  paradaEditavel(): boolean {
    return !!this.carga && this.carga.statusCarga !== 'FINALIZADA';
  }

  /** Abre a Parada selecionada (no modal de detalhes) direto no formulário de edição. */
  editarParadaAtual(): void {
    if (!this.paradaSelecionada) return;
    const parada = this.paradaSelecionada;
    this.fecharParada();
    this.abrirNovaParada(parada);
  }

  pedirExclusaoParada(): void {
    this.confirmandoExclusaoParada = true;
  }

  cancelarExclusaoParada(): void {
    this.confirmandoExclusaoParada = false;
  }

  confirmarExclusaoParada(): void {
    if (!this.paradaSelecionada) return;
    const id = this.paradaSelecionada.id;

    this.excluindoParada = true;
    this.paradaApi
      .deletar(id)
      .pipe(finalize(() => (this.excluindoParada = false)))
      .subscribe({
        next: () => {
          this.toast('success', 'Parada excluída com sucesso.', 'Paradas');
          this.fecharParada();
          this.carregarParadas();
        },
        error: (err) => {
          console.error(err);
          this.toast('error', this.mensagemErro(err, 'Não foi possível excluir a parada.'), 'Paradas');
        },
      });
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
          this.toast('error', this.mensagemErro(err, 'Não foi possível enviar o anexo.'), 'Anexos');
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
        this.toast('error', this.mensagemErro(err, 'Não foi possível abrir o preview do arquivo.'), 'Arquivo');
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
        this.toast('error', this.mensagemErro(err, 'Não foi possível baixar o arquivo.'), 'Arquivo');
      },
    });
  }

  // =========================
  // Cadastro manual de notas fiscais (upload de XML da NFe)
  // =========================
  onArquivosNotaXmlSelecionados(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivos = input.files ? Array.from(input.files) : [];
    this.arquivosNotaXmlSelecionados = arquivos.filter((a) => a.name.toLowerCase().endsWith('.xml'));

    if (this.arquivosNotaXmlSelecionados.length < arquivos.length) {
      this.toast('warning', 'Só arquivos .xml são aceitos — os demais foram ignorados.', 'Notas fiscais');
    }
  }

  removerArquivoNotaXml(arquivo: File): void {
    this.arquivosNotaXmlSelecionados = this.arquivosNotaXmlSelecionados.filter((a) => a !== arquivo);
  }

  baixarArquivoNotaManual(nota: NotaFiscalArquivoResponse): void {
    this.arquivoApi.downloadBlob(nota.arquivoId).subscribe({
      next: (blob) => this.baixarBlob(blob, nota.nomeArquivo || `NF_${nota.nota}.xml`),
      error: (err) => {
        console.error(err);
        this.toast('error', this.mensagemErro(err, 'Não foi possível baixar o XML.'), 'Notas fiscais');
      },
    });
  }

  enviarNotasXml(): void {
    if (!this.carga || this.arquivosNotaXmlSelecionados.length === 0) {
      this.toast('warning', 'Selecione ao menos um arquivo XML de NFe.', 'Notas fiscais');
      return;
    }

    this.enviandoNotasXml = true;

    this.cargaApi
      .importarNotasXml(this.carga.numeroCarga, this.arquivosNotaXmlSelecionados)
      .pipe(finalize(() => (this.enviandoNotasXml = false)))
      .subscribe({
        next: () => {
          const qtd = this.arquivosNotaXmlSelecionados.length;
          this.arquivosNotaXmlSelecionados = [];
          this.toast('success', `${qtd} nota(s) fiscal(is) importada(s) com sucesso.`, 'Notas fiscais');
          this.carregar();
        },
        error: (err) => {
          console.error(err);
          this.toast('error', this.mensagemErro(err, 'Não foi possível importar as notas fiscais.'), 'Notas fiscais');
        },
      });
  }

  // =========================
  // Notas fiscais (cliente)
  // =========================
  documentosFiscaisDisponiveis(): boolean {
    return !!this.carga && this.carga.statusCarga !== 'FINALIZADA';
  }

  private mensagemErro(err: any, fallback: string): string {
    return extrairMensagemErro(err, fallback);
  }

  abrirNotasFiscais(cliente: string): void {
    if (!this.carga) return;

    this.showNotasFiscaisModal = true;
    this.clienteNotasFiscais = cliente;
    this.notasFiscais = [];
    this.notasFiscaisErro = null;
    this.notaEmailAlvo = null;
    this.notaEmailDestinatario = '';
    this.loadingNotasFiscais = true;

    this.notaFiscalApi
      .listar(this.carga.numeroCarga, cliente)
      .pipe(finalize(() => (this.loadingNotasFiscais = false)))
      .subscribe({
        next: (notas) => (this.notasFiscais = notas || []),
        error: (err) => {
          console.error(err);
          this.notasFiscais = [];
          this.notasFiscaisErro = this.mensagemErro(
            err,
            'Não foi possível carregar os documentos fiscais deste cliente.'
          );
        },
      });
  }

  fecharNotasFiscais(): void {
    this.showNotasFiscaisModal = false;
    this.clienteNotasFiscais = null;
    this.notasFiscais = [];
    this.notaEmailAlvo = null;
  }

  private baixarBlob(blob: Blob, nome: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
  }

  baixarNotaXml(nota: NotaFiscalResumoResponse): void {
    if (!this.carga) return;

    this.baixandoNota = { numeroNota: nota.numeroNota, tipo: 'xml' };

    this.notaFiscalApi
      .baixarXmlBlob(this.carga.numeroCarga, nota.numeroNota)
      .pipe(finalize(() => (this.baixandoNota = null)))
      .subscribe({
        next: (blob) => {
          this.baixarBlob(blob, `NF_${nota.numeroNota}.xml`);
          this.toast('success', 'Download do XML iniciado.', 'Nota fiscal');
        },
        error: (err) => {
          console.error(err);
          this.toast('error', this.mensagemErro(err, 'Não foi possível baixar o XML.'), 'Nota fiscal');
        },
      });
  }

  baixarNotaPdf(nota: NotaFiscalResumoResponse): void {
    if (!this.carga) return;

    this.baixandoNota = { numeroNota: nota.numeroNota, tipo: 'pdf' };

    this.notaFiscalApi
      .baixarPdfBlob(this.carga.numeroCarga, nota.numeroNota)
      .pipe(finalize(() => (this.baixandoNota = null)))
      .subscribe({
        next: (blob) => {
          this.baixarBlob(blob, `NF_${nota.numeroNota}.pdf`);
          this.toast('success', 'Download do PDF (DANFE) iniciado.', 'Nota fiscal');
        },
        error: (err) => {
          console.error(err);
          this.toast('error', this.mensagemErro(err, 'Não foi possível baixar o PDF.'), 'Nota fiscal');
        },
      });
  }

  abrirEnviarEmail(nota: NotaFiscalResumoResponse): void {
    this.notaEmailAlvo = nota;
    // Pré-preenche com o e-mail cadastrado do cliente no WinThor, se houver — o usuário pode trocar à vontade.
    this.notaEmailDestinatario = (nota.emailCliente || '').trim();
  }

  cancelarEnviarEmail(): void {
    this.notaEmailAlvo = null;
    this.notaEmailDestinatario = '';
  }

  confirmarEnviarEmail(): void {
    if (!this.carga || !this.notaEmailAlvo) return;

    const destinatario = this.notaEmailDestinatario.trim();
    if (!destinatario) {
      this.toast('warning', 'Informe o e-mail do destinatário.', 'Nota fiscal');
      return;
    }

    this.enviandoEmailNota = true;

    this.notaFiscalApi
      .enviarEmail(this.carga.numeroCarga, this.notaEmailAlvo.numeroNota, { destinatario })
      .pipe(finalize(() => (this.enviandoEmailNota = false)))
      .subscribe({
        next: () => {
          this.toast('success', `E-mail enviado para ${destinatario}.`, 'Nota fiscal');
          this.cancelarEnviarEmail();
        },
        error: (err) => {
          console.error(err);
          this.toast('error', this.mensagemErro(err, 'Não foi possível enviar o e-mail.'), 'Nota fiscal');
        },
      });
  }

  // =========================
  // Devolução (detalhe)
  // =========================
  abrirDevolucoes(): void {
    if (!this.carga) return;

    this.showDevolucaoModal = true;
    this.devolucoes = [];
    this.devolucoesErro = null;
    this.loadingDevolucoes = true;

    this.devolucaoTransferenciaApi
      .devolucoes(this.carga.numeroCarga)
      .pipe(finalize(() => (this.loadingDevolucoes = false)))
      .subscribe({
        next: (itens) => (this.devolucoes = itens || []),
        error: (err) => {
          console.error(err);
          this.devolucoes = [];
          this.devolucoesErro = this.mensagemErro(err, 'Não foi possível carregar os detalhes da devolução.');
        },
      });
  }

  fecharDevolucoes(): void {
    this.showDevolucaoModal = false;
    this.devolucoes = [];
    this.devolucoesErro = null;
  }

  // =========================
  // Transferência (detalhe)
  // =========================
  abrirTransferencias(): void {
    if (!this.carga) return;

    this.showTransferenciaModal = true;
    this.transferencias = [];
    this.transferenciasErro = null;
    this.loadingTransferencias = true;

    this.devolucaoTransferenciaApi
      .transferencias(this.carga.numeroCarga)
      .pipe(finalize(() => (this.loadingTransferencias = false)))
      .subscribe({
        next: (itens) => (this.transferencias = itens || []),
        error: (err) => {
          console.error(err);
          this.transferencias = [];
          this.transferenciasErro = this.mensagemErro(err, 'Não foi possível carregar os detalhes da transferência.');
        },
      });
  }

  fecharTransferencias(): void {
    this.showTransferenciaModal = false;
    this.transferencias = [];
    this.transferenciasErro = null;
  }

  // =========================
  // Resumo de desconto (devolução + transferência combinados)
  // =========================
  private carregarResumoDesconto(): void {
    this.resumoDesconto = null;

    if (!this.carga) return;

    // Só vale a pena chamar se há algo relevante pra essa carga —
    // evita uma chamada extra ao WinThor pra cargas sem nenhuma
    // devolução/transferência/bloqueio.
    const relevante =
      this.carga.teveTransferencia ||
      (this.carga.codigosDevolucaoEncontrados?.length || 0) > 0 ||
      this.carga.diminuicaoPesoValorBloqueada;

    if (!relevante) return;

    this.loadingResumoDesconto = true;

    this.devolucaoTransferenciaApi
      .descontoResumo(this.carga.numeroCarga)
      .pipe(finalize(() => (this.loadingResumoDesconto = false)))
      .subscribe({
        next: (resumo) => (this.resumoDesconto = resumo),
        error: (err) => {
          console.error(err);
          this.resumoDesconto = null;
        },
      });
  }

  // =========================
  // Nova Parada
  // =========================
  /**
   * O GET de parada devolve tipoParada já traduzido pro rótulo (ex.: "Parada para
   * Abastecimento"), não o código do enum que o <select> usa (ex.: "ABASTECIMENTO") —
   * ver TipoParada.java (getDescricao()). Pra reabrir o form de edição com o combo
   * certo selecionado, precisamos voltar do rótulo pro código.
   */
  private static readonly TIPO_PARADA_LABEL_TO_CODE: Record<string, string> = {
    'Parada para Abastecimento': 'ABASTECIMENTO',
    'Parada para Dormir': 'PERNOITE',
    'Parada de Almoço/Janta': 'ALIMENTACAO',
    'Outro tipo de parada': 'OUTROS',
  };

  private resolverTipoParadaCode(p: ParadaCargaResponse): string {
    // presença de "abastecimento" é o sinal mais confiável (não depende do texto do rótulo)
    if (p.abastecimento) return 'ABASTECIMENTO';
    const label = p.tipoParada || '';
    return CargaDetalheComponent.TIPO_PARADA_LABEL_TO_CODE[label] || 'OUTROS';
  }

  /** Sem argumento: abre em branco pra cadastrar. Com argumento: abre preenchido pra editar essa parada. */
  abrirNovaParada(paradaExistente?: ParadaCargaResponse): void {
    this.showNovaParadaModal = true;
    this.carregarEixosCaminhao(this.carga?.codigoCaminhao);

    if (paradaExistente) {
      this.paradaEditandoId = paradaExistente.id;

      const ab = paradaExistente.abastecimento;
      const man = paradaExistente.manutencao;

      this.paradaForm = {
        tipoParada: this.resolverTipoParadaCode(paradaExistente),
        dtInicio: this.toDateTimeLocalValue(paradaExistente.dtInicio),
        dtFim: this.toDateTimeLocalValue(paradaExistente.dtFim),
        cidade: paradaExistente.cidade || '',
        local: paradaExistente.local || '',
        kmOdometro: paradaExistente.kmOdometro ?? null,
        observacao: paradaExistente.observacao || '',
        valorDespesa: null,
        descricaoDespesa: '',
        itensTrocadosText: (man?.itensTrocados || []).join(', '),
        abastecimento: {
          qtLitros: ab?.qtLitros ?? null,
          valorLitro: ab?.valorLitro ?? null,
          valorTotal: ab?.valorTotal ?? null,
          mediaKmLitro: ab?.mediaKmLitro ?? null,
          tipoCombustivel: ab?.tipoCombustivel || '',
          formaPagamento: ab?.formaPagamento || '',
          posto: ab?.posto || ab?.postoAbastecimentoNome || '',
          cidade: ab?.cidade || '',
          uf: ab?.uf || '',
          numNotaOuCupom: ab?.numNotaOuCupom || '',
        },
        manutencao: {
          descricao: man?.descricao || '',
          dataInicioManutencao: man?.dataInicioManutencao ? String(man.dataInicioManutencao).slice(0, 10) : '',
          dataFimManutencao: man?.dataFimManutencao ? String(man.dataFimManutencao).slice(0, 10) : '',
          tipoManutencao: man?.tipoManutencao || '',
          itensTrocados: man?.itensTrocados ? [...man.itensTrocados] : [],
          observacoes: man?.observacoes || '',
          valor: man?.valor ?? null,
          statusManutencao: man?.statusManutencao || '',
          oficinaId: '',
          trocasPneu: [],
        },
      };
      return;
    }

    this.paradaEditandoId = null;

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
        mediaKmLitro: null,
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

  private carregarEixosCaminhao(codigoCaminhao?: string | null): void {
    if (!codigoCaminhao) {
      this.eixosCaminhao = [];
      return;
    }

    this.loadingEixos = true;
    this.eixoApi.listarPorCaminhao(codigoCaminhao)
      .pipe(finalize(() => (this.loadingEixos = false)))
      .subscribe({
        next: (res) => {
          this.eixosCaminhao = Array.isArray(res) ? res : (res.content || []);
        },
        error: (err) => {
          this.eixosCaminhao = [];
          this.toast('error', this.mensagemErro(err, 'Não foi possível carregar os eixos cadastrados do caminhão.'), 'Pneus');
        },
      });
  }

  fecharNovaParada(): void {
    this.showNovaParadaModal = false;
    this.paradaEditandoId = null;
  }

  /** Back manda LocalDateTime como "yyyy-MM-ddTHH:mm:ss" (sem timezone) — corta pro formato do <input type="datetime-local">. */
  private toDateTimeLocalValue(v?: string | null): string {
    if (!v) return '';
    return v.length >= 16 ? v.slice(0, 16) : v;
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

  private toNullableNumber(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
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
      const mediaKmLitro = this.toNullableNumber(a.mediaKmLitro);
      if (mediaKmLitro !== null && mediaKmLitro <= 0) erros.push('Média km/L deve ser maior que zero.');
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
        mediaKmLitro: null,
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

  eixoNumero(eixo: EixoCaminhaoResponse): number | null {
    return eixo.eixoNumero ?? eixo.numeroEixo ?? eixo.numero ?? null;
  }

  eixoLabel(eixo: EixoCaminhaoResponse): string {
    const numero = this.eixoNumero(eixo);
    const descricao = String(eixo.descricao || '').trim();
    if (numero == null) return descricao || 'Eixo sem número';
    return descricao ? `Eixo ${numero} - ${descricao}` : `Eixo ${numero}`;
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
          mediaKmLitro: this.toNullableNumber(this.paradaForm.abastecimento.mediaKmLitro),
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

    const editando = !!this.paradaEditandoId;
    const request$ = editando
      ? this.paradaApi.atualizar(this.paradaEditandoId as string, req)
      : this.paradaApi.criar(req);

    request$
      .pipe(finalize(() => (this.savingParada = false)))
      .subscribe({
        next: () => {
          this.showNovaParadaModal = false;
          this.paradaEditandoId = null;
          this.toast('success', editando ? 'Parada atualizada com sucesso.' : 'Parada cadastrada com sucesso.', 'Paradas');
          this.carregarParadas();
        },
        error: (err) => {
          console.error(err);
          this.toast(
            'error',
            this.mensagemErro(err, editando ? 'Não foi possível atualizar a parada.' : 'Não foi possível cadastrar a parada.'),
            'Paradas'
          );
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

  formatKgFromTon(v: number | string | null | undefined, dec = 0): string {
    return formatKgFromTon(v, dec);
  }

  /** Pra valores que já vêm em kg (ex.: ResumoDescontoCargaResponse) — sem converter de tonelada. */
  formatKg(v: number | string | null | undefined, dec = 0): string {
    return parseNumberLike(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
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

  labelStatusTransferencia(status?: string | null): string {
    switch (status) {
      case 'PENDENTE_SYNC':
        return 'Transferência pendente de sincronização';
      case 'CONCLUIDA':
        return 'Transferência concluída';
      default:
        return '';
    }
  }

  transferenciaPendente(): boolean {
    return !!this.carga?.transferenciaPendente || this.carga?.statusTransferencia === 'PENDENTE_SYNC';
  }
}
