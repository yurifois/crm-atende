import Link from "next/link";
import { criarEmpresa } from "../actions";

const inputCls =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default function NovaEmpresaPage() {
  return (
    <div className="max-w-xl">
      <Link href="/empresas" className="text-sm text-zinc-500 hover:text-zinc-800">
        &larr; Voltar
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold tracking-tight">
        Nova empresa
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Comece com o basico. Na proxima tela voce monta a ficha completa e testa
        o robo.
      </p>
      <form
        action={criarEmpresa}
        className="space-y-5 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-800">
            Nome da empresa <span className="text-red-500">*</span>
          </span>
          <input
            name="nome"
            required
            placeholder="Ex: Barbearia do Ze"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-800">
            O que a empresa faz
          </span>
          <textarea
            name="descricao"
            rows={3}
            placeholder="Ex: Barbearia de bairro, cortes masculinos e barba."
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-800">
            Objetivo do robo
          </span>
          <span className="mb-1 block text-xs text-zinc-500">
            A meta principal do assistente (pode ajustar depois).
          </span>
          <textarea
            name="objetivo"
            rows={2}
            placeholder="Ex: Fazer o cliente agendar uma avaliacao ainda hoje."
            className={inputCls}
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Criar e configurar
        </button>
      </form>
    </div>
  );
}
