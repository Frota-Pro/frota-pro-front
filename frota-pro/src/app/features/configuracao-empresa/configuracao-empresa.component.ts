import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { ConfiguracaoEmpresaApiService } from '../../core/api/configuracao-empresa-api.service';
import { ConfiguracaoEmpresaResponse, ConfiguracaoEmpresaUpdateRequest } from '../../core/api/configuracao-empresa-api.models';
import { ToastService } from '../../shared/ui/toast/toast.service';

const ASSUNTO_PADRAO = 'Nota fiscal {numeroNota} - FrotaPRO';
const CORPO_PADRAO = '<p>Segue em anexo o XML e o DANFE (PDF) da nota fiscal {numeroNota}.</p>';

@Component({
  selector: 'app-configuracao-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracao-empresa.component.html',
  styleUrls: ['./configuracao-empresa.component.css'],
})
export class ConfiguracaoEmpresaComponent implements OnInit {

  loading = false;
  saving = false;
  uploadingLogo = false;
  errorMsg: string | null = null;

  config: ConfiguracaoEmpresaResponse | null = null;

  form: ConfiguracaoEmpresaUpdateRequest = {
    nomeEmpresa: '',
    emailRemetente: '',
    emailAssunto: '',
    emailCorpoHtml: '',
  };

  logoFile: File | null = null;

  constructor(
    private api: ConfiguracaoEmpresaApiService,
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
        next: (res) => {
          this.config = res;
          this.form = {
            nomeEmpresa: res.nomeEmpresa || '',
            emailRemetente: res.emailRemetente || '',
            emailAssunto: res.emailAssunto || '',
            emailCorpoHtml: res.emailCorpoHtml || '',
          };
        },
        error: (err) => (this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar as configurações.')),
      });
  }

  usarAssuntoPadrao(): void {
    this.form.emailAssunto = ASSUNTO_PADRAO;
  }

  usarCorpoPadrao(): void {
    this.form.emailCorpoHtml = CORPO_PADRAO;
  }

  salvar(): void {
    this.saving = true;

    const payload: ConfiguracaoEmpresaUpdateRequest = {
      nomeEmpresa: (this.form.nomeEmpresa || '').trim() || null,
      emailRemetente: (this.form.emailRemetente || '').trim() || null,
      emailAssunto: (this.form.emailAssunto || '').trim() || null,
      emailCorpoHtml: this.form.emailCorpoHtml || null,
    };

    this.api.atualizar(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (res) => {
          this.config = res;
          this.toast.success('Configurações salvas com sucesso.');
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível salvar as configurações.')),
      });
  }

  onLogoSelecionada(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.logoFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  enviarLogo(): void {
    if (!this.logoFile) {
      this.toast.warn('Selecione uma imagem para enviar.');
      return;
    }

    this.uploadingLogo = true;

    this.api.atualizarLogo(this.logoFile)
      .pipe(finalize(() => (this.uploadingLogo = false)))
      .subscribe({
        next: (res) => {
          this.config = res;
          this.logoFile = null;
          this.toast.success('Logo atualizada com sucesso.');
        },
        error: (err) => this.toast.error(extrairMensagemErro(err, 'Não foi possível enviar a logo.')),
      });
  }
}
