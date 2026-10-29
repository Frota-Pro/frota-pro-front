import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { ParametroSistemaApiService } from '../../core/api/parametro-sistema-api.service';
import { ParametroSistemaResponse, ParametroSistemaUpdateRequest } from '../../core/api/parametro-sistema-api.models';
import { ToastService } from '../../shared/ui/toast/toast.service';

type AbaId = 'metas' | 'avisos' | 'seguranca' | 'winthor' | 'cargas' | 'auditoria';

interface Aba { id: AbaId; rotulo: string; icone: string; }

/** Cada cartão da tela: em que aba fica e as palavras (além do título) que a busca encontra. */
interface Cartao { id: string; aba: AbaId; titulo: string; busca: string; }

const CHAVE_ABA = 'parametros-sistema:aba';

function normalizar(texto: string): string {
  return (texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

@Component({
  selector: 'app-parametros-sistema',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametros-sistema.component.html',
  styleUrls: ['./parametros-sistema.component.css'],
})
export class ParametrosSistemaComponent implements OnInit {

  loading = false;
  saving = false;
  errorMsg: string | null = null;

  readonly abas: Aba[] = [
    { id: 'metas', rotulo: 'Metas', icone: 'fa-bullseye' },
    { id: 'avisos', rotulo: 'Avisos e alertas', icone: 'fa-bell' },
    { id: 'seguranca', rotulo: 'Segurança de acesso', icone: 'fa-shield-alt' },
    { id: 'winthor', rotulo: 'Sincronização WinThor', icone: 'fa-sync-alt' },
    { id: 'cargas', rotulo: 'Cargas', icone: 'fa-truck' },
    { id: 'auditoria', rotulo: 'Auditoria', icone: 'fa-clipboard-list' },
  ];

  private readonly cartoes: Cartao[] = [
    { id: 'meta-fechamento', aba: 'metas', titulo: 'Fechamento da meta mensal',
      busca: 'dias uteis fechar meta mes motorista confirmar competencia' },
    { id: 'aviso-vencimentos', aba: 'avisos', titulo: 'Vencimentos e manutenção',
      busca: 'antecedencia vencimento documento cnh caminhao km manutencao preventiva parada estagnada aviso' },
    { id: 'aviso-multas', aba: 'avisos', titulo: 'Multas', busca: 'prazo pagamento recurso multa antecedencia aviso' },
    { id: 'aviso-abastecimento', aba: 'avisos', titulo: 'Abastecimento: preço fora do padrão',
      busca: 'abastecimento preco litro combustivel anomalo suspeito media posto percentual' },
    { id: 'seguranca-acesso', aba: 'seguranca', titulo: 'Senha padrão e celular do motorista',
      busca: 'senha padrao padrao123 bloquear login celular aparelho vincular dispositivo motorista app seguranca' },
    { id: 'winthor-devolucao', aba: 'winthor', titulo: 'Devolução',
      busca: 'devolucao peso valor carga diminuicao motivo codigo coddevol winthor sincronizacao' },
    { id: 'winthor-transferencia', aba: 'winthor', titulo: 'Transferência',
      busca: 'transferencia pedido carregamento peso valor winthor sincronizacao' },
    { id: 'carga-tempo-minimo', aba: 'cargas', titulo: 'Tempo mínimo de entrega',
      busca: 'tempo minimo entrega finalizar carga rapido minutos iniciar' },
    { id: 'auditoria-retencao', aba: 'auditoria', titulo: 'Retenção da trilha de auditoria',
      busca: 'auditoria retencao dias registros log apagar' },
  ];

  aba: AbaId = 'metas';
  busca = '';

  /** Foto do formulário como está salva: serve pra saber se há alteração pendente. */
  private original = '';

  get buscando(): boolean {
    return this.busca.trim().length > 0;
  }

  get alterado(): boolean {
    return JSON.stringify(this.form) !== this.original;
  }

  /** O cartão aparece? Sem busca: só os da aba aberta. Com busca: todos que combinam, de qualquer aba. */
  vis(id: string): boolean {
    const cartao = this.cartoes.find(c => c.id === id);
    if (!cartao) return false;
    return this.buscando ? this.combina(cartao) : cartao.aba === this.aba;
  }

  contagem(aba: AbaId): number {
    return this.cartoes.filter(c => c.aba === aba && this.combina(c)).length;
  }

  totalResultados(): number {
    return this.cartoes.filter(c => this.combina(c)).length;
  }

  irParaAba(aba: AbaId): void {
    this.busca = '';
    this.aba = aba;
    try { localStorage.setItem(CHAVE_ABA, aba); } catch { /* sem armazenamento: só não lembra a aba */ }
  }

  descartar(): void {
    if (!this.original) return;
    this.form = JSON.parse(this.original);
  }

  private combina(cartao: Cartao): boolean {
    const termos = normalizar(this.busca).split(/\s+/).filter(Boolean);
    const alvo = normalizar(`${cartao.titulo} ${cartao.busca}`);
    return termos.every(termo => alvo.includes(termo));
  }

  form: ParametroSistemaUpdateRequest = {
    diasUteisFechamentoMeta: 0,
    diasAntecedenciaVencimentoDocumento: 5,
    kmAntecedenciaManutencaoPreventiva: 500,
    diasManutencaoEstagnada: 7,
    diasAntecedenciaPrazoMulta: 5,
    validarMotivoAlteracaoPesoValorCarga: false,
    codigosDevolucaoPermitidos: '',
    permitirAtualizacaoPorTransferencia: true,
    validarTempoMinimoCarga: false,
    tempoMinimoEntregaPadraoMinutos: 30,
    diasRetencaoAuditoria: 180,
    percentualLimiteAnomaliaAbastecimento: 25,
    bloquearSenhaPadrao: false,
    vincularDispositivo: false,
  };

  constructor(
    private api: ParametroSistemaApiService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    try {
      const salva = localStorage.getItem(CHAVE_ABA) as AbaId | null;
      if (salva && this.abas.some(a => a.id === salva)) this.aba = salva;
    } catch { /* sem armazenamento: começa em Metas */ }
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api.buscar()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: ParametroSistemaResponse) => {
          this.form = {
            diasUteisFechamentoMeta: res.diasUteisFechamentoMeta ?? 0,
            diasAntecedenciaVencimentoDocumento: res.diasAntecedenciaVencimentoDocumento,
            kmAntecedenciaManutencaoPreventiva: res.kmAntecedenciaManutencaoPreventiva,
            diasManutencaoEstagnada: res.diasManutencaoEstagnada,
            diasAntecedenciaPrazoMulta: res.diasAntecedenciaPrazoMulta,
            validarMotivoAlteracaoPesoValorCarga: res.validarMotivoAlteracaoPesoValorCarga,
            codigosDevolucaoPermitidos: res.codigosDevolucaoPermitidos ?? '',
            permitirAtualizacaoPorTransferencia: res.permitirAtualizacaoPorTransferencia,
            validarTempoMinimoCarga: res.validarTempoMinimoCarga,
            tempoMinimoEntregaPadraoMinutos: res.tempoMinimoEntregaPadraoMinutos,
            diasRetencaoAuditoria: res.diasRetencaoAuditoria,
            percentualLimiteAnomaliaAbastecimento: res.percentualLimiteAnomaliaAbastecimento,
            bloquearSenhaPadrao: res.bloquearSenhaPadrao ?? false,
            vincularDispositivo: res.vincularDispositivo ?? false,
          };
          this.original = JSON.stringify(this.form);
        },
        error: (err) => (this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os parâmetros.')),
      });
  }

  salvar(): void {
    this.saving = true;

    this.api.atualizar(this.form)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.original = JSON.stringify(this.form);
          this.toast.success('Parâmetros salvos com sucesso.');
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível salvar os parâmetros.')),
      });
  }
}
