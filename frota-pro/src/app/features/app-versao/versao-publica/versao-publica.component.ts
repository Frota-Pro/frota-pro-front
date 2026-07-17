import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppVersaoApiService } from '../../../core/api/app-versao-api.service';
import { AppVersaoAtualResponse } from '../../../core/api/app-versao-api.models';

type Estado = 'carregando' | 'ok' | 'sem-versao' | 'erro';

@Component({
  selector: 'app-versao-publica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './versao-publica.component.html',
  styleUrls: ['./versao-publica.component.css'],
})
export class VersaoPublicaComponent implements OnInit {
  estado: Estado = 'carregando';
  versao?: AppVersaoAtualResponse;
  urlDownload: string;
  readonly anoAtual = new Date().getFullYear();

  constructor(private appVersaoService: AppVersaoApiService) {
    this.urlDownload = this.appVersaoService.urlDownloadPublico;
  }

  ngOnInit(): void {
    this.appVersaoService.atualPublico().subscribe({
      next: (res) => {
        this.versao = res;
        this.urlDownload = res.urlDownload || this.urlDownload;
        this.estado = 'ok';
      },
      error: (err) => {
        this.estado = err?.status === 404 ? 'sem-versao' : 'erro';
      },
    });
  }

  formatarTamanho(bytes?: number): string {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }
}
