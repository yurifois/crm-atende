"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Numero } from "@prisma/client";

type Acao = (formData: FormData) => void;
type AcaoExcluir = (id: string) => void;

const STATUS_LABEL: Record<string, { txt: string; cls: string }> = {
  CRIADO: { txt: "criado", cls: "bg-zinc-100 text-zinc-500" },
  CONECTANDO: { txt: "aguardando QR", cls: "bg-amber-100 text-amber-700" },
  CONECTADO: { txt: "conectado", cls: "bg-emerald-100 text-emerald-700" },
  DESCONECTADO: { txt: "desconectado", cls: "bg-red-100 text-red-700" },
};

function QrConexao({
  numeroId,
  onConectado,
}: {
  numeroId: string;
  onConectado: () => void;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("CONECTANDO");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    async function checar() {
      try {
        const r = await fetch(`/api/numeros/${numeroId}`, {
          cache: "no-store",
        });
        const data = await r.json();
        if (!ativo) return;
        if (!r.ok) {
          setErro(data.error || "Erro ao buscar QR");
          return;
        }
        setStatus(data.status);
        if (data.status === "CONECTADO") {
          onConectado();
          return;
        }
        if (data.qr) setQr(data.qr);
      } catch {
        if (ativo) setErro("Falha de conexao com o servidor");
      }
    }
    checar();
    const t = setInterval(checar, 3000);
    return () => {
      ativo = false;
      clearInterval(t);
    };
  }, [numeroId, onConectado]);

  const src = qr
    ? qr.startsWith("data:")
      ? qr
      : `data:image/png;base64,${qr}`
    : null;

  return (
    <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-center">
      {erro ? (
        <p className="text-sm text-red-600">{erro}</p>
      ) : status === "CONECTADO" ? (
        <p className="text-sm font-medium text-emerald-700">Conectado!</p>
      ) : src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="QR code do WhatsApp"
            className="mx-auto h-52 w-52"
          />
          <p className="mt-2 text-xs text-zinc-500">
            No WhatsApp: Aparelhos conectados &rarr; Conectar aparelho &rarr;
            escaneie este QR.
          </p>
        </>
      ) : (
        <p className="text-sm text-zinc-400">Gerando QR code...</p>
      )}
    </div>
  );
}

export default function GerenciadorNumeros({
  numeros,
  criarNumero,
  excluirNumero,
}: {
  numeros: Numero[];
  criarNumero: Acao;
  excluirNumero: AcaoExcluir;
}) {
  const router = useRouter();
  const [abertoId, setAbertoId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Numeros de WhatsApp
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Conecte um ou mais numeros. Todos usam a mesma ficha desta empresa.
          </p>
        </div>
        <form action={criarNumero}>
          <button
            type="submit"
            className="rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            + Conectar numero
          </button>
        </form>
      </div>

      {numeros.length === 0 ? (
        <p className="mt-4 text-xs text-zinc-400">
          Nenhum numero conectado ainda.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {numeros.map((n) => {
            const badge = STATUS_LABEL[n.status] ?? STATUS_LABEL.CRIADO;
            const conectado = n.status === "CONECTADO";
            return (
              <li
                key={n.id}
                className="rounded-md border border-zinc-100 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800">
                      {n.telefone ? `+${n.telefone}` : "Numero novo"}
                    </p>
                    <span
                      className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs ${badge.cls}`}
                    >
                      {badge.txt}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {!conectado && (
                      <button
                        onClick={() =>
                          setAbertoId(abertoId === n.id ? null : n.id)
                        }
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        {abertoId === n.id ? "Fechar" : "Ver QR"}
                      </button>
                    )}
                    <form action={excluirNumero.bind(null, n.id)}>
                      <button
                        type="submit"
                        className="text-xs text-zinc-400 hover:text-red-600"
                      >
                        remover
                      </button>
                    </form>
                  </div>
                </div>
                {abertoId === n.id && !conectado && (
                  <QrConexao
                    numeroId={n.id}
                    onConectado={() => {
                      setAbertoId(null);
                      router.refresh();
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
