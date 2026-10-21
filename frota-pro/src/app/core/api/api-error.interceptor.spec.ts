import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { apiErrorInterceptor } from './api-error.interceptor';

describe('apiErrorInterceptor', () => {
  let http: HttpClient;
  let mock: HttpTestingController;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['error']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toast },
      ],
    });
    http = TestBed.inject(HttpClient);
    mock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => mock.verify());

  /** Dispara uma requisição que falha e espera o toast (a leitura da mensagem é assíncrona). */
  async function falhar(url: string, body: any, status: number, method: 'get' | 'post' = 'get') {
    let erro: any;
    const req$ = method === 'get' ? http.get(url) : http.post(url, {});
    req$.subscribe({ error: (e) => (erro = e) });
    mock.expectOne(url).flush(body, { status, statusText: 'x' });
    await new Promise((r) => setTimeout(r, 0));
    return erro;
  }

  describe('mensagem do backend', () => {
    it('mostra o campo message', async () => {
      await falhar('/api/x', { message: 'Carga já finalizada' }, 400);

      expect(toast.error).toHaveBeenCalledWith('Carga já finalizada', 'Não foi possível concluir');
    });

    it('usa error, detail, details e title quando message não existe', async () => {
      await falhar('/api/x', { error: 'do error' }, 400);
      expect(toast.error).toHaveBeenCalledWith('do error', jasmine.any(String));

      toast.error.calls.reset();
      await falhar('/api/x', { detail: 'do detail' }, 400);
      expect(toast.error).toHaveBeenCalledWith('do detail', jasmine.any(String));

      toast.error.calls.reset();
      await falhar('/api/x', { title: 'do title' }, 400);
      expect(toast.error).toHaveBeenCalledWith('do title', jasmine.any(String));
    });

    it('corpo em texto simples vira a mensagem', async () => {
      await falhar('/api/x', 'Texto direto do servidor', 400);

      expect(toast.error).toHaveBeenCalledWith('Texto direto do servidor', jasmine.any(String));
    });

    it('um erro de campo mostra campo: mensagem', async () => {
      await falhar('/api/x', { errors: [{ field: 'kmInicial', message: 'deve ser maior que zero' }] }, 400);

      expect(toast.error).toHaveBeenCalledWith('kmInicial: deve ser maior que zero', jasmine.any(String));
    });

    it('vários erros viram lista e mostram no máximo quatro', async () => {
      const errors = ['a', 'b', 'c', 'd', 'e', 'f'].map((m) => ({ message: m }));

      await falhar('/api/x', { errors }, 400);

      expect(toast.error).toHaveBeenCalledWith('a\n• b\n• c\n• d', jasmine.any(String));
    });

    it('junta errors, fieldErrors e violations', async () => {
      await falhar('/api/x', {
        errors: [{ message: 'um' }],
        fieldErrors: [{ field: 'f', message: 'dois' }],
        violations: [{ message: 'tres' }],
      }, 400);

      expect(toast.error).toHaveBeenCalledWith('um\n• f: dois\n• tres', jasmine.any(String));
    });

    it('lê a mensagem de uma resposta em Blob (download que falhou)', async () => {
      let erro: any;
      http.get('/api/pdf', { responseType: 'blob' }).subscribe({ error: (e) => (erro = e) });
      const blob = new Blob([JSON.stringify({ message: 'Relatório sem dados' })], { type: 'application/json' });
      mock.expectOne('/api/pdf').flush(blob, { status: 400, statusText: 'Bad Request' });
      await new Promise((r) => setTimeout(r, 20));

      expect(toast.error).toHaveBeenCalledWith('Relatório sem dados', jasmine.any(String));
      expect(erro.status).toBe(400);
    });
  });

  describe('mensagem por status quando o backend não explica', () => {
    const casos: [number, string][] = [
      [0, 'Sem conexão com a API (verifique o servidor e sua internet).'],
      [400, 'Requisição inválida. Verifique os campos informados.'],
      [403, 'Acesso negado.'],
      [404, 'Recurso não encontrado.'],
      [409, 'Conflito ao salvar. Verifique dados duplicados.'],
      [500, 'Erro interno no servidor.'],
      [503, 'Erro interno no servidor.'],
      [418, 'Erro inesperado.'],
    ];

    for (const [status, texto] of casos) {
      it(`status ${status}`, async () => {
        await falhar('/api/x', null, status);

        expect(toast.error).toHaveBeenCalledWith(texto, 'Não foi possível concluir');
      });
    }
  });

  describe('quando não mostra aviso', () => {
    it('401 fica para o interceptador de autenticação', async () => {
      const erro = await falhar('/api/x', {}, 401);

      expect(toast.error).not.toHaveBeenCalled();
      expect(erro.status).toBe(401);
    });

    it('rotas de login, renovação e logout não geram aviso', async () => {
      await falhar('/api/login', { message: 'Credenciais inválidas' }, 400, 'post');
      await falhar('/api/login/refresh', {}, 500, 'post');
      await falhar('/api/login/logout', {}, 500, 'post');

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('409 de confirmação de abastecimento tem diálogo próprio', async () => {
      const erro = await falhar('/api/abastecimento', { avisos: ['Preço acima da média'] }, 409, 'post');

      expect(toast.error).not.toHaveBeenCalled();
      expect(erro.status).toBe(409);
    });

    it('409 comum (sem avisos) mostra o aviso', async () => {
      await falhar('/api/x', {}, 409);

      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  it('o erro original sempre continua chegando para quem chamou', async () => {
    const erro = await falhar('/api/x', { message: 'ruim' }, 400);

    expect(erro.status).toBe(400);
    expect(erro.error.message).toBe('ruim');
  });
});
