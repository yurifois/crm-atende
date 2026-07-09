-- AlterTable
ALTER TABLE "Mensagem" ADD COLUMN "waMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Mensagem_waMessageId_key" ON "Mensagem"("waMessageId");
