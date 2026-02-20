import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { CaminhaoApiService } from '../../../core/api/caminhao-api.service';
import { CategoriaCaminhaoApiService } from '../../../core/api/categoria-caminhao-api.service';
import { CaminhaoDetalheResponse, CaminhaoRequest } from '../../../core/api/caminhao-api.models';
import { CategoriaCaminhaoResponse } from '../../../core/api/categoria-caminhao-api.models';

import { MetaResponse } from '../../../core/api/meta-api.models';

import { CargaApiService } from '../../../core/api/carga-api.service';
import { CargaResponse } from '../../../core/api/carga-api.models';

import { AbastecimentoApiService } from '../../../core/api/abastecimento-api.service';
import { AbastecimentoResponse } from '../../../core/api/abastecimento-api.models';

import { ManutencaoApiService } from '../../../core/api/manutencao-api.service';
import { ManutencaoResponse } from '../../../core/api/manutencao-api.models';

import { DocumentoCaminhaoApiService } from '../../../core/api/documento-caminhao-api.service';
import {
  DocumentoCaminhaoResponse,
  TipoDocumentoCaminhao,
} from '../../../core/api/documento-caminhao-api.models';

type TabKey = 'cargas' | 'abastecimentos' | 'os';

@Component({
  selector: 'app-caminhao-detalhe',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './caminhao-detalhe.component.html',
  styleUrls: ['./caminhao-detalhe.component.css'],
})
export class CaminhaoDetalheComponent implements OnInit {
  codigo!: string;

  loading = false;
  errorMsg: string | null = null;

  data: CaminhaoDetalheResponse | null = null;
  tab: TabKey = 'cargas';

  // Meta ativa (consumo)
  meta: MetaResponse | null = null;

  // Histórico real
  cargasLoading = false;
  cargas: CargaResponse[] = [];

  abLoading = false;
  abastecimentos: AbastecimentoResponse[] = [];

  osLoading = false;
  manutencoes: ManutencaoResponse[] = [];

  // Categorias + Modal edição
  categorias: CategoriaCaminhaoResponse[] = [];
  showEditModal = false;

  editForm: CaminhaoRequest = {
    descricao: '',
    modelo: '',
    marca: '',
    placa: '',
    categoria: null,
    dtLicenciamento: null,
    codigoExterno: null,
    cor: null,
    antt: null,
    renavan: null,
    chassi: null,
    tara: null,
    maxPeso: null,
  };

  // Documentação
  docsLoading = false;
  docsError: string | null = null;
  docs: DocumentoCaminhaoResponse[] = [];

  uploading = false;
  selectedFile: File | null = null;

  tipoDocumento: TipoDocumentoCaminhao = 'CRLV';
  observacao = '';

  tiposAnexo: Array<{ value: TipoDocumentoCaminhao; label: string }> = [
    { value: 'CRLV', label: 'CRLV' },
    { value: 'CONTRATO_SEGURO', label: 'Contrato do Seguro' },
    { value: 'VISTORIA', label: 'Documento da vistoria' },
    { value: 'FOTO_FRENTE', label: 'Frente Caminhão' },
    { value: 'FOTO_LATERAL', label: 'Lateral Caminhão' },
    { value: 'FOTO_CHASSI', label: 'Chassi do caminhão' },
    { value: 'OUTRO', label: 'Outros' },
  ];

  // Preview modal
  showPreview = false;
  previewDoc: DocumentoCaminhaoResponse | null = null;

  // Para IMG (string ok)
  previewUrl: string | null = null;

  // Para IFRAME (SafeResourceUrl)
  previewSafeUrl: SafeResourceUrl | null = null;

  // URLs blob temporárias (revogar para não vazar memória)
  private previewObjectUrl: string | null = null;
  private downloadObjectUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: CaminhaoApiService,
    private categoriaApi: CategoriaCaminhaoApiService,
    private cargaApi: CargaApiService,
    private abastecimentoApi: AbastecimentoApiService,
    private manutencaoApi: ManutencaoApiService,
    private documentoApi: DocumentoCaminhaoApiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.codigo = String(this.route.snapshot.paramMap.get('codigo') || '');
    if (!this.codigo) {
      this.router.navigate(['/dashboard/caminhoes']);
      return;
    }

    this.carregarCategorias();
    this.carregarBase();
    this.carregarTab();
  }

  // ------------------ BASE ------------------
  carregarBase(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api
      .detalhes(this.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.data = res;
          this.meta = this.getMetaConsumo(res.metasAtivas || []);
          this.carregarDocumentos();
        },
        error: (err) => {
          console.error(err);
          this.data = null;
          this.errorMsg = 'Não foi possível carregar o detalhamento do caminhão.';
        },
      });
  }

  carregarCategorias(): void {
    this.categoriaApi.listarTodas().subscribe({
      next: (p) => (this.categorias = (p.content || []).filter((c) => c.ativo !== false)),
      error: () => (this.categorias = []),
    });
  }

  voltar(): void {
    this.router.navigate(['/dashboard/caminhoes']);
  }

  metaPercent(): number {
    if (!this.meta) return 0;
    const meta = Number(this.meta.valorMeta || 0);
    const real = Number(this.meta.valorRealizado || 0);
    if (meta <= 0) return 0;
    const p = (real / meta) * 100;
    return Math.max(0, Math.min(100, p));
  }

  private getMetaConsumo(list: MetaResponse[]): MetaResponse | null {
    if (!list || list.length === 0) return null;
    const found = list.find((m) => (m.tipoMeta || '').toUpperCase() === 'CONSUMO_COMBUSTIVEL');
    return found || null;
  }

  // ------------------ TABS ------------------
  setTab(t: TabKey) {
    this.tab = t;
    this.carregarTab();
  }

  carregarTab(): void {
    if (this.tab === 'cargas') this.carregarCargas();
    if (this.tab === 'abastecimentos') this.carregarAbastecimentos();
    if (this.tab === 'os') this.carregarManutencoes();
  }

  carregarCargas(): void {
    this.cargasLoading = true;
    this.cargaApi
      .listarPorCaminhao(this.codigo, { page: 0, size: 10, sort: 'dtSaida,desc' })
      .pipe(finalize(() => (this.cargasLoading = false)))
      .subscribe({
        next: (p) => (this.cargas = p.content || []),
        error: () => (this.cargas = []),
      });
  }

  carregarAbastecimentos(): void {
    this.abLoading = true;
    this.abastecimentoApi
      .listarPorCaminhao(this.codigo, { page: 0, size: 10, sort: 'dtAbastecimento,desc' })
      .pipe(finalize(() => (this.abLoading = false)))
      .subscribe({
        next: (p) => (this.abastecimentos = p.content || []),
        error: () => (this.abastecimentos = []),
      });
  }

  carregarManutencoes(): void {
    this.osLoading = true;
    this.manutencaoApi
      .listarPorCaminhao(this.codigo, { page: 0, size: 10, sort: 'dataInicioManutencao,desc' })
      .pipe(finalize(() => (this.osLoading = false)))
      .subscribe({
        next: (p) => (this.manutencoes = p.content || []),
        error: () => (this.manutencoes = []),
      });
  }

  // ------------------ EDITAR ------------------
  editar(): void {
    if (!this.data) return;

    const c = this.data.caminhao;

    this.editForm = {
      codigoExterno: c.codigoExterno || null,
      descricao: c.descricao || '',
      modelo: c.modelo || '',
      marca: c.marca || '',
      placa: c.placa || '',
      cor: c.cor || null,
      antt: c.antt || null,
      renavan: c.renavan || null,
      chassi: c.chassi || null,
      tara: c.tara ?? null,
      maxPeso: c.maxPeso ?? null,
      categoria: c.categoriaCodigo || null,
      dtLicenciamento: c.dtLicenciamento || null,
    };

    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
  }

  salvarEdicao(): void {
    if (!this.editForm.descricao?.trim()) return alert('Informe a descrição.');
    if (!this.editForm.modelo?.trim()) return alert('Informe o modelo.');
    if (!this.editForm.marca?.trim()) return alert('Informe a marca.');
    if (!this.editForm.placa?.trim()) return alert('Informe a placa.');

    this.loading = true;

    this.api
      .atualizar(this.codigo, this.editForm)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.showEditModal = false;
          this.carregarBase();
        },
        error: (err) => {
          console.error(err);
          alert('Não foi possível salvar as alterações.');
        },
      });
  }

  // ------------------ DOCUMENTAÇÃO ------------------
  private getCaminhaoIdParaDocumentos(): string {
    return this.codigo;
  }

  private getArquivoId(doc: DocumentoCaminhaoResponse): string {
    const d: any = doc as any;
    return d.arquivoId || d.idArquivo || d.arquivo?.id || d.arquivo?.uuid || d.id;
  }

  carregarDocumentos(): void {
    const caminhaoId = this.getCaminhaoIdParaDocumentos();

    this.docsLoading = true;
    this.docsError = null;

    this.documentoApi
      .listar(caminhaoId, { page: 0, size: 50, sort: 'criadoEm,desc' })
      .pipe(finalize(() => (this.docsLoading = false)))
      .subscribe({
        next: (p) => (this.docs = p.content || []),
        error: (err) => {
          console.error(err);
          this.docs = [];
          this.docsError = 'Não foi possível carregar os documentos.';
        },
      });
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.selectedFile = file;
  }

  uploadDocumento(): void {
    const caminhaoId = this.getCaminhaoIdParaDocumentos();

    if (!this.selectedFile) {
      alert('Selecione um arquivo.');
      return;
    }

    this.uploading = true;

    this.documentoApi
      .upload(caminhaoId, this.selectedFile, this.tipoDocumento, this.observacao)
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe({
        next: () => {
          this.selectedFile = null;
          this.observacao = '';
          this.tipoDocumento = 'CRLV';
          this.carregarDocumentos();
        },
        error: (err) => {
          console.error(err);
          alert('Não foi possível enviar o documento.');
        },
      });
  }

  // ------------------ PREVIEW/DOWNLOAD (BLOB) ------------------
  openPreview(doc: DocumentoCaminhaoResponse): void {
    this.previewDoc = doc;

    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }

    this.previewUrl = null;
    this.previewSafeUrl = null;

    const arquivoId = this.getArquivoId(doc);

    this.documentoApi.previewBlob(arquivoId).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.previewObjectUrl = objectUrl;

        this.previewUrl = objectUrl;
        this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);

        this.showPreview = true;
      },
      error: (err) => {
        console.error(err);
        this.previewUrl = null;
        this.previewSafeUrl = null;
        this.showPreview = true;
      },
    });
  }

  closePreview(): void {
    this.showPreview = false;
    this.previewDoc = null;
    this.previewUrl = null;
    this.previewSafeUrl = null;

    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }

  download(doc: DocumentoCaminhaoResponse): void {
    const arquivoId = this.getArquivoId(doc);

    this.documentoApi.downloadBlob(arquivoId).subscribe({
      next: (blob) => {
        if (this.downloadObjectUrl) {
          URL.revokeObjectURL(this.downloadObjectUrl);
          this.downloadObjectUrl = null;
        }

        const url = URL.createObjectURL(blob);
        this.downloadObjectUrl = url;

        const d: any = doc as any;
        const filename = d.arquivo?.nomeOriginal || d.nomeArquivo || 'arquivo';

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
        this.downloadObjectUrl = null;
      },
      error: (err) => {
        console.error(err);
        alert('Não foi possível baixar o arquivo.');
      },
    });
  }

  // ------------------ HELPERS ------------------
  isImage(doc: DocumentoCaminhaoResponse): boolean {
    const d: any = doc as any;
    const ct = (d.arquivo?.contentType || d.contentType || '').toLowerCase();
    return ct.startsWith('image/');
  }

  tipoAnexoLabel(v?: TipoDocumentoCaminhao | string | null): string {
    if (!v) return '—';
    const found = this.tiposAnexo.find((x) => x.value === v);
    return found?.label || String(v);
  }

  formatBytes(bytes?: number | null): string {
    const b = Number(bytes || 0);
    if (!b) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let v = b;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  formatBRL(v: number | null | undefined): string {
    const n = Number(v || 0);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatNumber(v: number | null | undefined, dec = 0): string {
    const n = Number(v || 0);
    return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  formatDateTimeBr(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('pt-BR');
  }

  statusLabel(s: string | null | undefined): string {
    const v = (s || '').toUpperCase();
    if (v === 'DISPONIVEL') return 'DISPONÍVEL';
    if (v === 'EM_ROTA') return 'EM ROTA';
    if (v === 'SINCRONIZADA') return 'SINCRONIZADA';
    if (v === 'FINALIZADA') return 'FINALIZADA';
    return s || '—';
  }
}
