import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message);
}

/** Helpers de sanitização/validação de entrada. */
export function cleanText(value: unknown, max = 80): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function isPositiveInt(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** Converte erros em JSON padronizado — deve ficar por último nas rotas. */
export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
): void {
  const status = typeof (error as { status?: number }).status === 'number'
    ? (error as { status: number }).status
    : 500;
  const message = error instanceof Error ? error.message : 'Erro interno.';
  if (status >= 500) {
    const id = (request as typeof request & { requestId?: string }).requestId ?? '-';
    console.error('[api]', id, error);
  }
  response.status(status).json({ error: message });
}
