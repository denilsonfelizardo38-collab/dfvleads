import { createApp } from '../server/src/app.ts';

/**
 * DFVLeads na Vercel (Opção C — só Vercel, sem Render):
 * o Express inteiro vira UMA função serverless que atende /api/*,
 * incluindo os sites publicados em /api/s/:slug.
 *
 * Limites do plano gratuito da Vercel:
 *  - máx. 60 s por requisição (buscas e geração de site costumam caber;
 *    buscas OSM muito lentas podem falhar — o erro é honesto no painel);
 *  - cache de busca em memória por instância (menos eficaz, sem efeito
 *    funcional);
 *  - sem estado entre chamadas: nada no código depende disso.
 */
const app = createApp();

export default app;

export const maxDuration = 60;
