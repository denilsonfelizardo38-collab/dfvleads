/**
 * Sonda de "sites escondidos": empresas cujo campo site no Google Maps
 * aponta para rede social (ou vazio) mas que NA VERDADE têm site próprio.
 *
 * Estratégia (100% local, sem API paga):
 *  1. Gerar domínios prováveis derivados do nome (belezadivina.com,
 *     beleza-divina.com.br, .com.pt, .ao...) a partir dos tokens do nome.
 *  2. Pré-filtro por DNS: domínio que nem resolve é descartado em
 *     milissegundos — sem gastar tentativa HTTP (é a maioria dos casos).
 *  3. Testar os poucos que resolvem: responde HTTP(S) rápido?
 *  4. Validar o conteúdo: o HTML precisa mencionar o nome da empresa
 *     (evita parque de domínios alheios).
 *
 * Custo: só as empresas "sem site" passam pela sonda, em paralelo com
 * timeout curto — a busca continua rápida.
 */

import { promises as dns } from 'node:dns';

const TLD_PADRAO = ['.com', '.com.br', '.pt', '.ao', '.com.ao', '.mz', '.com.mz'];

/** Tokeniza o nome e remove palavras genéricas que poluem domínios. */
function tokensDoNome(nome: string): string[] {
  const paradas = new Set([
    'de', 'da', 'do', 'das', 'dos', 'e', 'the', 'of',
    'restaurante', 'barbearia', 'salao', 'salão', 'academia', 'clinic',
    'clinica', 'clínica', 'padaria', 'loja', 'store', 'mercado', 'auto',
    'center', 'centre', 'sala', 'casa', 'ponto', 'espaço', 'espaco',
  ]);
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' e ')
    .split(/[^a-z0-9]+/)
    .filter((parte) => parte.length >= 3 && !paradas.has(parte));
}

/** TLDs mais prováveis para os nossos mercados, em ordem. */
const TLDS_TOP = ['.com', '.pt', '.com.br', '.ao'];

/** Domínios candidatos derivados do nome, ordenados por probabilidade. */
export function dominiosCandidatos(nome: string): string[] {
  const tokens = tokensDoNome(nome);
  if (tokens.length === 0) return [];

  const primeiro = tokens[0];
  const ultimo = tokens[tokens.length - 1];
  const juntos = tokens.join('');
  const hifen = tokens.join('-');

  if (tokens.length === 1) {
    return TLDS_TOP.concat(TLD_PADRAO).map((tld) => `${primeiro}${tld}`).slice(0, 8);
  }

  // Interseção base × TLD priorizada: composto nas TLDs principais,
  // depois cada palavra isolada — assim "telepizza.pt" não fica de fora
  // porque o composto "telepizzalisboa" comeu o orçamento de candidatos.
  const pares: [string, string[]][] = [
    [juntos, TLDS_TOP],
    [primeiro, TLDS_TOP],
    [ultimo, TLDS_TOP],
    [juntos, TLD_PADRAO],
    [hifen, ['.com', '.pt']],
    [primeiro, TLD_PADRAO],
  ];
  const vistos = new Set<string>();
  const candidatos: string[] = [];
  for (const [base, tlds] of pares) {
    for (const tld of tlds) {
      const dominio = `${base}${tld}`;
      if (vistos.has(dominio)) continue;
      vistos.add(dominio);
      candidatos.push(dominio);
    }
  }
  // Poucos candidatos: cada um vira pré-filtro DNS + possível HTTP.
  return candidatos.slice(0, 8);
}

/**
 * Pré-filtro barato: resolve o DNS do domínio com teto de tempo.
 * NXDOMAIN (domínio não registrado) é descartado aqui, sem HTTP.
 */
async function dnsResponde(host: string, timeoutMs = 1500): Promise<boolean> {
  try {
    await Promise.race([
      dns.resolve(host),
      new Promise<never>((_, rejeitar) => setTimeout(() => rejeitar(new Error('dns-timeout')), timeoutMs)),
    ]);
    return true;
  } catch {
    return false;
  }
}

function fetchComTimeout(url: string, ms: number, metodo: 'GET' | 'HEAD' = 'GET'): Promise<Response> {
  return fetch(url, {
    method: metodo,
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DFVLeadsSiteCheck/0.1)' },
    signal: AbortSignal.timeout(ms),
  });
}

/** Testa se um host responde HTTP(S) e devolve um trecho do HTML. */
async function sondaHttp(host: string, timeoutMs: number): Promise<string | null> {
  for (const url of [`https://${host}/`, `http://${host}/`]) {
    try {
      const resposta = await fetchComTimeout(url, timeoutMs, 'GET');
      if (!resposta.ok) continue;
      const tipo = resposta.headers.get('content-type') ?? '';
      if (!tipo.includes('html')) continue;
      const texto = await resposta.text();
      if (texto.length > 0) return texto.slice(0, 60_000);
    } catch {
      // tenta o próximo protocolo
    }
  }
  return null;
}

/**
 * O HTML realmente é da empresa? Regra dura para evitar falsos positivos
 * (beleza.pt NÃO é da "Beleza Divina"): ou o nome aparece junto
 * ("belezadivina"/"beleza divina"), ou PELO MENOS DOIS tokens distintos
 * do nome aparecem. Nome de uma palavra só exige o token (mas só sobra
 * um token quando as outras palavras são genéricas).
 */
function mencionaEmpresa(html: string, tokens: string[]): boolean {
  const alvo = html.toLowerCase();
  const presentes = tokens.filter((token) => alvo.includes(token));
  if (tokens.length === 1) return presentes.length === 1;
  if (presentes.length >= 2) return true;
  const junto = tokens.join('');
  const hifen = tokens.join('-');
  return alvo.includes(junto) || alvo.includes(hifen);
}

export interface ResultadoSonda {
  site: string;
}

/**
 * Procura um site próprio para a empresa. Devolve a URL encontrada ou null.
 * Roda em lote (todas as empresas de uma busca) com concorrência limitada.
 */
export async function procurarSiteProprio(nome: string, timeoutPorDominioMs = 2500): Promise<string | null> {
  const tokens = tokensDoNome(nome);
  if (tokens.length === 0) return null;

  const dominios = dominiosCandidatos(nome);
  // Pré-filtro DNS em paralelo: só quem resolve vai para HTTP.
  const resolvem = await Promise.all(
    dominios.map(async (dominio) => ({ dominio, ok: await dnsResponde(dominio) })),
  );
  const vivos = resolvem.filter((r) => r.ok).map((r) => r.dominio);
  if (vivos.length === 0) return null;

  const resultados = await Promise.all(
    vivos.map(async (dominio) => {
      const html = await sondaHttp(dominio, timeoutPorDominioMs);
      if (!html) return null;
      if (!mencionaEmpresa(html, tokens)) return null;
      return `https://${dominio}/`;
    }),
  );
  return resultados.find((site) => site !== null) ?? null;
}

/**
 * Sonda uma lista de places (sem site ou só-redes-sociais) em paralelo
 * (concorrência 10) e devolve um Map placeId → URL do site descoberto.
 * A rota de busca já filtrou HAS_SITE antes de chamar.
 */
export async function sondarLote(
  places: { placeId: string; name: string; website: string | null }[],
  timeoutPorDominioMs = 1800,
): Promise<Map<string, string>> {
  const achados = new Map<string, string>();
  const alvo = places;
  const LOTE = 10;

  for (let inicio = 0; inicio < alvo.length; inicio += LOTE) {
    const grupo = alvo.slice(inicio, inicio + LOTE);
    const promessas = grupo.map(async (place) => {
      const site = await procurarSiteProprio(place.name, timeoutPorDominioMs);
      if (site) achados.set(place.placeId, site);
    });
    await Promise.all(promessas);
  }
  return achados;
}
