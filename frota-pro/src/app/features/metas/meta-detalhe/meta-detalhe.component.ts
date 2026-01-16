import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { MetaApiService } from '../../../core/api/meta-api.service';
import { MetaRequest, MetaResponse } from '../../../core/api/meta-api.models';

type TabKey = 'resumo' | 'historico';

@Component({
  selector: 'app-meta-detalhe',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './meta-detalhe.component.html',
  styleUrls: ['./meta-detalhe.component.css'],
})
export class MetaDetalheComponent implements OnInit {
  id!: string;

  loading = false;
  errorMsg: string | null = null;

  data: MetaResponse | null = null;
  tab: TabKey = 'resumo';

  // histórico
  histLoading = false;
  historico: MetaResponse[] = [];

  // modal editar
  showEditModal = false;
  saving = false;

  editForm: MetaRequest = {
    dataIncio: '',
    dataFim: '',
    tipoMeta: '',
    valorMeta: 0,
    valorRealizado: 0,
    unidade: null,
    statusMeta: 'EM_ANDAMENTO',
    descricao: null,
    caminhao: null,
    categoria: null,
    motorista: null,
    renovarAutomaticamente: false,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: MetaApiService
  ) {}

  ngOnInit(): void {
    this.id = String(this.route.snapshot.paramMap.get('id') || '');
    if (!this.id) {
      this.router.navigate(['/dashboard/metas']);
      return;
    }

    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.errorMsg = null;

    this.api
      .buscarPorId(this.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.data = res;
          this.carregarHistorico();
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'Não foi possível carregar o detalhamento da meta.';
          this.data = null;
        },
      });
  }

  setTab(t: TabKey) {
    this.tab = t;
    if (t === 'historico') this.carregarHistorico();
  }

  carregarHistorico(): void {
    if (!this.data) return;
    const inicio = this.data.dataIncio;
    const fim = this.data.dataFim;

    if (!inicio || !fim) {
      this.historico = [];
      return;
    }

    this.histLoading = true;
    this.api
      .historico({
        caminhao: this.data.caminhaoCodigo || null,
        categoria: this.data.categoriaCodigo || null,
        motorista: this.data.motoristaCodigo || null,
        inicio,
        fim,
      })
      .pipe(finalize(() => (this.histLoading = false)))
      .subscribe({
        next: (list) => {
          this.historico = (list || []).slice().sort((a, b) =>
            String(b.dataIncio || '').localeCompare(String(a.dataIncio || ''))
          );
        },
        error: () => (this.historico = []),
      });
  }

  voltar(): void {
    this.router.navigate(['/dashboard/metas']);
  }

  abrirMeta(id: string): void {
    this.router.navigate(['/dashboard/metas', id]);
  }

  progressPercent(): number {
    if (!this.data) return 0;
    const meta = Number(this.data.valorMeta || 0);
    const real = Number(this.data.valorRealizado || 0);
    if (meta <= 0) return 0;
    const p = (real / meta) * 100;
    return Math.max(0, Math.min(100, p));
  }

  isFinalizada(): boolean {
    return (this.data?.statusMeta || '').toUpperCase() === 'FINALIZADA';
  }

  editar(): void {
    if (!this.data) return;

    this.editForm = {
      dataIncio: this.data.dataIncio,
      dataFim: this.data.dataFim,
      tipoMeta: this.data.tipoMeta,
      valorMeta: Number(this.data.valorMeta || 0),
      valorRealizado: Number(this.data.valorRealizado || 0),
      unidade: this.data.unidade || null,
      statusMeta: this.data.statusMeta || 'EM_ANDAMENTO',
      descricao: this.data.descricao || null,
      caminhao: this.data.caminhaoCodigo || null,
      categoria: this.data.categoriaCodigo || null,
      motorista: this.data.motoristaCodigo || null,
      renovarAutomaticamente: !!this.data.renovarAutomaticamente,
    };

    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
  }

  salvarEdicao(): void {
    if (!this.data) return;

    if (!this.editForm.tipoMeta?.trim()) return alert('Informe o tipo da meta.');
    if (!this.editForm.dataIncio) return alert('Informe a data início.');
    if (!this.editForm.dataFim) return alert('Informe a data fim.');

    this.saving = true;
    this.api
      .atualizar(this.data.id, this.editForm)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (res) => {
          this.showEditModal = false;
          this.data = res;
          this.carregarHistorico();
        },
        error: (err) => {
          console.error(err);
          alert('Não foi possível salvar as alterações.');
        },
      });
  }

  excluir(): void {
    if (!this.data) return;
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    this.loading = true;
    this.api
      .deletar(this.data.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.voltar(),
        error: () => alert('Não foi possível excluir a meta.'),
      });
  }

  formatNumber(v: number | null | undefined, dec = 2): string {
    const n = Number(v ?? 0);
    return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  formatDateBr(iso: string | null | undefined): string {
    if (!iso) return '—';
    const [y, m, d] = String(iso).split('-');
    if (!y || !m || !d) return String(iso);
    return `${d}/${m}/${y}`;
  }
}
