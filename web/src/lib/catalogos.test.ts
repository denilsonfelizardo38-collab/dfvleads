import { describe, expect, it } from 'vitest';
import { GRUPOS_NICHOS, TODOS_NICHOS } from './nichos.ts';
import { PAISES, paisDoTexto } from './paises.ts';

describe('GRUPOS_NICHOS / TODOS_NICHOS', () => {
  it('tem categorias não vazias com nichos não vazios', () => {
    expect(GRUPOS_NICHOS.length).toBeGreaterThan(0);
    for (const grupo of GRUPOS_NICHOS) {
      expect(grupo.categoria.trim().length).toBeGreaterThan(0);
      expect(grupo.nichos.length).toBeGreaterThan(0);
      for (const nicho of grupo.nichos) {
        expect(nicho.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('lista plana é a concatenação exata dos grupos', () => {
    const esperado = GRUPOS_NICHOS.flatMap((grupo) => grupo.nichos);
    expect(TODOS_NICHOS).toEqual(esperado);
  });

  it('contém nichos conhecidos de várias categorias', () => {
    expect(TODOS_NICHOS).toContain('Pizzaria');
    expect(TODOS_NICHOS).toContain('Barbearia');
    expect(TODOS_NICHOS).toContain('Hotel');
    expect(TODOS_NICHOS).toContain('Ginásio');
  });
});

describe('paisDoTexto', () => {
  it('detecta o país pelo nome exato (case-insensitive)', () => {
    expect(paisDoTexto('brasil')?.nome).toBe('Brasil');
    expect(paisDoTexto('PORTUGAL')?.nome).toBe('Portugal');
  });

  it('detecta por alias em inglês/sigla', () => {
    expect(paisDoTexto('brazil')?.nome).toBe('Brasil');
    expect(paisDoTexto('usa')?.nome).toBe('Estados Unidos');
    expect(paisDoTexto('mozambique')?.nome).toBe('Moçambique');
  });

  it('ignora acentos, caixa e espaços nas bordas', () => {
    expect(paisDoTexto('  Moçambique  ')?.nome).toBe('Moçambique');
    expect(paisDoTexto('mocambique')?.nome).toBe('Moçambique');
    expect(paisDoTexto('sao tome')?.nome).toBe('São Tomé e Príncipe');
  });

  it('devolve null para texto curto, vazio ou desconhecido', () => {
    expect(paisDoTexto('')).toBeNull();
    expect(paisDoTexto('br')).toBeNull();
    expect(paisDoTexto('Atlantida')).toBeNull();
  });

  it('não confunde cidade com país', () => {
    expect(paisDoTexto('Maputo')).toBeNull();
    expect(paisDoTexto('São Paulo')).toBeNull();
  });

  it('todo país tem rótulo de divisão, divisões e aliases', () => {
    expect(PAISES.length).toBeGreaterThan(0);
    for (const pais of PAISES) {
      expect(pais.rotuloDivisao.trim().length).toBeGreaterThan(0);
      expect(pais.divisoes.length).toBeGreaterThan(0);
      expect(pais.aliases.length).toBeGreaterThan(0);
    }
  });
});
