import os from "os";

// Descobre o IP local da maquina (ex: o IP da distro WSL), para que a
// Evolution (rodando no Docker) consiga alcancar este app pelo webhook.
export function ipLocal(): string {
  const ifaces = os.networkInterfaces();
  for (const nome of Object.keys(ifaces)) {
    for (const iface of ifaces[nome] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

// URL que a Evolution usa para chamar o webhook do app.
// Prioriza APP_WEBHOOK_URL (util em producao/VPS/tunel); senao, auto-detecta.
export function urlWebhook(): string {
  if (process.env.APP_WEBHOOK_URL) return process.env.APP_WEBHOOK_URL;
  const porta = process.env.PORT || "3000";
  return `http://${ipLocal()}:${porta}/api/whatsapp`;
}
