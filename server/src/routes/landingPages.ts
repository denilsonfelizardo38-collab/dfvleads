import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import JSZip from 'jszip';
import { supabaseAdmin } from '../services/supabaseAdmin.ts';
import { gerarLandingPageComAnalise, type DadosEmpresa } from '../services/siteGenerator.ts';
import { HttpError } from '../lib/http.ts';
import { config, planoPelaChave, TRIAL_SITES } from '../env.ts';
import { carregarPerfil } from '../middleware/gate.ts';
import type { AuthedRequest } from '../types.ts';

/**
 * O <iframe> de prévia não envia Authorization. Assinamos o URL com HMAC
 * (lead + usuário + expiração de 1h) para a prévia abrir sem vazar JWT.
 */
function assinaturaPreview(leadId: string, userId: string): string {
  const expira = Date.now() + 3600_000;
  const carga = `${leadId}.${userId}.${expira}`;
  const mac = createHmac('sha256', config.supabaseServiceRoleKey).update(carga).digest('hex').slice(0, 32);
  return `${expira}.${mac}`;
}

function assinaturaValida(leadId: string, userId: string, st: string): boolean {
  const [expiraBruto, mac] = st.split('.');
  const expira = Number(expiraBruto);
  if (!Number.isFinite(expira) || expira < Date.now() || !mac) return false;
  const carga = `${leadId}.${userId}.${expira}`;
  const esperado = createHmac('sha256', config.supabaseServiceRoleKey).update(carga).digest('hex').slice(0, 32);
  try {
    return timingSafeEqual(Buffer.from(mac), Buffer.from(esperado));
  } catch {
    return false;
  }
}

/**
 * Cota de sites: contas novas têm 1 site de trial; plano pago tem a cota do
 * período. Cada geração consome 1 unidade de sites_used. Devolve quantos
 * sites ainda restam, para a interface.
 */
async function cobrarCotaSite(user_id: string): Promise<number> {
  const perfil = await carregarPerfil(user_id);
  const plano = planoPelaChave(perfil.plan);
  const planoPagoAtivo = Boolean(plano && perfil.plan_expires && new Date(perfil.plan_expires) >= new Date());
  const limite = planoPagoAtivo && plano ? plano.sites : TRIAL_SITES;
  if (perfil.sites_used >= limite) {
    throw new HttpError(
      402,
      planoPagoAtivo
        ? `Cota do plano esgotada: ${limite} sites por período. Renove o plano para continuar.`
        : 'Você já usou o site grátis do trial. Assine um plano para criar mais sites.',
    );
  }
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ sites_used: perfil.sites_used + 1, updated_at: new Date().toISOString() })
    .eq('user_id', user_id);
  if (error) throw new HttpError(500, 'Falha ao registrar o uso do site.');
  return limite - (perfil.sites_used + 1);
}

export const landingPagesRouter = Router();

/**
 * GET /api/landing-pages — sites gerados pelo usuário (com dados do lead).
 * Alimenta a página "Websites" do painel.
 */
landingPagesRouter.get('/', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');

    const { data, error } = await supabaseAdmin
      .from('landing_pages')
      .select('id, lead_id, created_at, published, slug, published_at, leads ( id, name, phone, address, status )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw new HttpError(500, 'Falha ao carregar os sites.');

    const sites = (data ?? []).map((row) => {
      const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads;
      return {
        id: row.id as string,
        leadId: row.lead_id as string,
        criadoEm: row.created_at as string,
        publicado: Boolean(row.published),
        slug: (row.slug as string | null) ?? null,
        urlPublica: row.published && row.slug ? `/s/${row.slug}` : null,
        publicadoEm: (row.published_at as string | null) ?? null,
        lead: lead
          ? {
              id: lead.id as string,
              name: lead.name as string,
              phone: (lead.phone as string | null) ?? null,
              address: (lead.address as string | null) ?? null,
            }
          : null,
        previewUrl: `/api/landing-pages/${row.lead_id}/preview?st=${assinaturaPreview(row.lead_id as string, user.id)}`,
      };
    });

    response.json({ sites });
  } catch (error) {
    next(error);
  }
});

interface LeadRow {
  id: string;
  user_id: string;
  search_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  status: string;
}

async function carregarLeadDoUsuario(leadId: string, userId: string): Promise<LeadRow> {
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) throw new HttpError(400, 'ID de lead inválido.');
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('id, user_id, search_id, name, phone, address, website, rating, reviews, status')
    .eq('id', leadId)
    .single();
  if (error || !data) throw new HttpError(404, 'Lead não encontrado.');
  if (data.user_id !== userId) throw new HttpError(403, 'Este lead pertence a outro usuário.');
  return data as LeadRow;
}

/** Nicho e cidade da busca que originou o lead (para os textos do site). */
async function nichoECidade(searchId: string): Promise<{ nicho: string; cidade: string }> {
  const { data } = await supabaseAdmin
    .from('searches')
    .select('niche, city')
    .eq('id', searchId)
    .single();
  return { nicho: data?.niche ?? 'negócio local', cidade: data?.city ?? '' };
}

/** POST /api/landing-pages { leadId } — gera (ou regenera) a landing page do lead. */
landingPagesRouter.post('/', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');

    const leadId = String(request.body?.leadId ?? '');
    const lead = await carregarLeadDoUsuario(leadId, user.id);

    // Regra do produto: sites são criados APENAS para empresas sem site.
    if (lead.status !== 'NO_SITE') {
      throw new HttpError(
        400,
        'A geração de site é exclusiva para leads sem site. Este lead já tem presença web.',
      );
    }

    const { nicho, cidade } = await nichoECidade(lead.search_id);

    const dados: DadosEmpresa = {
      nome: lead.name,
      nicho,
      cidade,
      telefone: lead.phone,
      endereco: lead.address,
      rating: lead.rating == null ? null : Number(lead.rating),
      reviews: lead.reviews,
    };

    // Cadeia nova em uma passagem: Business Analyzer → Blueprint → Builder.
    // Cobra a cota ANTES de gastar IA/fotos; regeração custa de novo (cota).
    const sitesRestantes = await cobrarCotaSite(user.id);
    let html: string;
    let analise: import('../services/businessAnalyzer.ts').AnaliseResumo | null;
    try {
      const resultado = await gerarLandingPageComAnalise(dados);
      html = resultado.html;
      analise = resultado.analise;
    } catch (erro) {
      // Falhou depois de cobrar: devolve a cota — o usuário não paga por erro.
      const perfil = await carregarPerfil(user.id);
      await supabaseAdmin
        .from('profiles')
        .update({ sites_used: Math.max(0, perfil.sites_used - 1) })
        .eq('user_id', user.id);
      throw erro;
    }

    // Uma página por lead: regenerar substitui (upsert pelo índice único).
    const { data: pagina, error } = await supabaseAdmin
      .from('landing_pages')
      .upsert(
        { user_id: user.id, lead_id: lead.id, html },
        { onConflict: 'lead_id' },
      )
      .select('id, created_at')
      .single();
    if (error || !pagina) throw new HttpError(500, 'Falha ao salvar a landing page.');

    response.json({
      id: pagina.id,
      leadId: lead.id,
      previewUrl: `/api/landing-pages/${lead.id}/preview?st=${assinaturaPreview(lead.id, user.id)}`,
      criadoEm: pagina.created_at,
      sitesRemaining: sitesRestantes,
      analise,
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/landing-pages/:leadId/publicar { slug } — cria o link público. */
landingPagesRouter.post('/:leadId/publicar', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');

    const lead = await carregarLeadDoUsuario(String(request.params.leadId), user.id);
    const { data: pagina } = await supabaseAdmin
      .from('landing_pages')
      .select('id, html')
      .eq('lead_id', lead.id)
      .single();
    if (!pagina) throw new HttpError(404, 'Gere o site antes de publicar.');

    const slug = String(request.body?.slug ?? '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '');
    if (slug.length < 3 || slug.length > 40) throw new HttpError(400, 'Endereço deve ter entre 3 e 40 caracteres (letras, números e hífen).');

    const { data: ocupado } = await supabaseAdmin
      .from('landing_pages')
      .select('id')
      .eq('slug', slug)
      .neq('id', pagina.id)
      .maybeSingle();
    if (ocupado) throw new HttpError(409, `O endereço "${slug}" já está em uso. Escolha outro.`);

    const { error } = await supabaseAdmin
      .from('landing_pages')
      .update({ published: true, slug, published_at: new Date().toISOString() })
      .eq('id', pagina.id);
    if (error) throw new HttpError(500, 'Falha ao publicar.');
    response.json({ ok: true, slug, url: `/s/${slug}` });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/landing-pages/:leadId/preview?st=expira.mac
 * Montado FORA do grupo autenticado (app.ts) — o iframe não envia
 * Authorization, então a prévia usa a assinatura HMAC de 1h.
 */
export const previewHandler = async (request: import('express').Request, response: import('express').Response, next: import('express').NextFunction) => {
  try {
    // Resolve (lead, usuário) por SESSÃO ou por assinatura HMAC (caso do
    // iframe, que não envia Authorization). Falha → erro claro na prévia.
    async function resolverAcesso(): Promise<{ leadId: string; userId: string }> {
      const user = (request as AuthedRequest).user;
      if (user) return { leadId: String(request.params.leadId), userId: user.id };

      const st = String(request.query.st ?? '');
      const expira = Number(st.split('.')[0]);
      if (!st || !Number.isFinite(expira) || expira < Date.now()) {
        throw new HttpError(401, 'Prévia expirada — gere o site novamente para reabrir.');
      }
      const { data: paginaSt } = await supabaseAdmin
        .from('landing_pages')
        .select('user_id')
        .eq('lead_id', String(request.params.leadId))
        .single();
      if (!paginaSt) throw new HttpError(404, 'Landing page ainda não gerada para este lead.');
      const userIdSt = paginaSt.user_id as string;
      if (!assinaturaValida(String(request.params.leadId), userIdSt, st)) {
        throw new HttpError(401, 'Prévia expirada — gere o site novamente para reabrir.');
      }
      return { leadId: String(request.params.leadId), userId: userIdSt };
    }

    const { leadId, userId } = await resolverAcesso();
    const lead = await carregarLeadDoUsuario(leadId, userId);
    const { data: pagina } = await supabaseAdmin
      .from('landing_pages')
      .select('html')
      .eq('lead_id', lead.id)
      .single();
    if (!pagina) throw new HttpError(404, 'Landing page ainda não gerada para este lead.');

    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('X-Frame-Options', 'SAMEORIGIN');
    response.send(pagina.html);
  } catch (error) {
    next(error);
  }
};

// A MESMA lógica serve em dois caminhos: dentro do grupo autenticado
// (sessão do painel) e fora (assinatura HMAC, caso do iframe).
landingPagesRouter.get('/:leadId/preview', previewHandler);

/** GET /api/landing-pages/:leadId/download — ZIP com site + mensagens prontas. */
landingPagesRouter.get('/:leadId/download', async (request, response, next) => {
  try {
    const user = (request as AuthedRequest).user;
    if (!user) throw new HttpError(401, 'Não autenticado.');

    const lead = await carregarLeadDoUsuario(String(request.params.leadId), user.id);
    const { data: pagina } = await supabaseAdmin
      .from('landing_pages')
      .select('html')
      .eq('lead_id', lead.id)
      .single();
    if (!pagina) throw new HttpError(404, 'Landing page ainda não gerada para este lead.');

    const { cidade } = await nichoECidade(lead.search_id);

    const mensagem = [
      `Olá! Sou da equipe de sites ${cidade ? `de ${cidade}` : ''}.`,
      '',
      `Vi que o ${lead.name} não tem site próprio — criei uma prévia profissional pronta para você ver:`,
      '(anexei o site completo neste contato)',
      '',
      `Telefone: ${lead.phone ?? 'Contato'} | Endereço: ${lead.address ?? cidade}`,
      lead.rating ? `Avaliação: ${lead.rating}/5 no Google (${lead.reviews ?? 0} avaliações)` : '',
      '',
      'Posso publicar no seu domínio ainda esta semana. Posso enviar a prévia?',
    ]
      .filter((linha) => linha !== '')
      .join('\n');

    // Link de WhatsApp com a mensagem pronta, salvo junto no ZIP.
    const numeroWhatsApp = (lead.phone ?? '').replace(/\D/g, '');
    const linkWhatsApp = numeroWhatsApp
      ? `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`
      : '';

    const zip = new JSZip();
    zip.file('index.html', pagina.html);
    zip.file('LEIA-ME.txt', [
      `Site do ${lead.name}`,
      '',
      'COMO PUBLICAR (2 opções):',
      '1. Netlify/Vercel (grátis): arraste esta pasta em app.netlify.com/drop',
      '2. Hospedagem própria: faça upload do index.html na pasta pública',
      '',
      'O site é 100% estático: um arquivo só, com CSS/JS embutidos.',
      'Funciona em celular e desktop, com botões de ligar e WhatsApp.',
    ].join('\n'));
    zip.file('mensagem-whatsapp.txt', mensagem);
    if (linkWhatsApp) zip.file('abrir-whatsapp.url', `[InternetShortcut]\nURL=${linkWhatsApp}`);

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    const nomeArquivo = `site-${lead.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.zip`;
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    response.send(buffer);
  } catch (error) {
    next(error);
  }
});
