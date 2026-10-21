import { FechamentoMetaResumoItem, FechamentoMetaResumoResponse } from '../../core/api/fechamento-meta.models';
import {
  dataBr,
  deslocarMes,
  gradienteDoAnel,
  mesAnteriorAHoje,
  mesDeHoje,
  montarSegmentos,
  pendentes,
  rotuloDoMes,
  situacaoRotulo,
} from './fechamento-meta';

function resumo(parcial: Partial<FechamentoMetaResumoResponse> = {}): FechamentoMetaResumoResponse {
  return {
    mesReferencia: '2026-10-01',
    ativo: true,
    diasUteisFechamento: 5,
    dataLimite: '2026-11-06',
    mesEncerrado: true,
    totalMotoristas: 10,
    confirmados: 4,
    fechadosPeloPrazo: 1,
    emAberto: 5,
    emAndamento: 0,
    finalizados: 5,
    motoristas: [],
    ...parcial,
  };
}

function motorista(nome: string, situacao: FechamentoMetaResumoItem['situacao']): FechamentoMetaResumoItem {
  return { codigo: nome, nome, situacao, finalizado: situacao === 'CONFIRMADO' || situacao === 'FECHADO' };
}

describe('fechamento-meta', () => {
  describe('montarSegmentos', () => {
    it('devolve as quatro fatias com quantidade e porcentagem do total', () => {
      const s = montarSegmentos(resumo());

      expect(s.map((x) => x.chave)).toEqual(['confirmados', 'fechadosPeloPrazo', 'emAberto', 'emAndamento']);
      expect(s.map((x) => x.qtd)).toEqual([4, 1, 5, 0]);
      expect(s.map((x) => x.pct)).toEqual([40, 10, 50, 0]);
    });

    it('arredonda a porcentagem em uma casa', () => {
      const s = montarSegmentos(resumo({ totalMotoristas: 3, confirmados: 1, fechadosPeloPrazo: 0, emAberto: 2 }));

      expect(s[0].pct).toBe(33.3);
      expect(s[2].pct).toBe(66.7);
    });

    it('sem motoristas as porcentagens ficam em zero, sem dividir por zero', () => {
      const s = montarSegmentos(resumo({ totalMotoristas: 0, confirmados: 0, fechadosPeloPrazo: 0, emAberto: 0 }));

      expect(s.every((x) => x.pct === 0)).toBeTrue();
    });

    it('resposta nula devolve lista vazia', () => {
      expect(montarSegmentos(null)).toEqual([]);
      expect(montarSegmentos(undefined)).toEqual([]);
    });

    it('cada fatia tem uma cor própria', () => {
      const cores = montarSegmentos(resumo()).map((x) => x.cor);

      expect(new Set(cores).size).toBe(4);
    });
  });

  describe('gradienteDoAnel', () => {
    it('monta o anel só com as fatias que têm gente, em sequência', () => {
      const g = gradienteDoAnel(montarSegmentos(resumo()));

      expect(g.startsWith('conic-gradient(')).toBeTrue();
      expect(g).toContain('#16a34a 0.00% 40.00%');
      expect(g).toContain('#2563eb 40.00% 50.00%');
      expect(g).toContain('#f59e0b 50.00% 100.00%');
      expect(g).not.toContain('#94a3b8');
    });

    it('sem ninguém mostra um anel cinza claro', () => {
      expect(gradienteDoAnel(montarSegmentos(resumo({ totalMotoristas: 0, confirmados: 0, fechadosPeloPrazo: 0, emAberto: 0 }))))
        .toBe('conic-gradient(#e2e8f0 0 100%)');
    });
  });

  describe('meses', () => {
    it('desloca para frente e para trás, virando o ano', () => {
      expect(deslocarMes('2026-10', -1)).toBe('2026-09');
      expect(deslocarMes('2026-01', -1)).toBe('2025-12');
      expect(deslocarMes('2026-12', 1)).toBe('2027-01');
      expect(deslocarMes('2026-10', 0)).toBe('2026-10');
    });

    it('mês de hoje e mês anterior a hoje', () => {
      const hoje = new Date(2026, 10, 3); // 03/11/2026

      expect(mesDeHoje(hoje)).toBe('2026-11');
      expect(mesAnteriorAHoje(hoje)).toBe('2026-10');
      expect(mesAnteriorAHoje(new Date(2026, 0, 15))).toBe('2025-12');
    });

    it('rótulo do mês em português', () => {
      expect(rotuloDoMes('2026-10')).toBe('Outubro de 2026');
      expect(rotuloDoMes('2026-03')).toBe('Março de 2026');
    });

    it('data no formato brasileiro', () => {
      expect(dataBr('2026-11-06')).toBe('06/11/2026');
      expect(dataBr('2026-11-06T10:30:00')).toBe('06/11/2026');
      expect(dataBr(null)).toBe('');
      expect(dataBr(undefined)).toBe('');
    });
  });

  describe('situacaoRotulo', () => {
    it('texto de cada situação', () => {
      expect(situacaoRotulo('CONFIRMADO')).toBe('Finalizou');
      expect(situacaoRotulo('FECHADO')).toBe('Fechado pelo prazo');
      expect(situacaoRotulo('ABERTO')).toBe('Ainda não finalizou');
      expect(situacaoRotulo('EM_ANDAMENTO')).toBe('Mês em andamento');
    });

    it('desconhecida ou desligada mostra um traço', () => {
      expect(situacaoRotulo('DESATIVADO')).toBe('—');
      expect(situacaoRotulo(null)).toBe('—');
    });
  });

  describe('pendentes', () => {
    it('lista só quem ainda não finalizou (mês acabou, prazo aberto)', () => {
      const r = resumo({
        motoristas: [
          motorista('Ana', 'CONFIRMADO'),
          motorista('Bruno', 'ABERTO'),
          motorista('Carlos', 'FECHADO'),
          motorista('Diana', 'ABERTO'),
        ],
      });

      expect(pendentes(r)).toEqual({ itens: ['Bruno', 'Diana'], restantes: 0 });
    });

    it('limita as linhas e diz quantos faltaram', () => {
      const r = resumo({ motoristas: Array.from({ length: 12 }, (_, i) => motorista(`M${i}`, 'ABERTO')) });

      const p = pendentes(r, 8);

      expect(p.itens.length).toBe(8);
      expect(p.restantes).toBe(4);
    });

    it('sem resposta não tem pendentes', () => {
      expect(pendentes(null)).toEqual({ itens: [], restantes: 0 });
    });
  });
});
