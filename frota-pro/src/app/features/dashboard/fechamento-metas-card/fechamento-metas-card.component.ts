import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FechamentoMetaResumoResponse } from '../../../core/api/fechamento-meta.models';
import { MetaApiService } from '../../../core/api/meta-api.service';
import {
  SegmentoFechamento,
  dataBr,
  deslocarMes,
  gradienteDoAnel,
  mesAnteriorAHoje,
  mesDeHoje,
  montarSegmentos,
  pendentes,
  rotuloDoMes,
} from '../../../shared/utils/fechamento-meta';

/**
 * Quem já finalizou (e quem não) a meta do mês, de todos os motoristas ativos. Aparece só
 * quando o fechamento por dias úteis está ligado nos Parâmetros do Sistema.
 */
@Component({
  selector: 'app-fechamento-metas-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel" *ngIf="resumo?.ativo" data-testid="fechamento-card">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Fechamento das metas</h2>
          <p class="panel-subtitle">
            {{ rotuloMes }}
            <ng-container *ngIf="resumo!.mesEncerrado"> · prazo até {{ limite }}</ng-container>
            <ng-container *ngIf="!resumo!.mesEncerrado"> · mês em andamento</ng-container>
          </p>
        </div>

        <div class="nav">
          <button type="button" class="nav-btn" aria-label="Mês anterior" (click)="mudarMes(-1)">&#8249;</button>
          <button type="button" class="nav-btn" aria-label="Próximo mês" [disabled]="ehMesAtual" (click)="mudarMes(1)">&#8250;</button>
        </div>
      </div>

      <div class="empty" *ngIf="resumo!.totalMotoristas === 0">
        <div class="empty-title">Nenhum motorista ativo</div>
      </div>

      <div class="corpo" *ngIf="resumo!.totalMotoristas > 0">
        <div class="anel" [style.background]="gradiente" role="img" [attr.aria-label]="resumoTexto">
          <div class="anel-miolo">
            <strong>{{ resumo!.finalizados }}</strong>
            <span>de {{ resumo!.totalMotoristas }}</span>
          </div>
        </div>

        <div class="lado">
          <p class="resumo-texto" data-testid="fechamento-resumo">{{ resumoTexto }}</p>

          <ul class="legenda">
            <li *ngFor="let s of segmentos" [class.zerado]="s.qtd === 0">
              <span class="bolinha" [style.background]="s.cor"></span>
              {{ s.rotulo }}: <strong>{{ s.qtd }}</strong>
            </li>
          </ul>

          <div class="pendentes" *ngIf="faltam.itens.length > 0" data-testid="fechamento-pendentes">
            <div class="pendentes-titulo">Ainda não finalizaram</div>
            <ul>
              <li *ngFor="let nome of faltam.itens">{{ nome }}</li>
            </ul>
            <small *ngIf="faltam.restantes > 0">e mais {{ faltam.restantes }}</small>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; margin-top: 16px; }
      .panel { background: #ffffff; border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 14px; box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06); padding: 16px; }
      .panel-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .panel-title { margin: 0; font-size: 15px; font-weight: 750; color: #0f172a; }
      .panel-subtitle { margin: 2px 0 0; font-size: 12.5px; color: rgba(15, 23, 42, 0.60); }
      .empty { border-radius: 12px; border: 1px dashed rgba(15, 23, 42, 0.16); padding: 18px; background: rgba(15, 23, 42, 0.02); }
      .empty-title { font-size: 13.5px; font-weight: 750; color: #0f172a; }
      .nav { display: flex; gap: 6px; }
      .nav-btn { width: 30px; height: 30px; border: 1px solid #d5dbe5; background: #fff; border-radius: 8px; cursor: pointer; font-size: 18px; line-height: 1; }
      .nav-btn:disabled { opacity: .4; cursor: default; }
      .corpo { display: flex; gap: 28px; align-items: center; flex-wrap: wrap; padding: 8px 4px 4px; }
      .anel { width: 132px; height: 132px; border-radius: 50%; display: grid; place-items: center; flex: none; }
      .anel-miolo { width: 88px; height: 88px; border-radius: 50%; background: #fff; display: grid; place-content: center; text-align: center; }
      .anel-miolo strong { font-size: 26px; line-height: 1; }
      .anel-miolo span { font-size: 12px; color: #64748b; }
      .lado { flex: 1; min-width: 220px; }
      .resumo-texto { margin: 0 0 8px; font-weight: 600; }
      .legenda { list-style: none; margin: 0 0 10px; padding: 0; display: grid; gap: 4px; font-size: 13px; }
      .legenda li.zerado { opacity: .55; }
      .bolinha { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
      .pendentes { border-top: 1px dashed #d5dbe5; padding-top: 8px; font-size: 13px; }
      .pendentes-titulo { font-weight: 600; margin-bottom: 4px; }
      .pendentes ul { list-style: none; margin: 0; padding: 0; columns: 2; }
      .pendentes small { color: #64748b; }
    `,
  ],
})
export class FechamentoMetasCardComponent implements OnInit {
  mes = mesAnteriorAHoje();
  resumo: FechamentoMetaResumoResponse | null = null;
  segmentos: SegmentoFechamento[] = [];
  gradiente = '';
  faltam: { itens: string[]; restantes: number } = { itens: [], restantes: 0 };

  constructor(private metaApi: MetaApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.carregar();
  }

  get rotuloMes(): string {
    return rotuloDoMes(this.mes);
  }

  get limite(): string {
    return dataBr(this.resumo?.dataLimite);
  }

  get ehMesAtual(): boolean {
    return this.mes >= mesDeHoje();
  }

  get resumoTexto(): string {
    const r = this.resumo;
    if (!r) return '';
    if (!r.mesEncerrado) return 'O mês ainda não terminou: a meta só pode ser finalizada a partir do dia 1º do mês seguinte.';
    return `${r.finalizados} de ${r.totalMotoristas} motoristas já finalizaram a meta de ${this.rotuloMes}.`;
  }

  mudarMes(delta: number): void {
    const novo = deslocarMes(this.mes, delta);
    if (novo > mesDeHoje()) return;
    this.mes = novo;
    this.carregar();
  }

  private carregar(): void {
    this.metaApi.resumoFechamento(this.mes).subscribe({
      next: (r) => {
        this.resumo = r;
        this.segmentos = montarSegmentos(r);
        this.gradiente = gradienteDoAnel(this.segmentos);
        this.faltam = pendentes(r);
        this.cdr.markForCheck();
      },
      // O cartão é um extra do dashboard: se falhar (sem permissão, API antiga), ele some.
      // O aviso de erro, se houver, já vem do interceptador global.
      error: () => {
        this.resumo = null;
        this.cdr.markForCheck();
      },
    });
  }
}
