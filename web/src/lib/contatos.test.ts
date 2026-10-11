import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  listarContactos,
  marcarRespondido,
  registrarContacto,
  removerContacto,
  salvarContactos,
} from './contatos.ts';

/** Stub mínimo em memória do localStorage (o módulo só usa get/setItem). */
function instalarStorageFake() {
  let memoria: Record<string, string> = {};
  const fake = {
    getItem: vi.fn((chave: string) => (chave in memoria ? memoria[chave] : null)),
    setItem: vi.fn((chave: string, valor: string) => {
      memoria[chave] = valor;
    }),
    removeItem: vi.fn((chave: string) => {
      delete memoria[chave];
    }),
    clear: vi.fn(() => {
      memoria = {};
    }),
  };
  vi.stubGlobal('localStorage', fake);
  return fake;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  instalarStorageFake();
});

describe('listarContactos / salvarContactos', () => {
  it('começa vazio', () => {
    expect(listarContactos()).toEqual([]);
  });

  it('persiste e lê de volta (round-trip)', () => {
    salvarContactos([
      { leadId: 'l1', nome: 'Padaria Pão Quente', telefone: '871234567', canal: 'whatsapp', em: '2026-10-01T00:00:00.000Z', respondido: false },
    ]);
    expect(listarContactos()).toHaveLength(1);
    expect(listarContactos()[0].nome).toBe('Padaria Pão Quente');
  });

  it('devolve [] quando o JSON está corrompido', () => {
    localStorage.setItem('dfvleads:contatos', '{json quebrado');
    expect(listarContactos()).toEqual([]);
  });
});

describe('registrarContacto', () => {
  it('registra o contacto com os campos esperados e no topo da lista', () => {
    registrarContacto({ id: 'a', name: 'Barbearia Corte Fino', phone: '821234567' }, 'whatsapp');
    const segundo = registrarContacto({ id: 'b', name: 'Pizzaria Forno', phone: null }, 'telefone');

    expect(segundo.leadId).toBe('b');
    expect(segundo.telefone).toBeNull();
    expect(segundo.canal).toBe('telefone');
    expect(segundo.respondido).toBe(false);
    expect(typeof segundo.em).toBe('string');

    const lista = listarContactos();
    expect(lista.map((c) => c.leadId)).toEqual(['b', 'a']);
  });

  it('re-registrar o mesmo lead substitui (sem duplicar)', () => {
    registrarContacto({ id: 'a', name: 'Loja X', phone: '871234567' }, 'whatsapp');
    registrarContacto({ id: 'a', name: 'Loja X', phone: '871234567' }, 'copiado');

    const lista = listarContactos();
    expect(lista).toHaveLength(1);
    expect(lista[0].canal).toBe('copiado');
  });
});

describe('marcarRespondido / removerContacto', () => {
  it('alterna o estado respondido só do lead indicado', () => {
    registrarContacto({ id: 'a', name: 'Loja A', phone: '871234567' }, 'whatsapp');
    registrarContacto({ id: 'b', name: 'Loja B', phone: '821234567' }, 'telefone');

    marcarRespondido('a', true);
    const lista = listarContactos();
    expect(lista.find((c) => c.leadId === 'a')?.respondido).toBe(true);
    expect(lista.find((c) => c.leadId === 'b')?.respondido).toBe(false);

    marcarRespondido('a', false);
    expect(listarContactos().find((c) => c.leadId === 'a')?.respondido).toBe(false);
  });

  it('remove só o lead indicado e ignora ids inexistentes', () => {
    registrarContacto({ id: 'a', name: 'Loja A', phone: '871234567' }, 'whatsapp');
    registrarContacto({ id: 'b', name: 'Loja B', phone: '821234567' }, 'telefone');

    removerContacto('a');
    expect(listarContactos().map((c) => c.leadId)).toEqual(['b']);

    removerContacto('inexistente');
    expect(listarContactos().map((c) => c.leadId)).toEqual(['b']);
  });
});
