/**
 * Mantém o serviço sempre acordado (o plano Free do Render dorme após
 * ~15 min sem tráfego): se AUTO_PING_URL estiver definida, o servidor
 * visita a própria URL pública em intervalos regulares — o acesso conta
 * como tráfego de verdade e o serviço nunca dorme.
 *
 * Custo zero: o plano Free inclui 750 h/mês = 1 serviço ligado 24 h/dia.
 * Sem a variável, o ping simplesmente não roda (serviço dorme e acorda
 * na primeira visita — comportamento normal).
 */
export function iniciarAutoPing(): void {
  const url = process.env.AUTO_PING_URL ?? '';
  if (!url) return;
  const minutos = Math.max(2, Number(process.env.AUTO_PING_MIN ?? 5));

  const disparar = async () => {
    try {
      const resposta = await fetch(url, { signal: AbortSignal.timeout(15000) });
      console.log(`[auto-ping] ${resposta.status} (${new Date().toISOString()})`);
    } catch (erro) {
      console.warn(`[auto-ping] falhou: ${erro instanceof Error ? erro.message : erro}`);
    }
  };

  void disparar();
  setInterval(() => void disparar(), minutos * 60 * 1000);
  console.log(`[auto-ping] ativo: ${url} a cada ${minutos} min`);
}
