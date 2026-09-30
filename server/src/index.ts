import { existsSync } from 'node:fs';
import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.ts';
import { iniciarAutoPing } from './services/autoPing.ts';
import { config } from './env.ts';

const app = createApp();

/**
 * Painel estático (web/dist) servido pela PRÓPRIA API — um serviço só.
 * Em produção: npm run build na raiz gera web/dist; o Express entrega os
 * arquivos e faz fallback para o index.html (SPA do React Router).
 * No /s/:slug (sites publicados) prevalece a rota dinâmica da API.
 */
const aqui = dirname(fileURLToPath(import.meta.url));
const dist = join(aqui, '..', '..', 'web', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false }));
  app.get(/^\/(?!api|s).*/, (_request, response) => {
    response.sendFile(join(dist, 'index.html'));
  });
  console.log('[painel] servindo web/dist na mesma porta da API');
}

app.listen(config.port, () => {
  console.log(`DFVLeads API em http://localhost:${config.port} (${config.nodeEnv})`);
  iniciarAutoPing();
  console.log(
    config.googleMapsApiKey
      ? '[buscas] fonte: Google Places (GOOGLE_MAPS_API_KEY configurada)'
      : '[buscas] fonte: OpenStreetMap — grátis, sem chave (defina GOOGLE_MAPS_API_KEY em server/.env para usar o Google Places)',
  );
});
