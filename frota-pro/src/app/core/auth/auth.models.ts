export interface LoginRequest {
  login: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
}
