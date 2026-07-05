import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { montarPromptSistema, type EmpresaComFicha } from "@/lib/prompt";
import { gerarResposta, type MensagemChat } from "@/lib/gemini";
import { enviarTexto } from "@/lib/evolution";

// Divide a resposta em baloes curtos, para soar mais humano no WhatsApp.
function dividirMensagem(t: string): string[] {
  const partes = t
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (partes.length <= 1) return [t.trim()];
  if (partes.length > 3) {
    return [partes[0], partes[1], partes.slice(2).join(" ")];
  }
  return partes;
}

function extrairTexto(msg: unknown): string | null {
  const m = msg as {
    conversation?: string;
    extendedTextMessage?: { text?: string };
  } | null;
  const t = m?.conversation || m?.extendedTextMessage?.text || "";
  return t.trim() || null;
}

// Verifica se um texto "fromMe" foi enviado pelo proprio bot (eco), comparando
// com as ultimas respostas do assistente. Se nao for, foi um humano digitando.
function ehEcoDoBot(texto: string, msgsBot: { conteudo: string }[]): boolean {
  const t = texto.trim();
  return msgsBot.some((m) => {
    const c = m.conteudo.trim();
    return c === t || c.includes(t) || t.includes(c);
  });
}

// Gera a resposta e envia — roda em segundo plano (nao bloqueia o webhook).
async function gerarEEnviar(
  empresa: EmpresaComFicha,
  contatoId: string,
  instanceName: string,
  telefone: string,
) {
  try {
    const historico = await prisma.mensagem.findMany({
      where: { contatoId, papel: { in: ["USUARIO", "ASSISTENTE"] } },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    const mensagens: MensagemChat[] = historico.map((m) => ({
      role: m.papel === "ASSISTENTE" ? "assistant" : "user",
      content: m.conteudo,
    }));

    const resposta = await gerarResposta(montarPromptSistema(empresa), mensagens);

    await prisma.mensagem.create({
      data: { contatoId, papel: "ASSISTENTE", conteudo: resposta },
    });

    for (const balao of dividirMensagem(resposta)) {
      const delay = Math.min(2500, 700 + balao.length * 20);
      await enviarTexto(instanceName, telefone, balao, delay);
    }
  } catch (e) {
    console.error("[webhook] falha ao gerar/enviar resposta:", e);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      event?: string;
      instance?: string;
      data?: {
        key?: { remoteJid?: string; fromMe?: boolean };
        pushName?: string;
        message?: unknown;
      };
    };

    if ((body.event || "").toLowerCase() !== "messages.upsert") {
      return NextResponse.json({ ok: true, ignorado: "evento" });
    }

    const data = body.data;
    const remoteJid = data?.key?.remoteJid || "";
    if (remoteJid.includes("@g.us"))
      return NextResponse.json({ ok: true, ignorado: "grupo" });

    const texto = extrairTexto(data?.message);
    if (!texto) return NextResponse.json({ ok: true, ignorado: "sem-texto" });

    const instanceName = body.instance || "";
    const telefone = remoteJid.split("@")[0];
    if (!instanceName || !telefone)
      return NextResponse.json({ ok: true, ignorado: "sem-dados" });

    const numero = await prisma.numero.findUnique({
      where: { instanceName },
      include: {
        empresa: {
          include: {
            servicos: { orderBy: { ordem: "asc" } },
            promocoes: true,
            objecoes: true,
            faqs: true,
            recursos: true,
          },
        },
      },
    });
    if (!numero)
      return NextResponse.json({ ok: true, ignorado: "instancia-desconhecida" });

    // -------- Mensagem enviada pelo proprio numero (fromMe) --------
    // Pode ser o eco do bot OU uma resposta manual de um humano. Se for humano,
    // a empresa assumiu a conversa -> pausa o bot para este contato.
    if (data?.key?.fromMe) {
      const contato = await prisma.contato.findUnique({
        where: {
          empresaId_telefone: { empresaId: numero.empresaId, telefone },
        },
      });
      if (!contato) return NextResponse.json({ ok: true, ignorado: "sem-contato" });

      if (!contato.pausado) {
        const msgsBot = await prisma.mensagem.findMany({
          where: { contatoId: contato.id, papel: "ASSISTENTE" },
          orderBy: { createdAt: "desc" },
          take: 6,
        });
        if (!ehEcoDoBot(texto, msgsBot)) {
          // Humano assumiu: pausa e registra
          await prisma.contato.update({
            where: { id: contato.id },
            data: { pausado: true },
          });
          await prisma.mensagem.create({
            data: {
              contatoId: contato.id,
              papel: "SISTEMA",
              conteudo: "[atendimento assumido por humano — bot pausado]",
            },
          });
        }
      }
      return NextResponse.json({ ok: true, fromMe: true });
    }

    // -------- Mensagem do cliente --------
    const contato = await prisma.contato.upsert({
      where: {
        empresaId_telefone: { empresaId: numero.empresaId, telefone },
      },
      create: {
        empresaId: numero.empresaId,
        telefone,
        nome: data?.pushName ?? null,
      },
      update: {},
    });

    // Registra a mensagem recebida (mesmo se pausado, para historico)
    await prisma.mensagem.create({
      data: { contatoId: contato.id, papel: "USUARIO", conteudo: texto },
    });

    // Se a conversa foi assumida por um humano, o bot nao responde mais.
    if (contato.pausado) {
      return NextResponse.json({ ok: true, pausado: true });
    }

    // Processa e responde em segundo plano; devolve 200 imediatamente.
    void gerarEEnviar(numero.empresa, contato.id, instanceName, telefone);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook whatsapp]", e);
    return NextResponse.json({ ok: false });
  }
}
