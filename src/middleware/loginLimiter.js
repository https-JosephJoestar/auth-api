// Limitador sencillo en memoria para frenar ataques de fuerza bruta al login.
// Cuenta los intentos fallidos por email y bloquea durante un tiempo.
// Nota: al reiniciar el servidor se pierde el conteo (para producción usaría Redis).
const MAX_ATTEMPTS = 5;
const BLOCK_MINUTES = 15;

const attempts = new Map();

export function isBlocked(email) {
  const entry = attempts.get(email);
  if (!entry) return false;

  if (entry.blockedUntil && entry.blockedUntil > Date.now()) {
    return true;
  }
  if (entry.blockedUntil && entry.blockedUntil <= Date.now()) {
    attempts.delete(email);
  }
  return false;
}

export function registerFailedAttempt(email) {
  const entry = attempts.get(email) || { count: 0, blockedUntil: null };
  entry.count++;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + BLOCK_MINUTES * 60 * 1000;
  }
  attempts.set(email, entry);
}

export function resetAttempts(email) {
  attempts.delete(email);
}
