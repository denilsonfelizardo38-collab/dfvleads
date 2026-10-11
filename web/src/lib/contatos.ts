/**
 * Registo local de contactos feitos pelo painel (WhatsApp, ligação ou cópia
 * do número). Fica guardado no dispositivo do usuário e alimenta a página
 * "Mensagens" e o contador "Contactos Feitos" do dashboard.
 */
export type CanalContacto = 'whatsapp' | 'telefone' | 'copiado';

export interface Contacto {
  leadId: string;
  nome: string;
  telefone: string | null;
  canal: CanalContacto;
  em: string;
  respondido: boolean;
}

const STORAGE_KEY = 'dfvleads:contatos';

export function listarContactos(): Contacto[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Contacto[];
  } catch {
    return [];
  }
}

export function salvarContactos(contatos: Contacto[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contatos));
}

/** Registra (ou atualiza) o contacto de um lead. */
export function registrarContacto(
  lead: { id: string; name: string; phone: string | null },
  canal: CanalContacto,
): Contacto {
  const contatos = listarContactos().filter((contato) => contato.leadId !== lead.id);
  const contacto: Contacto = {
    leadId: lead.id,
    nome: lead.name,
    telefone: lead.phone,
    canal,
    em: new Date().toISOString(),
    respondido: false,
  };
  salvarContactos([contacto, ...contatos]);
  return contacto;
}

export function marcarRespondido(leadId: string, respondido: boolean) {
  const contatos = listarContactos().map((contato) =>
    contato.leadId === leadId ? { ...contato, respondido } : contato,
  );
  salvarContactos(contatos);
}

export function removerContacto(leadId: string) {
  salvarContactos(listarContactos().filter((contato) => contato.leadId !== leadId));
}
