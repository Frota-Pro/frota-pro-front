import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { CargaApiService } from '../../../core/api/carga-api.service';
import { ParadaCargaApiService } from '../../../core/api/parada-carga-api.service';
import { ArquivoApiService } from '../../../core/api/arquivo-api.service';

import { CargaResponse, ClienteCargaResponse } from '../../../core/api/carga-api.models';
import { AnexoParadaResponse, ParadaCargaRequest, ParadaCargaResponse } from '../../../core/api/parada-carga-api.models';

@Component({
  selector: 'app-carga-detalhe',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './carga-detalhe.component.html',
  styleUrls: ['./carga-detalhe.component.css'],
})
export class CargaDetalheComponent implements OnInit {
  numeroCarga = '';

  loading = false;
  errorMsg: string | null = null;

  carga: CargaResponse | null = null;

  // Paradas
  paradas: ParadaCargaResponse[] = [];
  loadingParadas = false;

  // Ordem de entrega
  ordem: string[] = [];
  ordemDirty = false;
  savingOrdem = false;

  // Observação motorista
  observacao = '';
  savingObs = false;

  // Preview Parada
  showParadaModal = false;
  paradaSelecionada: ParadaCargaResponse | null = null;
  anexosParada: AnexoParadaResponse[] = [];
  loadingAnexos = false;
  anexoTipo = 'COMPROVANTE';
  anexoObs = '';
  anexoFile: File | null = null;

  // Nova parada
  showNovaParadaModal = false;
  paradaForm: Partial<ParadaCargaRequest> = {
    tipoParada: 'OUTROS',
    dtInicio: '',
    dtFim: '',
    cidade: '',
    local: '',
    kmOdometro: null,
    observacao: '',
    valorDespesa: null,
    descricaoDespesa: '',
  };
  savingParada = false;

  // Preview arquivo
  previewUrl: string | null = null;
  previewMime: string | null = null;
  showArquivoModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cargaApi: CargaApiService,
    private paradaApi: ParadaCargaApiService,
    private arquivoApi: ArquivoApiService
  ) {}

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

    this.cargaApi
      .buscar(this.numeroCarga)
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
        },
        error: (err) => {
          console.error(err);
          this.carga = null;
          this.paradas = [];
          this.errorMsg = 'Não foi possível carregar os detalhes da carga.';
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
        },
      });
  }

  // ======= Clientes / Ordem =======
  clientesUnicos(clientes: ClienteCargaResponse[]): string[] {
    const set = new Set<string>();
    for (const c of clientes || []) {
      if (c?.cliente) set.add(c.cliente);
    }
    return Array.from(set);
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
    this.savingOrdem = true;
    this.cargaApi
      .atualizarOrdemEntrega(this.carga.numeroCarga, this.ordem)
      .pipe(finalize(() => (this.savingOrdem = false)))
      .subscribe({
        next: () => {
          this.ordemDirty = false;
          if (this.carga) this.carga.ordemEntregaClientes = [...this.ordem];
        },
        error: (err) => {
          console.error(err);
          alert('Não foi possível salvar a ordem de entrega.');
        },
      });
  }

  // ======= Observação =======
  salvarObservacao(): void {
    if (!this.carga) return;
    const obs = (this.observacao || '').trim();
    if (!obs) {
      alert('Informe uma observação para salvar.');
      return;
    }
    this.savingObs = true;
    this.cargaApi
      .atualizarObservacaoMotorista(this.carga.numeroCarga, obs)
      .pipe(finalize(() => (this.savingObs = false)))
      .subscribe({
        next: () => {
          if (this.carga) this.carga.observacaoMotorista = obs;
        },
        error: (err) => {
          console.error(err);
          alert('Não foi possível salvar a observação.');
        },
      });
  }

  // ======= Preview Parada =======
  abrirParada(p: ParadaCargaResponse): void {
    this.showParadaModal = true;
    this.paradaSelecionada = p;
    this.anexosParada = [];
    this.anexoFile = null;
    this.anexoObs = '';
    this.loadingAnexos = true;
    this.paradaApi
      .listarAnexos(p.id)
      .pipe(finalize(() => (this.loadingAnexos = false)))
      .subscribe({
        next: (a) => (this.anexosParada = a || []),
        error: (err) => {
          console.error(err);
          this.anexosParada = [];
        },
      });
  }

  fecharParada(): void {
    this.showParadaModal = false;
    this.paradaSelecionada = null;
    this.anexosParada = [];
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.anexoFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  uploadAnexoParada(): void {
    if (!this.paradaSelecionada) return;
    if (!this.anexoFile) {
      alert('Selecione um arquivo.');
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
          this.paradaApi.listarAnexos(this.paradaSelecionada!.id).subscribe({
            next: (a) => (this.anexosParada = a || []),
            error: () => null,
          });
        },
        error: (err) => {
          console.error(err);
          alert('Não foi possível enviar o anexo.');
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
        alert('Não foi possível abrir o preview do arquivo.');
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
      },
      error: (err) => {
        console.error(err);
        alert('Não foi possível baixar o arquivo.');
      },
    });
  }

  // ======= Nova Parada =======
  abrirNovaParada(): void {
    this.showNovaParadaModal = true;
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
    };
  }

  fecharNovaParada(): void {
    this.showNovaParadaModal = false;
  }

  salvarParada(): void {
    if (!this.carga) return;
    if (!this.paradaForm.dtInicio || !this.paradaForm.tipoParada) {
      alert('Informe o tipo e a data/hora de início.');
      return;
    }

    const req: ParadaCargaRequest = {
      carga: this.carga.numeroCarga,
      tipoParada: String(this.paradaForm.tipoParada),
      dtInicio: String(this.paradaForm.dtInicio),
      dtFim: this.paradaForm.dtFim || null,
      cidade: this.paradaForm.cidade || null,
      local: this.paradaForm.local || null,
      kmOdometro: (this.paradaForm.kmOdometro as any) ?? null,
      observacao: this.paradaForm.observacao || null,
      valorDespesa: (this.paradaForm.valorDespesa as any) ?? null,
      descricaoDespesa: this.paradaForm.descricaoDespesa || null,
      abastecimento: this.paradaForm.abastecimento,
      manutencao: this.paradaForm.manutencao,
    };

    this.savingParada = true;
    this.paradaApi
      .criar(req)
      .pipe(finalize(() => (this.savingParada = false)))
      .subscribe({
        next: () => {
          this.showNovaParadaModal = false;
          this.carregarParadas();
        },
        error: (err) => {
          console.error(err);
          alert('Não foi possível cadastrar a parada.');
        },
      });
  }

  // ======= Helpers =======
  formatMoneyBRL(v?: number | string | null): string {
    if (v === null || v === undefined) {
      return (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    let n: number;

    if (typeof v === 'number') {
      n = v;
    } else {
      // limpa "R$", espaços e separadores
      const raw = v
        .trim()
        .replace(/\s/g, '')
        .replace(/^R\$/i, '')
        .replace(/\./g, '')   // remove separador de milhar
        .replace(',', '.');   // troca decimal pt-BR para padrão JS

      n = Number(raw);
    }

    if (!Number.isFinite(n)) n = 0;

    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
}
