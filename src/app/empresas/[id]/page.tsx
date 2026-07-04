import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmpresaEditor from "@/components/EmpresaEditor";
import Playground from "@/components/Playground";
import {
  salvarPerfil,
  salvarComportamento,
  salvarRegras,
  excluirEmpresa,
  adicionarServico,
  excluirServico,
  atualizarServico,
  adicionarPromocao,
  excluirPromocao,
  atualizarPromocao,
  adicionarObjecao,
  excluirObjecao,
  atualizarObjecao,
  adicionarFaq,
  excluirFaq,
  atualizarFaq,
  adicionarRecurso,
  excluirRecurso,
  atualizarRecurso,
  criarNumero,
  excluirNumero,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function EditarEmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const empresa = await prisma.empresa.findUnique({
    where: { id },
    include: {
      servicos: { orderBy: { ordem: "asc" } },
      promocoes: true,
      objecoes: true,
      faqs: true,
      recursos: true,
      numeros: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!empresa) notFound();

  const excluir = excluirEmpresa.bind(null, id);

  return (
    <div>
      <Link
        href="/empresas"
        className="text-sm text-zinc-500 hover:text-zinc-800"
      >
        &larr; Voltar
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold tracking-tight">
        {empresa.nome}
      </h1>
      <p className="mb-4 text-sm text-zinc-500">
        Configure a ficha em abas e teste o robo no playground ao lado.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* Esquerda: ficha */}
        <div>
          <EmpresaEditor
            empresa={empresa}
            servicos={empresa.servicos}
            promocoes={empresa.promocoes}
            objecoes={empresa.objecoes}
            faqs={empresa.faqs}
            recursos={empresa.recursos}
            numeros={empresa.numeros}
            salvarPerfil={salvarPerfil.bind(null, id)}
            salvarComportamento={salvarComportamento.bind(null, id)}
            salvarRegras={salvarRegras.bind(null, id)}
            addServico={adicionarServico.bind(null, id)}
            delServico={excluirServico.bind(null, id)}
            editServico={atualizarServico.bind(null, id)}
            addPromocao={adicionarPromocao.bind(null, id)}
            delPromocao={excluirPromocao.bind(null, id)}
            editPromocao={atualizarPromocao.bind(null, id)}
            addObjecao={adicionarObjecao.bind(null, id)}
            delObjecao={excluirObjecao.bind(null, id)}
            editObjecao={atualizarObjecao.bind(null, id)}
            addFaq={adicionarFaq.bind(null, id)}
            delFaq={excluirFaq.bind(null, id)}
            editFaq={atualizarFaq.bind(null, id)}
            addRecurso={adicionarRecurso.bind(null, id)}
            delRecurso={excluirRecurso.bind(null, id)}
            editRecurso={atualizarRecurso.bind(null, id)}
            addNumero={criarNumero.bind(null, id)}
            delNumero={excluirNumero.bind(null, id)}
          />
          <form action={excluir} className="mt-6">
            <button
              type="submit"
              className="text-sm text-red-600 hover:underline"
            >
              Excluir empresa
            </button>
          </form>
        </div>

        {/* Direita: playground — acompanha a rolagem e fica sempre inteiro */}
        <div className="lg:sticky lg:top-4">
          <Playground empresaId={empresa.id} />
        </div>
      </div>
    </div>
  );
}
