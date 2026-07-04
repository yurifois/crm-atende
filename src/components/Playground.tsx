"use client";

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Playground({ empresaId }: { empresaId: string }) {
  const [mensagens, setMensagens] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  async function enviar() {
    const texto = input.trim();
    if (!texto || loading) return;
    setErro(null);
    const novas = [...mensagens, { role: "user" as const, content: texto }];
    setMensagens(novas);
    setInput("");
    setLoading(true);
    scrollToBottom();
    try {
      const resp = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId, mensagens: novas }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro ao gerar resposta");
      setMensagens([
        ...novas,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  return (
    <div className="flex h-[560px] flex-col rounded-lg border border-zinc-200 bg-white lg:h-[calc(100vh-13rem)] lg:max-h-[calc(100vh-13rem)]">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            Playground — teste o robo
          </h2>
          <p className="text-xs text-zinc-400">Salve a ficha antes de testar.</p>
        </div>
        {mensagens.length > 0 && (
          <button
            onClick={() => {
              setMensagens([]);
              setErro(null);
            }}
            className="text-xs text-zinc-400 hover:text-zinc-700"
          >
            Reiniciar
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 p-4"
      >
        {mensagens.length === 0 && (
          <p className="mt-8 text-center text-sm text-zinc-400">
            Escreva como um cliente e veja o robo responder. Tente ser um cliente
            dificil para testar as objecoes.
          </p>
        )}
        {mensagens.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "rounded-br-sm bg-emerald-600 text-white"
                  : "rounded-bl-sm border border-zinc-200 bg-white text-zinc-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-400">
              digitando...
            </div>
          </div>
        )}
        {erro && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
            {erro}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-zinc-100 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder="Digite como um cliente..."
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <button
          onClick={enviar}
          disabled={loading}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
