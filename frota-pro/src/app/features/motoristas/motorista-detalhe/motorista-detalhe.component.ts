import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { MotoristaApiService } from '../../../core/api/motorista-api.service';
import { MotoristaRequest, MotoristaResponse, RelatorioMetaMensalMotoristaResponse } from '../../../core/api/motorista-api.models';
import { CargaApiService } from '../../../core/api/carga-api.service';
import { CargaResponse } from '../../../core/api/carga-api.models';

import { DocumentoMotoristaApiService } from '../../../core/api/documento-motorista-api.service';
import { DocumentoMotoristaResponse, TipoDocumentoMotorista } from '../../../core/api/documento-motorista-api.models';

type TabKey = 'cargas' | 'meta' | 'docs';

@Component({
  selector: 'app-motorista-detalhe',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './motorista-detalhe.component.html',
  styleUrls: ['./motorista-detalhe.component.css'],
})
export class MotoristaDetalheComponent implements OnInit {
  codigo!: string;

  loading = false;
  errorMsg: string | null = null;

  motorista: MotoristaResponse | null = null;

  tab: TabKey = 'cargas';

  // cargas
  cargasLoading = false;
  cargas: CargaResponse[] = [];
  totalCargas = 0;
  cargasFinalizadas = 0;

  // meta mensal
  metaLoading = false;
  meta: RelatorioMetaMensalMotoristaResponse | null = null;

  // edição
  showEditModal = false;
  editForm: MotoristaRequest = {
    codigoExterno: null,
    nome: '',
    email: '',
    dataNascimento: null,
    cnh: '',
    validadeCnh: null,
  };

  // documentos
  docsLoading = false;
  docsError: string | null = null;
  docs: DocumentoMotoristaResponse[] = [];

  uploading = false;
  selectedFile: File | null = null;

  tipoDocumento: TipoDocumentoMotorista = 'CNH';
  observacao = '';

  tiposAnexo: Array<{ value: TipoDocumentoMotorista; label: string }> = [
    { value: 'CNH', label: 'CNH' },
    { value: 'RG', label: 'RG' },
    { value: 'CPF', label: 'CPF' },
    { value: 'COMPROVANTE_RESIDENCIA', label: 'Comprovante de residência' },
    { value: 'ASO', label: 'ASO (Atestado Saúde Ocupacional)' },
    { value: 'FOTO', label: 'Foto' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  // preview modal
  showPreview = false;
  previewDoc: DocumentoMotoristaResponse | null = null;
  previewUrl: string | null = null;
  previewSafeUrl: SafeResourceUrl | null = null;

  private previewObjectUrl: string | null = null;
  private downloadObjectUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: MotoristaApiService,
    private cargaApi: CargaApiService,
    private documentoApi: DocumentoMotoristaApiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.codigo = String(this.route.snapshot.paramMap.get('codigo') || '');
    if (!this.codigo) {
      this.router.navigate(['/dashboard/motoristas']);
      return;
    }

    this.carregarMotorista();
  }

  voltar(): void {
    this.router.navigate(['/dashboard/motoristas']);
  }

  setTab(t: TabKey) {
    this.tab = t;
    if (t === 'cargas') this.carregarCargas();
    if (t === 'meta') this.carregarMetaMensalAtual();
    if (t === 'docs') this.carregarDocumentos();
  }

  // ---------------- BASE ----------------
  carregarMotorista(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api.buscarPorCodigo(this.codigo)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (m) => {
          this.motorista = m;
          this.carregarCargas(); // default
        },
        error: (err) => {
          console.error(err);
          this.motorista = null;
          this.errorMsg = 'Não foi possível carregar o motorista.';
        }
      });
  }

  // ---------------- CARGAS ----------------
  carregarCargas(): void {
    if (!this.motorista) return;

    this.cargasLoading = true;

    this.cargaApi.listarPorMotorista(this.motorista.codigo, { page: 0, size: 10, sort: 'dtSaida,desc' })
      .pipe(finalize(() => (this.cargasLoading = false)))
      .subscribe({
        next: (p) => {
          this.cargas = p.content || [];
          this.totalCargas = p.totalElements || 0;
          this.cargasFinalizadas = (this.cargas || []).filter(c => String((c as any).statusCarga || '').toUpperCase() === 'FINALIZADA').length;
        },
        error: () => {
          this.cargas = [];
          this.totalCargas = 0;
          this.cargasFinalizadas = 0;
        }
      });
  }

  // ---------------- META MENSAL ----------------
  private firstDayOfMonthYYYYMMDD(d = new Date()): string {
    const dt = new Date(d.getFullYear(), d.getMonth(), 1);
    return this.toYYYYMMDD(dt);
  }

  private lastDayOfMonthYYYYMMDD(d = new Date()): string {
    const dt = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return this.toYYYYMMDD(dt);
  }

  private toYYYYMMDD(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  carregarMetaMensalAtual(): void {
    if (!this.motorista) return;

    const inicio = this.firstDayOfMonthYYYYMMDD();
    const fim = this.lastDayOfMonthYYYYMMDD();

    this.metaLoading = true;
    this.api.metaMensal(this.motorista.codigo, inicio, fim)
      .pipe(finalize(() => (this.metaLoading = false)))
      .subscribe({
        next: (r) => (this.meta = r),
        error: () => (this.meta = null),
      });
  }

  // ---------------- EDITAR ----------------
  editar(): void {
    if (!this.motorista) return;

    this.editForm = {
      codigoExterno: this.motorista.codigoExterno || null,
      nome: this.motorista.nome || '',
      email: this.motorista.email || '',
      dataNascimento: this.motorista.dataNascimento || null,
      cnh: this.motorista.cnh || '',
      validadeCnh: this.motorista.validadeCnh || null,
    };

    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
  }

  salvarEdicao(): void {
    if (!this.motorista) return;

    if (!this.editForm.nome?.trim()) return alert('Informe o nome.');
    if (!this.editForm.email?.trim()) return alert('Informe o e-mail.');
    if (!this.editForm.dataNascimento?.trim()) return alert('Informe a data de nascimento (dd/MM/yyyy).');
    if (!this.editForm.cnh?.trim()) return alert('Informe a CNH.');
    if (!this.editForm.validadeCnh?.trim()) return alert('Informe a validade da CNH (dd/MM/yyyy).');

    this.loading = true;
    this.api.atualizar(this.motorista.codigo, this.editForm)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (m) => {
          this.motorista = m;
          this.showEditModal = false;
        },
        error: (err) => {
          console.error(err);
          alert('Não foi possível salvar a edição.');
        }
      });
  }

  // ---------------- DOCUMENTOS ----------------
  private getMotoristaId(): string {
    return this.motorista?.id || '';
  }

  private getArquivoId(doc: DocumentoMotoristaResponse): string {
    return String(doc?.arquivo?.id || '');
  }

  carregarDocumentos(): void {
    const motoristaId = this.getMotoristaId();
    if (!motoristaId) return;

    this.docsLoading = true;
    this.docsError = null;

    this.documentoApi.listar(motoristaId)
      .pipe(finalize(() => (this.docsLoading = false)))
      .subscribe({
        next: (list) => (this.docs = list || []),
        error: (err) => {
          console.error(err);
          this.docs = [];
          this.docsError = 'Não foi possível carregar os documentos.';
        }
      });
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.selectedFile = file;
  }

  uploadDocumento(): void {
    const motoristaId = this.getMotoristaId();
    if (!motoristaId) return;

    if (!this.selectedFile) {
      alert('Selecione um arquivo.');
      return;
    }

    this.uploading = true;

    this.documentoApi.upload(motoristaId, this.selectedFile, this.tipoDocumento, this.observacao)
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe({
        next: () => {
          this.selectedFile = null;
          this.observacao = '';
          this.tipoDocumento = 'CNH';
          this.carregarDocumentos();
        },
        error: (err) => {
          console.error(err);
          alert('Não foi possível enviar o documento.');
        }
      });
  }

  openPreview(doc: DocumentoMotoristaResponse): void {
    this.previewDoc = doc;

    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }

    this.previewUrl = null;
    this.previewSafeUrl = null;

    const arquivoId = this.getArquivoId(doc);
    if (!arquivoId) {
      this.showPreview = true;
      return;
    }

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
      }
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

  download(doc: DocumentoMotoristaResponse): void {
    const arquivoId = this.getArquivoId(doc);
    if (!arquivoId) return alert('Arquivo inválido.');

    this.documentoApi.downloadBlob(arquivoId).subscribe({
      next: (blob) => {
        if (this.downloadObjectUrl) {
          URL.revokeObjectURL(this.downloadObjectUrl);
          this.downloadObjectUrl = null;
        }

        const url = URL.createObjectURL(blob);
        this.downloadObjectUrl = url;

        const filename = doc?.arquivo?.nomeOriginal || 'arquivo';

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
      }
    });
  }

  isImage(doc: DocumentoMotoristaResponse): boolean {
    const ct = String(doc?.arquivo?.contentType || '').toLowerCase();
    return ct.startsWith('image/');
  }

  tipoAnexoLabel(v?: string | null): string {
    if (!v) return '—';
    const found = this.tiposAnexo.find(x => x.value === v);
    return found?.label || String(v);
  }

  formatBytes(bytes?: number | null): string {
    const b = Number(bytes || 0);
    if (!b) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let v = b;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
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

  // KPI auxiliar: dias para vencer CNH (baseado em string dd/MM/yyyy)
  diasParaVencerCNH(): number | null {
    const s = this.motorista?.validadeCnh;
    if (!s) return null;

    // dd/MM/yyyy -> Date
    const [dd, mm, yyyy] = String(s).split('/');
    const dt = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (isNaN(dt.getTime())) return null;

    const hoje = new Date();
    const diffMs = dt.getTime() - new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }
}
