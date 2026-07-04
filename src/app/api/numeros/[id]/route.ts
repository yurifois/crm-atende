import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  estadoInstancia,
  obterQr,
  telefoneConectado,
} from "@/lib/evolution";
import type { StatusNumero } from "@prisma/client";

function mapear(estado: string): StatusNumero {
  if (estado === "open") return "CONECTADO";
  if (estado === "connecting") return "CONECTANDO";
  if (estado === "close") return "DESCONECTADO";
  return "CONECTANDO";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numero = await prisma.numero.findUnique({ where: { id } });
  if (!numero) {
    return NextResponse.json({ error: "Numero nao encontrado" }, { status: 404 });
  }

  const estado = await estadoInstancia(numero.instanceName);
  const status = mapear(estado);

  let qr: string | null = null;
  let telefone: string | null = numero.telefone;

  if (estado === "open") {
    // Conectou: captura o telefone e persiste
    telefone = (await telefoneConectado(numero.instanceName)) ?? telefone;
    if (numero.status !== "CONECTADO" || (telefone && telefone !== numero.telefone)) {
      await prisma.numero.update({
        where: { id },
        data: { status: "CONECTADO", telefone },
      });
    }
  } else {
    // Ainda nao conectou: pega um QR fresco
    try {
      const r = await obterQr(numero.instanceName);
      qr = r.qrBase64;
    } catch {
      qr = null;
    }
    if (numero.status !== status) {
      await prisma.numero.update({ where: { id }, data: { status } });
    }
  }

  return NextResponse.json({ status, qr, telefone });
}
