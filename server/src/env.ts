import dotenv from 'dotenv';
// Carrega o .env da raiz E o server/.env (sem sobrescrever o que já existe).
// Rodar da raiz (npm run dev) ou de server/ funciona dos dois jeitos.
dotenv.config();
dotenv.config({ path: 'server/.env' });
import type { Config } from './types.ts';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(`[env] variável ausente: ${name} — verifique server/.env`);
    return '';
  }
  return value;
}

export const config: Config = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  // Fonte de empresas opcional: com chave usa Google Places; sem chave o app
  // usa OpenStreetMap (grátis, sem cadastro). Buscas funcionam dos dois jeitos.
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
  llmApiKey: process.env.LLM_API_KEY ?? '',
  llmBaseUrl: (process.env.LLM_BASE_URL ?? 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
  llmModelo: process.env.LLM_MODELO ?? 'openai/gpt-oss-120b',
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY ?? '',
  // Pagamento automático: URL pública do app para os retornos/webhooks.
  appBaseUrl: (process.env.APP_BASE_URL ?? '').replace(/\/$/, ''),
  paypalClientId: process.env.PAYPAL_CLIENT_ID ?? '',
  paypalSecret: process.env.PAYPAL_SECRET ?? '',
  paypalSandbox: (process.env.PAYPAL_SANDBOX ?? 'true') === 'true',
  binancePayKey: process.env.BINANCE_PAY_KEY ?? '',
  binancePaySecret: process.env.BINANCE_PAY_SECRET ?? '',
  /** Prazo global das buscas OSM (ms). Vercel: 45000 (limite de 60 s/função). */
  overpassPrazoMs: Number(process.env.OVERPASS_PRAZO_MS ?? 100000),
};

export const SEARCH_RATE_LIMIT_PER_HOUR = 10;
/** Modelo de créditos: 1 crédito = 1 busca (com todos os leads que ela encontrar). */
export const CUSTO_BUSCA = 1;
/** Exportar o CSV dos leads consome esta quantidade de créditos. */
export const CUSTO_EXPORT_CSV = 3;
/** Gerar um site consome créditos de GERAÇÃO (diferente das buscas). */
export const CUSTO_GERAR_SITE = 1;
/**
 * Trial de contas novas: 1 busca + 1 site grátis (perfil nasce com 1 crédito
 * e sites_used = 0; o limite de sites do trial é verificado na geração).
 */
export const TRIAL_PESQUISAS = 1;
export const TRIAL_SITES = 1;

/** WhatsApp do Denilson — destino da confirmação de pagamento. */
export const WHATSAPP_ADMIN = '258879101185';

/**
 * Planos mensais (USD). Pesquisas e sites são cotas do PERÍODO (30 dias a
 * partir da ativação); buscas e gerações debitem das cotas. O cron diário
 * zera tudo quando o plano vence.
 */
export interface Plano {
  key: string;
  nome: string;
  precoUsd: number;
  pesquisas: number;   // buscas por período
  sites: number;       // gerações de site por período
  destaque?: boolean;
}

export const PLANOS: Plano[] = [
  { key: 'plano10', nome: 'Starter', precoUsd: 10, pesquisas: 100, sites: 4 },
  { key: 'plano30', nome: 'Business', precoUsd: 30, pesquisas: 200, sites: 15, destaque: true },
  { key: 'plano75', nome: 'Agência', precoUsd: 75, pesquisas: 600, sites: 35 },
];

export function planoPelaChave(key: string): Plano | undefined {
  return PLANOS.find((p) => p.key === key);
}
