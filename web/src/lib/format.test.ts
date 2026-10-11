import { describe, expect, it } from 'vitest';
import { formatDate, formatRating, initials, pareceWhatsApp, placeholderPhone } from './format.ts';

describe('formatRating', () => {
  it('devolve travessão quando não há avaliação nem reviews', () => {
    expect(formatRating(null, null)).toBe('—');
    expect(formatRating(null, 0)).toBe('—');
  });

  it('formata a nota com vírgula decimal e total de reviews', () => {
    expect(formatRating(4.5, 10)).toBe('4,5 (10)');
    expect(formatRating(4, 1)).toBe('4,0 (1)');
  });

  it('arredonda a nota para uma casa decimal', () => {
    expect(formatRating(4.567, 2)).toBe('4,6 (2)');
  });

  it('omite os parênteses quando não há reviews', () => {
    expect(formatRating(4.5, null)).toBe('4,5');
    expect(formatRating(4.5, 0)).toBe('4,5');
  });

  it('mostra travessão na nota quando só há reviews', () => {
    expect(formatRating(null, 5)).toBe('— (5)');
  });
});

describe('placeholderPhone', () => {
  it('devolve o texto padrão para telefone nulo', () => {
    expect(placeholderPhone(null)).toBe('Sem telefone');
  });

  it('devolve o próprio número quando existe', () => {
    expect(placeholderPhone('+258 87 910 1185')).toBe('+258 87 910 1185');
  });
});

describe('pareceWhatsApp', () => {
  it('rejeita vazio, nulo e comprimentos inválidos', () => {
    expect(pareceWhatsApp(null)).toBe(false);
    expect(pareceWhatsApp('')).toBe(false);
    expect(pareceWhatsApp('1234567')).toBe(false); // 7 dígitos
    expect(pareceWhatsApp('1234567890123456')).toBe(false); // 16 dígitos
  });

  it('rejeita SAC/0800, dígitos repetidos e sequências óbvias', () => {
    expect(pareceWhatsApp('0800123456')).toBe(false);
    expect(pareceWhatsApp('888888888')).toBe(false);
    expect(pareceWhatsApp('12345678')).toBe(false);
    expect(pareceWhatsApp('87123400000')).toBe(false); // 5+ zeros
  });

  it('valida móveis de Angola (244 9xx xxx xxx)', () => {
    expect(pareceWhatsApp('244923456789')).toBe(true);
    expect(pareceWhatsApp('244223456789')).toBe(false); // fixo, não móvel
  });

  it('valida móveis de Moçambique (258 8x xxx xxxx e local 8x/9x)', () => {
    expect(pareceWhatsApp('258821234567')).toBe(true);
    expect(pareceWhatsApp('258811234567')).toBe(false); // prefixo 81 fora de 82-87
    expect(pareceWhatsApp('871234567')).toBe(true); // formato local
    expect(pareceWhatsApp('771234567')).toBe(false); // local deve começar com 8/9
  });

  it('valida móveis do Brasil (55 + DDD + 9 + 8 dígitos)', () => {
    expect(pareceWhatsApp('5511987654321')).toBe(true);
    expect(pareceWhatsApp('551187654321')).toBe(false); // sem o 9
  });

  it('valida móveis de Portugal (351 9xx xxx xxx)', () => {
    expect(pareceWhatsApp('351912345678')).toBe(true);
    expect(pareceWhatsApp('351212345678')).toBe(false); // fixo
  });

  it('aceita formatação com espaços, traços e parênteses', () => {
    expect(pareceWhatsApp('+258 82 123 4567')).toBe(true);
    expect(pareceWhatsApp('(11) 98765-4321'.replace(/^/, '55'))).toBe(true);
  });
});

describe('initials', () => {
  it('devolve a inicial de nome único em maiúscula', () => {
    expect(initials('denilson')).toBe('D');
  });

  it('usa só as duas primeiras palavras', () => {
    expect(initials('Ana Beatriz Costa')).toBe('AB');
  });

  it('devolve string vazia para string vazia', () => {
    expect(initials('')).toBe('');
  });
});

describe('formatDate', () => {
  it('devolve uma string não vazia para ISO válido', () => {
    const texto = formatDate('2026-10-01T10:30:00.000Z');
    expect(typeof texto).toBe('string');
    expect(texto.length).toBeGreaterThan(0);
  });
});
