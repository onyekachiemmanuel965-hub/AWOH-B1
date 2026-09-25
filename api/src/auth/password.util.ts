import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

const WEAK_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  'qwerty123',
  'letmein1',
  'admin123',
  'welcome1',
  'changeme',
  'awohb123',
]);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/** MVP password policy — keep rules opaque in public error messages. */
export function isPasswordAcceptable(password: string): boolean {
  if (typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 128) return false;
  if (/\s/.test(password)) return false;
  if (WEAK_PASSWORDS.has(password.toLowerCase())) return false;
  // Require at least one letter and one number for basic strength
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return false;
  return true;
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
