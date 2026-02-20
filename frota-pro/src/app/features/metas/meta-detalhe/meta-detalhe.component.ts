import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { MetaApiService } from '../../../core/api/meta-api.service';
import { MetaRequest, MetaResponse } from '../../../core/api/meta-api.models';
import { ToastService } from '../../../shared/ui/toast/toast.service';

type TabKey = 'resumo' | 'historico';
type TipoMetaKey = 'QUILOMETRAGEM' | 'CONSUMO_COMBUSTIVEL' | 'TONELADA' | 'CARGA_TRANSPORTADA' | string;

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

  tiposMeta: Array<{ value: TipoMetaKey; label: string; unidade: string }> = [
    { value: 'QUILOMETRAGEM', label: 'Meta de quilometragem', unidade: 'km' },
    { value: 'CONSUMO_COMBUSTIVEL', label: 'Meta de consumo de combustível', unidade: 'km/l' },
    { value: 'TONELADA', label: 'Meta de tonelada da carga', unidade: 't' },
    { value: 'CARGA_TRANSPORTADA', label: 'Meta de carga transportada', unidade: 'cargas' },
  ];

  editForm: MetaRequest = {
    dataIncio: '',
    dataFim: '',
    tipoMeta: '',
    valorMeta: 0,
    valorRealizado: null,
    unidade: null,
    statusMeta: 'EM_ANDAMENTO',
    descricao: null,
    caminhao: null,
    categoria: null,
    motorista: null,
    renovarAutomaticamente: false,
    recalcularProgresso: true,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: MetaApiService,
    private toast: ToastService
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
      valorRealizado: this.data.valorRealizado ?? null,
      unidade: this.data.unidade || null,
      statusMeta: this.data.statusMeta || 'EM_ANDAMENTO',
      descricao: this.data.descricao || null,
      caminhao: this.data.caminhaoCodigo || null,
      categoria: this.data.categoriaCodigo || null,
      motorista: this.data.motoristaCodigo || null,
      renovarAutomaticamente: !!this.data.renovarAutomaticamente,
      recalcularProgresso: this.data.recalcularProgresso ?? true,
    };

    this.showEditModal = true;
  }

  onTipoMetaChange(): void {
    const unit = this.getUnidadeDefault(this.editForm.tipoMeta);
    if (unit) this.editForm.unidade = unit;
  }

  closeEdit(): void {
    this.showEditModal = false;
  }

  salvarEdicao(): void {
    if (!this.data) return;

    const errors = this.validateForm(this.editForm);
    if (errors.length) {
      this.toast.warn(errors.join(' • '), 'Validação');
      return;
    }

    this.saving = true;
    const req: MetaRequest = {
      ...this.editForm,
      caminhao: this.emptyToNull(this.editForm.caminhao),
      categoria: this.emptyToNull(this.editForm.categoria),
      motorista: this.emptyToNull(this.editForm.motorista),
      unidade: this.emptyToNull(this.editForm.unidade),
      descricao: this.emptyToNull(this.editForm.descricao),
    };
    this.api
      .atualizar(this.data.id, req)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (res) => {
          this.showEditModal = false;
          this.data = res;
          this.carregarHistorico();
          this.toast.success('Meta atualizada com sucesso.');
        },
        error: (err) => {
          console.error(err);
          this.toast.error('Não foi possível salvar as alterações.');
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
        next: () => {
          this.toast.success('Meta excluída com sucesso.');
          this.voltar();
        },
        error: () => this.toast.error('Não foi possível excluir a meta.'),
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

  private validateForm(form: MetaRequest): string[] {
    const errors: string[] = [];
    const tipo = (form.tipoMeta || '').trim();
    const unidade = (form.unidade || '').toString().trim();

    if (!tipo) errors.push('Informe o tipo da meta.');
    if (!form.dataIncio || !form.dataFim) errors.push('Informe o período.');

    const ini = this.parseDate(form.dataIncio);
    const fim = this.parseDate(form.dataFim);
    if (ini && fim && fim < ini) errors.push('A data fim deve ser maior ou igual à data início.');

    if (!form.valorMeta || form.valorMeta <= 0) errors.push('Informe um valor de meta maior que zero.');
    if (!unidade) errors.push('Informe a unidade da meta.');

    const caminhao = this.emptyToNull(form.caminhao);
    const categoria = this.emptyToNull(form.categoria);
    const motorista = this.emptyToNull(form.motorista);
    const targetCount = [caminhao, categoria, motorista].filter((v) => v != null).length;
    if (targetCount !== 1) {
      errors.push('Informe apenas um alvo: caminhão, categoria ou motorista.');
    }

    return errors;
  }

  private getUnidadeDefault(tipo: string | null | undefined): string | null {
    const t = (tipo || '').toUpperCase();
    const found = this.tiposMeta.find((x) => x.value === t);
    return found?.unidade ?? null;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const v = String(value).trim();
    if (!v) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
      const [d, m, y] = v.split('/').map(Number);
      return new Date(y, m - 1, d);
    }
    return null;
  }

  private emptyToNull(v: any): any {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s ? v : null;
  }
}
