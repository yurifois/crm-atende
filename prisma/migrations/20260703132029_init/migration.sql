-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('LINK_PAGAMENTO', 'LINK_AGENDAMENTO', 'ARQUIVO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusNumero" AS ENUM ('CRIADO', 'CONECTANDO', 'CONECTADO', 'DESCONECTADO');

-- CreateEnum
CREATE TYPE "PapelMensagem" AS ENUM ('USUARIO', 'ASSISTENTE', 'SISTEMA');

-- CreateEnum
CREATE TYPE "StatusLead" AS ENUM ('NOVO', 'QUALIFICADO', 'QUENTE', 'FECHADO', 'PERDIDO');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "personalidade" TEXT,
    "horario" TEXT,
    "endereco" TEXT,
    "formasPagamento" TEXT,
    "handoffRegra" TEXT,
    "notificacaoDestino" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" TEXT,
    "duracao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promocao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "condicoes" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Promocao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objecao" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "gatilho" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,

    CONSTRAINT "Objecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "pergunta" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecursoFechamento" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TipoRecurso" NOT NULL,
    "titulo" TEXT NOT NULL,
    "url" TEXT,
    "arquivoPath" TEXT,
    "quandoUsar" TEXT,

    CONSTRAINT "RecursoFechamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Numero" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "instanceToken" TEXT,
    "telefone" TEXT,
    "status" "StatusNumero" NOT NULL DEFAULT 'CRIADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Numero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contato" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "nome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" TEXT NOT NULL,
    "contatoId" TEXT NOT NULL,
    "papel" "PapelMensagem" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "contatoId" TEXT,
    "nome" TEXT,
    "interesse" TEXT,
    "status" "StatusLead" NOT NULL DEFAULT 'NOVO',
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Servico_empresaId_idx" ON "Servico"("empresaId");

-- CreateIndex
CREATE INDEX "Promocao_empresaId_idx" ON "Promocao"("empresaId");

-- CreateIndex
CREATE INDEX "Objecao_empresaId_idx" ON "Objecao"("empresaId");

-- CreateIndex
CREATE INDEX "FaqItem_empresaId_idx" ON "FaqItem"("empresaId");

-- CreateIndex
CREATE INDEX "RecursoFechamento_empresaId_idx" ON "RecursoFechamento"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Numero_instanceName_key" ON "Numero"("instanceName");

-- CreateIndex
CREATE INDEX "Numero_empresaId_idx" ON "Numero"("empresaId");

-- CreateIndex
CREATE INDEX "Contato_empresaId_idx" ON "Contato"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Contato_empresaId_telefone_key" ON "Contato"("empresaId", "telefone");

-- CreateIndex
CREATE INDEX "Mensagem_contatoId_idx" ON "Mensagem"("contatoId");

-- CreateIndex
CREATE INDEX "Lead_empresaId_idx" ON "Lead"("empresaId");

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promocao" ADD CONSTRAINT "Promocao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objecao" ADD CONSTRAINT "Objecao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaqItem" ADD CONSTRAINT "FaqItem_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecursoFechamento" ADD CONSTRAINT "RecursoFechamento_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Numero" ADD CONSTRAINT "Numero_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contato" ADD CONSTRAINT "Contato_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_contatoId_fkey" FOREIGN KEY ("contatoId") REFERENCES "Contato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contatoId_fkey" FOREIGN KEY ("contatoId") REFERENCES "Contato"("id") ON DELETE SET NULL ON UPDATE CASCADE;
