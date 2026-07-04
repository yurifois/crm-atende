"use server";

import { Prisma, type TipoRecurso } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  criarInstancia,
  deletarInstancia,
  configurarWebhook,
} from "@/lib/evolution";
import { urlWebhook } from "@/lib/rede";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function str(formData: FormData, k: string): string | null {
  const v = formData.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
}
function strAll(formData: FormData, k: string): string[] {
  return formData
    .getAll(k)
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
}
function revalEmpresa(id: string) {
  revalidatePath(`/empresas/${id}`);
  revalidatePath("/empresas");
}

// ------------------------------------------------------------------
// Criar empresa (formulario minimo -> redireciona pro editor)
// ------------------------------------------------------------------
export async function criarEmpresa(formData: FormData) {
  const nome = str(formData, "nome");
  if (!nome) throw new Error("O nome da empresa e obrigatorio.");
  const empresa = await prisma.empresa.create({
    data: {
      nome,
      descricao: str(formData, "descricao"),
      objetivo: str(formData, "objetivo"),
    },
  });
  revalidatePath("/empresas");
  redirect(`/empresas/${empresa.id}`);
}

// ------------------------------------------------------------------
// Salvamentos por secao (partial update)
// ------------------------------------------------------------------
export async function salvarPerfil(id: string, formData: FormData) {
  const dias = strAll(formData, "dias");
  const abre = str(formData, "abre");
  const fecha = str(formData, "fecha");
  const horarios =
    dias.length > 0
      ? ({ dias, abre, fecha } as Prisma.InputJsonValue)
      : Prisma.DbNull;

  await prisma.empresa.update({
    where: { id },
    data: {
      nome: str(formData, "nome") ?? undefined,
      descricao: str(formData, "descricao"),
      horarios,
      endereco: str(formData, "endereco"),
      pagamentos: strAll(formData, "pagamentos"),
      parcelamento: str(formData, "parcelamento"),
    },
  });
  revalEmpresa(id);
}

export async function salvarComportamento(id: string, formData: FormData) {
  await prisma.empresa.update({
    where: { id },
    data: {
      objetivo: str(formData, "objetivo"),
      personalidade: str(formData, "personalidade"),
    },
  });
  revalEmpresa(id);
}

export async function salvarRegras(id: string, formData: FormData) {
  await prisma.empresa.update({
    where: { id },
    data: {
      handoffRegra: str(formData, "handoffRegra"),
      notificacaoDestino: str(formData, "notificacaoDestino"),
    },
  });
  revalEmpresa(id);
}

export async function excluirEmpresa(id: string) {
  await prisma.empresa.delete({ where: { id } });
  revalidatePath("/empresas");
  redirect("/empresas");
}

// ------------------------------------------------------------------
// Sub-recursos: adicionar / excluir
// ------------------------------------------------------------------
export async function adicionarServico(empresaId: string, formData: FormData) {
  const nome = str(formData, "nome");
  if (!nome) return;
  await prisma.servico.create({
    data: {
      empresaId,
      nome,
      preco: str(formData, "preco"),
      duracao: str(formData, "duracao"),
      descricao: str(formData, "descricao"),
    },
  });
  revalEmpresa(empresaId);
}
export async function excluirServico(empresaId: string, id: string) {
  await prisma.servico.delete({ where: { id } });
  revalEmpresa(empresaId);
}

export async function adicionarPromocao(empresaId: string, formData: FormData) {
  const titulo = str(formData, "titulo");
  if (!titulo) return;
  await prisma.promocao.create({
    data: {
      empresaId,
      titulo,
      descricao: str(formData, "descricao"),
      condicoes: str(formData, "condicoes"),
    },
  });
  revalEmpresa(empresaId);
}
export async function excluirPromocao(empresaId: string, id: string) {
  await prisma.promocao.delete({ where: { id } });
  revalEmpresa(empresaId);
}

export async function adicionarObjecao(empresaId: string, formData: FormData) {
  const gatilho = str(formData, "gatilho");
  const resposta = str(formData, "resposta");
  if (!gatilho || !resposta) return;
  await prisma.objecao.create({
    data: { empresaId, gatilho, resposta },
  });
  revalEmpresa(empresaId);
}
export async function excluirObjecao(empresaId: string, id: string) {
  await prisma.objecao.delete({ where: { id } });
  revalEmpresa(empresaId);
}

export async function adicionarFaq(empresaId: string, formData: FormData) {
  const pergunta = str(formData, "pergunta");
  const resposta = str(formData, "resposta");
  if (!pergunta || !resposta) return;
  await prisma.faqItem.create({
    data: { empresaId, pergunta, resposta },
  });
  revalEmpresa(empresaId);
}
export async function excluirFaq(empresaId: string, id: string) {
  await prisma.faqItem.delete({ where: { id } });
  revalEmpresa(empresaId);
}

export async function adicionarRecurso(empresaId: string, formData: FormData) {
  const titulo = str(formData, "titulo");
  const tipo = str(formData, "tipo") as TipoRecurso | null;
  if (!titulo || !tipo) return;
  await prisma.recursoFechamento.create({
    data: {
      empresaId,
      titulo,
      tipo,
      url: str(formData, "url"),
      quandoUsar: str(formData, "quandoUsar"),
    },
  });
  revalEmpresa(empresaId);
}
export async function excluirRecurso(empresaId: string, id: string) {
  await prisma.recursoFechamento.delete({ where: { id } });
  revalEmpresa(empresaId);
}

// ------------------------------------------------------------------
// Sub-recursos: atualizar (editar item existente)
// ------------------------------------------------------------------
export async function atualizarServico(
  empresaId: string,
  id: string,
  formData: FormData,
) {
  await prisma.servico.update({
    where: { id },
    data: {
      nome: str(formData, "nome") ?? undefined,
      preco: str(formData, "preco"),
      duracao: str(formData, "duracao"),
      descricao: str(formData, "descricao"),
    },
  });
  revalEmpresa(empresaId);
}

export async function atualizarPromocao(
  empresaId: string,
  id: string,
  formData: FormData,
) {
  await prisma.promocao.update({
    where: { id },
    data: {
      titulo: str(formData, "titulo") ?? undefined,
      condicoes: str(formData, "condicoes"),
      descricao: str(formData, "descricao"),
    },
  });
  revalEmpresa(empresaId);
}

export async function atualizarObjecao(
  empresaId: string,
  id: string,
  formData: FormData,
) {
  await prisma.objecao.update({
    where: { id },
    data: {
      gatilho: str(formData, "gatilho") ?? undefined,
      resposta: str(formData, "resposta") ?? undefined,
    },
  });
  revalEmpresa(empresaId);
}

export async function atualizarFaq(
  empresaId: string,
  id: string,
  formData: FormData,
) {
  await prisma.faqItem.update({
    where: { id },
    data: {
      pergunta: str(formData, "pergunta") ?? undefined,
      resposta: str(formData, "resposta") ?? undefined,
    },
  });
  revalEmpresa(empresaId);
}

export async function atualizarRecurso(
  empresaId: string,
  id: string,
  formData: FormData,
) {
  await prisma.recursoFechamento.update({
    where: { id },
    data: {
      titulo: str(formData, "titulo") ?? undefined,
      tipo: (str(formData, "tipo") as TipoRecurso | null) ?? undefined,
      url: str(formData, "url"),
      quandoUsar: str(formData, "quandoUsar"),
    },
  });
  revalEmpresa(empresaId);
}

// ------------------------------------------------------------------
// Numeros de WhatsApp (instancias Evolution)
// ------------------------------------------------------------------
export async function criarNumero(empresaId: string) {
  const instanceName = `crm_${empresaId.slice(-6)}_${Date.now().toString(36)}`;
  const { hash } = await criarInstancia(instanceName);
  // Aponta o webhook desta instancia para o app (IP auto-detectado).
  try {
    await configurarWebhook(instanceName, urlWebhook());
  } catch {
    // nao bloqueia a criacao se o webhook falhar; da pra reconfigurar depois
  }
  await prisma.numero.create({
    data: {
      empresaId,
      instanceName,
      instanceToken: hash,
      status: "CONECTANDO",
    },
  });
  revalEmpresa(empresaId);
}

export async function excluirNumero(empresaId: string, numeroId: string) {
  const numero = await prisma.numero.findUnique({ where: { id: numeroId } });
  if (numero) {
    try {
      await deletarInstancia(numero.instanceName);
    } catch {
      // segue mesmo se a instancia ja nao existir na Evolution
    }
    await prisma.numero.delete({ where: { id: numeroId } });
  }
  revalEmpresa(empresaId);
}
