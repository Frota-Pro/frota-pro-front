export interface UsuarioResponse {
  id: string;
  login: string;
  nome: string;
  ativo: boolean;
  acessos: string[];
  // celular a que o motorista está vinculado (só o modelo; o identificador não sai da API)
  dispositivoVinculado?: boolean;
  dispositivoVinculadoNome?: string | null;
  dispositivoVinculadoEm?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface UsuarioCreateRequest {
  login: string;
  nome: string;
  senha: string;
  acessos?: string[];
  ativo?: boolean;
}

export interface UsuarioUpdateRequest {
  login: string;
  nome: string;
  acessos?: string[];
  ativo?: boolean;
}

export interface UsuarioSenhaUpdateRequest {
  novaSenha: string;
}

export interface UsuarioSenhaSelfRequest {
  senhaAtual: string;
  novaSenha: string;
}

export interface CredencialUsuarioCriado {
  nome: string;
  login: string;
  senhaInicial: string;
}

// Resposta de POST /usuario/motoristas: as senhas iniciais só vêm aqui, uma vez.
export interface UsuariosMotoristasCriadosResponse {
  mensagens: string[];
  credenciais: CredencialUsuarioCriado[];
}
