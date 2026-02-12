export interface UsuarioResponse {
  id: string;
  login: string;
  nome: string;
  ativo: boolean;
  acessos: string[];
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
