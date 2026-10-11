import { z } from 'zod';
import { HttpError } from './http.ts';

/**
 * Validação de entrada com zod. Faz parse do corpo; em falha lança 400 com
 * mensagem fixa em português (as regras semânticas específicas continuam nos
 * handlers, com as suas mensagens próprias).
 */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown, mensagem: string): T {
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) throw new HttpError(400, mensagem);
  return parsed.data;
}

/** POST /api/search */
export const buscaSchema = z.object({
  niche: z.string().min(1).max(60),
  city: z.string().min(1).max(60),
  radiusKm: z.number().finite().positive().max(500).nullish(),
});

/** POST /api/billing/pagamentos (confirmação manual via WhatsApp) */
export const pagamentoSchema = z.object({
  planKey: z.string().min(1).max(40),
  metodo: z.string().trim().toLowerCase().default('binance'),
  referencia: z.string().trim().min(4).max(120),
});

/** POST /api/billing/checkout/* */
export const checkoutSchema = z.object({
  planKey: z.string().min(1).max(40),
});

/** PATCH /api/me */
export const nomeSchema = z.object({
  nome: z.string().trim().max(80).nullish(),
});

/** POST /api/export */
export const exportSchema = z.object({
  leadIds: z.array(z.string().min(1).max(100)).min(1).max(1000),
});
