"use client";

import { useRef, useState } from "react";
import type {
  Empresa,
  Servico,
  Promocao,
  Objecao,
  FaqItem,
  RecursoFechamento,
  Numero,
} from "@prisma/client";
import ListaEditavel from "./ListaEditavel";
import GerenciadorNumeros from "./GerenciadorNumeros";

type Horarios = { dias?: string[]; abre?: string; fecha?: string } | null;

type Acao = (formData: FormData) => void;
type AcaoExcluir = (id: string) => void;
type AcaoEditar = (id: string, formData: FormData) => void;

type Props = {
  empresa: Empresa;
  servicos: Servico[];
  promocoes: Promocao[];
  objecoes: Objecao[];
  faqs: FaqItem[];
  recursos: RecursoFechamento[];
  numeros: Numero[];
  salvarPerfil: Acao;
  salvarComportamento: Acao;
  salvarRegras: Acao;
  addServico: Acao;
  delServico: AcaoExcluir;
  editServico: AcaoEditar;
  addPromocao: Acao;
  delPromocao: AcaoExcluir;
  editPromocao: AcaoEditar;
  addObjecao: Acao;
  delObjecao: AcaoExcluir;
  editObjecao: AcaoEditar;
  addFaq: Acao;
  delFaq: AcaoExcluir;
  editFaq: AcaoEditar;
  addRecurso: Acao;
  delRecurso: AcaoExcluir;
  editRecurso: AcaoEditar;
  addNumero: Acao;
  delNumero: AcaoExcluir;
};

const DIAS = [
  { v: "seg", l: "Seg" },
  { v: "ter", l: "Ter" },
  { v: "qua", l: "Qua" },
  { v: "qui", l: "Qui" },
  { v: "sex", l: "Sex" },
  { v: "sab", l: "Sab" },
  { v: "dom", l: "Dom" },
];
const OPCOES_PAGAMENTO = [
  "Pix",
  "Cartao de credito",
  "Cartao de debito",
  "Boleto",
  "Dinheiro",
];
const ABAS = [
  { id: "perfil", label: "Perfil da Empresa" },
  { id: "ia", label: "Comportamento da IA" },
  { id: "produtos", label: "Produtos & Precos" },
  { id: "regras", label: "Regras de Venda / Handoff" },
  { id: "whatsapp", label: "WhatsApp" },
] as const;

const TEMPLATE_OBJETIVO =
  "Fazer o cliente agendar um horario/avaliacao. Se ele hesitar, oferecer a primeira condicao especial e conduzir para a confirmacao do agendamento hoje.";
const TEMPLATE_PERSONALIDADE =
  "Consultivo e persuasivo, sem ser insistente. Faz perguntas fechadas para entender a necessidade e conduzir ao fechamento (ex: 'prefere de manha ou a tarde?'). Usa gatilhos de escassez e prova social com naturalidade. Tom caloroso, mensagens curtas, 1 emoji ocasional. Sempre termina com uma pergunta que avanca a venda.";

const inputCls =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1 block text-sm font-medium text-zinc-800">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </span>
  );
}
function Dica({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs text-zinc-500">{children}</span>;
}
function BotaoSalvar() {
  return (
    <button
      type="submit"
      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
    >
      Salvar secao
    </button>
  );
}

export default function EmpresaEditor(props: Props) {
  const { empresa } = props;
  const [aba, setAba] = useState<(typeof ABAS)[number]["id"]>("perfil");
  const objetivoRef = useRef<HTMLTextAreaElement>(null);
  const personalidadeRef = useRef<HTMLTextAreaElement>(null);

  const horarios = (empresa.horarios as Horarios) ?? null;
  const diasSel = horarios?.dias ?? [];
  const pagSel = empresa.pagamentos ?? [];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      {/* Abas */}
      <div className="mb-5 flex flex-wrap gap-1 border-b border-zinc-200">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium transition ${
              aba === a.id
                ? "border-b-2 border-emerald-600 text-emerald-700"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* -------- PERFIL -------- */}
      <form
        action={props.salvarPerfil}
        className={aba === "perfil" ? "space-y-5" : "hidden"}
      >
        <label className="block">
          <Label required>Nome da empresa</Label>
          <input
            name="nome"
            required
            defaultValue={empresa.nome}
            className={inputCls}
          />
        </label>
        <label className="block">
          <Label>O que a empresa faz (contexto)</Label>
          <Dica>
            O CONTEXTO — quem a empresa e. A tarefa do robo fica na aba
            &quot;Comportamento da IA&quot;.
          </Dica>
          <textarea
            name="descricao"
            rows={3}
            defaultValue={empresa.descricao ?? ""}
            className={inputCls}
          />
        </label>
        <div>
          <Label>Horario de funcionamento</Label>
          <Dica>Dado exato evita que o robo marque fora do horario.</Dica>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((d) => (
              <label
                key={d.v}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-sm has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
              >
                <input
                  type="checkbox"
                  name="dias"
                  value={d.v}
                  defaultChecked={diasSel.includes(d.v)}
                  className="accent-emerald-600"
                />
                {d.l}
              </label>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-zinc-500">das</span>
            <input
              type="time"
              name="abre"
              defaultValue={horarios?.abre ?? ""}
              className="rounded-md border border-zinc-300 px-2 py-1"
            />
            <span className="text-zinc-500">as</span>
            <input
              type="time"
              name="fecha"
              defaultValue={horarios?.fecha ?? ""}
              className="rounded-md border border-zinc-300 px-2 py-1"
            />
          </div>
        </div>
        <label className="block">
          <Label>Endereco</Label>
          <input
            name="endereco"
            defaultValue={empresa.endereco ?? ""}
            className={inputCls}
          />
        </label>
        <div>
          <Label>Formas de pagamento</Label>
          <div className="flex flex-wrap gap-2">
            {OPCOES_PAGAMENTO.map((p) => (
              <label
                key={p}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-sm has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
              >
                <input
                  type="checkbox"
                  name="pagamentos"
                  value={p}
                  defaultChecked={pagSel.includes(p)}
                  className="accent-emerald-600"
                />
                {p}
              </label>
            ))}
          </div>
          <input
            name="parcelamento"
            defaultValue={empresa.parcelamento ?? ""}
            placeholder="Condicoes de parcelamento (ex: ate 3x sem juros)"
            className={`${inputCls} mt-2`}
          />
        </div>
        <BotaoSalvar />
      </form>

      {/* -------- COMPORTAMENTO IA -------- */}
      <form
        action={props.salvarComportamento}
        className={aba === "ia" ? "space-y-5" : "hidden"}
      >
        <label className="block">
          <div className="flex items-center justify-between">
            <Label required>Objetivo principal do assistente</Label>
            <button
              type="button"
              onClick={() => {
                if (objetivoRef.current)
                  objetivoRef.current.value = TEMPLATE_OBJETIVO;
              }}
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Preencher com modelo
            </button>
          </div>
          <Dica>
            A TAREFA do robo. Ex: &quot;fazer o cliente agendar&quot;,
            &quot;vender o produto X&quot;. Mantem o bot focado em fechar.
          </Dica>
          <textarea
            ref={objetivoRef}
            name="objetivo"
            required
            rows={3}
            defaultValue={empresa.objetivo ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <div className="flex items-center justify-between">
            <Label>Personalidade e tecnicas de venda</Label>
            <button
              type="button"
              onClick={() => {
                if (personalidadeRef.current)
                  personalidadeRef.current.value = TEMPLATE_PERSONALIDADE;
              }}
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              Preencher com modelo de alta conversao
            </button>
          </div>
          <Dica>
            Defina se sera persuasivo, se usara gatilhos mentais e se fara
            perguntas fechadas para conduzir ao fechamento.
          </Dica>
          <textarea
            ref={personalidadeRef}
            name="personalidade"
            rows={4}
            defaultValue={empresa.personalidade ?? ""}
            className={inputCls}
          />
        </label>
        <BotaoSalvar />
      </form>

      {/* -------- PRODUTOS -------- */}
      <div className={aba === "produtos" ? "space-y-4" : "hidden"}>
        <ListaEditavel
          titulo="Servicos & precos"
          descricao="O que a empresa vende. O robo usa isso para apresentar e cotar."
          itens={props.servicos.map((s) => ({
            id: s.id,
            principal: s.nome,
            secundario: [s.preco, s.duracao].filter(Boolean).join(" · ") || null,
            extra: s.descricao,
            valores: {
              nome: s.nome,
              preco: s.preco ?? "",
              duracao: s.duracao ?? "",
              descricao: s.descricao ?? "",
            },
          }))}
          campos={[
            { name: "nome", label: "Nome do servico", required: true },
            { name: "preco", label: "Preco (ex: R$60)" },
            { name: "duracao", label: "Duracao (ex: 45min)" },
            { name: "descricao", label: "Descricao / diferencial", textarea: true },
          ]}
          adicionar={props.addServico}
          excluir={props.delServico}
          editar={props.editServico}
          addLabel="Adicionar servico"
        />
        <ListaEditavel
          titulo="Promocoes"
          descricao="Ofertas que o robo pode usar para incentivar o fechamento."
          itens={props.promocoes.map((p) => ({
            id: p.id,
            principal: p.titulo,
            secundario: null,
            extra: [p.descricao, p.condicoes].filter(Boolean).join(" — ") || null,
            valores: {
              titulo: p.titulo,
              condicoes: p.condicoes ?? "",
              descricao: p.descricao ?? "",
            },
          }))}
          campos={[
            { name: "titulo", label: "Titulo da promocao", required: true },
            { name: "condicoes", label: "Condicoes (ex: so na terca)" },
            { name: "descricao", label: "Descricao", textarea: true },
          ]}
          adicionar={props.addPromocao}
          excluir={props.delPromocao}
          editar={props.editPromocao}
          addLabel="Adicionar promocao"
        />
      </div>

      {/* -------- REGRAS -------- */}
      <div className={aba === "regras" ? "space-y-4" : "hidden"}>
        <form
          action={props.salvarRegras}
          className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5"
        >
          <label className="block">
            <Label>Regra de handoff (quando avisar um humano)</Label>
            <Dica>Situacoes em que o robo deve parar e chamar uma pessoa.</Dica>
            <textarea
              name="handoffRegra"
              rows={2}
              defaultValue={empresa.handoffRegra ?? ""}
              placeholder="Ex: reclamacao grave, ou pedido acima de R$500."
              className={inputCls}
            />
          </label>
          <label className="block">
            <Label>Onde notificar o handoff</Label>
            <input
              name="notificacaoDestino"
              defaultValue={empresa.notificacaoDestino ?? ""}
              placeholder="Ex: 5561999998888 ou voce@email.com"
              className={inputCls}
            />
          </label>
          <BotaoSalvar />
        </form>

        <ListaEditavel
          titulo="Objecoes"
          descricao="Se o cliente disser o gatilho, o robo responde com a resposta cadastrada."
          itens={props.objecoes.map((o) => ({
            id: o.id,
            principal: `"${o.gatilho}"`,
            secundario: null,
            extra: o.resposta,
            valores: { gatilho: o.gatilho, resposta: o.resposta },
          }))}
          campos={[
            { name: "gatilho", label: "Gatilho (ex: ta caro)", required: true },
            { name: "resposta", label: "Resposta do robo", textarea: true, required: true },
          ]}
          adicionar={props.addObjecao}
          excluir={props.delObjecao}
          editar={props.editObjecao}
          addLabel="Adicionar objecao"
        />

        <ListaEditavel
          titulo="Perguntas frequentes"
          itens={props.faqs.map((f) => ({
            id: f.id,
            principal: f.pergunta,
            secundario: null,
            extra: f.resposta,
            valores: { pergunta: f.pergunta, resposta: f.resposta },
          }))}
          campos={[
            { name: "pergunta", label: "Pergunta", required: true },
            { name: "resposta", label: "Resposta", textarea: true, required: true },
          ]}
          adicionar={props.addFaq}
          excluir={props.delFaq}
          editar={props.editFaq}
          addLabel="Adicionar FAQ"
        />

        <ListaEditavel
          titulo="Recursos de fechamento"
          descricao="Links que o robo envia na hora de fechar (pagamento, agendamento, materiais)."
          itens={props.recursos.map((r) => ({
            id: r.id,
            principal: r.titulo,
            secundario: r.tipo,
            extra: [r.url, r.quandoUsar && `usar quando: ${r.quandoUsar}`]
              .filter(Boolean)
              .join(" — ") || null,
            valores: {
              titulo: r.titulo,
              tipo: r.tipo,
              url: r.url ?? "",
              quandoUsar: r.quandoUsar ?? "",
            },
          }))}
          campos={[
            { name: "titulo", label: "Titulo (ex: Link de pagamento)", required: true },
            {
              name: "tipo",
              label: "Tipo",
              type: "select",
              required: true,
              options: [
                "LINK_PAGAMENTO",
                "LINK_AGENDAMENTO",
                "ARQUIVO",
                "OUTRO",
              ],
            },
            { name: "url", label: "URL / link" },
            { name: "quandoUsar", label: "Quando usar", textarea: true },
          ]}
          adicionar={props.addRecurso}
          excluir={props.delRecurso}
          editar={props.editRecurso}
          addLabel="Adicionar recurso"
        />
      </div>

      {/* -------- WHATSAPP -------- */}
      <div className={aba === "whatsapp" ? "" : "hidden"}>
        <GerenciadorNumeros
          numeros={props.numeros}
          criarNumero={props.addNumero}
          excluirNumero={props.delNumero}
        />
      </div>
    </div>
  );
}
