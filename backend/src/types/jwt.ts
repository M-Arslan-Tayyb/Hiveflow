/**
 * Payload signed into / verified from JWTs.
 * Access tokens carry userId + email; refresh tokens carry only userId.
 */
export interface JwtPayload {
  userId: string;
  email?: string;
}
