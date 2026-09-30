/**
 * TELEFONE REAL E COERENTE COM O NEGÓCIO.
 *
 * Regra do produto: dado real > volume. Um número só entra como lead se:
 *  1. não for lixo (0800, placeholders com zeros, sequências, repetições);
 *  2. sua estrutura bater com um país conhecido (DDI + formato local);
 *  3. esse país for O MESMO do negócio (cidade da busca) — número
 *     estrangeiro para loja local é dado errado, descartado.
 */

export interface VereditoTelefone {
  /** País identificado pelo DDI/estrutura, ou null se estrutura inválida. */
  pais: string | null;
  lixo: boolean;
  /** Aceito como móvel real (WhatsApp provável). */
  movel: boolean;
}

/** Cidade → país do mercado (mesma lista do businessAnalyzer.PAISES). */
export function paisDaBusca(cidade: string): string {
  const c = cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/(angola|luanda|benguela|lubango|huambo|talatona|viana|lobito|cazenga)/.test(c)) return 'Angola';
  if (/(moçambique|mocambique|maputo|nampula|beira|matola|quetelimane|pemba)/.test(c)) return 'Moçambique';
  if (/(brasil|sao paulo|rio de janeiro|brasilia|belo horizonte|curitiba|salvador|fortaleza|recife|porto alegre)/.test(c)) return 'Brasil';
  if (/(portugal|lisboa|porto|coimbra|faro|braga|aveiro|sintra)/.test(c)) return 'Portugal';
  if (/(estados unidos|new york|miami|boston|los angeles)/.test(c)) return 'Estados Unidos';
  if (/(reino unido|london|manchester|birmingham)/.test(c)) return 'Reino Unido';
  if (/(africa do sul|cape town|johannesburg|durban)/.test(c)) return 'África do Sul';
  return '';
}

const REGRAS: { pais: string; ddi: string; movel: RegExp; fixo: RegExp }[] = [
  { pais: 'Angola', ddi: '244', movel: /^9\d{8}$/, fixo: /^2\d{7}$/ },
  { pais: 'Moçambique', ddi: '258', movel: /^8[2-7]\d{7}$/, fixo: /^2\d{7}$/ },
  { pais: 'Brasil', ddi: '55', movel: /^\d{2}9\d{8}$/, fixo: /^\d{2}[2-5]\d{7}$/ },
  { pais: 'Portugal', ddi: '351', movel: /^9\d{8}$/, fixo: /^2\d{8}$/ },
];

/** Rejeita o lixo clássico de dados abertos. */
function telefoneLixo(digitos: string): boolean {
  if (/^(0800|0300|0500|0900|4004|4002)/.test(digitos)) return true;
  if (/^(\d)\1+$/.test(digitos)) return true;
  const local = digitos.replace(/^(244|258|55|351|1|44|27|7|27)/, '');
  const sequencia = /^(?:01234567|12345678|123456789|23456789|98765432|987654321|87654321|76543210|1234567)$/;
  if (sequencia.test(local) || sequencia.test(digitos)) return true;
  if (/0{5,}/.test(digitos)) return true;
  if (/(\d)\1{4,}/.test(digitos)) return true;
  return false;
}

/** Número (com ou sem +) → país + flag de móvel, ou inválido. */
export function telefoneCoerente(telefone: string | null | undefined): VereditoTelefone {
  const vazio: VereditoTelefone = { pais: null, lixo: true, movel: false };
  if (!telefone?.trim()) return vazio;
  const digitos = telefone.replace(/\D/g, '');

  if (digitos.length < 8 || digitos.length > 15) return vazio;
  if (telefoneLixo(digitos)) return vazio;

  // 1) DDI explícito na frente? Valida contra as regras do país.
  for (const regra of REGRAS) {
    if (digitos.startsWith(regra.ddi)) {
      const local = digitos.slice(regra.ddi.length);
      const movel = regra.movel.test(local);
      const fixo = regra.fixo.test(local);
      if (movel || fixo) return { pais: regra.pais, lixo: false, movel };
      return vazio; // DDI certo, estrutura errada → número inválido
    }
  }

  // 2) Sem DDI: tenta casar o número local com as regras (ex.: 923000111
  //    em Luanda é um móvel angolano válido).
  for (const regra of REGRAS) {
    if (regra.movel.test(digitos)) return { pais: regra.pais, lixo: false, movel: true };
    if (regra.fixo.test(digitos)) return { pais: regra.pais, lixo: false, movel: false };
  }

  // 3) Heurísticas de outros mercados (EUA/UK/África do Sul) — país
  //    genérico 'estrangeiro' só quando a estrutura é plausível.
  if (/^1\d{10}$/.test(digitos)) return { pais: 'Estados Unidos', lixo: false, movel: false };
  if (/^44\d{10}$/.test(digitos)) return { pais: 'Reino Unido', lixo: false, movel: false };
  if (/^27\d{9}$/.test(digitos)) return { pais: 'África do Sul', lixo: false, movel: false };

  return vazio;
}
