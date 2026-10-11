import type { DadosEmpresa } from './siteGenerator.ts';

/**
 * CONTEÚDO DO SITE — segunda camada da IA.
 *
 * O Blueprint decide a ARQUITETURA; esta interface é o MATERIAL que o
 * siteBuilder consome para encher o site com o que é específico do negócio
 * (itens do menu, serviços reais daquele segmento, perguntas de FAQ, CTAs).
 * Tudo que é OPINIÓNVEL a respeito do tipo de negócio a IA escreve aqui;
 * nada que seja FATO do negócio concreto (preços, horários, nomes) pode
 * ser inventado — fatos só entram dos dados do mapa.
 */
export interface ConteudoSite {
  kicker: string;                 // acima do H1, ex.: "Pizzaria artesanal em Maputo"
  chamadaHero: string;            // frase comercial do hero (sem fatos)
  rotuloCtaPrincipal: string;     // ex.: "Pedir agora" / "Agendar avaliação"
  rotuloCtaSecundario: string;    // ex.: "Ver menu" / "Ver serviços"
  itensCatalogo: { titulo: string; nota: string }[];  // menu/serviços/imóveis/quartos
  servicos: { titulo: string; descricao: string }[];  // como o negócio atende
  sobre: string;                  // parágrafo institucional do segmento
  destaqueEquipe: string;         // 1 frase sobre os profissionais
  faq: { pergunta: string; resposta: string }[];
  whatsapp_mensagens: string[];
}

export function tipoConteudoSecao(nome: string): 'catalogo' | 'servicos' | 'sobre' | 'faq' | 'outro' {
  const n = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/menu|cardapio|catalogo|produt|imovel|quarto|veicul|curso|pacote/.test(n)) return 'catalogo';
  if (/servic|tratament|procediment|solucao|especialidade/.test(n)) return 'servicos';
  if (/sobre|quem somos|historia|institucional/.test(n)) return 'sobre';
  if (/faq|pergunta|duvida/.test(n)) return 'faq';
  return 'outro';
}

/**
 * BUSINESS ANALYZER — o cérebro novo do DFVLeads.
 *
 * Em vez de "preencher um template de landing page", a IA atua como analista
 * de negócios + arquiteto: entende QUE negócio é, como funciona, o que os
 * clientes precisam e decide a solução. O Blueprint resultante é a fonte de
 * verdade para o resto da geração (seções, componentes, formulário, WhatsApp,
 * moeda, SEO, design).
 *
 * Regras duras (determinísticas, não negociáveis pela IA):
 *  - Nunca inventar preços: sem dado real → "Consultar preço"/"Solicitar orçamento".
 *  - Nunca inventar avaliações/testemunhos: só o rating REAL do Maps.
 *  - Moeda/idioma vêm do país do negócio (DDI do telefone + cidade), não da IA.
 *  - Arquitetura: site estático premium; se o Blueprint pedir backend
 *    (pedidos/autenticação), isso fica registrado como fase 2 — sem mock falso.
 */

export interface CampoFormulario {
  nome: string;
  rotulo: string;
  tipo: 'text' | 'textarea' | 'select' | 'tel' | 'date' | 'number' | 'email';
  placeholder?: string;
  opcoes?: string[];
}

export interface Blueprint {
  business_type: string;        // ex.: Food Service, Serviços, Saúde, Imobiliário
  specific_type: string;        // ex.: Pizzaria, Barbearia, Imobiliária
  business_model: string;       // ex.: Local food business, Serviço presencial
  target_audience: string[];
  customer_needs: string[];     // o que os clientes procuram/precisam fazer
  problems_opportunities: string[];
  recommended_solution: string; // ex.: "Website + menu digital + pedidos por WhatsApp"
  capabilities: string[];       // da lista canônica (validada abaixo)
  sections: string[];           // nomes de seções em ordem
  form_fields: CampoFormulario[];
  whatsapp_mensagens: string[]; // saudações contextuais por ação
  preco_real_disponivel: boolean; // só true se os DADOS tiverem preços
  seo: { title: string; description: string; schema_type: string; palavras_chave: string[] };
  design_direction: {
    mood: string;
    /** Paleta escolhida pela IA (opcional, validada por regularizeCor). */
    cores?: { primario: string; acento: string; fundo: string; tinta: string };
    primario: string; acento: string; fundo: string; tinta: string; textoBotao: string;
    tipografia: 'serifada' | 'moderna' | 'editorial' | 'tecnica';
    hero: 'escuro-foto' | 'claro-split' | 'editorial';
    densidade: 'compacta' | 'confortavel' | 'ampla';
  };
  precisa_backend: boolean;     // informação p/ fase 2 — nunca mockamos backend
  linguagem: string;
}

/** Capacidades canônicas — a IA escolhe APENAS daqui. */
const CAPACIDADES_VALIDAS = new Set([
  'catalog', 'products', 'services', 'pricing', 'menu', 'booking', 'appointment',
  'reservation', 'ordering', 'delivery', 'gallery', 'portfolio', 'team', 'reviews',
  'locations', 'map', 'opening_hours', 'quotations', 'property_listing', 'vehicle_listing',
  'room_listing', 'memberships', 'courses', 'events', 'registration', 'contact',
  'whatsapp', 'faq', 'blog', 'careers',
  // Nichos que pedem unidades de tratamento/pacotes específicos:
  'product_categories', 'treatments', 'packages', 'promotions',
]);

/** Países: DDI do telefone é o sinal mais confiável; cidade reforça. */
const PAISES: { ddi: string; chaves: string[]; pais: string; codigo: string; simbolo: string; escala: string }[] = [
  { ddi: '55', chaves: ['sao paulo', 'rio de janeiro', 'brasilia', 'belo horizonte', 'curitiba', 'salvador', 'fortaleza', 'recife', 'porto alegre'], pais: 'Brasil', codigo: 'BRL', simbolo: 'R$', escala: 'pt-BR' },
  { ddi: '244', chaves: ['luanda', 'benguela', 'lubango', 'huambo', 'talatona', 'viana', 'lobito'], pais: 'Angola', codigo: 'AOA', simbolo: 'Kz', escala: 'pt-AO' },
  { ddi: '258', chaves: ['maputo', 'nampula', 'beira', 'matola', 'quetelimane', 'pemba'], pais: 'Moçambique', codigo: 'MZN', simbolo: 'MT', escala: 'pt-MZ' },
  { ddi: '351', chaves: ['lisboa', 'porto', 'coimbra', 'faro', 'braga', 'aveiro', 'sintra'], pais: 'Portugal', codigo: 'EUR', simbolo: '€', escala: 'pt-PT' },
  { ddi: '1', chaves: ['new york', 'miami', 'boston', 'los angeles'], pais: 'Estados Unidos', codigo: 'USD', simbolo: '$', escala: 'en-US' },
  { ddi: '44', chaves: ['london', 'manchester', 'birmingham'], pais: 'Reino Unido', codigo: 'GBP', simbolo: '£', escala: 'en-GB' },
  { ddi: '27', chaves: ['cape town', 'johannesburg', 'durban'], pais: 'África do Sul', codigo: 'ZAR', simbolo: 'R', escala: 'en-ZA' },
];

export function paisEMoeda(dados: DadosEmpresa): { pais: string; codigo: string; simbolo: string; escala: string } {
  const ddi = (dados.telefone ?? '').replace(/\D/g, '');
  const cidade = dados.cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // 1) DDI exato; 2) cidade conhecida; 3) padrão Brasil (mercado principal).
  for (const p of PAISES) if (ddi.startsWith(p.ddi)) return p;
  for (const p of PAISES) if (p.chaves.some((c) => cidade.includes(c))) return p;
  return PAISES[0];
}

/** Mapeia nomes de seção (livres, da IA) para componentes do builder. */
function chaveSecao(nome: string): string {
  const n = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/hero|inicio|home|abertura/.test(n)) return 'hero';
  if (/menu|cardapio|catalogo|produt|imovel|quarto|veicul|curso|pacote/.test(n)) return 'catalogo';
  if (/servic|tratament|procediment|solucao|especialidade/.test(n)) return 'servicos';
  if (/galeria|portfolio|fotos|galeria de/.test(n)) return 'galeria';
  if (/equipe|barbeiro|medico|professor|corretor|profissionais|team/.test(n)) return 'equipe';
  if (/avalia|review|depoimento|testemunho/.test(n)) return 'avaliacoes';
  if (/horario|funcionamento|opening/.test(n)) return 'horario';
  if (/local|endereco|onde|map|unidade/.test(n)) return 'localizacao';
  if (/agend|reserv|marca|pedido|orcament|inscri|contact|contato|fale/.test(n)) return 'agendar';
  if (/faq|pergunta|dúvida|duvida/.test(n)) return 'faq';
  if (/sobre|quem somos|historia|institucional/.test(n)) return 'sobre';
  return '';
}

const PALETA_BASE: Blueprint['design_direction'] = {
  mood: 'profissional acolhedor',
  primario: '#a86a2c', acento: '#d0914f', fundo: '#faf8f4', tinta: '#1a140e', textoBotao: '#ffffff',
  tipografia: 'moderna', hero: 'claro-split', densidade: 'confortavel',
};

/** Fallback determinístico: nichos conhecidos + genérico para nunca vistos. */
export function blueprintPadrao(dados: DadosEmpresa): Blueprint {
  const chave = dados.nicho.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const { pais, codigo, simbolo, escala } = paisEMoeda(dados);
  const conhecidos: Record<string, Partial<Blueprint>> = {
    pizzaria: {
      business_type: 'Food Service', specific_type: 'Pizzaria', business_model: 'Restaurante local com balcão e entrega',
      customer_needs: ['Ver o menu', 'Ver preços', 'Fazer pedido', 'Saber horário', 'Localização', 'Contactar'],
      capabilities: ['menu', 'pricing', 'ordering', 'whatsapp', 'gallery', 'opening_hours', 'locations', 'faq'],
      sections: ['Hero', 'Menu', 'Galeria', 'Horário', 'Localização', 'Pedido', 'FAQ'],
      whatsapp_mensagens: ['Olá! Gostaria de fazer um pedido.'],
      seo: { title: '', description: '', schema_type: 'Restaurant', palavras_chave: [] },
    },
    barbearia: {
      business_type: 'Beleza e bem-estar', specific_type: 'Barbearia', business_model: 'Serviço presencial com agendamento',
      customer_needs: ['Ver serviços e preços', 'Agendar horário', 'Ver a equipe', 'Localização', 'Contactar'],
      capabilities: ['services', 'pricing', 'booking', 'team', 'gallery', 'opening_hours', 'locations', 'whatsapp'],
      sections: ['Hero', 'Serviços', 'Equipe', 'Galeria', 'Horário', 'Agendamento', 'FAQ'],
      whatsapp_mensagens: ['Olá! Gostaria de agendar um corte.'],
      seo: { title: '', description: '', schema_type: 'HairSalon', palavras_chave: [] },
    },
    imobiliaria: {
      business_type: 'Imobiliário', specific_type: 'Imobiliária', business_model: 'Intermediação de imóveis',
      customer_needs: ['Ver imóveis disponíveis', 'Filtrar por tipo/preço', 'Falar com um corretor', 'Agendar visita'],
      capabilities: ['property_listing', 'booking', 'contact', 'whatsapp', 'team', 'faq'],
      sections: ['Hero', 'Imóveis', 'Equipe', 'Visita', 'FAQ'],
      form_fields: [
        { nome: 'interesse', rotulo: 'Tipo de interesse', tipo: 'select', opcoes: ['Comprar', 'Alugar', 'Vender', 'Avaliar meu imóvel'] },
        { nome: 'detalhe', rotulo: 'O que procura (bairro, quartos, faixa de valor)', tipo: 'textarea', placeholder: 'Ex.: apartamento 2 quartos, centro, até 300 mil' },
      ],
      whatsapp_mensagens: ['Olá! Tenho interesse em um imóvel.'],
      seo: { title: '', description: '', schema_type: 'RealEstateAgent', palavras_chave: [] },
    },
    oficina: {
      business_type: 'Automotivo', specific_type: 'Oficina mecânica', business_model: 'Serviço automotivo com orçamento',
      customer_needs: ['Solicitar orçamento', 'Agendar revisão', 'Ver serviços e preços', 'Localização e horário'],
      capabilities: ['services', 'quotations', 'booking', 'opening_hours', 'locations', 'whatsapp', 'faq'],
      sections: ['Hero', 'Serviços', 'Horário', 'Localização', 'Orçamento', 'FAQ'],
      form_fields: [
        { nome: 'veiculo', rotulo: 'Veículo (marca/modelo/ano)', tipo: 'text', placeholder: 'Ex.: Honda Civic 2019' },
        { nome: 'problema', rotulo: 'O que está acontecendo', tipo: 'textarea', placeholder: 'Descreva o problema ou serviço desejado' },
      ],
      whatsapp_mensagens: ['Olá! Gostaria de solicitar um orçamento para o meu veículo.'],
      seo: { title: '', description: '', schema_type: 'AutoRepair', palavras_chave: [] },
    },
    hotel: {
      business_type: 'Hospedagem', specific_type: 'Hotel', business_model: 'Hospedagem com reservas',
      customer_needs: ['Ver quartos e preços', 'Reservar', 'Ver comodidades', 'Localização', 'Contactar'],
      capabilities: ['room_listing', 'reservation', 'gallery', 'locations', 'whatsapp', 'faq'],
      sections: ['Hero', 'Quartos', 'Galeria', 'Localização', 'Reserva', 'FAQ'],
      form_fields: [
        { nome: 'checkin', rotulo: 'Check-in', tipo: 'date' },
        { nome: 'checkout', rotulo: 'Check-out', tipo: 'date' },
        { nome: 'hospedes', rotulo: 'Hóspedes', tipo: 'number', placeholder: '2' },
      ],
      whatsapp_mensagens: ['Olá! Gostaria de verificar disponibilidade de quartos.'],
      seo: { title: '', description: '', schema_type: 'Hotel', palavras_chave: [] },
    },
  };

  for (const [palavra, base] of Object.entries(conhecidos)) {
    if (chave.includes(palavra)) return montarBlueprint(dados, base, { pais, codigo, simbolo, escala });
  }

  // Negócio NUNCA previsto: análise genérica honesta — capacidade mínima
  // sólida (serviços + contato + horário + local), sem inventar especialidades.
  return montarBlueprint(
    dados,
    {
      business_type: 'Negócio local',
      specific_type: dados.nicho,
      business_model: 'Atendimento local',
      customer_needs: ['Conhecer os serviços', 'Solicitar orçamento', 'Ver horário e localização', 'Contactar pelo WhatsApp'],
      capabilities: ['services', 'quotations', 'opening_hours', 'locations', 'whatsapp', 'contact'],
      sections: ['Hero', 'Serviços', 'Horário', 'Localização', 'Contato'],
      whatsapp_mensagens: [`Olá! Gostaria de saber mais sobre os serviços da ${dados.nome}.`],
      seo: { title: '', description: '', schema_type: 'LocalBusiness', palavras_chave: [] },
    },
    { pais, codigo, simbolo, escala },
  );
}

function montarBlueprint(
  dados: DadosEmpresa,
  base: Partial<Blueprint>,
  local: { pais: string; codigo: string; simbolo: string; escala: string },
): Blueprint {
  return {
    business_type: base.business_type ?? 'Negócio local',
    specific_type: base.specific_type ?? dados.nicho,
    business_model: base.business_model ?? 'Atendimento local',
    target_audience: base.target_audience ?? ['Clientes da região'],
    customer_needs: base.customer_needs ?? ['Conhecer os serviços', 'Contactar'],
    problems_opportunities: base.problems_opportunities ?? ['Sem website próprio', 'Depende só de redes sociais/mouth'],
    recommended_solution: base.recommended_solution ?? 'Website profissional + captação por WhatsApp',
    capabilities: (base.capabilities ?? ['services', 'whatsapp', 'opening_hours', 'locations']).filter((c) => CAPACIDADES_VALIDAS.has(c)),
    sections: base.sections ?? ['Hero', 'Serviços', 'Horário', 'Localização', 'Contato'],
    form_fields: base.form_fields ?? [],
    whatsapp_mensagens: base.whatsapp_mensagens ?? [`Olá! Gostaria de saber mais sobre a ${dados.nome}.`],
    preco_real_disponivel: false, // sem dados de preço reais — NUNCA inventar
    seo: {
      title: `${dados.nome} — ${dados.nicho} em ${dados.cidade}`,
      description: `${dados.nome}: ${dados.nicho} em ${dados.cidade}. Atendimento pelo site em segundos.`,
      schema_type: base.seo?.schema_type ?? 'LocalBusiness',
      palavras_chave: [dados.nicho, `${dados.nicho} em ${dados.cidade}`, dados.nome],
    },
    design_direction: { ...PALETA_BASE },
    precisa_backend: false,
    linguagem: local.escala,
  };
}

/**
 * Contenção de estrago: hex válido, contraste mínimo com o fundo (WCAG
 * aproximado por luminância relativa) e fundo claro (o design system usa
 * cartões brancos, footer escuro e textos escuros). Se a IA sair da linha,
 * cai na paleta da dica de segmento ou na base.
 */
function regularizeCor(valor: unknown, fallback: string, fundo: string): string {
  const hex = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  if (!/^#[0-9a-f]{6}$/.test(hex)) return fallback;
  const num = parseInt(hex.slice(1), 16);
  const [r, g, b] = [num >> 16, (num >> 8) & 255, num & 255];
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const [fr, fg, fb] = [parseInt(fundo.slice(1, 3), 16), parseInt(fundo.slice(3, 5), 16), parseInt(fundo.slice(5, 7), 16)];
  const lumFundo = (0.2126 * fr + 0.7152 * fg + 0.0722 * fb) / 255;
  if (Math.abs(lum - lumFundo) < 0.25) return fallback;
  return hex;
}

/** Passa o nicho para o sistema de design (cores coerentes com o segmento). */
const DICAS_PALETA: [RegExp, Partial<Blueprint['design_direction']>][] = [
  // Pizzaria/comida: referência Bella Napoli — vermelho-tomate, dark, creme.
  [/pizz|restaur|food|comida|lanche|hamburg|sushi/, { primario: '#d92626', acento: '#b71c1c', fundo: '#f7f3ec', tinta: '#191310', textoBotao: '#ffffff', tipografia: 'serifada', hero: 'escuro-foto', densidade: 'confortavel' }],
  [/salao|beleza|estetic/, { primario: '#b06180', acento: '#d89ab4', fundo: '#fbf6f8', tinta: '#201318' }],
  [/dent|clinic|saude|medic/, { primario: '#1f8aa8', acento: '#58b7cd', fundo: '#f5fafc', tinta: '#0e1c21', tipografia: 'moderna' }],
  [/imobiliar|imovel|real estate/, { primario: '#3d6b54', acento: '#6fa585', fundo: '#f7faf8', tinta: '#101d16', tipografia: 'editorial', hero: 'editorial' }],
  [/energia|solar|industr|constru|engenh/, { primario: '#c25a26', acento: '#e2854f', fundo: '#f7f8fa', tinta: '#15171a', tipografia: 'tecnica', hero: 'editorial' }],
  [/escola|educac|curs|universi/, { primario: '#4a5aa8', acento: '#7d8ccd', fundo: '#f7f8fd', tinta: '#131629', tipografia: 'editorial' }],
];

/** Instruções da análise (STEP 2-8). A IA responde SOMENTE com JSON. */
function instrucaoAnalise(dados: DadosEmpresa, local: { pais: string; simbolo: string }): string {
  return `
Você é analista de negócios, arquiteto de soluções e designer UX sênior. Analise o negócio abaixo e responda SOMENTE com um JSON válido (sem markdown, sem código).

NEGÓCIO (dados reais do mapa — NÃO invente fatos além destes):
- Nome: ${dados.nome}
- Categoria informada: ${dados.nicho}
- Cidade: ${dados.cidade}
- País: ${local.pais} (moeda oficial: ${local.simbolo})
- Telefone: ${dados.telefone ?? 'não informado'}
- Endereço: ${dados.endereco ?? 'não informado'}
- Avaliação: ${dados.rating ? `${dados.rating}/5 (${dados.reviews ?? 0} avaliações)` : 'sem avaliação'}

Formato exato do JSON:
{
  "business_type": "categoria ampla (ex.: Food Service, Saúde, Imobiliário, Serviços)",
  "specific_type": "tipo específico (ex.: Pizzaria, Barbearia, Imobiliária)",
  "business_model": "como o negócio funciona em 1 frase",
  "target_audience": ["3 perfis de cliente"],
  "customer_needs": ["5-7 coisas que o cliente procura/precisa fazer"],
  "problems_opportunities": ["3-4 problemas/oportunidades de presença digital"],
  "recommended_solution": "a solução digital certa em 1 frase (ex.: Website + menu digital + pedidos por WhatsApp)",
  "capabilities": ["escolha APENAS desta lista: catalog, products, services, pricing, menu, booking, appointment, reservation, ordering, delivery, gallery, portfolio, team, reviews, locations, map, opening_hours, quotations, property_listing, vehicle_listing, room_listing, memberships, courses, events, registration, contact, whatsapp, faq, blog, careers, product_categories, treatments, packages, promotions"],
  "sections": ["5-9 seções na ordem ideal da página, nomeadas em português (ex.: Hero, Menu, Galeria, Sobre, Agendamento, FAQ)"],
  "form_fields": [{"nome": "campo", "rotulo": "rótulo do campo", "tipo": "text|textarea|select|date|number", "placeholder": "exemplo realista", "opcoes": ["só para select, 3-4 opções genéricas"]}] — campos CONTEXTUAIS além de nome/WhatsApp; use apenas os que fazem sentido para este negócio (0-5 campos; hotel: checkin/checkout/hóspedes; imobiliária: interesse + o que procura; oficina: veículo + problema),
  "whatsapp_mensagens": ["2-3 saudações contextuais do que o cliente diz ao chamar (ex.: 'Olá! Gostaria de agendar um corte.')"],
  "seo": {"title": "até 60 chars com nome + tipo + cidade", "description": "até 155 chars", "schema_type": "tipo schema.org (ex.: Restaurant, HairSalon, Hotel, RealEstateAgent, LocalBusiness)", "palavras_chave": ["4-6 palavras-chave locais"]},
  "design_direction": {"mood": "personalidade visual em 2-4 palavras", "tipografia": "serifada|moderna|editorial|tecnica", "hero": "escuro-foto|claro-split|editorial", "densidade": "compacta|confortavel|ampla", "cores": {"primario": "#rrggbb", "acento": "#rrggbb", "fundo": "#rrggbb", "tinta": "#rrggbb"}}
}

REGRAS DE DESIGN:
- "cores" é OPCIONAL e recomendada: escolha a paleta que um designer escolheria para ESTE segmento (ex.: pizzaria em vermelho-tomate sobre creme; barbearia em dourado escuro; clínica em azul-turquesa claro). "fundo" deve ser CLARO (cartões brancos ficam sobre ele) e "tinta" bem escuro para texto; "primario" é a cor das ações.
- Se não quiser arriscar cores, omita "cores" e o sistema aplica a paleta do segmento.
- NÃO invente preços, avaliações, horários, serviços com valores, prêmios ou fatos não informados.
- As seções/capacidades devem refletir COMO ESTE negócio funciona (pizzaria tem menu; oficina tem orçamento; imobiliária tem imóveis). Sinta-se livre para incluir seções como "Sobre", "Promoções" ou outras que este negócio mereça.
- Responda apenas com o JSON — começa em { e termina em }.
`.trim();
}

interface RespostaLLM {
  choices?: { message?: { content?: string } }[];
}

export async function chamarLLM(system: string, user: string, maxTokens: number, temperature: number): Promise<string | null> {
  const { config } = await import('../env.ts');
  if (!config.llmApiKey) return null;
  // 3 tentativas com espera: 429/instabilidade transiente não derruba a camada.
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    if (tentativa > 0) await new Promise((r) => setTimeout(r, 3000 * tentativa));
    try {
      const resposta = await fetch(`${config.llmBaseUrl}/chat/completions`, {
        method: 'POST',
        signal: AbortSignal.timeout(60000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.llmApiKey}` },
        body: JSON.stringify({
          model: config.llmModelo,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      });
      if (!resposta.ok) {
        // Rate limit: espera o que a API pede (limitado a 20s) e tenta de novo.
        if (resposta.status === 429) {
          const espera = Math.min(Number(resposta.headers.get('retry-after') ?? 6) || 6, 20);
          await new Promise((r) => setTimeout(r, espera * 1000));
        }
        continue;
      }
      const json = (await resposta.json()) as RespostaLLM;
      const texto = json.choices?.[0]?.message?.content ?? null;
      if (texto) return texto;
    } catch {
      // tenta de novo; esgotou → null e o chamador usa o fallback
    }
  }
  return null;
}

function extrairJson<T>(texto: string): T | null {
  const inicio = texto.indexOf('{');
  const fim = texto.lastIndexOf('}');
  if (inicio < 0 || fim <= inicio) return null;
  try {
    return JSON.parse(texto.slice(inicio, fim + 1)) as T;
  } catch {
    return null;
  }
}

/**
 * STEP 2-8: análise + blueprint. A IA decide; o sistema valida e corrige.
 * Devolve null quando a IA não responde — o chamador usa o blueprint padrão.
 */
export async function analisarNegocio(dados: DadosEmpresa): Promise<Blueprint | null> {
  const local = paisEMoeda(dados);
  const texto = await chamarLLM(
    'Você é analista de negócios sênior. Responde SOMENTE com JSON válido, sem markdown, sem código, sem emojis.',
    instrucaoAnalise(dados, { pais: local.pais, simbolo: local.simbolo }),
    3200,
    0.4,
  );
  if (!texto) return null;
  const bruto = extrairJson<Partial<Blueprint>>(texto);
  if (!bruto?.specific_type || !Array.isArray(bruto.capabilities)) return null;

  const base = blueprintPadrao(dados); // valores seguros para furos
  const blueprint: Blueprint = {
    ...base,
    ...bruto,
    capabilities: (bruto.capabilities ?? []).filter((c) => CAPACIDADES_VALIDAS.has(c)).length >= 3
      ? (bruto.capabilities ?? []).filter((c) => CAPACIDADES_VALIDAS.has(c))
      : base.capabilities,
    sections: (bruto.sections ?? []).length >= 3 ? (bruto.sections ?? []).map((s) => String(s).slice(0, 40)) : base.sections,
    form_fields: (bruto.form_fields ?? [])
      .filter((campo) => campo && typeof campo.rotulo === 'string' && campo.rotulo.length > 1)
      .slice(0, 5)
      .map((campo) => ({
        nome: String(campo.nome ?? 'campo').replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'campo',
        rotulo: String(campo.rotulo).slice(0, 60),
        tipo: (['text', 'textarea', 'select', 'date', 'number', 'tel', 'email'] as readonly string[]).includes(String(campo.tipo))
          ? (campo.tipo as CampoFormulario['tipo'])
          : ('text' as const),
        placeholder: campo.placeholder ? String(campo.placeholder).slice(0, 90) : undefined,
        opcoes: Array.isArray(campo.opcoes) ? campo.opcoes.slice(0, 5).map((o) => String(o).slice(0, 40)) : undefined,
      })),
    whatsapp_mensagens: (bruto.whatsapp_mensagens ?? base.whatsapp_mensagens).slice(0, 3).map((m) => String(m).slice(0, 120)),
    preco_real_disponivel: false, // regra dura: sem preços reais nos dados de origem
    seo: {
      title: (bruto.seo?.title ?? base.seo.title).slice(0, 60),
      description: (bruto.seo?.description ?? base.seo.description).slice(0, 155),
      schema_type: (bruto.seo?.schema_type ?? base.seo.schema_type).slice(0, 40),
      palavras_chave: (bruto.seo?.palavras_chave ?? base.seo.palavras_chave).slice(0, 6).map((p) => String(p).slice(0, 40)),
    },
    design_direction: {
      ...base.design_direction,
      ...(bruto.design_direction ?? {}),
      // AUTONOMIA: a IA escolhe a paleta; regularizeCor contém o estrago
      // (hex válido, contraste com o fundo, fundo claro). Sem cores da IA,
      // vale a dica determinística do segmento (DICAS_PALETA).
      primario: regularizeCor(bruto.design_direction?.cores?.primario, base.design_direction.primario, bruto.design_direction?.cores?.fundo ?? base.design_direction.fundo),
      acento: regularizeCor(bruto.design_direction?.cores?.acento, base.design_direction.acento, bruto.design_direction?.cores?.fundo ?? base.design_direction.fundo),
      fundo: regularizeCor(bruto.design_direction?.cores?.fundo, base.design_direction.fundo, '#ffffff'),
      tinta: regularizeCor(bruto.design_direction?.cores?.tinta, base.design_direction.tinta, '#000000'),
      textoBotao: base.design_direction.textoBotao,
      tipografia: (['serifada', 'moderna', 'editorial', 'tecnica'] as readonly string[]).includes(String(bruto.design_direction?.tipografia))
        ? (bruto.design_direction!.tipografia as Blueprint['design_direction']['tipografia'])
        : base.design_direction.tipografia,
      hero: (['escuro-foto', 'claro-split', 'editorial'] as readonly string[]).includes(String(bruto.design_direction?.hero))
        ? (bruto.design_direction!.hero as Blueprint['design_direction']['hero'])
        : base.design_direction.hero,
      densidade: (['compacta', 'confortavel', 'ampla'] as readonly string[]).includes(String(bruto.design_direction?.densidade))
        ? (bruto.design_direction!.densidade as Blueprint['design_direction']['densidade'])
        : base.design_direction.densidade,
    },
  };

  // Dica de paleta por segmento (determinística) — sobre a escolha estrutural da IA.
  const chave = `${dados.nicho} ${dados.nome}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [padrao, dica] of DICAS_PALETA) {
    if (padrao.test(chave)) Object.assign(blueprint.design_direction, dica);
  }
  return blueprint;
}

/** Componentes do plano, prontos para o builder (STEP 8-12). */
export interface Plano {
  secoes: { chave: string; titulo: string }[];
  campos: CampoFormulario[];
  saudacoes: string[];
  moeda: { pais: string; codigo: string; simbolo: string };
  textoPreco: string;
}

/**
 * SEGUNDA CHAMADA DE IA — escreve o MATERIAL do site para ESTE negócio:
 * itens do menu/serviços, sobre, FAQ, CTAs e kicker. O siteBuilder consome
 * isso em vez de textos genéricos fixos. Falha/devolução inválida → null
 * e o builder mantém os textos honestos padrão.
 */
export async function escreverConteudoSite(dados: DadosEmpresa, blueprint: Blueprint): Promise<ConteudoSite | null> {
  const local = paisEMoeda(dados);
  const instrucao = `
Você é arquiteto de conteúdo sênior. Escreva o MATERIAL textual do site do negócio abaixo, ESPECÍFICO para o tipo "${blueprint.specific_type}" (${blueprint.business_type}). Responda SOMENTE com JSON válido (sem markdown, sem código, sem emojis).

NEGÓCIO (dados reais do mapa):
- Nome: ${dados.nome}
- Tipo: ${blueprint.specific_type} (${dados.nicho})
- Cidade: ${dados.cidade}, ${local.pais}
- Modelo: ${blueprint.business_model}
- Necessidades dos clientes: ${blueprint.customer_needs.join('; ')}
- Capacidades decididas: ${blueprint.capabilities.join(', ')}

Formato exato do JSON:
{
  "kicker": "rótulo curto acima do título, ex.: 'Pizzaria artesanal em ${dados.cidade}' (até 60 chars)",
  "chamadaHero": "frase comercial do hero falando do que o cliente faz no site (até 110 chars)",
  "rotuloCtaPrincipal": "2-4 palavras para o botão de conversão, ex.: 'Pedir agora', 'Agendar avaliação', 'Reservar mesa'",
  "rotuloCtaSecundario": "2-3 palavras para o botão que rola ao catálogo, ex.: 'Ver menu', 'Ver serviços'",
  "itensCatalogo": [4-8 itens, cada um {"titulo": "item típico e específico de ${blueprint.specific_type} (até 40 chars)", "nota": "1 frase de descrição apetecível/útil (até 80 chars)"}],
  "servicos": [3-6 itens, cada um {"titulo": "como este negócio atende (até 40 chars)", "descricao": "1 frase clara (até 90 chars)"}],
  "sobre": "1 parágrafo (2-4 frases) sobre um ${blueprint.specific_type} típico, no tom do segmento, SEM inventar fatos da empresa (anos, prêmios, números)",
  "destaqueEquipe": "1 frase sobre os profissionais, sem inventar nomes (até 120 chars)",
  "faq": [3-5 pares {"pergunta": "...", "resposta": "1-2 frases diretas"}],
  "whatsapp_mensagens": ["2-3 saudações contextuais do que o cliente diz ao chamar"]
}

REGRAS:
- Os itens do catálogo devem ser os TÍPICOS de ${blueprint.specific_type} (pizzaria: pizzas clássicas e combos; hotel: tipos de quarto; dentista: limpeza, restauração...). Genéricos como "Item 1" são proibidos.
- NÃO invente preços, avaliações, nomes de pessoas, horários ou fatos específicos da empresa. Conteúdo de SEGMENTO (como funciona este tipo de negócio) é bem-vindo; FATO da empresa concreta, só o que está acima.
- Português natural (${local.escala}), tom do segmento, sem emojis.
- Responda apenas com o JSON — começa em { e termina em }.
`.trim();

  const texto = await chamarLLM(
    'Você é arquiteto de conteúdo sênior. Responde SOMENTE com JSON válido, sem markdown, sem código, sem emojis.',
    instrucao,
    2600,
    0.55,
  );
  if (!texto) return null;
  const bruto = extrairJson<Partial<ConteudoSite>>(texto);
  if (!bruto) return null;

  const textoCurto = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const itens = (bruto.itensCatalogo ?? [])
    .filter((i): i is { titulo: string; nota: string } => Boolean(i && typeof i.titulo === 'string' && i.titulo.length > 1))
    .slice(0, 8)
    .map((i) => ({ titulo: textoCurto(i.titulo, 44), nota: textoCurto(i.nota, 90) }));
  const servicos = (bruto.servicos ?? [])
    .filter((s): s is { titulo: string; descricao: string } => Boolean(s && typeof s.titulo === 'string' && s.titulo.length > 1))
    .slice(0, 6)
    .map((s) => ({ titulo: textoCurto(s.titulo, 44), descricao: textoCurto(s.descricao, 100) }));
  const faq = (bruto.faq ?? [])
    .filter((f): f is { pergunta: string; resposta: string } => Boolean(f && typeof f.pergunta === 'string' && typeof f.resposta === 'string'))
    .slice(0, 5)
    .map((f) => ({ pergunta: textoCurto(f.pergunta, 110), resposta: textoCurto(f.resposta, 260) }));

  const valido = itens.length >= 3 && servicos.length >= 2 && bruto.sobre && bruto.sobre.length > 40;
  if (!valido) return null;

  return {
    kicker: textoCurto(bruto.kicker, 60) || `${blueprint.specific_type} em ${dados.cidade}`,
    chamadaHero: textoCurto(bruto.chamadaHero, 110) || `Fale direto pelo WhatsApp — a ${dados.nome} responde você em segundos.`,
    rotuloCtaPrincipal: textoCurto(bruto.rotuloCtaPrincipal, 30) || 'Falar com a empresa',
    rotuloCtaSecundario: textoCurto(bruto.rotuloCtaSecundario, 30) || 'Ver catálogo',
    itensCatalogo: itens,
    servicos,
    sobre: textoCurto(bruto.sobre, 520),
    destaqueEquipe: textoCurto(bruto.destaqueEquipe, 130) || 'Profissionais do segmento prontos para atender você.',
    faq,
    whatsapp_mensagens: (bruto.whatsapp_mensagens ?? []).slice(0, 3).map((m) => textoCurto(m, 120)).filter(Boolean),
  };
}

export function construirPlano(blueprint: Blueprint, dados: DadosEmpresa): Plano {
  const vistas = new Set<string>();
  const secoes: Plano['secoes'] = [];
  for (const nome of blueprint.sections) {
    const chave = chaveSecao(nome);
    if (!chave || vistas.has(chave)) continue;
    vistas.add(chave);
    secoes.push({ chave, titulo: nome });
  }
  if (!vistas.has('agendar')) secoes.push({ chave: 'agendar', titulo: 'Contato' });
  if (!vistas.has('hero')) secoes.unshift({ chave: 'hero', titulo: 'Início' });

  return {
    secoes,
    campos: blueprint.form_fields,
    saudacoes: blueprint.whatsapp_mensagens.length > 0 ? blueprint.whatsapp_mensagens : [`Olá! Gostaria de saber mais sobre a ${dados.nome}.`],
    moeda: (() => {
      const local = paisEMoeda(dados);
      return { pais: local.pais, codigo: local.codigo, simbolo: local.simbolo };
    })(),
    // Sem preço real: chamada para ação honesta, escolhida pelo modelo de negócio.
    textoPreco: /reserv|hotel|room|imovel|property/.test(blueprint.business_type.toLowerCase())
      ? 'Preço sob consulta'
      : 'Consultar preço',
  };
}

/** Resumo para o usuário (STEP 22 — explicação da decisão). */
export interface AnaliseResumo {
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
}

export function resumirAnalise(blueprint: Blueprint, plano: Plano, correcoes: string[]): AnaliseResumo {
  return {
    negocio: blueprint.specific_type,
    tipo: blueprint.business_type,
    modelo: blueprint.business_model,
    clientes: blueprint.target_audience,
    necessidades: blueprint.customer_needs,
    solucao: blueprint.recommended_solution,
    secoes: plano.secoes.map((s) => s.titulo),
    funcionalidades: blueprint.capabilities,
    moeda: `${plano.moeda.codigo} / ${plano.moeda.simbolo} (${plano.moeda.pais})`,
    idioma: blueprint.linguagem,
    arquitetura: blueprint.precisa_backend
      ? 'Frontend estático agora + backend (pedidos/reservas) como fase 2'
      : 'Frontend estático (site 100% funcional, sem backend necessário)',
    design: `${blueprint.design_direction.mood} · hero ${blueprint.design_direction.hero} · tipografia ${blueprint.design_direction.tipografia}`,
    correcoes,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   DIRETOR DE CRIAÇÃO — a IA pensa como programador front-end sénior:
   parte do modelo do negócio, decide o LAYOUT (hero), a ESTRUTURA
   (formato de cada seção), os detalhes (cantos, divisores, faixas) e
   só então o builder executa. Sites de nichos diferentes param de
   parecer o mesmo template com outra cor.

   Regras duras:
   - Vocabulário fechado de heros/formatos (validados abaixo); qualquer
     invencionice cai no fallback pontual — o site nunca quebra.
   - Sem foto disponível, heros com foto são proibidos (caem p/ split).
   - Sem LLM, o fallback é DETERMINÍSTICO COM VARIEDADE: negócios
     diferentes recebem designs diferentes (hash do nome+nicho+cidade).
   ═══════════════════════════════════════════════════════════════════ */

export type HeroLayout =
  | 'foto-cheia'       // foto fullscreen de fundo, texto central (impacto)
  | 'split'            // texto à esquerda, foto à direita (clássico)
  | 'editorial'        // tipografia gigante, quase sem foto (sofisticado)
  | 'cartao-flutuante' // foto em cartão + cartão branco flutuante (moderno)
  | 'faixa'            // faixa com padrão + conteúdo (ousado)
  | 'centro';          // texto centrado, sem foto (limpo, direto)

const HEROS_VALIDOS: readonly string[] = [
  'foto-cheia', 'split', 'editorial', 'cartao-flutuante', 'faixa', 'centro',
];

/** Formatos válidos por seção (chave do chaveSecao → formatos). */
export const FORMATOS_VALIDOS: Record<string, readonly string[]> = {
  catalogo: ['grade', 'lista', 'destaque'],
  servicos: ['cartoes', 'linhas', 'faixa'],
  galeria: ['grade', 'faixa'],
  equipe: ['nota', 'cartoes'],
  avaliacoes: ['caixa', 'faixa'],
  horario: ['faixa', 'cartao'],
  localizacao: ['cartao', 'faixa'],
  sobre: ['texto', 'split'],
  faq: ['acordeao', 'colunas'],
  agendar: ['form', 'split', 'centro'],
};

export interface DesignSite {
  conceito: string;                    // a ideia do design em 1 frase
  hero: HeroLayout;
  cantos: 'vivos' | 'suaves' | 'redondos';
  divisores: 'retos' | 'curva' | 'onda';
  fundoAlternado: boolean;             // seções alternadas com fundo suave
  faixaCta: boolean;                   // faixa de conversão no meio da página
  formatos: Record<string, string>;    // chave da seção → formato
}

/** Mapeia o hero antigo do blueprint para o vocabulário novo. */
export function mapearHero(hero: string): HeroLayout {
  if (hero === 'escuro-foto') return 'foto-cheia';
  if (hero === 'claro-split') return 'split';
  if ((HEROS_VALIDOS as readonly string[]).includes(hero)) return hero as HeroLayout;
  return 'split';
}

/** Hash determinístico FNV-1a (seed de variedade, sem aleatoriedade). */
export function hashSeed(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Fallback determinístico COM variedade: o mesmo negócio recebe sempre o
 * mesmo design; negócios diferentes (quase sempre) recebem designs
 * diferentes — mesmo sem LLM, os sites param de ser clones.
 */
export function designPadrao(dados: DadosEmpresa, blueprint: Blueprint, temFoto: boolean): DesignSite {
  const seed = hashSeed(`${dados.nome} ${dados.nicho} ${dados.cidade}`);
  const pick = <T>(lista: readonly T[], salt: number): T =>
    lista[((seed + Math.imul(salt, 0x9e3779b9)) >>> 0) % lista.length];

  const heros: HeroLayout[] = temFoto
    ? ['foto-cheia', 'split', 'editorial', 'cartao-flutuante', 'faixa', 'centro']
    : ['editorial', 'centro', 'faixa', 'split'];
  const formatos: Record<string, string> = {};
  let salt = 7;
  for (const opcoes of Object.values(FORMATOS_VALIDOS)) {
    formatos[Object.keys(FORMATOS_VALIDOS)[salt - 7]] = pick(opcoes, salt);
    salt += 1;
  }
  return {
    conceito: `Direção ${blueprint.design_direction.mood} para ${blueprint.specific_type} (determinística).`,
    hero: pick(heros, 1),
    cantos: pick(['vivos', 'suaves', 'redondos'] as const, 40),
    divisores: pick(['retos', 'curva', 'onda'] as const, 41),
    fundoAlternado: pick([true, false] as const, 42),
    faixaCta: pick([true, false] as const, 43),
    formatos,
  };
}

/** Valida o JSON do diretor de criação; cada furo cai no fallback pontual. */
export function validarDesign(bruto: unknown, fallback: DesignSite, temFoto: boolean): DesignSite {
  const b = (bruto ?? {}) as Record<string, unknown>;
  const umDe = (v: unknown, lista: readonly string[], padrao: string): string =>
    typeof v === 'string' && lista.includes(v) ? v : padrao;

  let hero = umDe(b.hero, HEROS_VALIDOS, fallback.hero) as HeroLayout;
  // Heros com foto exigem foto real disponível.
  if (!temFoto && (hero === 'foto-cheia' || hero === 'cartao-flutuante')) hero = 'split';

  const fb = (b.formatos ?? {}) as Record<string, unknown>;
  const formatos: Record<string, string> = {};
  for (const [chave, opcoes] of Object.entries(FORMATOS_VALIDOS)) {
    formatos[chave] = umDe(fb[chave], opcoes, fallback.formatos[chave]);
  }
  return {
    conceito:
      typeof b.conceito === 'string' && b.conceito.trim().length > 3
        ? b.conceito.trim().slice(0, 140)
        : fallback.conceito,
    hero,
    cantos: umDe(b.cantos, ['vivos', 'suaves', 'redondos'], fallback.cantos) as DesignSite['cantos'],
    divisores: umDe(b.divisores, ['retos', 'curva', 'onda'], fallback.divisores) as DesignSite['divisores'],
    fundoAlternado: typeof b.fundoAlternado === 'boolean' ? b.fundoAlternado : fallback.fundoAlternado,
    faixaCta: typeof b.faixaCta === 'boolean' ? b.faixaCta : fallback.faixaCta,
    formatos,
  };
}

/**
 * Instrução do DIRETOR DE CRIAÇÃO (STEP 9). A IA pensa como programador
 * front-end sénior + diretor de arte: parte do MODELO do negócio (como ele
 * ganha dinheiro, o que o cliente precisa FAZER no site), decide o layout
 * do hero, o formato de CADA seção e os acabamentos — e justifica no
 * conceito. Responde SOMENTE com JSON.
 */
function instrucaoDesign(
  dados: DadosEmpresa,
  blueprint: Blueprint,
  temFoto: boolean,
  chavesSecoes: string[],
): string {
  const formatosSecoes = chavesSecoes
    .filter((c) => c !== 'hero' && FORMATOS_VALIDOS[c])
    .map((c) => `- ${c}: ${FORMATOS_VALIDOS[c].join(' | ')}`)
    .join('\n');
  return `
Você é diretor de arte + programador front-end sénior premiado. Vais DESENHAR o site do negócio abaixo — não escrever textos (isso já está feito), mas decidir LAYOUT e ESTRUTURA como um profissional: o que o site deve conter, em que ordem visual, com que formato cada parte, para converter visitantes em contactos. Responda SOMENTE com um JSON válido (sem markdown, sem código, sem emojis).

NEGÓCIO:
- Nome: ${dados.nome} (${blueprint.specific_type} — ${dados.nicho})
- Cidade: ${dados.cidade} · Modelo: ${blueprint.business_model}
- Clientes precisam: ${blueprint.customer_needs.join('; ')}
- Solução: ${blueprint.recommended_solution}
- Clima visual: ${blueprint.design_direction.mood} (cor principal ${blueprint.design_direction.primario})
- Seções decididas (aparecem nesta ordem): ${chavesSecoes.join(', ')}
- Fotos reais disponíveis: ${temFoto ? 'sim' : 'não'}

VOCABULÁRIO DE HERO (escolha 1 e JUSTIFIQUE no conceito):
- foto-cheia: foto fullscreen de fundo + texto central gigante (impacto emocional; ideal p/ comida, hotel, estética)${temFoto ? '' : ' — PROIBIDO aqui (sem fotos)'}
- split: texto à esquerda + foto à direita (clássico que converte; ideal p/ serviços com prova visual)
- editorial: tipografia enorme, quase sem foto (sofisticado; ideal p/ advocacia, imobiliária premium, clínica)}
- cartao-flutuante: foto em cartão + cartão branco flutuante com a oferta (moderno; ideal p/ salão, dentista, oficina)${temFoto ? '' : ' — PROIBIDO aqui (sem fotos)'}
- faixa: faixa com padrão + conteúdo direto (ousado; ideal p/ entrega, fast-food, promoções)}
- centro: texto centrado sem foto, CTA gigante (limpo; ideal p/ orçamento, serviços técnicos)}

FORMATOS POR SEÇÃO (escolha 1 por seção listada):
${formatosSecoes || '(nenhuma seção com formato variável)'}

ACABAMENTOS:
- cantos: vivos (cantos retos, técnico) | suaves (padrão amigável) | redondos (acolhedor/lúdico)
- divisores: retos | curva | onda (transição decorativa no fim do hero)
- fundoAlternado: true alterna o fundo das seções (ritmo) — use quando houver 5+ seções; false mantém tudo limpo
- faixaCta: true insere uma faixa de conversão (chamada + botão) no meio da página — use quando a conversão principal for WhatsApp/pedido

Formato exato do JSON:
{
  "conceito": "a tua decisão de design em 1 frase (ex.: 'Hero editorial com tipografia gigante porque o cliente da imobiliária compra confiança, não fotos')",
  "hero": "um dos 6 acima",
  "cantos": "vivos|suaves|redondos",
  "divisores": "retos|curva|onda",
  "fundoAlternado": true,
  "faixaCta": true,
  "formatos": {"catalogo": "lista", "servicos": "linhas", "...": "..."}
}

REGRAS:
- Pensa como programador: o formato deve servir o CONTEÚDO (menu longo pede lista; 3 serviços fortes pedem cartões; prova social pede faixa; FAQ longo pede 2 colunas). Formato errado para o conteúdo é pior que o padrão.
- PROIBIDO escolher tudo no formato mais comum: pelo menos 2 seções devem usar um formato que NÃO seja o primeiro da lista.
- "formatos" deve conter TODAS as seções listadas acima (exceto hero).
- Responda apenas com o JSON — começa em { e termina em }.
`.trim();
}

/**
 * STEP 9 — o diretor de criação desenha o site. Sem LLM ou com resposta
 * inválida, vale o fallback determinístico com variedade.
 */
export async function desenharSite(
  dados: DadosEmpresa,
  blueprint: Blueprint,
  temFoto: boolean,
): Promise<DesignSite> {
  const fallback = designPadrao(dados, blueprint, temFoto);
  const chavesSecoes = construirPlano(blueprint, dados).secoes.map((s) => s.chave);
  const texto = await chamarLLM(
    'Você é diretor de arte e programador front-end sénior. Responde SOMENTE com JSON válido, sem markdown, sem código, sem emojis.',
    instrucaoDesign(dados, blueprint, temFoto, chavesSecoes),
    1400,
    0.8,
  );
  if (!texto) return fallback;
  const bruto = extrairJson<unknown>(texto);
  if (!bruto) return fallback;
  return validarDesign(bruto, fallback, temFoto);
}
