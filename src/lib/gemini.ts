// Cliente do Google Gemini. Trocavel: para usar outro provedor,
// basta reimplementar gerarResposta com a mesma assinatura.

export type MensagemChat = {
  role: "user" | "assistant";
  content: string;
};

const MODELO = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Rede de seguranca: remove markdown/simbolos para manter o texto 100% humano.
export function limparFormatacao(t: string): string {
  return t
    .replace(/\*\*([\s\S]*?)\*\*/g, "$1") // **negrito**
    .replace(/__([\s\S]*?)__/g, "$1") // __negrito__
    .replace(/`([^`]*)`/g, "$1") // `codigo`
    .replace(/^#{1,6}\s+/gm, "") // titulos ###
    .replace(/^\s*[-*•]\s+/gm, "") // marcadores de lista
    .replace(/\*/g, "") // qualquer asterisco restante
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function gerarResposta(
  promptSistema: string,
  mensagens: MensagemChat[],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY nao configurada no .env");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: promptSistema }] },
    contents: mensagens.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
      // Desliga o "raciocinio" do modelo para evitar vazamento de texto
      // interno na resposta (ex: analises em ingles no meio do atendimento).
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Gemini erro ${resp.status}: ${txt.slice(0, 300)}`);
  }

  const data = await resp.json();
  const texto =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";

  const limpo = limparFormatacao(texto);
  return limpo || "(sem resposta)";
}
