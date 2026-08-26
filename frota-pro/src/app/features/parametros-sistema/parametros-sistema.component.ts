import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { ParametroSistemaApiService } from '../../core/api/parametro-sistema-api.service';
import { ParametroSistemaResponse, ParametroSistemaUpdateRequest } from '../../core/api/parametro-sistema-api.models';
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
  };

  constructor(
    private api: ParametroSistemaApiService,
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
          };
        },
        error: (err) => (this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os parâmetros.')),
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
