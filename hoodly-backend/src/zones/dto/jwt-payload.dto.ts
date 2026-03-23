export interface JwtPayloadDto {
  sub: string;
  email?: string;
  [key: string]: unknown;
}
