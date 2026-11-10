import { ConferenciaMotoristaCaminhaoLinha, ConferenciaPessoa } from '../../core/api/conferencia-api.models';

function motorista(p: ConferenciaPessoa | null | undefined): string {
  if (!p?.codigoMotorista && !p?.nomeMotorista) return 'sem motorista';
  return [p?.codigoMotorista, p?.nomeMotorista].filter(Boolean).join(' - ');
}

function veiculo(p: ConferenciaPessoa | null | undefined): string {
  if (!p?.codigoVeiculo && !p?.placa) return 'sem caminhão';
  return [p?.codigoVeiculo, p?.placa].filter(Boolean).join(' - ');
}

/** "Hoje" no FrotaPRO, do jeito que a tela mostra. */
export function motoristaAtual(linha: ConferenciaMotoristaCaminhaoLinha): string {
  return motorista(linha.atualNoFrota);
}

export function caminhaoAtual(linha: ConferenciaMotoristaCaminhaoLinha): string {
  return veiculo(linha.atualNoFrota);
}

/** O que "Confirmar" vai fazer, em frases curtas (uma por troca). */
export function resumoDaMudanca(linha: ConferenciaMotoristaCaminhaoLinha): string[] {
  const frases: string[] = [];

  if (linha.trocarMotorista) {
    const novo = [linha.codigoMotoristaNovo, linha.nomeMotoristaNovo].filter(Boolean).join(' - ')
      || `${linha.carregamento?.codigoMotorista ?? '?'} (não cadastrado)`;
    frases.push(`Motorista: ${motoristaAtual(linha)} → ${novo}`);
  }

  if (linha.trocarCaminhao) {
    const novo = [linha.codigoCaminhaoNovo, linha.placaCaminhaoNovo].filter(Boolean).join(' - ')
      || `${linha.carregamento?.codigoVeiculo ?? '?'} (não cadastrado)`;
    frases.push(`Caminhão: ${caminhaoAtual(linha)} → ${novo}`);
  }

  return frases;
}

/** Texto da pergunta antes de confirmar. */
export function perguntaDeConfirmacao(linha: ConferenciaMotoristaCaminhaoLinha): string {
  return [
    `Confirmar a troca na carga ${linha.numeroCarga}?`,
    '',
    ...resumoDaMudanca(linha),
    '',
    'A carga ficará marcada como "definida manualmente" e a sincronização não desfaz.',
  ].join('\n');
}
