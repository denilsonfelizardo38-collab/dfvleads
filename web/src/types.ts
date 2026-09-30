// Tipos compartilhados entre frontend e API.

export type LeadStatus = 'NO_SITE' | 'SOCIAL_ONLY' | 'HAS_SITE';

export type Plan = 'free' | 'plano10' | 'plano30' | 'plano75';

/** Plano do catálogo (GET /api/billing/planos). */
export interface PlanoCatalogo {
  key: string;
  nome: string;
  precoUsd: number;
  pesquisas: number;
  sites: number;
  destaque?: boolean;
}

export interface PagamentoPedido {
  id: string;
  plan_key: string;
  amount_usd: number;
  metodo: string;
  referencia: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string | null;
}

export interface Notificacao {
  id: string;
  titulo: string;
  corpo: string;
  read: boolean;
  created_at: string;
}

export interface AdminUsuario {
  user_id: string;
  email: string;
  plan: string;
  plan_expires: string | null;
  credits: number;
  sites_used: number;
  searches_used: number;
  blocked: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface AdminStats {
  usuarios: number;
  bloqueados: number;
  pagamentosPendentes: number;
  pagamentosAprovados: number;
  sitesGerados: number;
  buscasTotais: number;
}

export interface Lead {
  id: string;
  placeId: string;
  name: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  status: LeadStatus;
  seen: boolean;
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

export interface SearchRecord {
  id: string;
  niche: string;
  city: string;
  radiusKm: number | null;
  leadCount: number;
  createdAt: string;
}

export interface SearchResponse {
  search: SearchRecord;
  creditsUsed: number;
  creditsRemaining: number;
  summary: SearchSummary;
  leads: Lead[];
}

export interface Profile {
  email: string;
  plan: Plan;
  credits: number;
  totalSearches: number;
  totalLeads: number;
  isAdmin?: boolean;
  blocked?: boolean;
  planoInfo?: { nome: string; pesquisas: number; sites: number; precoUsd: number } | null;
  sitesUsed?: number;
  searchesUsed?: number;
  planExpires?: string | null;
  planoAtivo?: boolean;
}

export const STATUS_META: Record<
  LeadStatus,
  { cor: string; label: string; short: string; chip: string; rowTone: string }
> = {
  NO_SITE: {
    cor: 'bg-red-400',
    label: 'Sem site',
    short: 'Sem site',
    chip: 'bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/30',
    rowTone: 'bg-red-500/[0.04]',
  },
  SOCIAL_ONLY: {
    cor: 'bg-amber-400',
    label: 'Só redes sociais',
    short: 'Só redes',
    chip: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/30',
    rowTone: 'bg-amber-500/[0.04]',
  },
  HAS_SITE: {
    cor: 'bg-slate-400',
    label: 'Tem site',
    short: 'Tem site',
    chip: 'bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/30',
    rowTone: 'opacity-50',
  },
};
