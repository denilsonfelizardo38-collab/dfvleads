import { supabase } from './supabase.ts';

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export class ApiError extends Error {
  status: number;
  needUpgrade: boolean;

  constructor(status: number, message: string, needUpgrade = false) {
    super(message);
    this.status = status;
    this.needUpgrade = needUpgrade;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new ApiError(401, 'Sessão expirada. Faça login novamente.');

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `Erro ${response.status}`;
    const needUpgrade =
      typeof body === 'object' && body !== null && (body as { needUpgrade?: boolean }).needUpgrade === true;
    throw new ApiError(response.status, message, needUpgrade);
  }

  return body as T;
}

export const api = {
  getMe: () => request<import('../types.ts').Profile>('/me'),
  search: (input: { niche: string; city: string; radiusKm?: number | null }) =>
    request<import('../types.ts').SearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  history: () =>
    request<{ searches: import('../types.ts').SearchRecord[] }>('/history'),
  leads: (searchId: string) =>
    request<{ search: import('../types.ts').SearchRecord; leads: import('../types.ts').Lead[] }>(
      `/leads/${searchId}`,
    ),
  meusLeads: (options: { limite?: number; offset?: number; filtro?: string } = {}) => {
    const params = new URLSearchParams();
    if (options.limite) params.set('limite', String(options.limite));
    if (options.offset) params.set('offset', String(options.offset));
    if (options.filtro) params.set('filtro', options.filtro);
    const query = params.toString();
    return request<{ leads: import('../types.ts').LeadLista[]; total: number }>(
      `/leads${query ? `?${query}` : ''}`,
    );
  },
  meusSites: () => request<{ sites: import('../types.ts').SiteGerado[] }>('/landing-pages'),
  atualizarPerfil: (nome: string) =>
    request<{ ok: boolean; nome: string }>('/me', { method: 'PATCH', body: JSON.stringify({ nome }) }),
  consume: (input: { niche: string; city: string }) =>
    request<{ enough: boolean; billable: number; credits: number }>('/credits/consume', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  criarLandingPage: (leadId: string) =>
    request<{
      id: string;
      leadId: string;
      previewUrl: string;
      criadoEm: string;
      sitesRemaining?: number;
      analise: {
        negocio: string;
        tipo: string;
        modelo: string;
        clientes: string[];
        necessidades: string[];
        solucao: string;
        secoes: string[];
        funcionalidades: string[];
        moeda: string;
        idioma: string;
        arquitetura: string;
        design: string;
        correcoes: string[];
      } | null;
    }>('/landing-pages', { method: 'POST', body: JSON.stringify({ leadId }) }),
  downloadLandingPage: async (leadId: string): Promise<Blob> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new ApiError(401, 'Sessão expirada. Faça login novamente.');

    const response = await fetch(`${API_URL}/api/landing-pages/${leadId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new ApiError(response.status, `Falha ao baixar o site (${response.status}).`);
    return response.blob();
  },
  exportCsv: async (leadIds: string[]): Promise<Blob> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new ApiError(401, 'Sessão expirada. Faça login novamente.');

    const response = await fetch(`${API_URL}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ leadIds }),
    });
    if (!response.ok) throw new ApiError(response.status, `Falha ao exportar (${response.status}).`);
    return response.blob();
  },
  // ── Billing / planos ──────────────────────────────────────
  planos: () => request<{ planos: import('../types.ts').PlanoCatalogo[]; whatsappAdmin: string }>('/billing/planos'),
  metodosPagamento: () => request<{ paypal: boolean; binance: boolean }>('/billing/metodos'),
  checkoutPaypal: (planKey: string) =>
    request<{ pedidoId: string; aprovacaoUrl: string }>('/billing/checkout/paypal', {
      method: 'POST',
      body: JSON.stringify({ planKey }),
    }),
  checkoutBinance: (planKey: string) =>
    request<{ pedidoId: string; pagamentoUrl: string }>('/billing/checkout/binance', {
      method: 'POST',
      body: JSON.stringify({ planKey }),
    }),
  submeterPagamento: (input: { planKey: string; metodo: string; referencia: string }) =>
    request<{ id: string; whatsappUrl: string }>('/billing/pagamentos', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  meusPagamentos: () =>
    request<{ pagamentos: import('../types.ts').PagamentoPedido[] }>('/billing/meus-pagamentos'),
  notificacoes: () =>
    request<{ notificacoes: import('../types.ts').Notificacao[] }>('/notifications'),
  marcarLidas: () => request<{ ok: boolean }>('/notifications/lidas', { method: 'POST' }),
  // ── Publicar site ─────────────────────────────────────────
  publicarSite: (leadId: string, slug: string) =>
    request<{ ok: boolean; slug: string; url: string }>(`/landing-pages/${leadId}/publicar`, {
      method: 'POST',
      body: JSON.stringify({ slug }),
    }),
  // ── Admin ─────────────────────────────────────────────────
  adminStats: () => request<import('../types.ts').AdminStats>('/admin/stats'),
  adminUsuarios: (q = '') =>
    request<{ usuarios: import('../types.ts').AdminUsuario[] }>(`/admin/usuarios?q=${encodeURIComponent(q)}`),
  adminBloquear: (userId: string, blocked: boolean) =>
    request<{ ok: boolean }>(`/admin/usuarios/${userId}/bloquear`, { method: 'POST', body: JSON.stringify({ blocked }) }),
  adminCreditar: (userId: string, credits: number) =>
    request<{ ok: boolean; credits: number }>(`/admin/usuarios/${userId}/creditar`, { method: 'POST', body: JSON.stringify({ credits }) }),
  adminPagamentos: (status = 'pending') =>
    request<{ pedidos: (import('../types.ts').PagamentoPedido & { email: string; profiles?: { full_name?: string } | null })[] }>(
      `/admin/pagamentos?status=${status}`,
    ),
  adminDecidirPagamento: (id: string, aprovar: boolean) =>
    request<{ ok: boolean }>(`/admin/pagamentos/${id}/decidir`, { method: 'POST', body: JSON.stringify({ aprovar }) }),
  adminNotificar: (input: { userId: string | 'todos'; titulo: string; corpo: string }) =>
    request<{ ok: boolean; enviados?: number }>('/admin/notificar', { method: 'POST', body: JSON.stringify(input) }),
};
