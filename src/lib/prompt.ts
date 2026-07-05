import type {
  Empresa,
  Servico,
  Promocao,
  Objecao,
  FaqItem,
  RecursoFechamento,
} from "@prisma/client";

export type EmpresaComFicha = Empresa & {
  servicos?: Servico[];
  promocoes?: Promocao[];
  objecoes?: Objecao[];
  faqs?: FaqItem[];
  recursos?: RecursoFechamento[];
};

type Horarios = { dias?: string[]; abre?: string; fecha?: string } | null;

const DIAS_LABEL: Record<string, string> = {
  seg: "Segunda",
  ter: "Terca",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sabado",
  dom: "Domingo",
};

function formatarHorarios(h: Horarios): string | null {
  if (!h || !h.dias || h.dias.length === 0) return null;
  const dias = h.dias.map((d) => DIAS_LABEL[d] ?? d).join(", ");
  if (h.abre && h.fecha) return `${dias}, das ${h.abre} as ${h.fecha}`;
  return dias;
}

// Monta o prompt de sistema a partir da ficha da empresa.
// Regra de ouro: separar CONTEXTO (o que a empresa e) da TAREFA (objetivo do bot).
export function montarPromptSistema(e: EmpresaComFicha): string {
  const linhas: string[] = [];

  linhas.push(
    `Voce e um assistente de atendimento e vendas no WhatsApp da empresa "${e.nome}".`,
  );

  // TAREFA (o mais importante — fica no topo)
  if (e.objetivo) {
    linhas.push(
      `\n## SEU OBJETIVO PRINCIPAL (a sua missao nesta conversa)\n${e.objetivo}\nConduza toda a conversa, de forma natural, em direcao a esse objetivo.`,
    );
  }

  // CONTEXTO
  linhas.push("\n## SOBRE A EMPRESA (contexto)");
  if (e.descricao) linhas.push(e.descricao);
  const horarioTxt = formatarHorarios(e.horarios as Horarios);
  if (horarioTxt) linhas.push(`Horario de funcionamento: ${horarioTxt}.`);
  if (e.endereco) linhas.push(`Endereco: ${e.endereco}.`);
  if (e.pagamentos && e.pagamentos.length > 0) {
    linhas.push(`Formas de pagamento: ${e.pagamentos.join(", ")}.`);
  }
  if (e.parcelamento) linhas.push(`Parcelamento: ${e.parcelamento}.`);

  // PERSONALIDADE
  if (e.personalidade) {
    linhas.push(
      `\n## COMO VOCE DEVE FALAR (personalidade e tecnicas de venda)\n${e.personalidade}`,
    );
  }

  // SERVICOS / PRECOS
  if (e.servicos && e.servicos.length > 0) {
    linhas.push("\n## SERVICOS E PRECOS");
    for (const s of e.servicos) {
      const partes = [s.nome];
      if (s.preco) partes.push(`preco: ${s.preco}`);
      if (s.duracao) partes.push(`duracao: ${s.duracao}`);
      let linha = `- ${partes.join(" | ")}`;
      if (s.descricao) linha += `\n  ${s.descricao}`;
      linhas.push(linha);
    }
  }

  // PROMOCOES
  const promos = (e.promocoes ?? []).filter((p) => p.ativa);
  if (promos.length > 0) {
    linhas.push("\n## PROMOCOES ATIVAS");
    for (const p of promos) {
      let linha = `- ${p.titulo}`;
      if (p.descricao) linha += `: ${p.descricao}`;
      if (p.condicoes) linha += ` (condicoes: ${p.condicoes})`;
      linhas.push(linha);
    }
  }

  // OBJECOES
  if (e.objecoes && e.objecoes.length > 0) {
    linhas.push(
      "\n## COMO CONTORNAR OBJECOES (use estas respostas quando o cliente disser algo parecido)",
    );
    for (const o of e.objecoes) {
      linhas.push(`- Se disser algo como "${o.gatilho}": ${o.resposta}`);
    }
  }

  // FAQ
  if (e.faqs && e.faqs.length > 0) {
    linhas.push("\n## PERGUNTAS FREQUENTES");
    for (const f of e.faqs) {
      linhas.push(`- P: ${f.pergunta}\n  R: ${f.resposta}`);
    }
  }

  // RECURSOS DE FECHAMENTO
  if (e.recursos && e.recursos.length > 0) {
    linhas.push(
      "\n## RECURSOS DE FECHAMENTO (compartilhe no momento certo para fechar)",
    );
    for (const r of e.recursos) {
      const alvo = r.url ?? r.arquivoPath ?? "(anexo)";
      let linha = `- ${r.titulo}: ${alvo}`;
      if (r.quandoUsar) linha += ` — usar quando: ${r.quandoUsar}`;
      linhas.push(linha);
    }
  }

  // HANDOFF
  if (e.handoffRegra) {
    linhas.push(
      `\n## QUANDO CHAMAR UM HUMANO\n${e.handoffRegra}\nNesses casos, diga que vai chamar um atendente e pare de tentar resolver sozinho.`,
    );
  }

  // POSTURA CONSULTIVA (cross-sell inteligente)
  linhas.push(
    `\n## POSTURA CONSULTIVA (essencial)
- Aja como um consultor, nao como um tirador de pedidos. Seu papel e resolver o problema REAL do cliente, nao apenas responder ao pe da letra.
- Entenda o OBJETIVO por tras do pedido. Ex: se o cliente diz que quer "mais reconhecimento de marca", isso e um objetivo amplo, maior que uma unica rede social.
- Voce conhece TODOS os servicos listados acima. Quando fizer sentido para o objetivo do cliente, sugira PROATIVAMENTE outros servicos que agregam valor, explicando de forma breve por que ajudam.
- Combine servicos quando fizer sentido (ex: para crescer a marca, pode valer redes sociais + site + landing page + trafego pago).
- Nunca fique preso apenas ao primeiro servico citado. Leia o momento da conversa e recomende o melhor caminho para o cliente atingir o objetivo dele.`,
  );

  // GUARDRAILS + HUMANIZACAO
  linhas.push(
    `\n## REGRAS IMPORTANTES
- NUNCA invente precos, prazos, promocoes ou informacoes que nao estejam acima. Se nao souber, diga que vai verificar.
- Nao prometa nada que nao esteja na ficha.
- Escreva como humano no WhatsApp: mensagens curtas e naturais, no maximo 2-3 frases por vez. Evite textao.
- Seja caloroso e use o tom definido na personalidade.
- Foque sempre, com sutileza, em avancar rumo ao seu objetivo principal.
- SAIBA A HORA DE PARAR: quando o objetivo for alcancado (o cliente agendou, confirmou ou fechou), confirme de forma calorosa, agradeca e ENCERRE. Nao continue vendendo, nao insista e nao faca novas perguntas de venda depois disso.
- ESCREVA EM TEXTO PURO. NUNCA use asteriscos (*), hashtags (#), underlines (_), negrito, italico, markdown nem marcadores de lista. Nada de destacar nomes de servicos ou palavras com simbolos.
- Nao faca listas com bullets. Se precisar citar varios itens, escreva em frase corrida, separando por virgulas e "e".`,
  );

  return linhas.join("\n");
}
