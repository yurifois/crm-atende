-- AlterTable
ALTER TABLE "Mensagem" ADD COLUMN "enviadoIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
