"use client";

import { useRef, useState } from "react";

export type Campo = {
  name: string;
  label: string;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
  type?: "text" | "select";
  options?: string[];
};

export type ItemLista = {
  id: string;
  principal: string;
  secundario?: string | null;
  extra?: string | null;
  valores: Record<string, string>;
};

type Props = {
  titulo: string;
  descricao?: string;
  itens: ItemLista[];
  campos: Campo[];
  adicionar: (formData: FormData) => void; // ja vinculada com empresaId
  excluir: (id: string) => void; // ja vinculada com empresaId
  editar: (id: string, formData: FormData) => void; // ja vinculada com empresaId
  addLabel?: string;
};

const inputCls =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

function CampoInput({
  campo,
  defaultValue,
}: {
  campo: Campo;
  defaultValue?: string;
}) {
  if (campo.type === "select") {
    return (
      <select
        name={campo.name}
        required={campo.required}
        defaultValue={defaultValue ?? ""}
        className={inputCls}
      >
        <option value="" disabled>
          {campo.label}
        </option>
        {(campo.options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (campo.textarea) {
    return (
      <textarea
        name={campo.name}
        required={campo.required}
        defaultValue={defaultValue}
        rows={2}
        placeholder={campo.placeholder ?? campo.label}
        className={inputCls}
      />
    );
  }
  return (
    <input
      name={campo.name}
      required={campo.required}
      defaultValue={defaultValue}
      placeholder={campo.placeholder ?? campo.label}
      className={inputCls}
    />
  );
}

export default function ListaEditavel({
  titulo,
  descricao,
  itens,
  campos,
  adicionar,
  excluir,
  editar,
  addLabel = "Adicionar",
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-zinc-900">{titulo}</h3>
      {descricao && <p className="mt-0.5 text-xs text-zinc-500">{descricao}</p>}

      {/* Lista de itens existentes */}
      {itens.length > 0 ? (
        <ul className="mt-3 divide-y divide-zinc-100 rounded-md border border-zinc-100">
          {itens.map((it) =>
            editandoId === it.id ? (
              <li key={it.id} className="bg-emerald-50/40 px-3 py-3">
                <form
                  action={(fd) => {
                    editar(it.id, fd);
                    setEditandoId(null);
                  }}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {campos.map((c) => (
                    <div key={c.name} className={c.textarea ? "sm:col-span-2" : ""}>
                      <CampoInput campo={c} defaultValue={it.valores[c.name] ?? ""} />
                    </div>
                  ))}
                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoId(null)}
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              <li
                key={it.id}
                className="flex items-start justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800">
                    {it.principal}
                    {it.secundario && (
                      <span className="ml-2 font-normal text-zinc-500">
                        {it.secundario}
                      </span>
                    )}
                  </p>
                  {it.extra && (
                    <p className="mt-0.5 text-xs text-zinc-500">{it.extra}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditandoId(it.id)}
                    className="text-xs font-medium text-emerald-700 hover:underline"
                  >
                    editar
                  </button>
                  <form action={excluir.bind(null, it.id)}>
                    <button
                      type="submit"
                      className="text-xs text-zinc-400 hover:text-red-600"
                    >
                      remover
                    </button>
                  </form>
                </div>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-zinc-400">Nenhum item cadastrado.</p>
      )}

      {/* Formulario de adicao */}
      <form
        ref={formRef}
        action={(fd) => {
          adicionar(fd);
          formRef.current?.reset();
        }}
        className="mt-4 grid gap-2 sm:grid-cols-2"
      >
        {campos.map((c) => (
          <div key={c.name} className={c.textarea ? "sm:col-span-2" : ""}>
            <CampoInput campo={c} />
          </div>
        ))}
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            + {addLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
