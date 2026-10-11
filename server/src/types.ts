// Tipos compartilhados do backend.

export interface Config {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  googleMapsApiKey: string;
  llmApiKey: string;
  llmBaseUrl: string;
  llmModelo: string;
  unsplashAccessKey: string;
  /** URL público do app (ex.: https://dfvleads.onrender.com) — pagamentos. */
  appBaseUrl: string;
  /** PayPal REST (sandbox ou live). Vazio = PayPal desativado. */
  paypalClientId: string;
  paypalSecret: string;
  paypalSandbox: boolean;
  paypalWebhookId: string;
  /** Binance Pay (Merchant). Vazio = Binance desativado. */
  binancePayKey: string;
  binancePaySecret: string;
  /** Prazo global das buscas OSM (ms) — menor na Vercel (60 s/função). */
  overpassPrazoMs: number;
}

export type LeadStatus = 'NO_SITE' | 'SOCIAL_ONLY' | 'HAS_SITE';

/** Resultado bruto do Google Places, antes de persistir. */
export interface PlaceCandidate {
  placeId: string;
  name: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  lat: number | null;
  lng: number | null;
}

export interface LeadDTO {
  id: string;
  placeId: string;
  name: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  status: LeadStatus;
  seen: boolean; // já retornado em busca anterior do usuário (dedupe)
  lat?: number | null;
  lng?: number | null;
}

export interface SearchRecord {
  id: string;
  niche: string;
  city: string;
  radiusKm: number | null;
  leadCount: number;
  createdAt: string;
}

export interface SearchSummary {
  total: number;
  newLeads: number;
  alreadySeen: number;
  noSite: number;
  socialOnly: number;
  hasSite: number;
  ignoradasComSite?: number;
  /** Descartadas por não ter telefone (regra: só entra lead com número). */
  ignoradasSemTelefone?: number;
  /** Aviso da fonte (ex.: país é área grande demais — buscar cidade específica). */
  aviso?: string;
}

export interface Profile {
  plan: 'free' | 'pro' | 'pro_max';
  credits: number;
  totalSearches: number;
  totalLeads: number;
}

export interface ProfileWithUser extends Profile {
  email: string;
}

/** Request já autenticado (middleware requireAuth injeta `user`). */
export interface AuthedRequest extends Express.Request {
  user?: { id: string; email: string };
}
