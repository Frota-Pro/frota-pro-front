import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ManutencaoApiService } from '../../../core/api/manutencao-api.service';
import { ManutencaoRequest, ManutencaoResponse } from '../../../core/api/manutencao-api.models';
import { DocumentoManutencaoApiService } from '../../../core/api/documento-manutencao-api.service';
import { DocumentoManutencaoResponse, TipoDocumentoManutencao } from '../../../core/api/documento-manutencao-api.models';
import { ToastService } from '../../../shared/ui/toast/toast.service';

const MAX_CODIGO = 50;

@Component({
  selector: 'app-manutencao-detalhe',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manutencao-detalhe.component.html',
  styleUrls: ['./manutencao-detalhe.component.css'],
})
export class ManutencaoDetalheComponent implements OnInit {

  codigo = '';
  loading = false;
  erro: string | null = null;

  manutencao: ManutencaoResponse | null = null;

  // docs
  docsLoading = false;
  docs: DocumentoManutencaoResponse[] = [];
  tipoDoc: TipoDocumentoManutencao = 'OUTRO';
  obsDoc = '';
  fileDoc: File | null = null;

  // preview
  showPreview = false;
  previewUrl: string | null = null;
  previewName: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: ManutencaoApiService,
    private docApi: DocumentoManutencaoApiService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.codigo = this.route.snapshot.paramMap.get('codigo') || '';
    if (!this.codigo) {
      this.toast.error('Código da manutenção é obrigatório.');
      return;
    }
    if (this.codigo.length > MAX_CODIGO) {
      this.toast.error(`Código da manutenção deve ter no máximo ${MAX_CODIGO} caracteres.`);
      return;
    }
    this.carregar();
    this.carregarDocs();
  }

  carregar(): void {
    if (!this.codigo || this.codigo.length > MAX_CODIGO) {
      this.toast.error('Código da manutenção inválido.');
      return;
    }
    this.loading = true;
    this.erro = null;

    this.api.buscarPorCodigo(this.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (m) => this.manutencao = m,
        error: (err) => this.erro = err?.error?.message || 'Erro ao carregar manutenção.',
      });
  }

  carregarDocs(): void {
    if (!this.codigo || this.codigo.length > MAX_CODIGO) {
      this.toast.error('Código da manutenção inválido.');
      return;
    }
    this.docsLoading = true;
    this.docApi.listar(this.codigo, { page: 0, size: 50, sort: 'criadoEm,desc' })
      .pipe(finalize(() => (this.docsLoading = false)))
      .subscribe({
        next: (res) => this.docs = res.content || [],
        error: () => this.docs = [],
      });
  }

  onFileChange(ev: any): void {
    const f = ev?.target?.files?.[0];
    this.fileDoc = f || null;
  }

  uploadDoc(): void {
    if (!this.fileDoc) {
      this.toast.warn('Selecione um arquivo.');
      return;
    }

    this.docsLoading = true;
    this.docApi.upload(this.codigo, this.fileDoc, this.tipoDoc, this.obsDoc)
      .pipe(finalize(() => (this.docsLoading = false)))
      .subscribe({
        next: () => {
          this.fileDoc = null;
          this.obsDoc = '';
          this.tipoDoc = 'OUTRO';
          this.carregarDocs();
        },
        error: (err) => this.toast.error(err?.error?.message || 'Erro ao enviar documento.'),
      });
  }

  async preview(doc: DocumentoManutencaoResponse): Promise<void> {
    const arquivoId = doc?.arquivo?.id;
    if (!arquivoId) return;

    this.docApi.previewBlob(arquivoId).subscribe({
      next: (blob) => {
        if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
        this.previewUrl = URL.createObjectURL(blob);
        this.previewName = doc.arquivo?.nomeOriginal || 'arquivo';
        this.showPreview = true;
      },
      error: () => this.toast.error('Erro ao abrir preview.'),
    });
  }

  download(doc: DocumentoManutencaoResponse): void {
    const arquivoId = doc?.arquivo?.id;
    if (!arquivoId) return;

    this.docApi.downloadBlob(arquivoId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.arquivo?.nomeOriginal || 'download';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('Erro ao baixar arquivo.'),
    });
  }

  closePreview(): void {
    this.showPreview = false;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
    this.previewName = null;
  }

  formatMoneyBRL(v?: number | null): string {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return 'R$ 0,00';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
