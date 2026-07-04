// Cliente da Evolution API (WhatsApp nao-oficial, self-hosted).
// Uma Evolution atende varias instancias; cada instancia = um numero.

const BASE = process.env.EVOLUTION_URL || "http://localhost:8083";
const KEY = process.env.EVOLUTION_API_KEY || "";

export type EstadoEvolution = "open" | "connecting" | "close" | "desconhecido";

async function evo(path: string, init?: RequestInit) {
  const resp = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: KEY,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const texto = await resp.text();
  let data: unknown = null;
  try {
    data = texto ? JSON.parse(texto) : null;
  } catch {
    data = texto;
  }
  if (!resp.ok) {
    const msg =
      (data as { response?: { message?: string } })?.response?.message ||
      (typeof data === "string" ? data : JSON.stringify(data));
    throw new Error(`Evolution ${resp.status}: ${String(msg).slice(0, 200)}`);
  }
  return data;
}

// Cria a instancia. Se `numero` for informado, tambem gera um codigo de
// pareamento (o cliente digita esse codigo no proprio WhatsApp, sem QR).
export async function criarInstancia(instanceName: string, numero?: string | null) {
  const body: Record<string, unknown> = {
    instanceName,
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
  };
  if (numero) body.number = numero;
  const data = (await evo("/instance/create", {
    method: "POST",
    body: JSON.stringify(body),
  })) as {
    hash?: string;
    qrcode?: { base64?: string; pairingCode?: string };
    instance?: { status?: string };
  };
  return {
    hash: data.hash ?? null,
    qrBase64: data.qrcode?.base64 ?? null,
    pairingCode: data.qrcode?.pairingCode ?? null,
    status: data.instance?.status ?? "connecting",
  };
}

// Busca um QR e/ou codigo de pareamento novos (quando esta conectando).
export async function obterQr(instanceName: string, numero?: string | null) {
  const q = numero ? `?number=${encodeURIComponent(numero)}` : "";
  const data = (await evo(`/instance/connect/${instanceName}${q}`)) as {
    base64?: string;
    pairingCode?: string;
  };
  return { qrBase64: data.base64 ?? null, pairingCode: data.pairingCode ?? null };
}

// Estado atual da conexao.
export async function estadoInstancia(
  instanceName: string,
): Promise<EstadoEvolution> {
  try {
    const data = (await evo(
      `/instance/connectionState/${instanceName}`,
    )) as { instance?: { state?: EstadoEvolution } };
    return data.instance?.state ?? "desconhecido";
  } catch {
    return "desconhecido";
  }
}

// Numero de telefone conectado (quando ja pareou).
export async function telefoneConectado(
  instanceName: string,
): Promise<string | null> {
  try {
    const data = (await evo(
      `/instance/fetchInstances?instanceName=${instanceName}`,
    )) as Array<{ ownerJid?: string; number?: string }>;
    const inst = Array.isArray(data) ? data[0] : null;
    const jid = inst?.ownerJid || inst?.number || null;
    if (!jid) return null;
    return jid.split("@")[0];
  } catch {
    return null;
  }
}

// Configura o webhook da instancia para o app receber as mensagens.
export async function configurarWebhook(instanceName: string, url: string) {
  await evo(`/webhook/set/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url,
        webhookByEvents: false,
        webhookBase64: false,
        events: ["MESSAGES_UPSERT"],
      },
    }),
  });
}

// Envia uma mensagem de texto. `delay` (ms) simula o "digitando..." antes de enviar.
export async function enviarTexto(
  instanceName: string,
  numero: string,
  texto: string,
  delay = 1200,
) {
  await evo(`/message/sendText/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({ number: numero, text: texto, delay }),
  });
}

export async function deletarInstancia(instanceName: string) {
  try {
    await evo(`/instance/logout/${instanceName}`, { method: "DELETE" });
  } catch {
    // ignora se ja estava deslogada
  }
  await evo(`/instance/delete/${instanceName}`, { method: "DELETE" });
}
