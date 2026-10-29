import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { ParametroSistemaApiService } from '../../core/api/parametro-sistema-api.service';
import { ParametroSistemaResponse, ParametroSistemaUpdateRequest } from '../../core/api/parametro-sistema-api.models';
import { RotaApiService } from '../../core/api/rota-api.service';
import { UnificarRotasResponse } from '../../core/api/rota-api.models';
import { ToastService } from '../../shared/ui/toast/toast.service';

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

  form: ParametroSistemaUpdateRequest = {
    diasUteisFechamentoMeta: 0,
    diasAntecedenciaVencimentoDocumento: 5,
    kmAntecedenciaManutencaoPreventiva: 500,
    diasManutencaoEstagnada: 7,
    diasAntecedenciaPrazoMulta: 5,
    validarMotivoAlteracaoPesoValorCarga: false,
    codigosDevolucaoPermitidos: '',
    sufixosRotaIgnorados: 'FRIOS',
    permitirAtualizacaoPorTransferencia: true,
    validarTempoMinimoCarga: false,
    tempoMinimoEntregaPadraoMinutos: 30,
    diasRetencaoAuditoria: 180,
    percentualLimiteAnomaliaAbastecimento: 25,
  };

  constructor(
    private api: ParametroSistemaApiService,
    private rotaApi: RotaApiService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
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
            sufixosRotaIgnorados: res.sufixosRotaIgnorados ?? '',
            permitirAtualizacaoPorTransferencia: res.permitirAtualizacaoPorTransferencia,
            validarTempoMinimoCarga: res.validarTempoMinimoCarga,
            tempoMinimoEntregaPadraoMinutos: res.tempoMinimoEntregaPadraoMinutos,
            diasRetencaoAuditoria: res.diasRetencaoAuditoria,
            percentualLimiteAnomaliaAbastecimento: res.percentualLimiteAnomaliaAbastecimento,
          };
        },
        error: (err) => (this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os parâmetros.')),
      });
  }

  // Unificar rotas repetidas: o backend usa o valor SALVO de "sufixos ignorados". Primeiro simula,
  // mostra o que vai acontecer e só junta de verdade quando o admin confirma.
  unificando = false;
  simulacaoRotas: UnificarRotasResponse | null = null;

  simularUnificacaoRotas(): void {
    this.unificando = true;
    this.simulacaoRotas = null;

    this.rotaApi.unificarRepetidas(true)
      .pipe(finalize(() => (this.unificando = false)))
      .subscribe({
        next: (res) => {
          this.simulacaoRotas = res;
          if (res.grupos.length === 0) this.toast.success('Nenhuma rota repetida encontrada.');
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível simular a unificação.')),
      });
  }

  confirmarUnificacaoRotas(): void {
    this.unificando = true;

    this.rotaApi.unificarRepetidas(false)
      .pipe(finalize(() => (this.unificando = false)))
      .subscribe({
        next: (res) => {
          this.simulacaoRotas = null;
          this.toast.success(`${res.rotasRemovidas} rota(s) unificada(s); ${res.cargasMovidas} carga(s) movida(s).`);
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível unificar as rotas.')),
      });
  }

  salvar(): void {
    this.saving = true;

    this.api.atualizar(this.form)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => this.toast.success('Parâmetros salvos com sucesso.'),
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível salvar os parâmetros.')),
      });
  }
}
