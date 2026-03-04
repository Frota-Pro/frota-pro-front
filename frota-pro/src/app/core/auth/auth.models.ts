export interface LoginRequest {
  login: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
