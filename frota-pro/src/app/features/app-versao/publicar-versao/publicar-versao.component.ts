import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppVersaoApiService } from '../../../core/api/app-versao-api.service';
import { AppVersaoAtualResponse } from '../../../core/api/app-versao-api.models';
import { ToastService } from '../../../shared/ui/toast/toast.service';

const MAX_VERSAO_NOME = 50;

@Component({
  selector: 'app-publicar-versao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publicar-versao.component.html',
  styleUrls: ['./publicar-versao.component.css'],
})
export class PublicarVersaoComponent implements OnInit {
  versaoAtual?: AppVersaoAtualResponse;
  carregandoAtual = false;

  enviando = false;
  apkSelecionado?: File;

  form = {
    versaoNome: '',
    notas: '',
    obrigatoria: false,
  };

  constructor(
    private appVersaoService: AppVersaoApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.carregarAtual();
  }

  carregarAtual() {
    this.carregandoAtual = true;
    this.appVersaoService.atualPublico().subscribe({
      next: (res) => {
        this.versaoAtual = res;
        this.carregandoAtual = false;
      },
      error: (err) => {
        this.versaoAtual = undefined;
        this.carregandoAtual = false;
        if (err?.status !== 404) {
          console.error('[PublicarVersao] erro ao carregar versão atual', err);
        }
      },
    });
  }

  onArquivoSelecionado(event: Event) {
    const input = event.target as HTMLInputElement;
    this.apkSelecionado = input.files?.[0] ?? undefined;
  }

  publicar() {
    if (!this.apkSelecionado) {
      this.toast.warn('Selecione o arquivo .apk.');
      return;
    }
    if (!this.form.versaoNome.trim()) {
      this.toast.warn('Informe o nome da versão. Ex: 2.4.0');
      return;
    }
    if (this.form.versaoNome.length > MAX_VERSAO_NOME) {
      this.toast.warn(`Nome da versão deve ter no máximo ${MAX_VERSAO_NOME} caracteres.`);
      return;
    }

    this.enviando = true;
    this.appVersaoService
      .publicar(this.apkSelecionado, this.form.versaoNome.trim(), this.form.notas, this.form.obrigatoria)
      .subscribe({
        next: () => {
          this.toast.success('Nova versão publicada com sucesso.');
          this.enviando = false;
          this.resetForm();
          this.carregarAtual();
        },
        error: (err) => {
          console.error('[PublicarVersao] erro ao publicar', err);
          this.toast.error('Erro ao publicar a versão.');
          this.enviando = false;
        },
      });
  }

  private resetForm() {
    this.form = { versaoNome: '', notas: '', obrigatoria: false };
    this.apkSelecionado = undefined;
  }

  formatarTamanho(bytes?: number): string {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }
}
