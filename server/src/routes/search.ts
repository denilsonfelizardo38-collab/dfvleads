import { Router } from 'express';
import { supabaseAdmin, getAuthUser } from '../services/supabaseAdmin.ts';
import { classifyLead } from '../services/leadStatus.ts';
import { placesSearchText } from '../services/googlePlaces.ts';
import { buscarLugaresOsm } from '../services/openStreetMap.ts';
import { sondarLote } from '../services/siteProbe.ts';
import { config, CUSTO_BUSCA, planoPelaChave } from '../env.ts';
import { telefoneCoerente, paisDaBusca } from '../services/telefoneValido.ts';
import { HttpError, badRequest, cleanText } from '../lib/http.ts';
import type { AuthedRequest, LeadDTO, PlaceCandidate } from '../types.ts';

export const searchRouter = Router();

/** GET /api/me — perfil (créditos, plano, cotas, validade) para o dashboard. */
searchRouter.get('/me', async (request, response, next) => {
  try {
    const user = await getAuthUser(request);
    if (!user) throw new HttpError(401, 'Sessão inválida ou expirada.');

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('plan, credits, total_searches, total_leads, is_admin, blocked, plan_expires, sites_used, searches_used, period_start, full_name')
      .eq('user_id', user.id)
      .single();

    if (error || !data) throw new HttpError(500, 'Perfil não encontrado. Rode supabase/schema.sql e a migração de admin/billing.');

    const plano = planoPelaChave(data.plan);
    const expirado = !data.plan_expires || new Date(data.plan_expires) < new Date();
    response.json({
      email: user.email ?? '',
      nome: (data.full_name as string | null) ?? '',
      plan: data.plan,
      credits: data.credits,
      totalSearches: data.total_searches,
      totalLeads: data.total_leads,
      isAdmin: data.is_admin ?? false,
      blocked: data.blocked ?? false,
      planoInfo: plano ? { nome: plano.nome, pesquisas: plano.pesquisas, sites: plano.sites, precoUsd: plano.precoUsd } : null,
      sitesUsed: data.sites_used ?? 0,
      searchesUsed: data.searches_used ?? 0,
      planExpires: data.plan_expires,
      planoAtivo: Boolean(plano && !expirado),
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/search — executa a busca, dedupe, debita créditos e persiste. */
searchRouter.post('/search', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');

    const niche = cleanText(request.body?.niche, 60);
    const city = cleanText(request.body?.city, 60);
    const radiusKm =
      Number.isFinite(request.body?.radiusKm) && Number(request.body?.radiusKm) > 0
        ? Math.min(500, Math.round(Number(request.body.radiusKm)))
        : null;

    if (niche.length < 2) throw badRequest('Informe um nicho (ex.: barbearia, dentista, pizzaria).');
    if (city.length < 2) throw badRequest('Informe uma cidade.');

    // ── Perfil e saldo ────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();
    if (profileError || !profile) throw new HttpError(500, 'Perfil não encontrado.');

    // ── Fonte de empresas: Google Places (se houver chave) ou OpenStreetMap (grátis, sem chave) ──
    const { places: todas, aviso }: { places: PlaceCandidate[]; aviso?: string } = config.googleMapsApiKey
      ? await placesSearchText(`${niche} em ${city}`)
      : await buscarLugaresOsm(niche, city);
    // Regra do produto: mantemos APENAS empresas sem site — quem já tem
    // site nem entra na lista, e não há cobrança por elas.
    const semSiteAparente = todas.filter((place) => classifyLead(place.website) !== 'HAS_SITE');
    const comSiteAparente = todas.length - semSiteAparente.length;

    // ── Sonda de sites escondidos ─────────────────────────────────
    // Empresas cujo campo site no Maps aponta para rede social (ou vazio)
    // mas que TÊM site próprio (ex.: "Beleza Divina" com belezadivina.com).
    // A sonda testa domínios derivados do nome e valida o conteúdo; quem
    // tem site é descartada como HAS_SITE — não entra na lista nem cobrar.
    // Medição: o que pesa na espera é a sonda de sites escondidos.
    const inicioSonda = Date.now();
    const sitesDescobertos = await sondarLote(semSiteAparente);
    console.log(
      `[sonda] ${semSiteAparente.length} leads testados em ${((Date.now() - inicioSonda) / 1000).toFixed(1)}s — ${sitesDescobertos.size} site(s) escondido(s) descoberto(s)`,
    );
    const semSite = semSiteAparente.filter((place) => !sitesDescobertos.has(place.placeId));
    const descobertosComSite = semSiteAparente.length - semSite.length;
    const descartadasComSite = comSiteAparente + descobertosComSite;

    // Regra do produto: sem telefone não há prospecção — e o número tem de
    // ser REAL e COERENTE com o negócio: estrutura válida de país, sem lixo
    // (0800, placeholders, repetições) e do MESMO país da cidade buscada.
    // Número estrangeiro para loja local = dado errado, descartado.
    const comTelefone = semSite.filter((place) => Boolean(place.phone?.trim()));
    const semTelefone = semSite.length - comTelefone.length;
    const paisAlvo = paisDaBusca(city);
    const places = comTelefone.filter((place) => {
      const veredito = telefoneCoerente(place.phone);
      if (veredito.lixo || veredito.pais === null) return false;
      // Cidade fora da lista conhecida: aceita qualquer estrutura válida.
      return paisAlvo === '' || veredito.pais === paisAlvo;
    });
    const descartadasTelefoneInvalido = comTelefone.length - places.length;
    const descartadasSemTelefone = semTelefone + descartadasTelefoneInvalido;
    if (places.length === 0) {
      throw new HttpError(
        404,
        `Nenhuma empresa sem site e COM telefone real encontrada (${descartadasComSite} tinham site, ${semTelefone} não tinham telefone e ${descartadasTelefoneInvalido} tinham número inválido/de outro país — todas ignoradas). Tente outro nicho/cidade.`,
      );
    }

    // ── Dedupe: places já retornados em buscas anteriores do usuário ──
    const placeIds = places.map((place) => place.placeId);
    const { data: seenRows } = await supabaseAdmin
      .from('leads')
      .select('place_id')
      .eq('user_id', user.id)
      .in('place_id', placeIds);
    const seenSet = new Set((seenRows ?? []).map((row) => row.place_id as string));

    // ── Montagem das linhas a persistir ───────────────────────────
    const rows: Record<string, unknown>[] = [];
    for (const place of places) {
      rows.push({
        search_id: '',
        user_id: user.id,
        place_id: place.placeId,
        name: place.name,
        phone: place.phone,
        address: place.address,
        website: place.website,
        rating: place.rating,
        reviews: place.reviews,
        lat: place.lat,
        lng: place.lng,
        status: classifyLead(place.website),
        payload: { raw: place },
      });
    }

    const newLeads = places.filter((place) => !seenSet.has(place.placeId)).length;

    // ── Créditos ──────────────────────────────────────────────────
    // Modelo: 1 crédito = 1 busca, não importa quantos leads ela traga.
    if (profile.credits < CUSTO_BUSCA) {
      response.status(402).json({
        error: `Cada busca consome ${CUSTO_BUSCA} crédito e você tem ${profile.credits}. Faça upgrade para continuar.`,
        needUpgrade: true,
        credits: profile.credits,
      });
      return;
    }

    // ── Persistência (search + leads + perfil) ────────────────────
    const { data: searchRow, error: searchError } = await supabaseAdmin
      .from('searches')
      .insert({ user_id: user.id, niche, city, radius_km: radiusKm, lead_count: places.length })
      .select('id, niche, city, radius_km, lead_count, created_at')
      .single();
    if (searchError || !searchRow) throw new HttpError(500, 'Falha ao salvar a busca.');

    const searchId = searchRow.id as string;
    for (const row of rows) row.search_id = searchId;

    // Insert com select: devolve os UUIDs gerados (mesmos ids usados no
    // histórico e no export CSV).
    const { data: insertedRows, error: leadsError } = await supabaseAdmin
      .from('leads')
      .insert(rows)
      .select('id, place_id, name, phone, address, website, rating, reviews, status, lat, lng');
    if (leadsError) throw new HttpError(500, `Falha ao salvar leads: ${leadsError.message}`);

    const leads: LeadDTO[] = (insertedRows ?? []).map((row) => ({
      id: row.id as string,
      placeId: row.place_id as string,
      name: row.name as string,
      phone: (row.phone as string | null) ?? null,
      address: (row.address as string | null) ?? null,
      website: (row.website as string | null) ?? null,
      rating: row.rating == null ? null : Number(row.rating),
      reviews: (row.reviews as number | null) ?? null,
      status: row.status as LeadDTO['status'],
      seen: seenSet.has(row.place_id as string),
      lat: (row.lat as number | null) ?? null,
      lng: (row.lng as number | null) ?? null,
    }));

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        credits: profile.credits - CUSTO_BUSCA,
        // A busca e os leads já foram inseridos acima, então os counts já os incluem.
        total_searches: await countUserSearches(user.id),
        total_leads: await countUserLeads(user.id),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
    if (updateError) throw new HttpError(500, 'Falha ao atualizar créditos.');

    response.json({
      search: {
        id: searchId,
        niche,
        city,
        radiusKm,
        leadCount: leads.length,
        createdAt: searchRow.created_at,
      },
      creditsUsed: CUSTO_BUSCA,
      creditsRemaining: profile.credits - CUSTO_BUSCA,
      summary: {
        total: leads.length,
        newLeads,
        alreadySeen: leads.length - newLeads,
        noSite: leads.length, // filtro: só sem site entra na lista
        socialOnly: leads.filter((lead) => lead.status === 'SOCIAL_ONLY').length,
        hasSite: 0,
        ignoradasComSite: descartadasComSite,
        ignoradasSemTelefone: descartadasSemTelefone,
        aviso,
      },
      leads,
    });
  } catch (error) {
    next(error);
  }
});

/** PATCH /me — atualiza dados do perfil (nome exibido no dashboard). */
searchRouter.patch('/me', async (request, response, next) => {
  try {
    const user = await getAuthUser(request);
    if (!user) throw new HttpError(401, 'Sessão inválida ou expirada.');

    const nome = cleanText(request.body?.nome, 80);
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: nome || null, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (error) throw new HttpError(500, 'Falha ao atualizar o perfil. Rode supabase/migration_admin_billing.sql.');
    response.json({ ok: true, nome });
  } catch (error) {
    next(error);
  }
});

async function countUserSearches(userId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('searches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}

async function countUserLeads(userId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}
