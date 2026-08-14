export interface LoginRequest {
  login: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
  mustChangePassword: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
