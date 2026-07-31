import crypto from 'crypto';
import { AuthUserResponse, TokenPayload, UserRole } from '../types/auth';

const PASSWORD_SEPARATOR = ':';
const TOKEN_EXPIRATION_IN_SECONDS = 60 * 60 * 24;

function getJwtSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error('A variável AUTH_JWT_SECRET precisa estar configurada no .env');
  }

  return secret;
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value: string): string {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalizedValue.length % 4 === 0 ? '' : '='.repeat(4 - (normalizedValue.length % 4));

  return Buffer.from(`${normalizedValue}${padding}`, 'base64').toString('utf-8');
}

function signTokenContent(content: string): string {
  return crypto
    .createHmac('sha256', getJwtSecret())
    .update(content)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function secureCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');

  return `${salt}${PASSWORD_SEPARATOR}${hash}`;
}

export function comparePassword(password: string, passwordHash: string): boolean {
  const [salt, storedHash] = passwordHash.split(PASSWORD_SEPARATOR);

  if (!salt || !storedHash) {
    return false;
  }

  const currentHash = crypto.scryptSync(password, salt, 64).toString('hex');

  return secureCompare(storedHash, currentHash);
}

export function normalizeUserRole(role: unknown): UserRole {
  return role === 'admin' ? 'admin' : 'user';
}

export function createToken(user: AuthUserResponse): string {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: normalizeUserRole(user.role),
    iat: nowInSeconds,
    exp: nowInSeconds + TOKEN_EXPIRATION_IN_SECONDS,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const content = `${encodedHeader}.${encodedPayload}`;
  const signature = signTokenContent(content);

  return `${content}.${signature}`;
}

export function verifyToken(token: string): TokenPayload {
  const [encodedHeader, encodedPayload, signature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Token inválido');
  }

  const content = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = signTokenContent(content);

  if (!secureCompare(signature, expectedSignature)) {
    throw new Error('Token inválido');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<TokenPayload>;
  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (!payload.sub || !payload.email || !payload.name || !payload.exp || !payload.iat) {
    throw new Error('Token inválido');
  }

  if (payload.exp < nowInSeconds) {
    throw new Error('Token expirado');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    role: normalizeUserRole(payload.role),
    iat: payload.iat,
    exp: payload.exp,
  };
}
