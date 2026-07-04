import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { montarPromptSistema } from "@/lib/prompt";
import { gerarResposta, type MensagemChat } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { empresaId, mensagens } = (await req.json()) as {
      empresaId: string;
      mensagens: MensagemChat[];
    };

    if (!empresaId) {
      return NextResponse.json(
        { error: "empresaId obrigatorio" },
        { status: 400 },
      );
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        servicos: { orderBy: { ordem: "asc" } },
        promocoes: true,
        objecoes: true,
        faqs: true,
        recursos: true,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa nao encontrada" },
        { status: 404 },
      );
    }

    const promptSistema = montarPromptSistema(empresa);
    const reply = await gerarResposta(promptSistema, mensagens ?? []);

    return NextResponse.json({ reply, promptSistema });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
