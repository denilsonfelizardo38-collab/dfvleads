import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Log estruturado de acessos (1 linha JSON por requisição) + id de
 * correlação, reutilizado pelo errorHandler nos erros 500.
 */
export function requestLog(request: Request, response: Response, next: NextFunction): void {
  const id = randomUUID().slice(0, 8);
  (request as typeof request & { requestId?: string }).requestId = id;
  const inicio = Date.now();
  response.on('finish', () => {
    const linha = {
      t: 'http',
      id,
      method: request.method,
      path: request.path,
      status: response.statusCode,
      ms: Date.now() - inicio,
    };
    if (response.statusCode >= 500) console.error(JSON.stringify(linha));
    else console.log(JSON.stringify(linha));
  });
  next();
}
