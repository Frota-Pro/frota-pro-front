import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { ConferenciaTransportadoApiService } from '../../core/api/conferencia-transportado-api.service';
import {
  ConferenciaCargaDiferenca,
  ConferenciaMovimento,
  ConferenciaNotaDetalhe,
  ConferenciaTransportadoResponse,
} from '../../core/api/conferencia-transportado-api.models';

const MOTIVOS: Record<string, string> = {
  CANCELADA: 'Nota cancelada',
  SEM_CARREGAMENTO: 'Sem carregamento (balcão, venda direta, retirada)',
  CARREGAMENTO_INEXISTENTE: 'Carregamento inexistente no WinThor',
  SEM_PEDIDO: 'Carregamento sem pedido',
  SEM_MDFE: 'Sem manifesto (MDF-e)',
  SEM_MOTORISTA_VEICULO: 'Sem motorista ou veículo',
  CAMINHAO_FORA_DA_FROTA: 'Caminhão do manifesto não é da frota (terceiro): não entra',
  MOVIDA_PARA_OUTRA_CARGA: 'Movida para outra carga',
  NOVA_NO_WINTHOR: 'Nota nova no WinThor',
  TRANSPORTADA: 'Transportada',
  NA_MESMA_CARGA: 'Ainda na mesma carga',
  FORA_DO_PERIODO_CONSULTADO: 'Fora do período consultado',
};

const CATEGORIAS: Record<string, string> = {
  CARGA_NAO_SINCRONIZADA: 'Ainda não chegou ao FrotaPRO',
  DATA_DIFERENTE_NO_FROTAPRO: 'Data diferente no FrotaPRO',
  DATA_DIFERENTE_NO_WINTHOR: 'Data diferente no WinThor',
  VALOR_DIFERENTE: 'Valor diferente',
  CARGA_SUMIDA_DO_WINTHOR: 'Sumiu do WinThor',
  CARGA_SEM_TRANSPORTE_HOJE: 'Sem transporte hoje',
  CARGA_DE_TERCEIRO: 'Caminhão de terceiro',
  CARGA_DESCARTADA_NO_SYNC: 'O sync descartou',
};

const ORIGENS: Record<string, string> = {
  REENTREGA: 'Reentrega',
  TRANSFERENCIA: 'Sobra de transferência',
  SEM_NOTA: 'Ficou sem nota',
  COMUM: 'Sem origem registrada',
};

/** Cada janela de detalhe que o usuário pode abrir. */
export type Painel =
  | 'pontes'
  | 'diferencas'
  | 'zerar'
  | 'manual'
  | 'pequenas'
  | 'transferencias'
  | 'notasFora'
  | 'manifestos'
  | 'devolucoes';

/** Um cartão do resumo: quantos itens, de quê, e o que fazer. */
export interface CartaoResumo {
  id: Painel;
  titulo: string;
  quantidade: number;
  resumo: string;
  /** atencao = alguém precisa agir; info = só para conhecer. */
  nivel: 'atencao' | 'info';
}

const TITULOS_PAINEL: Record<Painel, string> = {
  pontes: 'Como chegamos nesses números',
  diferencas: 'Cargas com diferença',
  zerar: 'Cargas que ficaram sem nota',
  manual: 'Lançar km e abastecimento à mão',
  pequenas: 'Cargas pequenas',
  transferencias: 'Transferências entre cargas',
  notasFora: 'Notas que não entram no transporte',
  manifestos: 'Manifestos sem nota',
  devolucoes: 'Devoluções',
};

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

@Component({
  selector: 'app-conferencia-transportado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conferencia-transportado.component.html',
  styleUrls: ['./conferencia-transportado.component.css'],
})
export class ConferenciaTransportadoComponent implements OnInit {
  mes = '';
  dados: ConferenciaTransportadoResponse | null = null;
  loading = false;
  erro: string | null = null;

  /** Janela de detalhe aberta; nulo = nenhuma. */
  painel: Painel | null = null;

  filtroCategoria = '';
  expandidas = new Set<number>();

  zerando = false;
  mensagemZerar: string | null = null;

  constructor(private api: ConferenciaTransportadoApiService) {}

  ngOnInit(): void {
    const hoje = new Date();
    // mês corrente como padrão; no começo do mês o gerente quase sempre quer conferir o mês que acabou
    const base = hoje.getDate() <= 5 ? new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1) : hoje;
    this.mes = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
    this.carregar(false);
  }

  carregar(atualizar: boolean): void {
    if (!/^\d{4}-\d{2}$/.test(this.mes)) {
      this.erro = 'Escolha o mês.';
      return;
    }
    this.loading = true;
    this.erro = null;
    this.expandidas.clear();
    this.api
      .buscar(this.mes, atualizar)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (d) => (this.dados = d),
        error: (err) => {
          this.dados = null;
          this.painel = null;
          this.erro = extrairMensagemErro(err) || 'Não foi possível gerar a conferência.';
        },
      });
  }

  // ------------------------------------------------------------------ janela de detalhe

  abrir(painel: Painel): void {
    this.painel = painel;
    if (painel === 'diferencas') this.filtroCategoria = '';
  }

  @HostListener('document:keydown.escape')
  fechar(): void {
    this.painel = null;
  }

  get tituloPainel(): string {
    return this.painel ? TITULOS_PAINEL[this.painel] : '';
  }

  // ------------------------------------------------------------------ resumo

  /** Cartões com algo a mostrar, os que pedem ação primeiro. Quem está com zero não ocupa espaço. */
  get cartoes(): CartaoResumo[] {
    const d = this.dados;
    if (!d) return [];
    const somaZerar = this.zeraveis.reduce((s, c) => s + c.valorFrotaPro, 0);
    const todos: CartaoResumo[] = [
      {
        id: 'diferencas',
        titulo: 'Cargas com diferença',
        quantidade: d.cargasComDiferenca.length,
        resumo: `FrotaPRO − WinThor: ${BRL.format(d.totais.diferenca)}`,
        nivel: 'atencao',
      },
      {
        id: 'zerar',
        titulo: 'Cargas sem nota, contando em dobro',
        quantidade: this.zeraveis.length,
        resumo: `${BRL.format(somaZerar)} para tirar dos totais`,
        nivel: 'atencao',
      },
      {
        id: 'manual',
        titulo: 'Lançar km e abastecimento',
        quantidade: d.lancamentoManual?.length ?? 0,
        resumo: 'Motorista de terceiro: lançar à mão',
        nivel: 'atencao',
      },
      {
        id: 'pequenas',
        titulo: 'Cargas pequenas',
        quantidade: d.cargasPequenas?.length ?? 0,
        resumo: `Menos de ${d.limitePequenaKg ?? 500} kg: confirmar a viagem`,
        nivel: 'atencao',
      },
      {
        id: 'transferencias',
        titulo: 'Transferências entre cargas',
        quantidade: this.movimentos.length,
        resumo: d.resumoMovimentos ? `${BRL.format(d.resumoMovimentos.valor)} mudaram de carga` : 'Notas que mudaram de carga',
        nivel: 'info',
      },
      {
        id: 'devolucoes',
        titulo: 'Devoluções',
        quantidade: d.resumoDevolucoes?.notas ?? 0,
        resumo: d.resumoDevolucoes ? `${BRL.format(d.resumoDevolucoes.valor)} devolvidos (só informa)` : '',
        nivel: 'info',
      },
      {
        id: 'notasFora',
        titulo: 'Notas fora do transporte',
        quantidade: d.notasForaTotal,
        resumo: 'Sem carga, sem manifesto, terceiro ou cancelada',
        nivel: 'info',
      },
      {
        id: 'manifestos',
        titulo: 'Manifestos sem nota',
        quantidade: d.manifestosSemNota?.length ?? 0,
        resumo: 'Viagem sem valor',
        nivel: 'info',
      },
    ];
    return todos
      .filter((c) => c.quantidade > 0)
      .sort((a, b) => Number(b.nivel === 'atencao') - Number(a.nivel === 'atencao'));
  }

  get qtdAtencao(): number {
    return this.cartoes.filter((c) => c.nivel === 'atencao').length;
  }

  /** O que pede ação e está zerado: vira uma linha de "tudo certo" em vez de cartões vazios. */
  get semPendencia(): string[] {
    const d = this.dados;
    if (!d) return [];
    const itens: [string, number][] = [
      ['Diferenças entre WinThor e FrotaPRO', d.cargasComDiferenca.length],
      ['Cargas sem nota', this.zeraveis.length],
      ['Lançamento manual de km', d.lancamentoManual?.length ?? 0],
      ['Cargas pequenas', d.cargasPequenas?.length ?? 0],
    ];
    return itens.filter(([, q]) => q === 0).map(([nome]) => nome);
  }

  get movimentos(): ConferenciaMovimento[] {
    return this.dados?.movimentosEntreCargas ?? [];
  }

  // ------------------------------------------------------------------ cargas com diferença

  get categorias(): { codigo: string; rotulo: string; qtd: number }[] {
    const contagem = new Map<string, number>();
    (this.dados?.cargasComDiferenca ?? []).forEach((c) => contagem.set(c.categoria, (contagem.get(c.categoria) ?? 0) + 1));
    return Array.from(contagem.entries()).map(([codigo, qtd]) => ({ codigo, rotulo: this.categoria(codigo), qtd }));
  }

  get cargasFiltradas(): ConferenciaCargaDiferenca[] {
    const todas = this.dados?.cargasComDiferenca ?? [];
    return this.filtroCategoria ? todas.filter((c) => c.categoria === this.filtroCategoria) : todas;
  }

  categoria(codigo: string): string {
    return CATEGORIAS[codigo] ?? codigo;
  }

  origem(codigo: string): string {
    return ORIGENS[codigo] ?? codigo;
  }

  motivo(codigo: string): string {
    return MOTIVOS[codigo] ?? codigo;
  }

  alternar(numCar: number): void {
    if (this.expandidas.has(numCar)) this.expandidas.delete(numCar);
    else this.expandidas.add(numCar);
  }

  /** Carga de origem → destino de cada transferência da nota, com dia e hora, para a coluna "Transferências". */
  historicoTexto(n: ConferenciaNotaDetalhe): string {
    return (n.historico ?? [])
      .map((h) => `${h.deCarga ?? '?'} → ${h.paraCarga ?? '?'}${h.quando ? ' em ' + this.dataHora(h.quando) : ''}`)
      .join(' · ');
  }

  dataHora(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const p = (v: number) => String(v).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // ------------------------------------------------------------------ cargas sem nota

  /** Cargas que ficaram sem nota e podem ser tiradas dos totais. */
  get zeraveis(): ConferenciaCargaDiferenca[] {
    return (this.dados?.cargasComDiferenca ?? []).filter((c) => c.podeSerZerada);
  }

  zerarTransferidas(): void {
    const n = this.zeraveis.length;
    if (!n || this.zerando) return;
    if (!window.confirm(`Tirar dos totais ${n} carga(s) que ficaram sem nota? O valor e o peso antigos ficam guardados na própria carga.`)) {
      return;
    }
    this.zerando = true;
    this.mensagemZerar = null;
    this.api
      .zerarTransferidas(this.mes)
      .pipe(finalize(() => (this.zerando = false)))
      .subscribe({
        next: (r) => {
          this.mensagemZerar = `${r.length} carga(s) tirada(s) dos totais.`;
          this.painel = null;
          this.carregar(true);
        },
        error: (err) => (this.mensagemZerar = extrairMensagemErro(err) || 'Não foi possível tirar as cargas dos totais (só administrador).'),
      });
  }

  // ------------------------------------------------------------------ planilha e impressão

  /** Planilha para abrir no Excel (separador ponto e vírgula, números no formato brasileiro). */
  exportarCsv(): void {
    if (!this.dados) return;
    const d = this.dados;
    const n = (v: number | null | undefined) => (v == null ? '' : v.toFixed(2).replace('.', ','));
    const linhas: string[][] = [
      [`Conferência do valor transportado - ${d.mes}`],
      [],
      ['Venda faturada (referência 111)', n(d.totais.vendaFaturada)],
      ['Transportado no WinThor', n(d.totais.transportadoWinThor)],
      ['Transportado no FrotaPRO', n(d.totais.transportadoFrotaPro)],
      ['Diferença', n(d.totais.diferenca)],
      [],
      ['PONTE 1: venda faturada até o transportado no WinThor'],
      ['Item', 'Quantidade', 'Valor', 'Explicação'],
      ...d.ponteVendaParaTransportado.map((l) => [l.titulo, String(l.quantidade), n(l.valor), l.explicacao]),
      [],
      ['PONTE 2: transportado no WinThor até o FrotaPRO'],
      ['Item', 'Quantidade', 'Valor', 'Explicação'],
      ...d.ponteWinThorParaFrotaPro.map((l) => [l.titulo, String(l.quantidade), n(l.valor), l.explicacao]),
      [],
      ['CARGAS COM DIFERENÇA'],
      ['Carga', 'Categoria', 'WinThor', 'FrotaPRO', 'Diferença', 'Explicação'],
      ...d.cargasComDiferenca.map((c) => [String(c.numCar), this.categoria(c.categoria), n(c.valorWinThor), n(c.valorFrotaPro), n(c.diferenca), c.explicacao]),
      [],
      ['CARGAS PEQUENAS (peso abaixo de ' + (d.limitePequenaKg ?? '') + ' kg)'],
      ['Carga', 'Origem', 'Peso kg', 'Valor', 'Motorista', 'Placa', 'Explicacao'],
      ...(d.cargasPequenas ?? []).map((c) => [String(c.numCar), this.origem(c.origem), n(c.pesoKg), n(c.valor), c.motorista ?? '', c.placa ?? '', c.explicacao]),
      [],
      ['LANCAMENTO MANUAL (motorista fora da frota)'],
      ['Carga', 'Motorista', 'Valor', 'Explicacao'],
      ...(d.lancamentoManual ?? []).map((l) => [String(l.numCar), l.codMotorista, n(l.valor), l.explicacao]),
      [],
      ['TRANSFERENCIAS ENTRE CARGAS (o valor sai da carga de origem e entra na de destino)'],
      ['Origem (diminui)', 'Destino (aumenta)', 'Motivo', 'Notas', 'Valor', 'Primeira', 'Ultima'],
      ...this.movimentos.map((m) => [
        String(m.deCarga ?? ''), String(m.paraCarga ?? ''), m.motivo ?? '', String(m.notas), n(m.valor),
        m.primeira ? this.dataHora(m.primeira) : '', m.ultima ? this.dataHora(m.ultima) : '',
      ]),
    ];
    const csv = linhas.map((l) => l.map((c) => `"${(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conferencia-transportado-${d.mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  imprimir(): void {
    window.print();
  }

  sinal(v: number): string {
    return v > 0 ? 'pos' : v < 0 ? 'neg' : '';
  }
}
