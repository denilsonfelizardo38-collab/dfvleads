import type { PlaceCandidate } from '../types.ts';

/**
 * Fonte de leads GRATUITA via OpenStreetMap — sem chave e sem cartão:
 *  1. Nominatim geocodifica a cidade → caixa delimitadora (bbox)
 *  2. Overpass API busca os negócios do nicho dentro da área
 *     (craft=barber, amenity=restaurant, shop=bakery, ...)
 *  3. Mapeia para o mesmo PlaceCandidate do Google Places, então o resto
 *     do pipeline (sonda de sites escondidos, dedupe, créditos) é igual.
 *
 * Diferenças honestas vs Google: sem avaliações/notas e cobertura menor
 * em algumas regiões — o app já não exibe avaliações, então a lista de
 * leads funciona igual. Cobertura cresce conforme a comunidade mapeia;
 * Brasil e Portugal são bem servidos.
 *
 * Áreas grandes (país/estado): por bbox a consulta nunca termina, então
 * usamos a área NOMEADA do Overpass (mais eficiente) e devolvemos menos
 * resultados com um aviso pedindo cidade específica.
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
/**
 * Overpass principal + espelhos GLOBAIS públicos (o serviço cai com frequência).
 * Ficam de fora de propósito: overpass.osm.ch (extrato regional — responde
 * rápido mas só tem dados da Suíça, devolveria 0 resultados mentiroso) e
 * overpass.osm.jp (certificado TLS expirado, o Node recusa).
 */
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const UA = 'DFVLeads/0.1 (gerador de leads para negócios locais)';

/** Nicho (texto do usuário) → filtros Overpass. Primeiro match vence. */
const MAPEAMENTO: { chaves: string[]; filtros: string[] }[] = [
  // ── Comida e bebida ──────────────────────────────────────────
  { chaves: ['pizzaria', 'pizza'], filtros: ['["amenity"="pizza"]', '["cuisine"="pizza"]'] },
  { chaves: ['sushi'], filtros: ['["cuisine"="sushi"]', '["amenity"="restaurant"]'] },
  { chaves: ['hamburguer', 'burger'], filtros: ['["cuisine"="burger"]', '["amenity"="fast_food"]'] },
  { chaves: ['fast food', 'fastfood'], filtros: ['["amenity"="fast_food"]'] },
  { chaves: ['restaurante', 'restaurant', 'comida'], filtros: ['["amenity"="restaurant"]'] },
  { chaves: ['cafeteria', 'cafe', 'café', 'coffee'], filtros: ['["amenity"="cafe"]'] },
  { chaves: ['padaria', 'bakery'], filtros: ['["shop"="bakery"]'] },
  { chaves: ['pastelaria', 'pastry', 'confeitaria'], filtros: ['["shop"="pastry"]', '["shop"="confectionery"]'] },
  { chaves: ['gelataria', 'gelado', 'sorvete', 'ice cream', 'helado'], filtros: ['["shop"="ice_cream"]', '["amenity"="ice_cream"]'] },
  { chaves: ['bar '], filtros: ['["amenity"="bar"]', '["amenity"="pub"]'] },
  { chaves: ['catering', 'buffet'], filtros: ['["shop"="deli"]', '["craft"="caterer"]'] },
  { chaves: ['caminhao de comida', 'food truck'], filtros: ['["amenity"="fast_food"]', '[" amenity"="restaurant"]'] },
  // ── Beleza e cuidados ────────────────────────────────────────
  { chaves: ['barbearia', 'barber'], filtros: ['["craft"="barber"]', '["shop"="hairdresser"]'] },
  { chaves: ['salao', 'cabeleireiro', 'salon', 'hair'], filtros: ['["shop"="hairdresser"]', '["shop"="beauty"]'] },
  { chaves: ['manicure', 'pedicure', 'unha'], filtros: ['["shop"="beauty"]', '["craft"="nail_technician"]'] },
  { chaves: ['spa', 'massagem', 'massage'], filtros: ['["leisure"="spa"]', '["shop"="massage"]'] },
  { chaves: ['estetic', 'maquiagem', 'makeup'], filtros: ['["shop"="beauty"]', '["beauty"="hairdresser"]'] },
  // ── Turismo e hospedagem ────────────────────────────────────
  { chaves: ['hotel'], filtros: ['["tourism"="hotel"]', '["tourism"="motel"]'] },
  { chaves: ['hostel', 'alojamento', 'hospedagem', 'lodge', 'guest'], filtros: ['["tourism"="hostel"]', '["tourism"="guest_house"]', '["tourism"="hotel"]'] },
  { chaves: ['resort'], filtros: ['["tourism"="hotel"]', '["leisure"="resort"]'] },
  { chaves: ['agencia de viagem', 'viagem', 'tour oper', 'guia turis'], filtros: ['["shop"="travel_agency"]', '["office"="travel_agent"]'] },
  { chaves: ['aluguel de carro', 'rent a car', 'rent-a-car', 'locadora', 'car rental'], filtros: ['["amenity"="car_rental"]'] },
  // ── Saúde ────────────────────────────────────────────────────
  { chaves: ['dentista', 'dentist', 'odont'], filtros: ['["amenity"="dentist"]', '["healthcare"="dentist"]'] },
  { chaves: ['clinica', 'consultorio', 'medico', 'doctor'], filtros: ['["amenity"="clinic"]', '["amenity"="doctors"]'] },
  { chaves: ['fisioterapia', 'physio', 'psicolog', 'psycholog'], filtros: ['["healthcare"="physiotherapist"]', '["amenity"="clinic"]'] },
  { chaves: ['laboratorio', 'diagnostico'], filtros: ['["healthcare"="laboratory"]', '["amenity"="clinic"]'] },
  { chaves: ['farmacia'], filtros: ['["amenity"="pharmacy"]'] },
  { chaves: ['veterinar', 'veterin'], filtros: ['["amenity"="veterinary"]'] },
  // ── Automóveis ──────────────────────────────────────────────
  { chaves: ['oficina', 'mecanico', 'car_repair'], filtros: ['["shop"="car_repair"]'] },
  { chaves: ['lavagem', 'car wash'], filtros: ['["amenity"="car_wash"]'] },
  { chaves: ['detail', 'estetica autom'], filtros: ['["shop"="car_repair"]', '["shop"="car"]'] },
  { chaves: ['stand de automoveis', 'concessionaria', 'dealership', 'loja de carro'], filtros: ['["shop"="car"]'] },
  { chaves: ['pecas', 'auto parts', 'acessorios automo'], filtros: ['["shop"="car_parts"]'] },
  { chaves: ['pneus', 'tire', 'tyre'], filtros: ['["shop"="tyres"]'] },
  { chaves: ['eletricista automo', 'auto eletric'], filtros: ['["shop"="car_repair"]'] },
  { chaves: ['funilaria', 'pintura automo', 'body shop'], filtros: ['["shop"="car_repair"]'] },
  // ── Casa e construção ───────────────────────────────────────
  { chaves: ['construcao', 'construtora', 'obra', 'builder'], filtros: ['["craft"="builder"]', '["office"="construction_company"]'] },
  { chaves: ['arquitet', 'architect'], filtros: ['["office"="architect"]'] },
  { chaves: ['engenhari', 'engineering'], filtros: ['["office"="engineer"]'] },
  { chaves: ['design de interiores', 'interior'], filtros: ['["shop"="interior_decoration"]', '["craft"="carpenter"]'] },
  { chaves: ['serralheria', 'serralheiro', 'esquadria', 'caldeireiro', 'metal'], filtros: ['["craft"="metal_construction"]', '["craft"="blacksmith"]'] },
  { chaves: ['mobilia', 'movel', 'moveis', 'furniture'], filtros: ['["shop"="furniture"]'] },
  { chaves: ['carpintaria', 'marceneiro', 'carpenter'], filtros: ['["craft"="carpenter"]'] },
  { chaves: ['canaliza', 'encanador', 'plumber', 'plombeiro'], filtros: ['["craft"="plumber"]'] },
  { chaves: ['eletricista', 'eletrica'], filtros: ['["craft"="electrician"]'] },
  { chaves: ['pintor', 'pintura'], filtros: ['["craft"="painter"]'] },
  { chaves: ['climatiza', 'ar condicionado', 'hvac', 'air_condition'], filtros: ['["craft"="hvac"]'] },
  { chaves: ['energia solar', 'solar', 'fotovolta'], filtros: ['["shop"="solar"]', '["craft"="photovoltaic"]'] },
  { chaves: ['jardinagem', 'jardineiro', 'paisagismo', 'garden'], filtros: ['["craft"="gardener"]', '["shop"="garden_centre"]', '["leisure"="garden"]'] },
  { chaves: ['limpeza', 'cleaning'], filtros: ['["shop"="dry_cleaning"]', '["office"="cleaning"]'] },
  { chaves: ['seguranca privada', 'security'], filtros: ['["office"="security"]', '["office"="private_investigator"]'] },
  { chaves: ['chaveiro'], filtros: ['["craft"="locksmith"]'] },
  { chaves: ['vidrac'], filtros: ['["craft"="glaziery"]', '["shop"="glaziery"]'] },
  // ── Empresas e serviços profissionais ───────────────────────
  { chaves: ['advocacia', 'advogado', 'lawyer', 'advoca'], filtros: ['["office"="lawyer"]'] },
  { chaves: ['contabil', 'accountant'], filtros: ['["office"="accountant"]', '["office"="tax_advisor"]'] },
  { chaves: ['consultoria', 'consult'], filtros: ['["office"="consulting"]'] },
  { chaves: ['marketing', 'publicidade', 'advertis'], filtros: ['["office"="advertising_agency"]', '["office"="marketing"]', '["office"="graphic_design"]'] },
  { chaves: ['empresa de ti', 'desenvolvimento', 'software', 'informatic'], filtros: ['["office"="it"]', '["office"="company"]'] },
  { chaves: ['imobiliar', 'real estate', 'imovel'], filtros: ['["office"="estate_agent"]'] },
  { chaves: ['recursos humanos', 'human resources'], filtros: ['["office"="employment_agency"]'] },
  { chaves: ['seguros', 'insurance'], filtros: ['["office"="insurance"]'] },
  { chaves: ['logistica', 'transporte', 'logistics', 'transport'], filtros: ['["office"="logistics"]', '["office"="forwarding"]'] },
  { chaves: ['importacao', 'exportacao', 'import', 'export'], filtros: ['["office"="customs"]', '["office"="company"]'] },
  // ── Comércio ────────────────────────────────────────────────
  { chaves: ['loja de roupa', 'roupas', 'clothes', 'boutique'], filtros: ['["shop"="clothes"]'] },
  { chaves: ['calcado', 'sapato', 'shoes'], filtros: ['["shop"="shoes"]'] },
  { chaves: ['eletronico', 'electron'], filtros: ['["shop"="electronics"]'] },
  { chaves: ['telemovel', 'celular', 'telefonia', 'mobile phone'], filtros: ['["shop"="mobile_phone"]'] },
  { chaves: ['mercado', 'supermercado', 'mercearia', 'supermarket'], filtros: ['["shop"="supermarket"]', '["shop"="convenience"]'] },
  { chaves: ['joalher', 'joia', 'jewelry', 'relogio'], filtros: ['["shop"="jewelry"]'] },
  { chaves: ['cosmetic', 'perfumaria'], filtros: ['["shop"="cosmetics"]', '["shop"="beauty"]'] },
  { chaves: ['florista', 'floricultura', 'flor'], filtros: ['["shop"="florist"]'] },
  { chaves: ['materiais de construcao', 'material de construcao', 'building_material'], filtros: ['["shop"="doityourself"]', '["shop"="hardware"]'] },
  { chaves: ['artigos desportivos', 'desporto', 'sporting goods'], filtros: ['["shop"="sports"]'] },
  { chaves: ['loja infantil', 'infantil', 'baby'], filtros: ['["shop"="baby_goods"]', '["shop"="toys"]'] },
  { chaves: ['petshop', 'pet'], filtros: ['["shop"="pet"]', '["shop"="pet_grooming"]'] },
  { chaves: ['otica'], filtros: ['["shop"="optician"]'] },
  { chaves: ['livraria', 'papelaria', 'book', 'stationery'], filtros: ['["shop"="books"]', '["shop"="stationery"]'] },
  { chaves: ['presente', 'gift'], filtros: ['["shop"="gift"]'] },
  // ── Educação ────────────────────────────────────────────────
  { chaves: ['universidade', 'faculdade', 'university', 'college'], filtros: ['["amenity"="university"]', '["amenity"="college"]'] },
  { chaves: ['escola', 'colegio', 'school'], filtros: ['["amenity"="school"]', '["amenity"="language_school"]'] },
  { chaves: ['idiomas', 'language'], filtros: ['["amenity"="language_school"]'] },
  { chaves: ['formacao', 'curso profissional', 'training'], filtros: ['["amenity"="prep_school"]', '["office"="educational_institution"]'] },
  { chaves: ['explicacao', 'tutor', 'reforco'], filtros: ['["amenity"="prep_school"]'] },
  { chaves: ['conducao', 'autoescola', 'driving'], filtros: ['["amenity"="driving_school"]'] },
  { chaves: ['academia', 'gym', 'fitness', 'ginasio'], filtros: ['["leisure"="fitness_centre"]', '["amenity"="gym"]'] },
  { chaves: ['artes marciais', 'martial', 'crossfit', 'yoga', 'pilates'], filtros: ['["leisure"="sports_centre"]', '["leisure"="fitness_centre"]'] },
  { chaves: ['informatica', 'computer'], filtros: ['["amenity"="prep_school"]', '["office"="educational_institution"]'] },
  // ── Desporto ────────────────────────────────────────────────
  { chaves: ['clube desportivo', 'campo desportivo', 'sports_centre', 'estadio'], filtros: ['["leisure"="sports_centre"]', '["leisure"="stadium"]'] },
  { chaves: ['piscina'], filtros: ['["leisure"="swimming_pool"]'] },
  { chaves: ['personal trainer'], filtros: ['["leisure"="fitness_centre"]'] },
  // ── Criativos e eventos ─────────────────────────────────────
  { chaves: ['fotografo', 'photograph', 'estudio foto', 'video'], filtros: ['["craft"="photographer"]', '["shop"="photo"]'] },
  { chaves: ['evento', 'casamento', 'wedding', 'event'], filtros: ['["office"="event_management"]', '["amenity"="events_venue"]'] },
  { chaves: ['dj'], filtros: ['["craft"="dj"]'] },
  { chaves: ['decoracao', 'decoration'], filtros: ['["shop"="interior_decoration"]'] },
  { chaves: ['salao de festas', 'festas', 'events_venue', 'espaco de eventos'], filtros: ['["amenity"="events_venue"]'] },
  { chaves: ['grafica', 'print', 'copyshop'], filtros: ['["shop"="copyshop"]', '["craft"="printer"]'] },
  { chaves: ['agencia de modelos', 'model'], filtros: ['["office"="modeling_agency"]'] },
  // ── Agricultura e negócios locais ───────────────────────────
  { chaves: ['fazenda', 'quinta', 'farm'], filtros: ['["place"="farm"]', '["landuse"="farmyard"]'] },
  { chaves: ['agropecuaria', 'agricola', 'agricultural', 'agri'], filtros: ['["shop"="agrarian"]', '["craft"="agricultural_engines"]'] },
  { chaves: ['irrigacao', 'irrigation'], filtros: ['["craft"="agricultural_engines"]', '["shop"="agrarian"]'] },
  { chaves: ['pesca', 'fishing'], filtros: ['["shop"="fishing"]'] },
  { chaves: ['avicultura', 'pecuaria', 'poultry'], filtros: ['["place"="farm"]', '["landuse"="farmyard"]'] },
];

interface ElementoOsm {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface CacheEntrada<T> {
  valor: T;
  expira: number;
}

const cacheCidades = new Map<string, CacheEntrada<LocalOsm>>();
const cacheBuscas = new Map<string, CacheEntrada<PlaceCandidate[]>>();
const CACHE_CIDADE_MS = 6 * 60 * 60 * 1000; // cidade muda pouco
const CACHE_BUSCA_MS = 30 * 60 * 1000; // acertos ficam 30min (menos pressão no Overpass)
const CACHE_BUSCA_VAZIA_MS = 5 * 60 * 1000; // vazio expira rápido p/ o usuário re-tentar

/** Resultado do geocode: caixa + metadados para detectar área grande. */
interface LocalOsm {
  bbox: Bbox;
  addresstype: string;
  osmType: 'relation' | 'way' | 'node' | null;
  osmId: number | null;
}

interface Bbox {
  sul: number;
  oeste: number;
  norte: number;
  leste: number;
}

/** Tipos do Nominatim que representam áreas demais para uma bbox. */
const AREAS_GRANDES = new Set(['country', 'state']);

const LIMITE_PADRAO = 60;
const LIMITE_PAIS = 20;

/**
 * Rate-limit: o Overpass/Nominatim públicos aplicam 429 quando há rajadas
 * (no Render o IP de saída é partilhado com outros apps, então o 429 é
 * frequente). Estratégia: intervalo entre chamadas, espera com jitter
 * honrando Retry-After, round-robin nos espelhos (cada um tem cota própria)
 * e mensagens limpas — o corpo bruto do erro NUNCA vaza para o usuário.
 */
let ultimaChamadaOverpass = 0;
const INTERVALO_OVERPASS_MS = 3000;
const ESPERA_FALHA_MS = 3000;
/** Próximo espelho a tentar primeiro (round-robin por chamada). */
let proximoEndpoint = 0;

/** Espera com jitter para não sincronizar rajadas com outros clientes. */
function esperaComJitter(baseMs: number): Promise<void> {
  const ms = baseMs + Math.floor(Math.random() * 2000);
  return new Promise((r) => setTimeout(r, ms));
}

async function aguardarVezOverpass(): Promise<void> {
  const espera = INTERVALO_OVERPASS_MS - (Date.now() - ultimaChamadaOverpass);
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimaChamadaOverpass = Date.now();
}

/** Nominatim: a política de uso pede máx. 1 req/s por IP. */
let ultimaChamadaNominatim = 0;
async function aguardarVezNominatim(): Promise<void> {
  const espera = 1200 - (Date.now() - ultimaChamadaNominatim);
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  ultimaChamadaNominatim = Date.now();
}

async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 20000): Promise<T> {
  const resposta = await fetch(url, {
    ...init,
    headers: { 'User-Agent': UA, ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => '');
    const retryAfterSeg = Number(resposta.headers.get('retry-after')) || 0;
    // Detalhe bruto só no log do servidor — o usuário recebe mensagem limpa.
    console.warn(`[osm] HTTP ${resposta.status} em ${url} — ${texto.slice(0, 200)}`);
    throw Object.assign(new Error(`OpenStreetMap indisponível (HTTP ${resposta.status}).`), {
      status: 502,
      httpStatus: resposta.status,
      retryAfterSeg,
    });
  }
  return (await resposta.json()) as T;
}

/** Cidade → bbox + metadados (Nominatim, com cache de 6h e retry em 429/5xx). */
async function localDaCidade(cidade: string): Promise<LocalOsm> {
  const chave = cidade.trim().toLowerCase();
  const emCache = cacheCidades.get(chave);
  if (emCache && emCache.expira > Date.now()) return emCache.valor;

  const url = `${NOMINATIM}?q=${encodeURIComponent(cidade)}&format=jsonv2&limit=1`;
  let json:
    | {
        boundingbox?: string[];
        addresstype?: string;
        osm_type?: string;
        osm_id?: number;
      }[]
    | null = null;
  for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
    try {
      await aguardarVezNominatim();
      json = await fetchJson<
        {
          boundingbox?: string[];
          addresstype?: string;
          osm_type?: string;
          osm_id?: number;
        }[]
      >(url);
      break;
    } catch (erro) {
      const http = (erro as { httpStatus?: number }).httpStatus;
      const podeRepetir = http === undefined || http === 429 || http >= 500;
      if (tentativa >= 3 || !podeRepetir) break;
      const retrySeg = (erro as { retryAfterSeg?: number }).retryAfterSeg ?? 0;
      await esperaComJitter(http === 429 ? Math.max(retrySeg, 4) * 1000 : ESPERA_FALHA_MS);
    }
  }
  if (!json) {
    throw Object.assign(
      new Error(
        `Não consegui localizar "${cidade}" agora — o serviço de mapas está sobrecarregado. Aguarde 1-2 minutos e tente de novo. Nada foi cobrado.`,
      ),
      { status: 503 },
    );
  }

  const hit = json[0];
  if (!hit?.boundingbox || hit.boundingbox.length < 4) {
    throw Object.assign(new Error(`Cidade não encontrada no OpenStreetMap: ${cidade}`), {
      status: 404,
    });
  }
  const local: LocalOsm = {
    bbox: {
      sul: Number(hit.boundingbox[0]),
      norte: Number(hit.boundingbox[1]),
      oeste: Number(hit.boundingbox[2]),
      leste: Number(hit.boundingbox[3]),
    },
    addresstype: hit.addresstype ?? '',
    osmType: hit.osm_type === 'relation' || hit.osm_type === 'way' || hit.osm_type === 'node' ? hit.osm_type : null,
    osmId: typeof hit.osm_id === 'number' ? hit.osm_id : null,
  };
  cacheCidades.set(chave, { valor: local, expira: Date.now() + CACHE_CIDADE_MS });
  return local;
}

/** Filtros Overpass para o nicho digitado (fallback: busca pelo nome). */
function filtrosDoNicho(nicho: string): string[] {
  const chave = nicho.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const entrada of MAPEAMENTO) {
    if (entrada.chaves.some((palavra) => chave.includes(palavra))) return entrada.filtros;
  }
  // Nicho fora do dicionário: busca negócios cujo NOME contenha o termo.
  return [`["name"~"${chave.replace(/"/g, '')}",i]`];
}

/** Área nomeada do Overpass para um osm_id (relation = +36e8, way = +24e8). */
function areaNomeada(local: LocalOsm): string | null {
  if (local.osmType === 'relation' && local.osmId) return `area(${3600000000 + local.osmId})`;
  if (local.osmType === 'way' && local.osmId) return `area(${2400000000 + local.osmId})`;
  return null;
}

function montarQuery(filtros: string[], bbox: Bbox, limite: number): string {
  const area = `(${bbox.sul},${bbox.oeste},${bbox.norte},${bbox.leste})`;
  const corpos = filtros
    .map((filtro) => `node${filtro}${area};way${filtro}${area};relation${filtro}${area};`)
    .join('');
  return `[out:json][timeout:45];\n(\n${corpos}\n);\nout center ${limite};`;
}

function montarQueryAreaNomeada(filtros: string[], area: string, limite: number): string {
  // Área de país/estado é o pior caso do Overpass: varredura nacional.
  // Só node+way (lojas como relation são raras) para a query caber no tempo.
  const corpos = filtros
    .map((filtro) => `node${filtro}(area.a);way${filtro}(area.a);`)
    .join('');
  return `[out:json][timeout:60];\n${area}->.a;\n(\n${corpos}\n);\nout center ${limite};`;
}

/** Tipos do Nominatim que NÃO são negócios (ruas, bairros, divisas). */
const CLASSES_IGNORADAS = new Set([
  'boundary', 'place', 'highway', 'landuse', 'natural', 'waterway',
  'railway', 'aeroway', 'barrier', 'man_made', 'building', 'power', 'route',
]);

interface HitNominatim {
  osm_type?: string;
  osm_id?: number;
  lat?: string;
  lon?: string;
  name?: string;
  class?: string;
  extratags?: Record<string, string>;
  address?: Record<string, string>;
}

/**
 * Plano B: quando o Overpass está fora, o Nominatim (infra separada, quase
 * sempre de pé) também encontra negócios — busca pelo NOME dentro da caixa.
 * Menos completo (depende do nicho aparecer no nome) e por isso é só fallback.
 */
export async function buscarPeloNome(
  nicho: string,
  bbox: Bbox,
  limite: number,
): Promise<{ elements: ElementoOsm[] } | null> {
  const termo = nicho.trim();
  if (termo.length < 2) return null;
  const url = `${NOMINATIM}?q=${encodeURIComponent(termo)}&format=jsonv2&limit=${limite}` +
    `&viewbox=${bbox.oeste},${bbox.norte},${bbox.leste},${bbox.sul}&bounded=1&extratags=1&addressdetails=1`;

  let hits: HitNominatim[] | null = null;
  for (let tentativa = 1; tentativa <= 2; tentativa += 1) {
    try {
      await aguardarVezNominatim();
      hits = await fetchJson<HitNominatim[]>(url, undefined, 20000);
      break;
    } catch {
      await esperaComJitter(2000);
    }
  }
  if (!hits) return null;

  const elementos: ElementoOsm[] = [];
  for (const hit of hits) {
    if (!hit.name || CLASSES_IGNORADAS.has(hit.class ?? '')) continue;
    if (hit.osm_type !== 'node' && hit.osm_type !== 'way' && hit.osm_type !== 'relation') continue;
    const endereco = hit.address ?? {};
    elementos.push({
      type: hit.osm_type,
      id: hit.osm_id ?? 0,
      lat: Number(hit.lat),
      lon: Number(hit.lon),
      tags: {
        name: hit.name,
        ...(endereco.road ? { 'addr:street': endereco.road } : {}),
        ...(endereco.house_number ? { 'addr:housenumber': endereco.house_number } : {}),
        ...(endereco.city ?? endereco.town ?? endereco.village
          ? { 'addr:city': endereco.city ?? endereco.town ?? endereco.village }
          : {}),
        ...(hit.extratags ?? {}),
      },
    });
  }
  return { elements: elementos };
}

/**
 * Limpa o valor bruto do telefone do OSM.
 * O mapa às vezes traz VÁRIOS números numa célula ("+55 11 504-4191;+55 11
 * 5092-4492") — concatenar isso num link wa.me gerava número inválido.
 * Escolhe o MELHOR número: válido (8-15 dígitos), preferindo móvel/WhatsApp.
 */
/**
 * Números "inventados"/inúteis que o OSM às vezes tem: 0800, placeholders
 * com zeros, sequências e repetições. Rejeitados — é melhor entregar
 * menos leads do que telefones falsos (regra: dado real > volume).
 */
function telefoneLixo(digitos: string): boolean {
  // Linhas de atendimento (não têm WhatsApp e não atendem lead):
  if (/^(0800|0300|0500|0900|4004|4002)/.test(digitos)) return true;
  // Todos os dígitos iguais: 99999999, 11111111…
  if (RegExp('^(\\d)\\1+$').test(digitos)) return true;
  // Sequência-placeholders apenas quando são o número local INTEIRO
  // (ex.: 12345678). Runs no meio do número são legítimos (912345678 é
  // um móvel português real).
  const local = digitos.replace(/^(244|258|55|351)/, '');
  if (RegExp('^(?:01234567|12345678|123456789|23456789|98765432|987654321|87654321|76543210|1234567)$').test(local) ||
      RegExp('^(?:01234567|12345678|123456789|23456789|98765432|987654321|87654321|76543210|1234567)$').test(digitos)) return true;
  // 5+ zeros seguidos: +258 00 000 000… (4 zeros ainda pode ser real).
  if (/0{5,}/.test(digitos)) return true;
  // 5+ dígitos repetidos em sequência: 77777…
  if (/(\d)\1{4,}/.test(digitos)) return true;
  return false;
}

/**
 * O número é um móvel (aceita WhatsApp)? Valida a estrutura conhecida dos
 * mercados do produto: Angola, Moçambique, Brasil, Portugal.
 */
function pareceMovel(digitos: string): boolean {
  if (digitos.startsWith('244')) return /^2449\d{8}$/.test(digitos);           // Angola: 244 + 9 + 8
  if (digitos.startsWith('258')) return /^2588[2-7]\d{7}$/.test(digitos);       // Moçambique: 258 + 82-87 + 7
  if (digitos.startsWith('55')) return /^55\d{2}9\d{8}$/.test(digitos);         // Brasil: 55 + DDD + 9 + 8
  if (digitos.startsWith('351')) return /^3519\d{8}$/.test(digitos);            // Portugal: 351 + 9 + 8
  // Sem DDI conhecido: heurística genérica de móvel (9 dígitos começando em 8/9).
  return /^[89]\d{8}$/.test(digitos);
}

function melhorTelefone(brutos: (string | undefined)[]): string | null {
  const candidatos = brutos
    .filter((valor): valor is string => Boolean(valor && valor.trim()))
    .flatMap((valor) => valor.split(/[;,\/|]/))
    .map((parte) => parte.trim())
    .filter(Boolean);

  // Passa por cada candidato: tamanho plausível, sem lixo, sem 0000…
  const validos = candidatos.filter((parte) => {
    const digitos = parte.replace(/\D/g, '');
    if (digitos.length < 8 || digitos.length > 15) return false;
    return !telefoneLixo(digitos);
  });
  if (validos.length === 0) return null; // antes devolvia o lixo original — agora descarta

  // Prioridade: móvel (WhatsApp funciona) > fixo com estrutura plausível > resto.
  const movel = validos.find((parte) => pareceMovel(parte.replace(/\D/g, '')));
  if (movel) return movel;
  const fixoPlausivel = validos.find((parte) => {
    const d = parte.replace(/\D/g, '');
    // Fixos conhecidos (9 dígitos locais começando em 2):
    // Angola 244+2XXXXXXXX, Moçambique 258+2XXXXXXXX,
    // Brasil 55+DDD+8 dígitos, Portugal 351+2XXXXXXXX.
    return /^2442\d{7}$/.test(d) || /^2582\d{7}$/.test(d) || /^55\d{10}$/.test(d) || /^3512\d{8}$/.test(d);
  });
  return fixoPlausivel ?? validos[0];
}

function paraCandidate(elemento: ElementoOsm): PlaceCandidate | null {
  const tags = elemento.tags ?? {};
  if (!tags.name) return null;

  const telefone = melhorTelefone([
    tags['contact:whatsapp'],
    tags['contact:mobile'],
    tags.phone,
    tags['contact:phone'],
    tags['contact:messenger'],
  ]);
  // Facebook/Instagram contam como "só redes" — a sonda procura site depois.
  const site =
    tags.website ?? tags['contact:website'] ?? tags['contact:facebook'] ?? tags['contact:instagram'] ?? null;
  const endereco = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:suburb'],
    tags['addr:city'],
  ]
    .filter(Boolean)
    .join(', ');

  return {
    placeId: `osm-${elemento.type}-${elemento.id}`,
    name: tags.name,
    phone: telefone,
    address: endereco || null,
    website: site,
    rating: null,
    reviews: null,
    lat: elemento.lat ?? elemento.center?.lat ?? null,
    lng: elemento.lon ?? elemento.center?.lon ?? null,
  };
}

/**
 * Busca real de negócios do nicho na cidade, via OpenStreetMap.
 * Mesma forma de saída do Google Places (PlaceCandidate[]).
 * `aviso` volta preenchido quando a área era grande demais (país/estado):
 * os resultados são uma amostra e vale buscar por cidade específica.
 */
export async function buscarLugaresOsm(
  nicho: string,
  cidade: string,
  limite = LIMITE_PADRAO,
): Promise<{ places: PlaceCandidate[]; partial: boolean; aviso?: string }> {
  const chave = `${nicho.trim().toLowerCase()}|${cidade.trim().toLowerCase()}`;
  const emCache = cacheBuscas.get(chave);
  if (emCache && emCache.expira > Date.now()) {
    return { places: emCache.valor, partial: false };
  }

  const local = await localDaCidade(cidade);
  const grande = AREAS_GRANDES.has(local.addresstype);
  const limiteArea = grande ? LIMITE_PAIS : limite;

  // Em país/estado a busca por bbox nunca termina; a área nomeada resolve.
  const area = grande ? areaNomeada(local) : null;
  if (grande && !area) {
    throw Object.assign(
      new Error(
        `"${cidade}" é uma área muito grande para buscar de uma vez. Tente uma cidade específica (ex.: "${nicho} em São Paulo").`,
      ),
      { status: 400 },
    );
  }

  const filtros = filtrosDoNicho(nicho);
  // Regra do produto: só vale lead com telefone. A cobertura de telefone no
  // OSM é parcial (varia por nicho/cidade), então pedimos 3x mais resultados
  // e filtramos aqui — filtro na query (regex de chave) sobrecarrega o Overpass.
  const pedidos = Math.min(limiteArea * 3, 200);
  const query = area ? montarQueryAreaNomeada(filtros, area, pedidos) : montarQuery(filtros, local.bbox, pedidos);
  // A query já declara timeout de 45/60s; o fetch dá folga além disso e um
  // orçamento global evita pendurar a requisição quando tudo falha.
  const timeoutFetch = area ? 80000 : 75000;
  // Orçamento total: o usuário não deve ficar minutos vendo spinner quando
  // o serviço público inteiro está fora — sobra tempo para o plano B (busca
  // pelo nome no Nominatim) e o erro honesto chega em ~2min.
  // Prazo global da busca: config.overpassPrazoMs (Vercel: 45000).
  const { config } = await import('../env.ts');
  const prazo = Date.now() + config.overpassPrazoMs;

  // Tenta os espelhos em round-robin (2x cada) — 429/504/timeout no
  // Overpass público são transitórios e variar o primeiro espelho distribui
  // a carga, já que cada espelho tem a sua própria cota. Honra Retry-After.
  const ordem = OVERPASS_ENDPOINTS.map((_, i) => OVERPASS_ENDPOINTS[(proximoEndpoint + i) % OVERPASS_ENDPOINTS.length]);
  proximoEndpoint += 1;
  let json: { elements?: ElementoOsm[] } | null = null;
  let ultimoErro: unknown = null;
  let tudo429 = true;
  for (const endpoint of ordem) {
    for (let tentativa = 1; tentativa <= 2; tentativa += 1) {
      if (Date.now() > prazo) break;
      try {
        await aguardarVezOverpass();
        json = await fetchJson<{ elements?: ElementoOsm[] }>(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ data: query }).toString(),
        }, timeoutFetch);
        break;
      } catch (erro) {
        ultimoErro = erro;
        const http = (erro as { httpStatus?: number }).httpStatus;
        if (http !== 429) tudo429 = false;
        const retrySeg = (erro as { retryAfterSeg?: number }).retryAfterSeg ?? 0;
        if (http === 429) await esperaComJitter(Math.max(retrySeg, 8) * 1000);
        else await esperaComJitter(ESPERA_FALHA_MS);
      }
    }
    if (json) break;
  }
  // Plano B antes de desistir: Overpass caiu, o Nominatim pode salvar a busca.
  let veioDoPlanoB = false;
  if (!json) {
    try {
      const planoB = await buscarPeloNome(nicho, local.bbox, limiteArea);
      if (planoB && planoB.elements.length > 0) {
        json = planoB;
        veioDoPlanoB = true;
      }
    } catch {
      /* cai no erro honesto abaixo */
    }
  }
  if (!json) {
    const causa = (ultimoErro as Error)?.message ?? 'sem detalhes';
    const semRede = /fetch failed|connect|enotfound|econnreset|aborted due to timeout/i.test(causa);
    const motivo = tudo429
      ? 'O serviço público de mapas está com muita gente ao mesmo tempo (limite de uso atingido).'
      : semRede
        ? 'Não consegui acessar o serviço público de mapas agora (instabilidade na rede ou no serviço).'
        : 'O serviço público de mapas está sobrecarregado neste momento.';
    throw Object.assign(
      new Error(
        `${motivo} Aguarde 1-2 minutos e tente de novo — buscar por cidade específica costuma passar mais rápido. Nada foi cobrado.`,
      ),
      { status: 503 },
    );
  }

  const vistos = new Set<string>();
  const places: PlaceCandidate[] = [];
  for (const elemento of json.elements ?? []) {
    const candidate = paraCandidate(elemento);
    if (!candidate || vistos.has(candidate.placeId)) continue;
    vistos.add(candidate.placeId);
    places.push(candidate);
    if (places.length >= limiteArea) break;
  }

  const avisos: string[] = [];
  if (area) {
    avisos.push(
      `"${cidade}" é uma área muito grande — estes são só os primeiros ${places.length} resultados. Para mais leads, busque uma cidade específica (ex.: "São Paulo", "Campinas").`,
    );
  }
  if (veioDoPlanoB) {
    avisos.push(
      'O serviço principal de mapas estava fora do ar; usei a busca alternativa do OpenStreetMap — pode haver menos leads que o normal.',
    );
  }

  cacheBuscas.set(chave, {
    valor: places,
    expira: Date.now() + (places.length > 0 ? CACHE_BUSCA_MS : CACHE_BUSCA_VAZIA_MS),
  });
  return {
    places,
    partial: veioDoPlanoB,
    aviso: avisos.length > 0 ? avisos.join(' ') : undefined,
  };
}
