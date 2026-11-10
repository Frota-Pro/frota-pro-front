import { ConferenciaMotoristaCaminhaoLinha } from '../../core/api/conferencia-api.models';
import { perguntaDeConfirmacao, resumoDaMudanca } from './conferencia.utils';

function linhaDoCasoReal(parcial: Partial<ConferenciaMotoristaCaminhaoLinha> = {}): ConferenciaMotoristaCaminhaoLinha {
  return {
    numeroCarga: 'CAR-001178',
    numeroCargaExterno: '422812',
    statusCarga: 'SINCRONIZADA',
    iniciada: false,
    manifesto: { numMdfe: 33288, codigoMotorista: '29', codigoVeiculo: '86', placa: 'QFF6539' },
    carregamento: { codigoMotorista: '378', nomeMotorista: 'MARTINHO', codigoVeiculo: '253', placa: 'ABC1D23' },
    atualNoFrota: {
      codigoMotorista: 'MOT-000015',
      nomeMotorista: 'MARTINHO DE SOUSA SA',
      codigoVeiculo: 'CAM-000011',
      placa: 'QFF6539',
    },
    motoristaDefinidoManualmente: true,
    caminhaoDefinidoManualmente: false,
    trocarMotorista: false,
    trocarCaminhao: true,
    codigoCaminhaoNovo: 'CAM-000040',
    placaCaminhaoNovo: 'ABC1D23',
    podeConfirmar: true,
    transferencias: [],
    ...parcial,
  };
}

describe('conferencia.utils', () => {
  it('resume só o que vai mudar (caso real: só o caminhão)', () => {
    expect(resumoDaMudanca(linhaDoCasoReal())).toEqual(['Caminhão: CAM-000011 - QFF6539 → CAM-000040 - ABC1D23']);
  });

  it('resume motorista e caminhão quando os dois mudam', () => {
    const frases = resumoDaMudanca(
      linhaDoCasoReal({
        trocarMotorista: true,
        codigoMotoristaNovo: 'MOT-000099',
        nomeMotoristaNovo: 'FULANO',
      }),
    );
    expect(frases).toEqual([
      'Motorista: MOT-000015 - MARTINHO DE SOUSA SA → MOT-000099 - FULANO',
      'Caminhão: CAM-000011 - QFF6539 → CAM-000040 - ABC1D23',
    ]);
  });

  it('avisa quando o cadastro novo não existe no FrotaPRO', () => {
    const frases = resumoDaMudanca(
      linhaDoCasoReal({ codigoCaminhaoNovo: null, placaCaminhaoNovo: null, podeConfirmar: false }),
    );
    expect(frases[0]).toContain('253 (não cadastrado)');
  });

  it('a pergunta de confirmação cita a carga e a troca', () => {
    const pergunta = perguntaDeConfirmacao(linhaDoCasoReal());
    expect(pergunta).toContain('CAR-001178');
    expect(pergunta).toContain('CAM-000040');
    expect(pergunta).toContain('definida manualmente');
  });
});
