import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EmpresasPage() {
  const empresas = await prisma.empresa.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { servicos: true, numeros: true, leads: true } },
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-sm text-zinc-500">
            Cadastre um negocio e monte a ficha do agente.
          </p>
        </div>
        <Link
          href="/empresas/nova"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Nova empresa
        </Link>
      </div>

      {empresas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-zinc-600">Nenhuma empresa cadastrada ainda.</p>
          <Link
            href="/empresas/nova"
            className="mt-3 inline-block text-sm font-semibold text-emerald-600 hover:underline"
          >
            Cadastrar a primeira empresa
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {empresas.map((e) => (
            <li key={e.id}>
              <Link
                href={`/empresas/${e.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-emerald-400 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900">{e.nome}</span>
                  {!e.ativo && (
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      inativa
                    </span>
                  )}
                </div>
                {e.descricao && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                    {e.descricao}
                  </p>
                )}
                <div className="mt-3 flex gap-4 text-xs text-zinc-400">
                  <span>{e._count.servicos} servicos</span>
                  <span>{e._count.numeros} numeros</span>
                  <span>{e._count.leads} leads</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
