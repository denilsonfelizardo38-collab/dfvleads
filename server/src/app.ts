import express from 'express';
import cors from 'cors';
import { config } from './env.ts';
import { errorHandler } from './lib/http.ts';
import { requestLog } from './middleware/requestLog.ts';
import { requireAuth } from './middleware/auth.ts';
import { gateBloqueio } from './middleware/gate.ts';
import { searchRateLimit } from './middleware/searchRateLimit.ts';
import { searchRouter } from './routes/search.ts';
import { historyRouter } from './routes/history.ts';
import { leadsRouter } from './routes/leads.ts';
import { exportRouter } from './routes/export.ts';
import { creditsRouter } from './routes/credits.ts';
import { landingPagesRouter, previewHandler } from './routes/landingPages.ts';
import { billingRouter, paypalRetornoHandler, paypalWebhookHandler, binanceWebhookHandler } from './routes/billing.ts';
import { adminRouter } from './routes/admin.ts';
import { publicRouter } from './routes/public.ts';
import { notificationsRouter } from './routes/notifications.ts';

export function createApp(): express.Express {
  const app = express();

  // Log estruturado + id de correlação em todas as requisições.
  app.use(requestLog);

  // CORS: CORS_ORIGIN aceita VÁRIAS origens separadas por vírgula
  // (ex.: painel no localhost e na Vercel ao mesmo tempo).
  const origensPermitidas = config.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(cors({
    origin(origem, callback) {
      // Sem origem (curl/mobile) ou origem na lista → liberado.
      if (!origem || origensPermitidas.includes(origem)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }));
  // rawBody guardado para a verificação de assinatura do webhook Binance.
  app.use(express.json({
    limit: '256kb',
    verify: (request, _response, buf) => {
      (request as typeof request & { rawBody?: string }).rawBody = buf.toString();
    },
  }));

  // Health check (sem auth).
  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, service: 'dfvleads-api' });
  });

  // Site publicado por slug: público, fora do /api.
  app.use('/s', publicRouter);
  // Mesmo conteúdo sob /api/s (caminho da função serverless na Vercel).
  app.use('/api/s', publicRouter);

  // Prévia do site fora do grupo autenticado: o iframe usa a assinatura
  // HMAC de 1h (st=...) devolvida na criação do site.
  app.get('/api/landing-pages/:leadId/preview', previewHandler);

  // Pagamento automático: retorno do PayPal (navegador) e webhooks
  // (servidores PayPal/Binance) — rotas públicas sem sessão.
  app.get('/api/billing/retorno/paypal', paypalRetornoHandler);
  app.post('/api/billing/webhook/paypal', paypalWebhookHandler);
  app.post('/api/billing/webhook/binance', binanceWebhookHandler);

  // Todas as rotas abaixo exigem sessão Supabase válida + conta ativa.
  const api = express.Router();
  api.use(requireAuth);
  api.use(gateBloqueio);

  api.use('/history', historyRouter);
  api.use('/leads', leadsRouter);
  api.use('/export', exportRouter);
  api.use('/credits', creditsRouter);
  api.use('/landing-pages', landingPagesRouter);
  api.use('/billing', billingRouter);
  api.use('/admin', adminRouter);
  api.use('/notifications', notificationsRouter);

  // searchRouter expõe GET /me e POST /search (com rate limit no POST).
  api.post('/search', searchRateLimit);
  api.use(searchRouter);

  app.use('/api', api);

  // 404 JSON só para rotas de API e sites publicados; qualquer outra rota
  // segue adiante para o servidor estático do painel (em produção).
  app.use((request, response, next) => {
    if (request.path.startsWith('/api/') || request.path.startsWith('/s/')) {
      response.status(404).json({ error: 'Rota não encontrada.' });
      return;
    }
    next();
  });

  app.use(errorHandler);
  return app;
}
