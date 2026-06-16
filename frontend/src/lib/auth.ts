/**
 * auth.ts
 * Lightweight client-side auth using SHA-256 hashing + sessionStorage.
 * The plain-text password never lives in the code — only its hash.
 */

const SESSION_KEY = 'porcelanas_auth';

// SHA-256 hash of the access password (computed offline — never the plain text)
const VALID_USER  = 'admin';
const VALID_HASH  = 'acf19ca182de3ddff1509a8528cb333927eb21fbe27b93174bb6b642e19dbf22';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function tryLogin(username: string, password: string): Promise<boolean> {
  if (username.trim().toLowerCase() !== VALID_USER) return false;
  const hash = await sha256(password);
  if (hash !== VALID_HASH) return false;
  sessionStorage.setItem(SESSION_KEY, '1');
  return true;
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
