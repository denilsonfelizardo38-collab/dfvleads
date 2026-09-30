/**
 * Valida a conexão com o Supabase: tabelas do schema e disponibilidade
 * do Auth. Uso: node_modules/.bin/tsx scripts/testa-supabase.ts
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY vazia no server/.env');
    return;
  }
  const supabase = createClient(url, key);

  const { error: erroProfiles } = await supabase
    .from('profiles')
    .select('count', { count: 'exact', head: true });
  console.log('profiles:', erroProfiles ? `ERRO: ${erroProfiles.message}` : 'OK');

  const { error: erroLeads } = await supabase
    .from('leads')
    .select('count', { count: 'exact', head: true });
  console.log('leads:', erroLeads ? `ERRO: ${erroLeads.message}` : 'OK');

  const { error: erroLanding } = await supabase
    .from('landing_pages')
    .select('count', { count: 'exact', head: true });
  console.log('landing_pages:', erroLanding ? `ERRO: ${erroLanding.message}` : 'OK');

  // Auth responde? (signUp inválido deve dar erro de validação, não 404 de rede)
  const { error: erroAuth } = await supabase.auth.signUp({
    email: 'teste-fake@invalido.local',
    password: '123456',
  });
  console.log(
    'auth:',
    erroAuth && /already|invalid|rate/i.test(erroAuth.message)
      ? 'OK (respondeu validação)'
      : erroAuth
        ? `AVISO: ${erroAuth.message}`
        : 'OK',
  );
}

void main();
