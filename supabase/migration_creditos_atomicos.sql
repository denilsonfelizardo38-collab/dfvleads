-- Migração: débito ATÓMICO de créditos e de cota de sites.
-- Corrige a condição de corrida do caminho antigo (ler → conferir → escrever),
-- onde duas requisições simultâneas gastavam 1 crédito por 2 usos ou
-- estouravam a cota de sites do período.
--
-- COMO APLICAR: correr este ficheiro no SQL Editor do Supabase (uma vez).
-- O backend usa estas funções se existirem; antes da migração, usa o
-- caminho antigo automaticamente (sem quebrar).

-- Debita `p_valor` créditos do usuário numa única instrução: só debita se
-- houver saldo, e devolve { ok, credits }. Nunca deixa o saldo negativo.
create or replace function public.debitar_creditos(p_user_id uuid, p_valor integer)
returns table (ok boolean, credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits integer;
begin
  if p_valor is null or p_valor <= 0 then
    raise exception 'valor inválido';
  end if;

  update public.profiles
  set credits = credits - p_valor,
      updated_at = now()
  where user_id = p_user_id
    and credits >= p_valor
  returning profiles.credits into v_credits;

  if found then
    return query select true, v_credits;
  else
    select profiles.credits into v_credits
    from public.profiles
    where user_id = p_user_id;
    if not found then
      raise exception 'perfil não encontrado';
    end if;
    return query select false, v_credits;
  end if;
end;
$$;

-- Consome 1 unidade da cota de sites do período de forma atómica: só
-- incrementa se ainda houver cota, e devolve { ok, restantes }.
create or replace function public.consumir_site_quota(p_user_id uuid, p_limite integer)
returns table (ok boolean, restantes integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
begin
  if p_limite is null or p_limite < 0 then
    raise exception 'limite inválido';
  end if;

  update public.profiles
  set sites_used = sites_used + 1,
      updated_at = now()
  where user_id = p_user_id
    and sites_used < p_limite
  returning profiles.sites_used into v_used;

  if found then
    return query select true, (p_limite - v_used);
  else
    select profiles.sites_used into v_used
    from public.profiles
    where user_id = p_user_id;
    if not found then
      raise exception 'perfil não encontrado';
    end if;
    return query select false, greatest(p_limite - v_used, 0);
  end if;
end;
$$;
