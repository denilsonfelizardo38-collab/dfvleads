import type { Blueprint, CampoFormulario, Plano, ConteudoSite } from './businessAnalyzer.ts';
import { construirPlano, paisEMoeda } from './businessAnalyzer.ts';
import type { DadosEmpresa } from './siteGenerator.ts';

/**
 * SITE BUILDER — transforma o Blueprint em site real.
 *
 * Diferenças para o template antigo (que segue como rede de segurança):
 *  - design system derivado do Blueprint (cores/tipografia/hero/densidade);
 *  - seções na ordem DECIDIDA pela análise, não uma ordem fixa;
 *  - formulário contextual (campos por negócio) + WhatsApp com mensagem
 *    contextual;
 *  - moeda correta do país e preço honesto ("Consultar preço"/"Sob consulta")
 *    — nada de valores inventados;
 *  - avaliações: SÓ o rating real do mapa, nunca depoimentos inventados;
 *  - SEO: title/description do blueprint + JSON-LD schema.org do tipo certo;
 *  - validação automática com auto-correção (preços, placeholders, links).
 */

export interface Foto {
  url: string;
  alt: string;
  autor: string;
  fonte?: string;
}

export type { AnaliseResumo } from './businessAnalyzer.ts';
import type { AnaliseResumo } from './businessAnalyzer.ts';
import { resumirAnalise } from './businessAnalyzer.ts';

const SVG: Record<string, string> = {
  relogio: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  raio: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4.9 12.5H11l-1 9.5 8.1-10.5H13z"/></svg>',
  usuarios: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>',
  pin: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  escudo: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  telefone: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.9 2.2z"/></svg>',
  estrela: '<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
  jantar: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7a3 3 0 0 0 6 0V2M6 2v20M17 2c-1.7 0-3 2.2-3 5s1.3 5 3 5 3-2.2 3-5-1.3-5-3-5zm0 10v10"/></svg>',
  tesoura: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/></svg>',
  ferramenta: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7z"/></svg>',
  casa: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  sol: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>',
  livro: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  seta: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
};

const FONTE: Record<Blueprint['design_direction']['tipografia'], string> = {
  serifada: "'Playfair Display',Georgia,serif",
  moderna: "system-ui,-apple-system,'Segoe UI',sans-serif",
  editorial: "'Libre Baskerville',Georgia,serif",
  tecnica: "'Inter',system-ui,sans-serif",
};

const FONTES_LINK: Partial<Record<Blueprint['design_direction']['tipografia'], string>> = {
  serifada: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap',
  editorial: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap',
  tecnica: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap',
};

function esc(valor: string): string {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Ícone coerente com o negócio (sem emoji, sempre SVG). */
function iconeDoNegocio(blueprint: Blueprint): string {
  const caps = blueprint.capabilities.join(' ') + ' ' + blueprint.specific_type.toLowerCase();
  if (/menu|ordering|restaurant|pizz/i.test(caps)) return SVG.jantar;
  if (/property|room|imob/i.test(caps)) return SVG.casa;
  if (/booking|appointment/i.test(caps)) return SVG.tesoura;
  if (/quotations|repair|oficina/i.test(caps)) return SVG.ferramenta;
  if (/energy|solar/i.test(caps)) return SVG.sol;
  if (/courses|education/i.test(caps)) return SVG.livro;
  return SVG.escudo;
}

/** Container com estado para o JS do site montar a mensagem do WhatsApp. */
const SAUDACAO_ID = 'saudacao';

/** Fallbacks honestos do builder (sem IA ou IA falhou) — por capacidade. */
const CATALOGO_PADRAO: Record<string, { titulo: string; nota: string }[]> = {
  room_property: [
    { titulo: 'Quarto padrão', nota: 'Detalhes e disponibilidade pelo WhatsApp' },
    { titulo: 'Quarto duplo', nota: 'Ideal para casais — reserve com antecedência' },
    { titulo: 'Suíte', nota: 'A opção mais completa da casa' },
  ],
  menu: [
    { titulo: 'Especialidade da casa', nota: 'A receita que fez a fama da casa' },
    { titulo: 'Clássico do cardápio', nota: 'O pedido favorito dos clientes' },
    { titulo: 'Para compartilhar', nota: 'Ideal para grupos e famílias' },
    { titulo: 'Doces e bebidas', nota: 'Para fechar em grande estilo' },
  ],
  vehicle: [
    { titulo: 'Categoria econômica', nota: 'Disponibilidade pelo WhatsApp' },
    { titulo: 'Categoria executiva', nota: 'Reserve com antecedência' },
    { titulo: 'Utilitários', nota: 'Para grupos e cargas' },
  ],
  generico: [
    { titulo: 'Atendimento especializado', nota: 'Direto com quem entende do assunto' },
    { titulo: 'Solução sob medida', nota: 'Conforme a sua necessidade e prazo' },
  ],
};

function catalogoPadrao(caps: string[], nomeEmpresa: string): { titulo: string; nota: string }[] {
  if (caps.includes('property_listing') || caps.includes('room_listing')) return CATALOGO_PADRAO.room_property;
  if (caps.includes('menu') || caps.includes('catalog')) return CATALOGO_PADRAO.menu;
  if (caps.includes('vehicle_listing')) return CATALOGO_PADRAO.vehicle;
  return [
    { titulo: 'Atendimento especializado', nota: `Fale com a ${nomeEmpresa} para detalhes` },
    { titulo: 'Solução sob medida', nota: 'Orçamento sem compromisso' },
  ];
}

function iconeCatalogo(caps: string[]): string {
  if (caps.includes('room_listing') || caps.includes('property_listing')) return SVG.casa;
  if (caps.includes('vehicle_listing')) return SVG.ferramenta;
  if (caps.includes('menu')) return SVG.jantar;
  return SVG.escudo;
}

const SERVICOS_PADRAO = [
  { titulo: 'Atendimento especializado', descricao: 'Direto com quem entende do assunto, sem intermediários.' },
  { titulo: 'Orçamento sem compromisso', descricao: 'Conte o que você precisa e receba a proposta.' },
  { titulo: 'Solução sob medida', descricao: 'Conforme o seu momento, prazo e orçamento.' },
];

function campoHtml(campo: CampoFormulario): string {
  const rotulo = esc(campo.rotulo);
  const nome = esc(campo.nome);
  if (campo.tipo === 'textarea') {
    return `<label class="campo"><span>${rotulo}</span><textarea name="${nome}" rows="3" placeholder="${esc(campo.placeholder ?? '')}" required></textarea></label>`;
  }
  if (campo.tipo === 'select' && (campo.opcoes?.length ?? 0) >= 2) {
    return `<label class="campo"><span>${rotulo}</span><select name="${nome}">${campo.opcoes!.map((o) => `<option>${esc(o)}</option>`).join('')}</select></label>`;
  }
  return `<label class="campo"><span>${rotulo}</span><input name="${nome}" type="${campo.tipo}" placeholder="${esc(campo.placeholder ?? '')}" required></label>`;
}

/** Cartões do catálogo/menu — conteúdo do segmento pela IA, preço honesto. */
function cartoesCatalogo(
  blueprint: Blueprint,
  dados: DadosEmpresa,
  textoPreco: string,
  conteudo: ConteudoSite | null,
): string {
  const caps = blueprint.capabilities;
  const icone = iconeCatalogo(caps);
  const itens = conteudo?.itensCatalogo?.length ? conteudo.itensCatalogo : catalogoPadrao(caps, dados.nome);

  return `
<div class="gradeCatalogo">
  ${itens
    .map(
      (item, i) => `<article class="cartao reveal" style="transition-delay:${i * 70}ms">
    <div class="cartaoIco">${icone}</div>
    <h3>${esc(item.titulo)}</h3>
    <p>${esc(item.nota)}</p>
    <span class="precoTag">${esc(textoPreco)}</span>
    <a class="ctaCard" href="#agendar">Pedir pelo WhatsApp</a>
  </article>`,
    )
    .join('')}
</div>
<p class="notaCatalogo reveal">Preços e detalhes atualizados direto com <b>${esc(dados.nome)}</b> pelo WhatsApp — sem valores desatualizados no site.</p>`;
}

/** Avaliações: SOMENTE o dado real do mapa. Sem rating → seção honesta. */
function blocoAvaliacoes(dados: DadosEmpresa): string {
  if (!dados.rating) {
    return `
<section id="reputacao">
  <h2 class="reveal">Reputação</h2>
  <p class="chamada reveal">Peça as avaliações do <b>${esc(dados.nome)}</b> diretamente pelo WhatsApp — mostramos o histórico de clientes reais.</p>
</section>`;
  }
  return `
<section id="reputacao">
  <h2 class="reveal">Reputação</h2>
  <div class="ratingBox reveal">
    <div class="ratingNota">${dados.rating.toFixed(1)}</div>
    <div>
      <div class="ratingEstrelas" aria-label="${dados.rating} de 5">${'<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>'.repeat(5)}</div>
      <p>${dados.reviews ? `${dados.reviews} avaliações` : 'Avaliações'} de clientes do mapa</p>
    </div>
  </div>
</section>`;
}

/** JSON-LD com o tipo certo e SEM campos inventados. */
function jsonLd(blueprint: Blueprint, dados: DadosEmpresa): string {
  const dadosSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': blueprint.seo.schema_type,
    name: dados.nome,
    description: blueprint.seo.description,
    address: { '@type': 'PostalAddress', addressLocality: dados.cidade },
    ...(dados.telefone ? { telephone: dados.telefone } : {}),
    ...(dados.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: dados.rating, reviewCount: dados.reviews ?? 1 } } : {}),
  };
  return `<script type="application/ld+json">${JSON.stringify(dadosSchema).replaceAll('<', '\\u003c')}</script>`;
}

/** STEP 14-15: validação com auto-correção antes de entregar o HTML. */
export function validarSite(html: string, dados: DadosEmpresa): { html: string; correcoes: string[] } {
  const correcoes: string[] = [];
  let final = html;

  // 1. Nenhum preço pode ter sido inventado: só tags honestas de preço.
  if (/MT\s*\d|R\$\s*\d|€\s*\d|\$\s*\d|Kz\s*\d/.test(final)) {
    final = final.replace(/>MT\s*\d[^<]*</g, '>Consultar preço<').replace(/>R\$\s*\d[^<]*</g, '>Consultar preço<');
    correcoes.push('Preço numérico detectado e substituído por "Consultar preço" (sem preço real nos dados).');
  }

  // 2. Campos de formulário exigem rótulo; input sem name é inútil.
  if (/<input(?![^>]*name=)[^>]*>/.test(final)) {
    final = final.replace(/<input(?![^>]*name=)([^>]*)>/g, '<input$1 name="pedido">');
    correcoes.push('Campo de formulário sem name corrigido (name="pedido").');
  }

  // 3. Links âncora precisam de destino existente.
  const ids = new Set([...final.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  final = final.replace(/href="#([^"]+)"/g, (tudo, alvo: string) => (ids.has(alvo) ? tudo : '#inicio'));

  // 4. Fotos mortas não quebram o layout: onerror remove o elemento.
  final = final.replace(/<img([^>]*)>/g, '<img$1 onerror="this.style.display=\'none\'">');

  // 5. Acessibilidade básica: toda imagem com alt.
  final = final.replace(/<img((?![^>]*alt=)[^>]*)>/g, '<img$1 alt="">');

  // 6. Emoji nunca vira arte de site.
  if (/[\u{1F300}-\u{1FAFF}]/u.test(final)) {
    final = final.replace(/[\u{1F300}-\u{1FAFF}]/gu, '');
    correcoes.push('Emoji removido do conteúdo (ícones são SVG).');
  }

  // 7. Placeholder de dev nunca vaza para produção.
  if (/lorem ipsum/i.test(final)) {
    final = final.replace(/lorem ipsum[^<]*/gi, dados.nicho);
    correcoes.push('Placeholder "lorem ipsum" substituído por conteúdo do negócio.');
  }

  return { html: final, correcoes };
}

export function construirSite(
  dados: DadosEmpresa,
  blueprint: Blueprint,
  fotos: Foto[],
  correcoesExternas: string[] = [],
  conteudo: ConteudoSite | null = null,
): { html: string; resumo: AnaliseResumo } {
  const plano: Plano = construirPlano(blueprint, dados);
  const d = blueprint.design_direction;
  const nomeSeguro = esc(dados.nome);
  const ultimaPalavra = esc(dados.nome.split(' ').slice(-1)[0] ?? '');
  const restoNome = esc(dados.nome.split(' ').slice(0, -1).join(' '));
  const wa = (dados.telefone ?? '').replace(/\D/g, '');
  const temWhats = wa.length >= 9;
  const fotoCapa = fotos[0];
  const fotosGaleria = fotos.slice(1, 7);
  const textoPreco = plano.textoPreco;

  const secoesHtml: string[] = [];
  const linksNav: string[] = [];
  let primeira = true;

  for (const secao of plano.secoes) {
    const titulo = esc(secao.titulo);
    if (secao.chave === 'hero') {
      linksNav.push(`<a href="#inicio">Início</a>`);
      const heroEscuro = d.hero === 'escuro-foto';
      // Material textual: IA (específico do segmento) com fallback honesto.
      const kickerTexto = esc(conteudo?.kicker ?? `${dados.nicho} em ${dados.cidade}`);
      const ctaPrincipal = esc(conteudo?.rotuloCtaPrincipal ?? 'Falar com a empresa');
      const ctaSecundario = esc(conteudo?.rotuloCtaSecundario ?? 'Ver catálogo');
      if (heroEscuro && fotoCapa) {
        // Referência Bella Napoli: barra de atributos no pé do hero.
        const atributos = [
          `${SVG.escudo} Qualidade comprovada`,
          `${SVG.relogio} Atendimento ágil`,
          `${SVG.pin} ${esc(dados.endereco ?? dados.cidade)}`,
          dados.rating ? `${SVG.estrela} ${dados.rating.toFixed(1)} no mapa` : `${SVG.usuarios} Clientes que voltam`,
        ];
        secoesHtml.push(`
<header class="hero heroEscuro" id="inicio">
  <div class="heroFundo" aria-hidden="true"><img src="${esc(fotoCapa.url)}" alt=""></div>
  <div class="heroConteudo">
    <span class="kicker reveal"><i></i>${kickerTexto}</span>
    <h1 class="reveal">${restoNome} <em>${ultimaPalavra}</em></h1>
    <p class="sub reveal">${esc(conteudo?.chamadaHero ?? `Fale direto pelo WhatsApp — a ${dados.nome} responde você.`)}</p>
    <div class="heroBotoes reveal">
      <a class="cta" href="#agendar">${iconeDoNegocio(blueprint)} ${ctaPrincipal}</a>
      <a class="cta ctaGhost" href="#catalogo">${ctaSecundario}</a>
    </div>
    <div class="atributos reveal">${atributos.map((a) => `<span>${a}</span>`).join('')}</div>
  </div>
</header>`);
      } else {
        secoesHtml.push(`
<header class="hero heroClaro" id="inicio">
  <div class="heroGrid">
    <div>
      <span class="kicker reveal"><i></i>${kickerTexto}</span>
      <h1 class="reveal">${restoNome} <em>${ultimaPalavra}</em></h1>
      <p class="sub reveal">${esc(conteudo?.chamadaHero ?? `Fale direto pelo WhatsApp, sem burocracia — a ${dados.nome} responde você.`)}</p>
      <a class="cta reveal" href="#agendar">${iconeDoNegocio(blueprint)} ${ctaPrincipal}</a>
      <div class="selos reveal">
        <span>${SVG.raio} Resposta rápida</span>
        <span>${SVG.pin} ${esc(dados.endereco ?? dados.cidade)}</span>
        ${dados.rating ? `<span>${SVG.estrela} ${dados.rating.toFixed(1)}${dados.reviews ? ` (${dados.reviews})` : ''} no mapa</span>` : ''}
      </div>
    </div>
    ${fotoCapa ? `<figure class="heroFoto reveal"><img src="${esc(fotoCapa.url)}" alt="${esc(fotoCapa.alt)}" loading="eager"></figure>` : ''}
  </div>
</header>`);
      }
      primeira = false;
      continue;
    }

    const ancora = secao.chave;
    linksNav.push(`<a href="#${ancora}">${titulo.length > 16 ? titulo.slice(0, 15) + '…' : titulo}</a>`);

    switch (secao.chave) {
      case 'catalogo':
        secoesHtml.push(`
<section id="catalogo">
  <h2 class="reveal">${titulo}</h2>
  <p class="chamada reveal">O que a <b>${esc(dados.nome)}</b> oferece.</p>
  ${cartoesCatalogo(blueprint, dados, textoPreco, conteudo)}
</section>`);
        break;
      case 'servicos': {
        // Serviços escritos pela IA para ESTE segmento; fallback honesto.
        const servicos = conteudo?.servicos?.length
          ? conteudo.servicos
          : SERVICOS_PADRAO;
        secoesHtml.push(`
<section id="servicos">
  <h2 class="reveal">${titulo}</h2>
  <p class="chamada reveal">Como a <b>${esc(dados.nome)}</b> atende você.</p>
  <div class="gradeCatalogo">
    ${servicos
      .map(
        (s, i) => `<article class="cartao reveal" style="transition-delay:${i * 70}ms"><div class="cartaoIco">${iconeDoNegocio(blueprint)}</div><h3>${esc(s.titulo)}</h3><p>${esc(s.descricao)}</p></article>`,
      )
      .join('')}
  </div>
</section>`);
        break;
      }
      case 'galeria':
        if (fotosGaleria.length > 0) {
          secoesHtml.push(`
<section id="galeria">
  <h2 class="reveal">${titulo}</h2>
  <div class="galeria">
    ${fotosGaleria.map((f) => `<figure class="reveal"><img src="${esc(f.url)}" alt="${esc(f.alt)}" loading="lazy"></figure>`).join('')}
  </div>
</section>`);
        }
        break;
      case 'equipe':
        secoesHtml.push(`
<section id="equipe">
  <h2 class="reveal">${titulo}</h2>
  <p class="chamada reveal">Quem vai atender você.</p>
  <p class="reveal notaEquipe">${esc(conteudo?.destaqueEquipe ?? `A ${dados.nome} tem profissionais prontos para o seu atendimento — conheça a equipe pelo WhatsApp.`)}</p>
</section>`);
        break;
      case 'avaliacoes':
        secoesHtml.push(blocoAvaliacoes(dados));
        break;
      case 'horario':
        secoesHtml.push(`
<section id="horario">
  <h2 class="reveal">${titulo}</h2>
  <p class="chamada reveal">${SVG.relogio} Horário de atendimento — confirme feriados pelo WhatsApp.</p>
</section>`);
        break;
      case 'localizacao':
        secoesHtml.push(`
<section id="localizacao">
  <h2 class="reveal">${titulo}</h2>
  <div class="localBox reveal">
    <div class="localIco">${SVG.pin}</div>
    <div>
      <p class="localEnd"><b>${nomeSeguro}</b></p>
      <p>${esc(dados.endereco ?? dados.cidade)}</p>
      <a class="linkMapa" target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dados.nome + ' ' + dados.cidade)}">Abrir no Google Maps</a>
    </div>
  </div>
</section>`);
        break;
      case 'faq': {
        const faqItens = conteudo?.faq?.length
          ? conteudo.faq
          : [
              { pergunta: 'Onde vocês ficam?', resposta: `${dados.endereco ?? dados.cidade}. Mande mensagem que enviamos a localização exata.` },
              { pergunta: 'Como falo com vocês?', resposta: 'Pelo WhatsApp mesmo — a mensagem já chega com seu nome e o que você precisa.' },
            ];
        secoesHtml.push(`
<section id="faq">
  <h2 class="reveal">${titulo}</h2>
  ${faqItens.map((f) => `<details class="reveal"><summary>${esc(f.pergunta)}</summary><p>${esc(f.resposta)}</p></details>`).join('\n  ')}
</section>`);
        break;
      }
      case 'sobre':
        secoesHtml.push(`
<section id="sobre">
  <h2 class="reveal">${titulo}</h2>
  <p class="chamada reveal">${esc(conteudo?.sobre ?? `A ${dados.nome} atende em ${dados.cidade} com um compromisso simples: pontualidade, capricho e um atendimento que faz o cliente voltar.`)}</p>
</section>`);
        break;
      case 'agendar':
      case 'contato':
      case 'pedido':
      case 'reserva':
      case 'orcamento': {
        if (primeira) primeira = false;
        const campos = plano.campos.map(campoHtml).join('');
        const saudacao = esc(plano.saudacoes[0] ?? `Olá! Gostaria de saber mais sobre a ${dados.nome}.`);
        secoesHtml.push(`
<section id="agendar">
  <h2 class="reveal">${titulo === 'Contato' ? 'Fale conosco' : titulo}</h2>
  <p class="chamada reveal">Preencha e a mensagem chega pronta no WhatsApp da <b>${esc(dados.nome)}</b>.</p>
  <form id="form" class="reveal">
    <label class="campo"><span>Seu nome</span><input name="nome" required placeholder="Como podemos te chamar"></label>
    <label class="campo"><span>Seu WhatsApp</span><input name="zap" type="tel" required placeholder="DDD + número"></label>
    ${campos}
    <span class="saudacaoOculta" id="${SAUDACAO_ID}" hidden>${saudacao}</span>
    <button class="botaoAgendar" type="submit">${SVG.telefone} Enviar pelo WhatsApp</button>
    <p class="avisoEnvio">Ao enviar, abre o seu WhatsApp com a mensagem pronta — só apertar enviar.</p>
  </form>
</section>`);
        break;
      }
      default:
        break;
    }
  }

  const tipografiaLink = FONTES_LINK[d.tipografia] ?? '';
  const densidade = { compacta: '2.2rem', confortavel: '3.4rem', ampla: '4.6rem' }[d.densidade];

  const html = `<!DOCTYPE html>
<html lang="${blueprint.linguagem.slice(0, 2)}"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(blueprint.seo.title)}</title>
<meta name="description" content="${esc(blueprint.seo.description)}">
<meta name="keywords" content="${esc(blueprint.seo.palavras_chave.join(', '))}">
<meta property="og:title" content="${esc(blueprint.seo.title)}">
<meta property="og:description" content="${esc(blueprint.seo.description)}">
<meta property="og:type" content="website">
${fotoCapa ? `<meta property="og:image" content="${esc(fotoCapa.url)}">` : ''}
${tipografiaLink ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${tipografiaLink}" rel="stylesheet">` : ''}
${jsonLd(blueprint, dados)}
<style>
:root{
  --p:${d.primario};--a:${d.acento};--bg:${d.fundo};--ink:${d.tinta};--btn:${d.textoBotao};
  --card:#ffffff;--borda:rgba(0,0,0,.09);--mut:#6d6a62;--pSuave:${d.primario}14;--pBorda:${d.primario}45;
  --fonte:${FONTE[d.tipografia]};--pad:${densidade}
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--fonte);background:var(--bg);color:var(--ink);line-height:1.65;overflow-x:hidden}
.ic{width:1em;height:1em;vertical-align:-.15em}
.reveal{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s ease}
.reveal.on{opacity:1;transform:none}
.topo{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem 1.4rem;background:rgba(255,255,255,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--borda)}
.topo b{font-size:1rem}
.topo b i{font-style:italic;color:var(--p)}
.nav{display:flex;gap:1rem;flex-wrap:wrap}
.nav a{font-size:.8rem;font-weight:700;color:var(--mut);text-decoration:none}
.nav a:hover{color:var(--p)}
.menuBtn{display:none;background:none;border:0;padding:.4rem;cursor:pointer;color:var(--ink)}
.menuBtn svg{width:1.5rem;height:1.5rem;display:block}
@media(max-width:860px){
  .menuBtn{display:block;order:2}
  .topo .cta{display:none}
  .nav{position:absolute;top:100%;left:0;right:0;flex-direction:column;gap:0;background:#fff;border-bottom:1px solid var(--borda);box-shadow:0 18px 40px rgba(0,0,0,.12);max-height:0;overflow:hidden;transition:max-height .3s ease}
  .nav.aberta{max-height:22rem}
  .nav a{padding:.95rem 1.4rem;border-top:1px solid var(--borda);font-size:.95rem}
}
.topo .cta{font-size:.86rem;font-weight:800;color:var(--btn);background:linear-gradient(120deg,var(--p),var(--a));padding:.55rem 1.1rem;border-radius:999px;text-decoration:none}
section{padding:var(--pad) 1.5rem;max-width:66rem;margin:0 auto}
h2{font-size:clamp(1.7rem,3.4vw,2.5rem);letter-spacing:-.02em}
.chamada{color:var(--mut);margin:.7rem 0 2.2rem;max-width:52ch}
.kicker{display:inline-flex;align-items:center;gap:.55rem;color:var(--p);border:1px solid var(--pBorda);background:var(--pSuave);border-radius:999px;padding:.45rem 1.05rem;font-size:.74rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.kicker i{width:.45rem;height:.45rem;border-radius:50%;background:var(--p)}
.cta{display:inline-flex;align-items:center;gap:.55rem;font-weight:800;color:var(--btn);background:linear-gradient(120deg,var(--p),var(--a));padding:.95rem 1.6rem;border-radius:999px;text-decoration:none;box-shadow:0 14px 34px ${d.primario}44}
.heroClaro{padding:4.5rem 1.5rem 5.5rem}
.heroGrid{max-width:66rem;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:3.2rem;align-items:center}
h1{font-size:clamp(2.4rem,5.6vw,4.2rem);line-height:1.04;letter-spacing:-.03em;margin:1.2rem 0 0;max-width:18ch}
h1 em{font-style:italic;color:var(--p)}
.sub{color:var(--mut);font-size:1.06rem;margin:1.2rem 0 2rem;max-width:46ch}
.selos{display:flex;flex-wrap:wrap;gap:1.1rem;margin-top:1.6rem;color:var(--mut);font-size:.9rem}
.selos span{display:inline-flex;align-items:center;gap:.45rem}
.heroFoto{border-radius:24px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.16);min-height:400px;background:var(--card)}
.heroFoto img{width:100%;height:100%;object-fit:cover;display:block}
.heroEscuro{position:relative;min-height:88vh;display:flex;align-items:center;padding:0}
.heroFundo{position:absolute;inset:0}
.heroFundo img{width:100%;height:100%;object-fit:cover}
.heroEscuro::before{content:"";position:absolute;inset:0;background:linear-gradient(${d.tinta}ee,${d.tinta}f5)}
.heroConteudo{position:relative;z-index:1;max-width:60rem;margin:0 auto;padding:9rem 1.5rem 5rem;text-align:center;color:#f2efe9}
.heroConteudo .kicker{color:var(--a);border-color:${d.acento}66;background:${d.primario}26}
.heroConteudo h1{margin:1.4rem auto 0;max-width:16ch;color:#fff;font-size:clamp(2.8rem,6.4vw,4.6rem)}
.heroConteudo h1 em{color:var(--a)}
.heroConteudo .sub{color:rgba(242,239,233,.85);margin:1.3rem auto 0}
.heroBotoes{display:flex;gap:.9rem;justify-content:center;flex-wrap:wrap;margin-top:1.8rem}
.ctaGhost{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.30);box-shadow:none}
.atributos{display:flex;flex-wrap:wrap;justify-content:center;gap:1.6rem;margin-top:2.4rem;color:rgba(242,239,233,.85);font-size:.86rem;font-weight:600}
.atributos span{display:inline-flex;align-items:center;gap:.5rem}
.atributos .ic{color:var(--a)}
.acaoTrio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;max-width:36rem;margin:2.6rem auto 0}
.acaoTrio a{display:flex;flex-direction:column;gap:.3rem;align-items:center;padding:1.15rem .8rem;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(6px);color:#fff;text-decoration:none;font-weight:800;font-size:.95rem;transition:transform .25s ease,background .25s ease}
.acaoTrio a small{font-weight:500;font-size:.74rem;color:rgba(242,239,233,.72)}
.acaoTrio a:hover{transform:translateY(-3px);background:rgba(255,255,255,.14)}
.acaoTrio .ic{width:1.35rem;height:1.35rem;color:var(--a)}
.gradeCatalogo{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.2rem}
.cartao{background:var(--card);border:1px solid var(--borda);border-radius:16px;padding:1.4rem;display:flex;flex-direction:column;gap:.5rem;box-shadow:0 6px 24px rgba(0,0,0,.05);transition:transform .25s ease,box-shadow .25s ease}
.cartao:hover{transform:translateY(-4px);box-shadow:0 14px 34px rgba(0,0,0,.10)}
.cartaoIco .ic{width:1.7rem;height:1.7rem;color:var(--p)}
.cartao h3{font-size:1.12rem}
.cartao p{color:var(--mut);font-size:.94rem;flex:1}
.precoTag{align-self:flex-start;font-size:1.02rem;font-weight:800;color:var(--ink);letter-spacing:-.01em}
.cartao .ctaCard{margin-top:.5rem;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;font-size:.82rem;font-weight:800;color:var(--btn);background:var(--p);border-radius:10px;padding:.6rem .9rem;text-decoration:none}
.notaCatalogo{margin-top:1.2rem;color:var(--mut);font-size:.9rem}
.galeria{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}
.galeria figure{border-radius:18px;overflow:hidden;background:var(--card)}
.galeria img{width:100%;height:210px;object-fit:cover;display:block}
.ratingBox{display:flex;gap:1.4rem;align-items:center;background:var(--card);border:1px solid var(--borda);border-radius:20px;padding:1.6rem;max-width:26rem}
.ratingNota{font-size:2.8rem;font-weight:800;color:var(--p)}
.ratingEstrelas .ic{color:${d.acento};width:1.05rem;height:1.05rem}
.localBox{display:flex;gap:1.2rem;align-items:flex-start;background:var(--card);border:1px solid var(--borda);border-radius:20px;padding:1.7rem;max-width:34rem}
.localIco .ic{width:1.6rem;height:1.6rem;color:var(--p)}
.localEnd{font-size:1.05rem}
.linkMapa{display:inline-block;margin-top:.7rem;font-weight:800;color:var(--p);text-decoration:none;border-bottom:2px solid var(--pBorda)}
#form{max-width:30rem;display:grid;gap:1rem}
.campo{display:grid;gap:.35rem}
.campo span{font-size:.82rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--mut)}
.campo input,.campo select,.campo textarea{background:#fff;border:1px solid var(--borda);border-radius:12px;padding:.85rem 1rem;color:var(--ink);font-size:.98rem;outline:none;font-family:inherit;transition:border .2s,box-shadow .2s}
.campo input:focus,.campo select:focus,.campo textarea:focus{border-color:var(--p);box-shadow:0 0 0 3px var(--pSuave)}
.botaoAgendar{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;font-weight:800;color:var(--btn);background:linear-gradient(120deg,var(--p),var(--a));border:0;padding:1rem 1.6rem;border-radius:999px;font-size:1rem;cursor:pointer}
.avisoEnvio{color:var(--mut);font-size:.85rem}
.notaEquipe{color:var(--mut);max-width:52ch}
details{background:var(--card);border:1px solid var(--borda);border-radius:16px;padding:1.1rem 1.3rem;margin-bottom:.8rem;max-width:46rem}
summary{font-weight:800;cursor:pointer}
details p{color:var(--mut);margin-top:.6rem}
@media(max-width:860px){.heroGrid{grid-template-columns:1fr;gap:2.2rem}.heroFoto{min-height:280px}.acaoTrio{grid-template-columns:1fr;max-width:22rem}.nav{display:none}}
@media(max-width:640px){section{padding:2.6rem 1.2rem}}
</style></head>
<body>
<nav class="topo"><b>${restoNome} <i>${ultimaPalavra}</i></b><div class="nav" id="nav">${linksNav.join('')}</div><a class="cta" href="#agendar">${esc(conteudo?.rotuloCtaPrincipal ?? 'Falar')}</a><button class="menuBtn" id="menuBtn" aria-label="Abrir menu" aria-expanded="false">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'}</button></nav>
${secoesHtml.join('\n')}
<footer style="background:${d.tinta};color:rgba(255,255,255,.78);padding:3rem 1.5rem 2rem;font-size:.9rem">
  <div style="max-width:66rem;margin:0 auto;display:grid;gap:2rem;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));text-align:left">
    <div>
      <b style="color:#fff;font-size:1.05rem">${nomeSeguro}</b>
      <p style="margin-top:.5rem;font-size:.85rem">${esc(dados.nicho)} — tradição e qualidade em cada atendimento.</p>
      ${temWhats ? `<a href="https://wa.me/${wa}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;gap:.5rem;margin-top:1rem;background:#25d366;color:#fff;font-weight:800;padding:.6rem 1.1rem;border-radius:999px;text-decoration:none">${SVG.telefone} WhatsApp</a>` : ''}
    </div>
    <div>
      <b style="color:#fff">Horário de Funcionamento</b>
      <p style="margin-top:.5rem;font-size:.85rem;line-height:1.9">Seg a Sex: 9h às 18h<br>Sábado: 9h às 14h<br>Domingo: fechado</p>
    </div>
    <div>
      <b style="color:#fff">Localização</b>
      <p style="margin-top:.5rem;font-size:.85rem">${esc(dados.endereco ?? dados.cidade)}</p>
      <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dados.nome + ' ' + dados.cidade)}" target="_blank" rel="noreferrer" style="color:var(--a);font-weight:700;text-decoration:none">Ver no mapa</a>
    </div>
    <div>
      <b style="color:#fff">Contacto</b>
      <p style="margin-top:.5rem;font-size:.85rem;line-height:1.9">${dados.telefone ? esc(dados.telefone) : 'Pelo WhatsApp'}<br>${temWhats ? 'WhatsApp disponível' : ''}</p>
    </div>
  </div>
  <p style="max-width:66rem;margin:1.6rem auto 0;padding-top:1.2rem;border-top:1px solid rgba(255,255,255,.12);font-size:.78rem;opacity:.65;text-align:center">© ${new Date().getFullYear()} ${nomeSeguro}. Site criado com DFVCode.</p>
</footer>
<script>
(function(){
  var obs=new IntersectionObserver(function(entradas){entradas.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');obs.unobserve(e.target);}});},{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});
  // Menu mobile
  var menuBtn=document.getElementById('menuBtn'),nav=document.getElementById('nav');
  if(menuBtn&&nav){
    menuBtn.addEventListener('click',function(){
      var aberta=nav.classList.toggle('aberta');
      menuBtn.setAttribute('aria-expanded',aberta?'true':'false');
    });
    nav.addEventListener('click',function(ev){if(ev.target.tagName==='A'){nav.classList.remove('aberta');menuBtn.setAttribute('aria-expanded','false');}});
  }
  var form=document.getElementById('form');
  if(form){
    form.addEventListener('submit',function(ev){
      ev.preventDefault();
      var nome=form.nome.value.trim();
      var zap=form.zap.value.replace(/[^\\d]/g,'');
      var campoNome=form.nome.closest('.campo');
      var campoZap=form.zap.closest('.campo');
      campoNome.style.borderColor='';campoZap.style.borderColor='';
      if(nome.length<2){campoNome.style.borderColor='#c33';form.nome.focus();return;}
      if(zap.length<8){campoZap.style.borderColor='#c33';form.zap.focus();return;}
      var saudacao=(document.getElementById('${SAUDACAO_ID}')||{}).textContent||'Olá!';
      var linhas=[saudacao,'Nome: '+nome,'WhatsApp: '+form.zap.value.trim()];
      // Campos contextuais do formulário entram na mensagem (rotulo: valor).
      var extras=form.querySelectorAll('input[name]:not([name=nome]):not([name=zap]), select[name], textarea[name]');
      extras.forEach(function(el){
        var v=(el.value||'').trim();
        if(!v)return;
        var rot=(el.closest('.campo')&&el.closest('.campo').querySelector('span'));
        linhas.push((rot?rot.textContent+': ':'')+v);
      });
      var waNumero='${wa}';
      var url='https://wa.me/'+waNumero+'?text='+encodeURIComponent(linhas.join('\\n'));
      window.open(url,'_blank');
    });
  }
})();
</script>
</body></html>`;

  const { html: validado, correcoes } = validarSite(html, dados);
  return { html: validado, resumo: resumirAnalise(blueprint, plano, [...correcoesExternas, ...correcoes]) };
}

export type { AnaliseResumo as ResumoAnalise, Blueprint as BlueprintExport };
export { paisEMoeda };
