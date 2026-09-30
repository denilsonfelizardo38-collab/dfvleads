import { Router } from 'express';
import { supabaseAdmin } from '../services/supabaseAdmin.ts';

export const publicRouter = Router();

const PAGINA_404 =
  '<!DOCTYPE html><html lang="pt"><body style="font-family:system-ui;padding:3rem;text-align:center"><h1>404</h1><p>Site não encontrado ou despublicado.</p></body></html>';

/** Lookup + resposta do site publicado (usado pelos dois caminhos). */
async function servirSlug(slug: string, response: import('express').Response): Promise<void> {
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    response.status(404).send(PAGINA_404);
    return;
  }
  const { data } = await supabaseAdmin
    .from('landing_pages')
    .select('html')
    .eq('slug', slug)
    .eq('published', true)
    .single();
  if (!data) {
    response.status(404).send(PAGINA_404);
    return;
  }
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader('Cache-Control', 'public, max-age=60');
  response.send(data.html);
}

/**
 * GET /s/:slug — site publicado no domínio do Render.
 * GET /api/s/:slug — mesmo site sob /api (caminho usado na Vercel, onde
 * TUDO é encaminhado para a função serverless da API).
 */
publicRouter.get('/s/:slug', (request, response) => {
  void servirSlug(String(request.params.slug ?? '').toLowerCase(), response);
});

publicRouter.get('/:slug', (request, response) => {
  void servirSlug(String(request.params.slug ?? '').toLowerCase(), response);
});
