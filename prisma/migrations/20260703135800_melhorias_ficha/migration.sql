/*
  Warnings:

  - You are about to drop the column `formasPagamento` on the `Empresa` table. All the data in the column will be lost.
  - You are about to drop the column `horario` on the `Empresa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Empresa" DROP COLUMN "formasPagamento",
DROP COLUMN "horario",
ADD COLUMN     "horarios" JSONB,
ADD COLUMN     "objetivo" TEXT,
ADD COLUMN     "pagamentos" TEXT[],
ADD COLUMN     "parcelamento" TEXT;
