import { HttpErrorResponse } from '@angular/common/http';
import { extrairMensagemErro } from './api-error.util';

function erro(status: number, error?: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('extrairMensagemErro', () => {
  describe('mensagem que o backend já manda pronta', () => {
    it('junta a lista de erros de validação com bolinha', () => {
      const e = erro(400, { errors: [{ message: 'Km inválido' }, { message: 'Peso obrigatório' }] });

      expect(extrairMensagemErro(e)).toBe('Km inválido • Peso obrigatório');
    });

    it('aceita erros que são texto simples', () => {
      expect(extrairMensagemErro(erro(400, { errors: ['primeiro', 'segundo'] }))).toBe('primeiro • segundo');
    });

    it('ignora mensagens vazias ou que não são texto', () => {
      const e = erro(400, { errors: [{ message: '   ' }, { message: 42 }, { message: 'Só essa' }, null] });

      expect(extrairMensagemErro(e)).toBe('Só essa');
    });

    it('usa o campo error quando não há lista', () => {
      expect(extrairMensagemErro(erro(400, { error: 'O mês 2026-10 ainda não terminou' })))
        .toBe('O mês 2026-10 ainda não terminou');
    });

    it('usa o campo message quando não há lista nem error', () => {
      expect(extrairMensagemErro(erro(400, { message: 'Regra de negócio violada' })))
        .toBe('Regra de negócio violada');
    });

    it('a lista de erros tem prioridade sobre error e message', () => {
      const e = erro(400, { errors: [{ message: 'da lista' }], error: 'do error', message: 'do message' });

      expect(extrairMensagemErro(e)).toBe('da lista');
    });

    it('a mensagem do backend ganha da mensagem por status', () => {
      expect(extrairMensagemErro(erro(500, { error: 'Falha específica' }))).toBe('Falha específica');
    });
  });

  describe('mensagem amigável por status', () => {
    it('sem conexão', () => {
      expect(extrairMensagemErro(erro(0))).toContain('Sem conexão com o servidor');
    });

    it('401, 403, 404 e 409', () => {
      expect(extrairMensagemErro(erro(401))).toContain('sessão expirou');
      expect(extrairMensagemErro(erro(403))).toContain('não tem permissão');
      expect(extrairMensagemErro(erro(404))).toContain('Não encontramos');
      expect(extrairMensagemErro(erro(409))).toContain('já foi alterada');
    });

    it('erros de servidor', () => {
      for (const status of [500, 502, 503, 504]) {
        expect(extrairMensagemErro(erro(status))).toContain('O servidor teve um problema');
      }
    });

    it('corpo vazio ou texto simples cai na mensagem do status', () => {
      expect(extrairMensagemErro(erro(502, '<html>Bad Gateway</html>'))).toContain('O servidor teve um problema');
      expect(extrairMensagemErro(erro(404, { error: '   ' }))).toContain('Não encontramos');
    });
  });

  describe('último recurso', () => {
    it('status sem mensagem própria usa o fallback informado', () => {
      expect(extrairMensagemErro(erro(418), 'Não deu certo salvar')).toBe('Não deu certo salvar');
    });

    it('sem fallback usa a mensagem genérica', () => {
      expect(extrairMensagemErro(erro(418))).toBe('Ocorreu um erro ao processar a solicitação.');
    });

    it('aceita valores que nem são erro http', () => {
      expect(extrairMensagemErro(null)).toBe('Ocorreu um erro ao processar a solicitação.');
      expect(extrairMensagemErro(undefined, 'padrão')).toBe('padrão');
      expect(extrairMensagemErro('texto qualquer')).toBe('Ocorreu um erro ao processar a solicitação.');
    });

    it('nunca mostra o texto técnico do Angular', () => {
      const e = new HttpErrorResponse({ status: 0, url: 'http://x/api', statusText: 'Unknown Error' });

      expect(extrairMensagemErro(e)).not.toContain('Http failure response');
    });
  });
});
