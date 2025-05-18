import { Role } from 'src/roles/enums/role.enum'


export interface JwtPayload {
  sub: string;      // 사용자 ID (subject)
  email: string;    // 사용자 이메일
  roles: Role[];    // 사용자 역할
  jti: string;      // JWT ID (토큰 고유 식별자)
  iat?: number;     // 발행 시간 (issued at)
  exp?: number;     // 만료 시간 (expiration time)
}

export interface RefreshTokenPayload {
  sub: string;      // 사용자 ID (subject)
  jti: string;      // JWT ID (토큰 고유 식별자)
  iat?: number;     // 발행 시간
  exp?: number;     // 만료 시간
}
