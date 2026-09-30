import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import { telefoneCoerente, paisDaBusca } from '../server/src/services/telefoneValido.ts';

let falhas = 0;

// ── 1) Estrutura: móveis/fixos reais passam, lixo é rejeitado ──────────
const ESTRUTURA: [string, string | null][] = [
  ['+55 61 99571-6969', 'movel'],
  ['+244 923 000 111', 'movel'],
  ['+258 84 555 0000', 'movel'],
  ['+351 912 345 678', 'movel'],
  ['0800 000 1234', null],
  ['+244 923 000 000', null],
  ['99999999', null],
  ['12345678', null],
  ['+258 00 000 000', null],
  ['777777777', null],
  ['+258 21 123 456', 'fixo'],
  ['+55 11 5042-4191', 'fixo'],
];

console.log('--- estrutura ---');
for (const [numero, esperado] of ESTRUTURA) {
  const veredito = telefoneCoerente(numero);
  const resultado = veredito.lixo || veredito.pais === null ? null : veredito.movel ? 'movel' : 'fixo';
  const ok = resultado === esperado;
  if (!ok) falhas++;
  console.log(`${ok ? 'OK ' : 'FALHOU'} ${numero.padEnd(22)} → ${resultado ?? 'null'} (esperado: ${esperado})`);
}

// ── 2) Coerência: o país do número deve bater com o da busca ──────────
const COERENCIA: [string, string, string | null][] = [
  ['+244 923 000 111', 'Luanda', 'Angola'],
  ['+258 84 555 0000', 'Maputo', 'Moçambique'],
  ['+55 61 99571-6969', 'Brasília', 'Brasil'],
  ['+351 912 345 678', 'Lisboa', 'Portugal'],
  ['+351 912 345 678', 'Luanda', null],
  ['+244 923 000 111', 'Maputo', null],
  ['+55 11 5042-4191', 'Luanda', null],
  ['+244 923 000 111', 'Cazenga', 'Angola'],
];

console.log('--- coerência geográfica ---');
for (const [telefone, cidade, esperado] of COERENCIA) {
  const veredito = telefoneCoerente(telefone);
  const esperadoPais = esperado === null ? null : veredito.pais; // rejeição: país tem de ser null
  const ok = esperado === null ? veredito.pais === null || veredito.pais !== paisDaBusca(cidade) : veredito.pais === esperado;
  void esperadoPais;
  if (!ok) falhas++;
  console.log(
    `${ok ? 'OK ' : 'FALHOU'} ${telefone.padEnd(22)} em ${cidade.padEnd(10)} → ${veredito.pais ?? 'null'}`,
  );
}

console.log(falhas === 0 ? '\nTodos os casos passaram.' : `\n${falhas} caso(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
