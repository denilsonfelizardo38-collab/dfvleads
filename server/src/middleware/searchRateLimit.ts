import type { NextFunction, Request, Response } from 'express';
import { SEARCH_RATE_LIMIT_PER_HOUR } from '../env.ts';
import type { AuthedRequest } from '../types.ts';

interface Bucket {
  count: number;
  resetAt: number;
}

/** Em memória: máx. 10 buscas/hora por usuário (reinicia ao reiniciar o server). */
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60 * 60 * 1000;

// Faxina periódica: evita crescimento ilimitado do Map em produção.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref?.();

function currentBucket(userId: string): Bucket {
  const now = Date.now();
  const bucket = buckets.get(userId);
  if (!bucket || bucket.resetAt <= now) {
    const fresh: Bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(userId, fresh);
    return fresh;
  }
  return bucket;
}

export function searchRateLimit(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const user = (request as AuthedRequest).user;
  if (!user) {
    response.status(401).json({ error: 'Não autenticado.' });
    return;
  }

  const bucket = currentBucket(user.id);
  if (bucket.count >= SEARCH_RATE_LIMIT_PER_HOUR) {
    const minutes = Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 60000));
    response.status(429).json({
      error: `Limite de ${SEARCH_RATE_LIMIT_PER_HOUR} buscas por hora atingido. Tente novamente em ${minutes} min.`,
      retryAfterMinutes: minutes,
    });
    return;
  }

  bucket.count += 1;
  next();
}
