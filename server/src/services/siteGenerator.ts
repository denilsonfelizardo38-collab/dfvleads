import { config } from '../env.ts';

/**
 * Gerador de landing pages "dev contratado": a IA escreve o site como se
 * fosse o dev oficial da empresa — nada de widgets de terceiros (avaliações
 * do Google, "ligar agora", botão de WhatsApp solto). O ponto de conversão
 * é um formulário (nome + WhatsApp + pedido) que monta a mensagem e abre
 * o wa.me do cliente. Identidade visual própria por segmento sobre BASE
 * CLARA premium (footer escuro), fotos reais do nicho e animações de scroll.
 * Sem LLM, um template embutido entrega o mesmo padrão.
 * Ícones e marcadores visuais são exclusivamente SVG/CSS — sem emoji.
 */

export interface DadosEmpresa {
  nome: string;
  nicho: string;
  cidade: string;
  telefone: string | null;
  endereco: string | null;
  rating: number | null;
  reviews: number | null;
}

interface Foto {
  url: string;
  alt: string;
  autor: string;
  /** Origem da foto, para o crédito (Openverse/Unsplash). */
  fonte?: string;
}

interface Paleta {
  primario: string;
  acento: string;
  fundo: string;
  tinta: string;
  /** Cor do texto sobre o botão com gradiente primário→acento. */
  textoBotao: string;
}

/** Paletas por segmento sobre base clara (a IA é livre p/ criar outras). */
const PALETAS: Record<string, Paleta> = {
  barbearia: { primario: '#a97e0f', acento: '#d4af37', fundo: '#faf7f0', tinta: '#1a1508', textoBotao: '#231a06' },
  salao: { primario: '#b06180', acento: '#d89ab4', fundo: '#fbf6f8', tinta: '#201318', textoBotao: '#ffffff' },
  restaurante: { primario: '#c05f35', acento: '#e08a5e', fundo: '#fdf8f4', tinta: '#1c120c', textoBotao: '#ffffff' },
  // Pizzaria segue a referência premium (Valentina): petróleo + dourado, seções creme.
  pizzaria: { primario: '#b9844a', acento: '#d4a373', fundo: '#f8f7f6', tinta: '#2b3a41', textoBotao: '#ffffff' },
  mecanico: { primario: '#c25a26', acento: '#e2854f', fundo: '#f7f8fa', tinta: '#15171a', textoBotao: '#ffffff' },
  oficina: { primario: '#c25a26', acento: '#e2854f', fundo: '#f7f8fa', tinta: '#15171a', textoBotao: '#ffffff' },
  dentista: { primario: '#1f8aa8', acento: '#58b7cd', fundo: '#f5fafc', tinta: '#0e1c21', textoBotao: '#ffffff' },
  clinica: { primario: '#1f8aa8', acento: '#58b7cd', fundo: '#f5fafc', tinta: '#0e1c21', textoBotao: '#ffffff' },
  academia: { primario: '#a8891c', acento: '#d0b23f', fundo: '#fafaf2', tinta: '#17150c', textoBotao: '#231d05' },
  petshop: { primario: '#2f9e6e', acento: '#6cc59a', fundo: '#f5fbf7', tinta: '#0e1d15', textoBotao: '#ffffff' },
  otica: { primario: '#5a6fc0', acento: '#8b9bd9', fundo: '#f6f8fd', tinta: '#131829', textoBotao: '#ffffff' },
  floricultura: { primario: '#c05680', acento: '#e08aa9', fundo: '#fdf6f9', tinta: '#1f1015', textoBotao: '#ffffff' },
  padaria: { primario: '#b07a25', acento: '#d9a552', fundo: '#fdf9f2', tinta: '#1c1409', textoBotao: '#261c08' },
  advocacia: { primario: '#7d6a45', acento: '#a6925f', fundo: '#faf9f6', tinta: '#18150e', textoBotao: '#ffffff' },
};

function paletaDoNicho(nicho: string): Paleta {
  const chave = nicho.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [palavra, paleta] of Object.entries(PALETAS)) {
    if (chave.includes(palavra.toLowerCase())) return paleta;
  }
  return { primario: '#a86a2c', acento: '#d0914f', fundo: '#faf8f4', tinta: '#1a140e', textoBotao: '#ffffff' };
}

/**
 * Conteúdo que a IA escreve para o site. O DESIGN NÃO É negociável:
 * ele vive 100% no template premium (base clara, form→WhatsApp, reveals).
 * A IA só abastece textos e listas — assim o site nunca sai bagunçado,
 * mesmo com um modelo fraco ou resposta cortada.
 */
interface ConteudoIA {
  chamadaHero: string;
  ctaLabel: string;
  servicos: { titulo: string; descricao: string }[];
  campoFormulario: { rotulo: string; placeholder: string };
  saudacaoWhatsapp: string;
  sobre: string;
  depoimentos: { nome: string; fala: string }[];
  faq: { pergunta: string; resposta: string }[];
  horario: string;
}

const INSTRUCAO = (dados: DadosEmpresa) => `
Você é copywriter sênior de sites de negócios locais. Escreva o CONTEÚDO (textos) do site da empresa abaixo. O layout/HTML/CSS já está pronto — NÃO escreva HTML, NÃO escreva código. Responda SOMENTE com um JSON válido, sem markdown e sem blocos de código.

EMPRESA (dados reais):
- Nome: ${dados.nome}
- Segmento: ${dados.nicho}
- Cidade: ${dados.cidade}
- Endereço: ${dados.endereco ?? dados.cidade}

Formato exato do JSON:
{
  "chamadaHero": "frase de venda de 1 linha para o topo do site (máx 90 caracteres), falando de agendamento",
  "ctaLabel": "2-3 palavras para o botão principal, contextual ao segmento (ex.: 'Agendar corte', 'Reservar mesa', 'Agendar revisão')",
  "servicos": [6 itens, cada um {"titulo": "nome do serviço (2-4 palavras)", "descricao": "1 frase clara de benefício (máx 90 caracteres)"}],
  "campoFormulario": {"rotulo": "nome do campo pedindo o desejo do cliente (ex.: 'O que você precisa')", "placeholder": "exemplo contextual do que o cliente escreve (ex.: 'Portão de ferro 3m, cor preto')"},
  "saudacaoWhatsapp": "primeira linha da mensagem que o cliente envia ao dono pelo WhatsApp (máx 80 caracteres)",
  "sobre": "1 parágrafo curto sobre a empresa (2-3 frases), tom do segmento",
  "depoimentos": [3 itens {"nome": "primeiro nome + inicial (ex.: 'Marcos R.')", "fala": "depoimento verossímil de 1-2 frases"}],
  "faq": [4 itens {"pergunta": "...", "resposta": "1-2 frases diretas"}],
  "horario": "ex.: 'Seg a Sáb, 9h às 18h' — plausível para o segmento"
}

REGRAS:
- Português do Brasil/Angola, tom acolhedor e profissional do segmento.
- Nada de emojis. Nada de "lorem ipsum". Nada de avaliações do Google.
- Serviços e FAQ devem fazer sentido para ${dados.nicho} em ${dados.cidade}.
- O campo do formulário é SEMPRE texto livre: o cliente descreve com as próprias palavras o que deseja (serviço, medidas, prazo). O rotulo deve convidar a escrever e o placeholder dar um exemplo contextual ao segmento.
- Responda apenas com o JSON — começa em { e termina em }.
`.trim();

/**
 * Conteúdo final do site (IA com fallback nos padrões do nicho).
 */
interface Conteudo {
  chamadaHero: string;
  ctaLabel: string;
  servicos: [string, string, string][]; // [icone, titulo, descricao]
  campo: string; // HTML do campo contextual do formulário
  saudacao: string;
  sobre: string;
  vozes: [string, string][];
  faq: [string, string][];
  horario: string;
}

/** Padrões por nicho — usados quando a IA não rodou. */
function conteudoPadrao(dados: DadosEmpresa): Conteudo {
  const chave = dados.nicho.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const barbearia = chave.includes('barbearia') || chave.includes('barber');
  const servicos = barbearia
    ? [
        [SVG.tesoura, 'Corte degradê', 'Máquina e tesoura com acabamento na navalha.'],
        [SVG.escudo, 'Barba completa', 'Toalha quente, óleo e alinhamento na navalha.'],
        [SVG.usuarios, 'Pacote mensal', 'Cortes do mês com desconto e prioridade de agenda.'],
        [SVG.raio, 'Corte infantil', 'Paciência e desenho animado na TV. Sem choro.'],
        [SVG.coracao, 'Combo casal', 'Dois cortes no mesmo horário, espacinho para acompanhar.'],
        [SVG.relogio, 'Express', 'Na régua em 25 minutos, sem fila.'],
      ] as [string, string, string][]
    : [
        [SVG.escudo, 'Qualidade premium', 'Padrão profissional do início ao fim.'],
        [SVG.raio, 'Atendimento rápido', 'Resposta no mesmo dia, agenda que funciona.'],
        [SVG.usuarios, 'Equipe experiente', 'Quem atende você sabe o que faz.'],
        [SVG.coracao, 'Preço justo', 'Orçamento claro, sem surpresa.'],
        [SVG.relogio, 'Horários flexíveis', 'Horários que cabem na sua rotina.'],
        [SVG.usuarios, 'Confiança do bairro', 'Clientes que voltam e indicam.'],
      ] as [string, string, string][];
  return {
    chamadaHero: 'Agende em segundos, sem ligação e sem fila. Escolha o serviço, deixe seu nome e WhatsApp — a gente confirma com você.',
    ctaLabel: barbearia ? 'Agendar corte' : 'Fazer agendamento',
    servicos,
    campo:
      '<label class="campo"><span>O que você precisa</span><textarea name="pedido" rows="3" placeholder="Conte o serviço desejado, medidas, prazo — o que for importante" required></textarea></label>',
    saudacao: barbearia
      ? `Olá! Quero agendar um corte na ${dados.nome}.`
      : `Olá! Quero agendar na ${dados.nome}.`,
    sobre: `O ${dados.nome} atende em ${dados.cidade} com um compromisso simples: pontualidade, capricho e um atendimento que faz o cliente voltar. Reserve seu horário pelo site e chegue sem espera.`,
    vozes: [
      ['Marcos R.', 'Atendimento nota dez — do agendamento ao resultado, tudo impecável. Recomendo de olhos fechados.'],
      ['Ana P.', 'Profissionais cuidadosos, explicaram cada etapa com paciência. Capricho em cada detalhe.'],
      ['Juninho S.', 'Experimentei uma vez e virei cliente fixo. Preço justo e resultado excelente.'],
    ],
    faq: [
      [barbearia ? 'Preciso agendar ou pode ir direto?' : 'Preciso agendar?', 'Atendemos com hora marcada para você não esperar. Pelo site, o agendamento chega direto no nosso WhatsApp.'],
      ['Pagamento — como funciona?', 'Pix, cartão ou dinheiro, no dia do atendimento. Pacotes com desconto podem ser combinados na hora.'],
      ['Onde vocês ficam?', `${dados.endereco ?? dados.cidade}. Mande mensagem depois de agendar que enviamos a localização exata.`],
      ['Posso remarcar?', 'Claro — é só chamar no WhatsApp com antecedência e escolher outro horário.'],
    ],
    horario: 'Seg a Sáb, 9h às 18h',
  };
}

/** Valida o JSON da IA; qualquer furo cai no conteúdo padrão do nicho. */
function parseConteudoIA(texto: string): ConteudoIA | null {
  const inicio = texto.indexOf('{');
  const fim = texto.lastIndexOf('}');
  if (inicio < 0 || fim <= inicio) return null;
  try {
    const bruto = JSON.parse(texto.slice(inicio, fim + 1)) as Partial<ConteudoIA>;
    const campoOk =
      Boolean(bruto.campoFormulario?.rotulo && bruto.campoFormulario?.placeholder);
    const valido =
      typeof bruto.chamadaHero === 'string' && bruto.chamadaHero.length > 10 &&
      typeof bruto.ctaLabel === 'string' && bruto.ctaLabel.length >= 3 &&
      Array.isArray(bruto.servicos) && bruto.servicos.length >= 3 &&
      campoOk &&
      typeof bruto.saudacaoWhatsapp === 'string' && bruto.saudacaoWhatsapp.length > 5 &&
      typeof bruto.sobre === 'string' && bruto.sobre.length > 30 &&
      Array.isArray(bruto.depoimentos) && bruto.depoimentos.length >= 3 &&
      Array.isArray(bruto.faq) && bruto.faq.length >= 3 &&
      typeof bruto.horario === 'string' && bruto.horario.length > 3;
    return valido ? (bruto as ConteudoIA) : null;
    } catch {
    return null;
  }
}

/** Converte o conteúdo da IA em peças prontas do template. */
function aplicarConteudoIA(ia: ConteudoIA): Conteudo {
  const icones = [SVG.tesoura, SVG.escudo, SVG.usuarios, SVG.raio, SVG.coracao, SVG.relogio];
  const servicos = ia.servicos
    .slice(0, 6)
    .map((servico, indice) => [icones[indice % icones.length], String(servico.titulo).slice(0, 60), String(servico.descricao).slice(0, 140)] as [string, string, string]);
  // Campo SEMPRE texto livre: o cliente descreve o que deseja com as próprias palavras.
  const campo = `<label class="campo"><span>${esc(ia.campoFormulario.rotulo)}</span><textarea name="pedido" rows="3" placeholder="${esc(ia.campoFormulario.placeholder)}" required></textarea></label>`;
  return {
    chamadaHero: String(ia.chamadaHero).slice(0, 200),
    ctaLabel: String(ia.ctaLabel).slice(0, 40),
    servicos,
    campo,
    saudacao: String(ia.saudacaoWhatsapp).slice(0, 160),
    sobre: String(ia.sobre).slice(0, 500),
    vozes: ia.depoimentos.slice(0, 3).map((depoimento) => [String(depoimento.nome).slice(0, 40), String(depoimento.fala).slice(0, 220)] as [string, string]),
    faq: ia.faq.slice(0, 4).map((item) => [String(item.pergunta).slice(0, 120), String(item.resposta).slice(0, 300)] as [string, string]),
    horario: String(ia.horario).slice(0, 60),
  };
}

function esc(valor: string): string {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// Ícones SVG inline (estilo Lucide) usados no template offline.
const SVG: Record<string, string> = {
  tesoura:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ic"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>',
  raio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ic"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  escudo:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ic"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  coracao:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ic"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  relogio:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ic"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  usuarios:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ic"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ic"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  setaBaixo:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ic"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
};

function creditoHtml(foto: Foto): string {
  const origem = foto.autor && foto.autor !== foto.fonte ? `${foto.autor} / ${foto.fonte ?? 'Openverse'}` : (foto.fonte ?? foto.autor);
  return origem ? `<span class="credito">Foto: ${esc(origem)}</span>` : '';
}

/**
 * Fallback premium (sem LLM): base clara, identidade por nicho,
 * formulário → WhatsApp e reveals no scroll. Footer escuro fecha o site.
 */
function templateOffline(dados: DadosEmpresa, fotos: Foto[], conteudo?: Conteudo): string {
  const nome = esc(dados.nome);
  const wa = (dados.telefone ?? '').replace(/[^\d]/g, '');
  const temWhats = wa.length >= 9;
  const paleta = paletaDoNicho(dados.nicho);
  // Tema premium escuro (referência: pizzarias artesanais) só para pizza.
  const temaPizza = /pizz/.test(dados.nicho.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  const conteudoFinal = conteudo ?? conteudoPadrao(dados);
  const { chamadaHero, ctaLabel, servicos, campo: campoContextual, saudacao, sobre, vozes, faq, horario } = conteudoFinal;

  const iniciais = (texto: string) =>
    texto.split(/\s+/).map((parte) => parte[0] ?? '').join('').slice(0, 2).toUpperCase();

  const [capa] = fotos;
  const fotosGaleria = fotos.slice(1, 7);

  return `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${nome} — ${esc(dados.nicho)} em ${esc(dados.cidade)}</title>
<meta name="description" content="${nome}: ${esc(dados.nicho)} em ${esc(dados.cidade)}. Agende pelo site em segundos.">
${temaPizza ? '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">' : ''}
<style>
:root{
  --p:${paleta.primario};--a:${paleta.acento};--bg:${paleta.fundo};--ink:${paleta.tinta};--btn:${paleta.textoBotao};
  --card:#ffffff;--borda:rgba(0,0,0,.09);--mut:#6d6a62;--pSuave:${paleta.primario}14;--pBorda:${paleta.primario}45
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--ink);line-height:1.65;overflow-x:hidden}
.ic{width:1em;height:1em;vertical-align:-.15em}
.reveal{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s ease}
.reveal.on{opacity:1;transform:none}
.topo{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem 1.4rem;background:rgba(255,255,255,.82);backdrop-filter:blur(10px);border-bottom:1px solid var(--borda)}
.topo b{font-size:1rem;letter-spacing:-.01em}
.topo b i{font-style:normal;color:var(--p)}
.topo a{font-size:.86rem;font-weight:800;color:var(--btn);background:linear-gradient(120deg,var(--p),var(--a));padding:.55rem 1.1rem;border-radius:999px;text-decoration:none}
.hero{position:relative;padding:4.5rem 1.5rem 5.5rem;overflow:hidden}
.hero::before{content:"";position:absolute;inset:0;background:radial-gradient(52% 44% at 78% 12%,var(--pSuave),transparent 70%),radial-gradient(40% 38% at 12% 78%,var(--pSuave),transparent 70%)}
.heroGrid{position:relative;max-width:66rem;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:3.2rem;align-items:center}
.heroSemFoto{position:relative;max-width:60rem;margin:0 auto;text-align:center}
.kicker{display:inline-flex;align-items:center;gap:.55rem;color:var(--p);border:1px solid var(--pBorda);background:var(--pSuave);border-radius:999px;padding:.45rem 1.05rem;font-size:.74rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.kicker i{width:.45rem;height:.45rem;border-radius:50%;background:var(--p)}
h1{font-size:clamp(2.4rem,5.6vw,4.2rem);line-height:1.04;letter-spacing:-.03em;color:var(--ink);margin:1.2rem 0 0;max-width:18ch}
.heroSemFoto h1{margin:1.2rem auto 0}
h1 em{font-style:normal;color:var(--p)}
.sub{color:var(--mut);max-width:32rem;margin:1.2rem 0 2rem;font-size:1.06rem}
.heroSemFoto .sub{margin:1.2rem auto 2rem}
.cta{display:inline-flex;align-items:center;gap:.6rem;background:linear-gradient(120deg,var(--p),var(--a));color:var(--btn);font-weight:800;padding:1rem 1.9rem;border-radius:999px;text-decoration:none;font-size:1.02rem;box-shadow:0 14px 34px var(--pBorda);transition:.25s}
.cta:hover{transform:translateY(-2px) scale(1.02)}
.selos{display:flex;gap:1.4rem;flex-wrap:wrap;margin-top:2.2rem;color:var(--mut);font-size:.86rem}
.selos span{display:inline-flex;align-items:center;gap:.45rem}
.selos .ic{color:var(--p)}
.heroFoto{position:relative;margin:0;border-radius:28px;overflow:hidden;box-shadow:0 34px 80px rgba(0,0,0,.16);border:1px solid var(--borda);min-height:430px;background:var(--card)}
.heroFoto img{position:absolute;inset:-8% 0;width:100%;height:116%;object-fit:cover;transition:transform .2s linear}
.seta{width:1.4rem;height:1.4rem;color:var(--p);margin:2.4rem auto 0;display:block;animation:flutua 2.2s ease-in-out infinite}
@keyframes flutua{50%{transform:translateY(8px)}}
section{max-width:66rem;margin:0 auto;padding:5rem 1.5rem}
.faixa{max-width:none;background:var(--card);border-top:1px solid var(--borda);border-bottom:1px solid var(--borda)}
.faixa>div{max-width:66rem;margin:0 auto}
h2{font-size:clamp(1.7rem,3.6vw,2.4rem);letter-spacing:-.02em;color:var(--ink);margin-bottom:.5rem}
.chamada{color:var(--mut);max-width:36rem;margin-bottom:2.4rem}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.card{background:var(--card);border:1px solid var(--borda);border-radius:20px;padding:1.6rem;transition:.3s;box-shadow:0 2px 10px rgba(0,0,0,.04)}
.card:hover{transform:translateY(-6px);border-color:var(--pBorda);box-shadow:0 18px 40px rgba(0,0,0,.1)}
.card .ic{width:1.7rem;height:1.7rem;color:var(--p)}
.card h3{color:var(--ink);margin:.75rem 0 .35rem;font-size:1.08rem}
.card p{color:var(--mut);font-size:.92rem}
.galeria{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.galeria figure{margin:0;position:relative;overflow:hidden;border-radius:20px;border:1px solid var(--borda);min-height:250px;background:var(--card);box-shadow:0 2px 10px rgba(0,0,0,.04)}
.galeria img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
.galeria figure:hover img{transform:scale(1.06)}
.credito{position:absolute;left:.75rem;bottom:.6rem;font-size:.66rem;color:#ffffffd9;background:rgba(0,0,0,.55);padding:.22rem .55rem;border-radius:8px;pointer-events:none}
blockquote{margin:0;font-size:.98rem;color:var(--ink)}
.quem{margin-top:1.2rem;display:flex;align-items:center;gap:.7rem}
.avatar{width:2.5rem;height:2.5rem;border-radius:50%;background:linear-gradient(135deg,var(--p),var(--a));color:var(--btn);display:grid;place-items:center;font-weight:800;font-size:.84rem;flex-shrink:0}
.quem b{display:block;font-size:.92rem;color:var(--ink)}
.quem small{color:var(--mut);font-size:.78rem}
.agendar{background:var(--card);border:1px solid var(--pBorda);border-radius:26px;padding:2.2rem;box-shadow:0 24px 60px rgba(0,0,0,.08)}
.agendar .grid{grid-template-columns:1fr 1fr}
.campo{display:flex;flex-direction:column;gap:.4rem;margin-bottom:1rem}
.campo span{font-size:.78rem;font-weight:800;color:var(--p);text-transform:uppercase;letter-spacing:.08em}
.campo input,.campo select,.campo textarea{background:#fff;border:1px solid var(--borda);border-radius:12px;padding:.85rem 1rem;color:var(--ink);font-size:.98rem;outline:none;transition:border .2s,box-shadow .2s;font-family:inherit}
.campo input:focus,.campo select:focus,.campo textarea:focus{border-color:var(--p);box-shadow:0 0 0 3px var(--pSuave)}
.campo.err input{border-color:#d64545}
.erro{color:#d64545;font-size:.78rem;display:none}
.campo.err .erro{display:block}
.botaoAgendar{width:100%;margin-top:.4rem;background:linear-gradient(120deg,var(--p),var(--a));color:var(--btn);font-weight:800;border:0;border-radius:14px;padding:1rem;font-size:1.05rem;cursor:pointer;transition:.25s;display:inline-flex;align-items:center;justify-content:center;gap:.6rem}
.botaoAgendar:hover{transform:translateY(-2px);box-shadow:0 14px 40px var(--pBorda)}
.aviso{font-size:.78rem;color:var(--mut);margin-top:.8rem;text-align:center}
.confirmado{display:none;margin-top:1rem;text-align:center;color:var(--p);font-weight:700}
details{background:var(--card);border:1px solid var(--borda);border-radius:14px;padding:1.05rem 1.25rem;margin-bottom:.7rem}
summary{color:var(--ink);font-weight:600;cursor:pointer}
details p{color:var(--mut);font-size:.92rem;margin-top:.6rem}
footer{background:var(--ink);color:rgba(255,255,255,.72);padding:2.8rem 1.5rem;text-align:center;font-size:.88rem}
footer b{color:#fff}
@media(max-width:860px){.heroGrid{grid-template-columns:1fr;gap:2.2rem}.heroFoto{min-height:300px;order:-1}}
@media(max-width:640px){.agendar .grid{grid-template-columns:1fr}}
${temaPizza ? `
/* ── Tema pizzaria: hero escuro com foto, serifada Playfair, ações em vidro ── */
.hero{padding:0;min-height:92vh;display:flex;align-items:center}
.hero::before{content:"";position:absolute;inset:0;background:linear-gradient(rgba(38,52,59,.92),rgba(35,48,55,.96))}
.topo{background:rgba(38,52,59,.92);border-color:rgba(255,255,255,.08)}
.topo b{color:#fff}
.topo b i{color:var(--a)}
.heroFotoFundo{position:absolute;inset:0}
.heroFotoFundo img{width:100%;height:100%;object-fit:cover}
.heroTema{position:relative;z-index:1;max-width:64rem;margin:0 auto;padding:9rem 1.5rem 5rem;text-align:center;color:#f2efe9}
.heroTema .kicker,.heroTema h1,.heroTema .sub{text-shadow:0 2px 18px rgba(20,28,32,.55)}
.heroTema .kicker{color:var(--a);border-color:rgba(212,163,115,.4);background:rgba(185,132,74,.15)}
.heroTema .kicker::before{content:"";width:2.4rem;height:2px;background:var(--a);border-radius:2px}
.heroTema h1{margin:1.4rem auto 0;max-width:16ch;color:#fff;font-family:'Playfair Display',Georgia,serif;font-size:clamp(2.8rem,6.4vw,4.6rem);letter-spacing:-.01em;line-height:1.08}
.heroTema h1 em{font-style:italic;color:var(--a)}
.heroTema .sub{color:rgba(242,239,233,.85);max-width:44ch;margin:1.3rem auto 0}
.acaoTrio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;max-width:34rem;margin:2.6rem auto 0}
.acaoTrio a{display:flex;flex-direction:column;gap:.3rem;align-items:center;padding:1.15rem .8rem;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(6px);color:#fff;text-decoration:none;font-weight:800;font-size:.95rem;transition:transform .25s ease,background .25s ease}
.acaoTrio a small{font-weight:500;font-size:.74rem;color:rgba(242,239,233,.72)}
.acaoTrio a:hover{transform:translateY(-3px);background:rgba(255,255,255,.14)}
.acaoTrio .ic{width:1.35rem;height:1.35rem;color:var(--a)}
@media(max-width:640px){.acaoTrio{grid-template-columns:1fr;max-width:22rem}.heroTema{padding-top:7rem}}
`
  : ''}
</style></head>
<body>
<div class="topo"><b>${nome.split(' ').slice(0, -1).join(' ')} <i>${esc(nome.split(' ').slice(-1)[0] ?? '')}</i></b><a href="#agendar">${ctaLabel}</a></div>
<header class="hero" id="inicio">
  ${
    temaPizza && capa
      ? `<div class="heroFotoFundo" aria-hidden="true"><img src="${esc(capa.url)}" alt="" loading="eager"></div>
  <div class="heroTema">
    <span class="kicker reveal"><i></i>${esc(dados.nicho)} artesanal em ${esc(dados.cidade)}</span>
    <h1 class="reveal">${esc(nome.split(' ').slice(0, -1).join(' '))} <em>${esc(nome.split(' ').slice(-1)[0] ?? '')}</em></h1>
    <p class="sub reveal">${esc(chamadaHero)}</p>
    <div class="acaoTrio reveal">
      <a href="#agendar">${SVG.relogio}<span>${esc(ctaLabel)}</span><small>Pelo site, em segundos</small></a>
      <a href="#servicos">${SVG.escudo}<span>Cardápio</span><small>Veja o que fazemos</small></a>
      <a href="#agendar">${SVG.pin}<span>Reserve</span><small>Garanta sua mesa</small></a>
    </div>
  </div>`
      : capa
      ? `<div class="heroGrid">
    <div>
      <span class="kicker reveal"><i></i>${esc(dados.nicho)} em ${esc(dados.cidade)}</span>
      <h1 class="reveal">${esc(nome.split(' ').slice(0, -1).join(' '))} <em>${esc(nome.split(' ').slice(-1)[0] ?? '')}</em></h1>
      <p class="sub reveal">${esc(chamadaHero)}</p>
      <a class="cta reveal" href="#agendar">${SVG.relogio} ${esc(ctaLabel)}</a>
      <div class="selos reveal">
        <span>${SVG.raio} Confirmação rápida</span>
        <span>${SVG.usuarios} Centenas de clientes atendidos</span>
        <span>${SVG.pin} ${esc(dados.endereco ?? dados.cidade)}</span>
      </div>
    </div>
    <figure class="heroFoto reveal"><img src="${esc(capa.url)}" alt="${esc(capa.alt)}" loading="eager">${creditoHtml(capa)}</figure>
  </div>`
      : `<div class="heroSemFoto">
    <span class="kicker reveal"><i></i>${esc(dados.nicho)} em ${esc(dados.cidade)}</span>
    <h1 class="reveal">${esc(nome.split(' ').slice(0, -1).join(' '))} <em>${esc(nome.split(' ').slice(-1)[0] ?? '')}</em></h1>
    <p class="sub reveal">${esc(chamadaHero)}</p>
    <a class="cta reveal" href="#agendar">${SVG.relogio} ${esc(ctaLabel)}</a>
    <div class="selos reveal" style="justify-content:center">
      <span>${SVG.raio} Confirmação rápida</span>
      <span>${SVG.usuarios} Centenas de clientes atendidos</span>
      <span>${SVG.pin} ${esc(dados.endereco ?? dados.cidade)}</span>
    </div>
    ${SVG.setaBaixo.replace('class="ic"', 'class="seta"')}
  </div>`
  }
</header>

<div class="faixa"><div><section id="servicos" style="padding-left:0;padding-right:0">
  <h2 class="reveal">Serviços</h2>
  <p class="chamada reveal">Escolha o que precisa e agende em menos de um minuto.</p>
  <div class="grid">
    ${servicos.map(([icone, titulo, desc], indice) => `<div class="card reveal" style="transition-delay:${indice * 70}ms">${icone}<h3>${esc(titulo)}</h3><p>${esc(desc)}</p></div>`).join('')}
  </div>
</section></div></div>

${
  fotosGaleria.length > 0
    ? `<section id="galeria">
  <h2 class="reveal">Galeria</h2>
  <p class="chamada reveal">Um pouco do ambiente e do padrão do trabalho.</p>
  <div class="galeria">
    ${fotosGaleria.map((foto, indice) => `<figure class="reveal" style="transition-delay:${indice * 70}ms"><img src="${esc(foto.url)}" alt="${esc(foto.alt)}" loading="lazy">${creditoHtml(foto)}</figure>`).join('')}
  </div>
</section>`
    : ''
}

<section id="sobre">
  <h2 class="reveal">Sobre</h2>
  <p class="chamada reveal">${esc(sobre)}</p>
</section>

<div class="faixa"><div><section id="depoimentos" style="padding-left:0;padding-right:0">
  <h2 class="reveal">Quem já veio, volta</h2>
  <div class="grid">
    ${vozes.map(([quem, fala], indice) => `<div class="card reveal" style="transition-delay:${indice * 70}ms"><blockquote>“${fala}”</blockquote><div class="quem"><span class="avatar">${iniciais(quem)}</span><span><b>${quem}</b><small>Cliente do ${nome}</small></span></div></div>`).join('')}
  </div>
</section></div></div>

<section id="agendar">
  <h2 class="reveal">${esc(ctaLabel)}</h2>
  <p class="chamada reveal">Preencha e a gente confirma seu horário pelo WhatsApp.</p>
  <form class="agendar reveal" id="form" novalidate>
    <div class="grid">
      <label class="campo"><span>Seu nome</span><input name="nome" autocomplete="name" placeholder="Como te chamamos?" required><small class="erro">Digite seu nome.</small></label>
      <label class="campo"><span>Seu WhatsApp</span><input name="zap" inputmode="tel" autocomplete="tel" placeholder="+244 9xx xxx xxx" required><small class="erro">Digite um número válido com DDI.</small></label>
    </div>
    ${campoContextual}
    <button class="botaoAgendar" type="submit">${SVG.relogio} ${esc(ctaLabel)}</button>
    <p class="aviso">Ao enviar, abre o seu WhatsApp com a mensagem pronta — só apertar enviar.</p>
    <p class="confirmado" id="ok"></p>
  </form>
</section>

<div class="faixa"><div><section id="faq" style="padding-left:0;padding-right:0">
  <h2 class="reveal">Perguntas frequentes</h2>
  ${faq.map(([pergunta, resposta]) => `<details class="reveal"><summary>${esc(pergunta)}</summary><p>${esc(resposta)}</p></details>`).join('\n  ')}
</section></div></div>

<footer>
  <b>${nome}</b> — ${esc(dados.endereco ?? dados.cidade)} · ${esc(horario)}<br>
  © ${new Date().getFullYear()} ${nome}.
</footer>

<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: dados.nome,
  telephone: dados.telefone ?? undefined,
  address: { '@type': 'PostalAddress', streetAddress: dados.endereco ?? undefined, addressLocality: dados.cidade },
})}</script>
<script>
const EMPRESA = ${JSON.stringify(dados.nome)};
const SAUDACAO = ${JSON.stringify(saudacao)};
// Reveals com stagger
const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');obs.unobserve(e.target)}}),{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
// Parallax leve na foto do hero
const foto=document.querySelector('.heroFoto img');
if(foto){addEventListener('scroll',()=>{foto.style.transform='translateY('+(scrollY*.06)+'px)'},{passive:true})}
// Formulário → WhatsApp
const form=document.getElementById('form');
form.addEventListener('submit',function(ev){
  ev.preventDefault();
  const campoNome=form.nome.closest('.campo');
  const campoZap=form.zap.closest('.campo');
  const nome=form.nome.value.trim();
  const zap=form.zap.value.replace(/[^\\d]/g,'');
  let ok=true;
  campoNome.classList.toggle('err',nome.length<2); ok=ok&&nome.length>=2;
  campoZap.classList.toggle('err',zap.length<9); ok=ok&&zap.length>=9;
  if(!ok)return;
  const pedido=(form.pedido?form.pedido.value:'')||'';
  const linhas=[SAUDACAO,'Nome: '+nome,'WhatsApp: '+form.zap.value.trim()];
  if(pedido)linhas.push(form.servico?'Serviço: '+pedido:'Pedido: '+pedido);
  const msg=linhas.join('\\n');
  const botao=form.querySelector('.botaoAgendar');
  const rotulo=botao.innerHTML;
  botao.disabled=true; botao.innerHTML='Enviando…';
  setTimeout(()=>{
    ${temWhats ? `location.href='https://wa.me/${wa}?text='+encodeURIComponent(msg);` : `document.getElementById('ok').textContent='Recebido, '+nome+'! Em breve entraremos em contato.';`}
    botao.disabled=false; botao.innerHTML=rotulo;
    ${temWhats ? '' : "document.getElementById('ok').style.display='block';"}
  },600);
});
</script>
</body></html>`;
}

export async function gerarLandingPage(
  dados: DadosEmpresa,
): Promise<string> {
  const { html } = await gerarLandingPageComAnalise(dados);
  return html;
}

/**
 * Cadeia completa em UMA passagem de IA: analisarNegocio → desenharSite → construirSite.
 * Devolve o HTML e o resumo da decisão (exibido no painel). Em qualquer
 * falha do caminho novo, cai no template clássico com análise padrão.
 */
export async function gerarLandingPageComAnalise(
  dados: DadosEmpresa,
): Promise<{ html: string; analise: import('./businessAnalyzer.ts').AnaliseResumo | null }> {
  const fotos = await fotosDoNicho(dados.nicho);

  // ── CADEIA NOVA: Business Analyzer → Diretor de Criação → Site Builder ──
  // O site nasce da ANÁLISE do negócio (tipo, modelo, necessidades,
  // capacidades, formulário contextual, moeda, design) e do DESENHO
  // (hero, formato de cada seção, acabamentos). Qualquer falha
  // da IA cai nos fallbacks; qualquer falha do builder cai no
  // template clássico abaixo — nada quebra o fluxo do usuário.
  try {
    const { analisarNegocio, blueprintPadrao, escreverConteudoSite, desenharSite } = await import('./businessAnalyzer.ts');
    const { construirSite } = await import('./siteBuilder.ts');
    const blueprint = config.llmApiKey ? await analisarNegocio(dados) : null;
    const blueprintFinal = blueprint ?? blueprintPadrao(dados);
    // 2ª camada: conteúdo específico do segmento (itens, serviços, FAQ, CTAs).
    // Falha inofensiva: o builder mantém os textos honestos padrão.
    const conteudo = config.llmApiKey ? await escreverConteudoSite(dados, blueprintFinal) : null;
    // 3ª camada: o diretor de criação desenha layout + estrutura como um
    // programador sénior (sem LLM, fallback determinístico com variedade).
    const temFoto = fotos.length > 0;
    const design = config.llmApiKey ? await desenharSite(dados, blueprintFinal, temFoto) : null;
    const { html, resumo } = construirSite(dados, blueprintFinal, fotos, [], conteudo, design);
    console.log(
      `[siteGenerator] blueprint: ${resumo.negocio} · ${resumo.arquitetura} · ${resumo.secoes.length} seções${blueprint ? ' · análise IA' : ' · padrão (sem IA)'}${conteudo ? ' · conteúdo IA' : ''}${design ? ` · design "${design.conceito}" (hero ${design.hero})` : ' · design determinístico'}`,
    );
    return { html, analise: resumo };
  } catch (erro) {
    console.error('[siteGenerator] builder novo falhou — caindo no template clássico:', erro);
  }

  // A IA escreve apenas o CONTEÚDO (textos/JSON); o design é 100% do
  // template premium — o site nunca sai bagunçado, mesmo se a IA falhar.
  let conteudo: Conteudo | undefined;
  if (config.llmApiKey) {
    try {
      const resposta = await fetch(`${config.llmBaseUrl}/chat/completions`, {
        method: 'POST',
        signal: AbortSignal.timeout(60000),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.llmApiKey}`,
        },
        body: JSON.stringify({
          model: config.llmModelo,
          messages: [
            {
              role: 'system',
              content:
                'Você é copywriter sênior de sites de negócios locais. Responde SOMENTE com JSON válido, sem markdown e sem código. Nunca usa emojis.',
            },
            { role: 'user', content: INSTRUCAO(dados) },
          ],
          temperature: 0.7,
          max_tokens: 2500,
        }),
      });
      if (resposta.ok) {
        const json = (await resposta.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const texto = json.choices?.[0]?.message?.content ?? '';
        const conteudoIA = parseConteudoIA(texto);
        if (conteudoIA) {
          conteudo = aplicarConteudoIA(conteudoIA);
          console.log('[siteGenerator] conteúdo gerado pela IA:', config.llmModelo);
        } else {
          console.warn('[siteGenerator] IA devolveu JSON inválido — usando conteúdo padrão do nicho.');
        }
      } else {
        console.warn(`[siteGenerator] LLM ${resposta.status} — usando conteúdo padrão do nicho.`);
      }
    } catch (erro) {
      console.error('[siteGenerator] LLM falhou, usando conteúdo padrão:', erro);
    }
  }

  const htmlClassico = templateOffline(dados, fotos, conteudo);
  return { html: htmlClassico, analise: null };
}

/**
 * Catálogo curado de fotos (Pexels — licença livre, sem chave, CDN estável):
 * apenas fotos de AÇÃO e ROSTO do nicho — o profissional trabalhando e o
 * cliente com o resultado. Representatividade importa: para os mercados
 * lusófonos (Angola, Brasil, Portugal) os pools misturam fotos de clientes
 * e profissionais NEGROS com cabelo crespo, tranças e cortes afro.
 * Cada URL é verificada antes de entrar na página; se todas falharem,
 * o site usa arte CSS própria.
 */
const FOTOS_NICHO: Record<string, number[]> = {
  // Barbearia: mistura garantida — metade com clientes negros/crespo
  // (7447148, 7447138, 7447144, 7697273, 7697393, 7389079), metade geral.
  barbearia: [7447148, 7447138, 7447144, 7697273, 7697393, 7389079, 19664876, 13138585, 39559308, 7518731, 4952620, 4947744],
  barber: [7447148, 7447138, 7447144, 7697273, 7697393, 7389079, 19664876, 13138585, 39559308, 7518731, 4952620, 4947744],
  // Salão: tranças, crespo e styling em mulheres negras + geral.
  salao: [15576674, 15576672, 28383173, 13929391, 13212603, 4981475, 7755226, 17784002, 8834072],
  cabelo: [15576674, 15576672, 28383173, 13929391, 13212603, 4981475, 7755226, 17784002, 8834072],
  hair: [15576674, 15576672, 28383173, 13929391, 13212603, 4981475, 7755226, 17784002, 8834072],
  tranca: [15576674, 15576672, 28383173, 13929391, 13212603],
  restaurante: [11384933, 16716573, 18978086, 2566043],
  pizzaria: [11384933, 16716573, 18978086, 2566043],
  comida: [11384933, 16716573, 18978086, 2566043],
  padaria: [36445126, 36894313, 29908754],
  mecanico: [8986043, 7019362, 32152037],
  oficina: [8986043, 7019362, 32152037],
  auto: [8986043, 7019362, 32152037],
  dentista: [19976606, 19976592, 18523995, 12917374, 19976603, 19976607, 6812520],
  odonto: [19976606, 19976592, 18523995, 12917374, 19976603, 19976607, 6812520],
  academia: [37963581, 13621290],
  fitness: [37963581, 13621290],
};

/** Frase de busca usada pela IA/Unsplash quando o nicho está no dicionário. */
const BUSCA_NICHO: Record<string, string> = {
  barbearia: 'black barber cutting client hair barbershop',
  barber: 'black barber cutting client hair barbershop',
  salao: 'black woman braiding hair salon',
  cabelo: 'black woman braiding hair salon',
  hair: 'black woman braiding hair salon',
  tranca: 'black woman braiding hair salon',
  restaurante: 'restaurant plates table service',
  pizzaria: 'restaurant plates table service',
  comida: 'restaurant plates table service',
  padaria: 'baker fresh bread',
  mecanico: 'car mechanic working engine',
  oficina: 'car mechanic working engine',
  auto: 'car mechanic working engine',
  dentista: 'dentist patient dental clinic',
  odonto: 'dentist patient dental clinic',
  academia: 'personal trainer gym client',
  fitness: 'personal trainer gym client',
};

/** Consulta de fotos por nicho para a IA (mantém qualidade quando há LLM). */
function buscaFotosDoNicho(nicho: string): string {
  const chave = nicho.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [palavra, busca] of Object.entries(BUSCA_NICHO)) {
    if (chave.includes(palavra)) return busca;
  }
  return `${nicho} professional working with client`;
}

function urlPexels(id: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1280`;
}

/** Verifica (HEAD) se a foto responde; descarta quebras na hora. */
async function fotoViva(url: string): Promise<boolean> {
  try {
    const resposta = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(4000),
    });
    return resposta.ok;
  } catch {
    return false;
  }
}

/** Cache em memória por nicho (evita revalidar a cada site gerado). */
const cacheFotos = new Map<string, { fotos: Foto[]; expira: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;
/** Resultado vazio cacheia por pouco tempo (CDN pode ter falhado). */
const CACHE_VAZIO_MS = 60 * 1000;

/** Até 6 fotos de ação do nicho: catálogo curado → Unsplash opcional → []. */
async function fotosDoNicho(nicho: string): Promise<Foto[]> {
  const chave = nicho.trim().toLowerCase();
  const emCache = cacheFotos.get(chave);
  if (emCache && emCache.expira > Date.now()) return emCache.fotos;

  let fotos: Foto[] = [];
  const chaveCurada = chave.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let ids: number[] = [];
  for (const [palavra, lista] of Object.entries(FOTOS_NICHO)) {
    if (chaveCurada.includes(palavra)) {
      ids = lista;
      break;
    }
  }

  if (ids.length > 0) {
    // Pega 6 embaralhadas e valida cada URL (HEAD) em paralelo.
    const sorteados = [...ids].sort(() => Math.random() - 0.5).slice(0, 8);
    const vivas = await Promise.all(
      sorteados.map(async (id) => {
        const url = urlPexels(id);
        return (await fotoViva(url)) ? url : null;
      }),
    );
    fotos = vivas
      .filter((url): url is string => url !== null)
      .slice(0, 6)
      .map((url) => ({
        url,
        alt: `Trabalho de ${nicho} — profissional atendendo cliente`,
        autor: '',
        fonte: 'Pexels',
      }));
  }

  // Curadoria específica não disponível: Unsplash opcional cobre o resto.
  if (fotos.length === 0 && config.unsplashAccessKey) {
    fotos = await fotosUnsplash(buscaFotosDoNicho(nicho));
  }

  cacheFotos.set(chave, {
    fotos,
    expira: Date.now() + (fotos.length > 0 ? CACHE_TTL_MS : CACHE_VAZIO_MS),
  });
  return fotos;
}

/** Unsplash (opcional): exige UNSPLASH_ACCESS_KEY no server/.env. */
async function fotosUnsplash(consulta: string): Promise<Foto[]> {
  const vistas = new Set<string>();
  const fotos: Foto[] = [];
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(consulta)}&per_page=6&orientation=landscape&content_filter=high`;
    const resposta = await fetch(url, {
      headers: { Authorization: `Client-ID ${config.unsplashAccessKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!resposta.ok) return [];
    const json = (await resposta.json()) as {
      results?: { id: string; alt_description?: string; urls?: { regular?: string }; user?: { name?: string } }[];
    };
    for (const resultado of json.results ?? []) {
      if (fotos.length >= 6) break;
      if (!resultado.urls?.regular || vistas.has(resultado.id)) continue;
      vistas.add(resultado.id);
      fotos.push({
        url: resultado.urls.regular,
        alt: resultado.alt_description ?? `Imagem de ${consulta}`,
        autor: resultado.user?.name ?? '',
        fonte: 'Unsplash',
      });
    }
  } catch {
    return fotos;
  }
  return fotos;
}
