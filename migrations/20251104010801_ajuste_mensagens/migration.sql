/*
  Warnings:

  - You are about to drop the column `adminId` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `adocaoId` on the `mensagens` table. All the data in the column will be lost.
  - You are about to drop the column `adotanteId` on the `mensagens` table. All the data in the column will be lost.
  - Added the required column `destinatarioId` to the `mensagens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remetenteId` to the `mensagens` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "mensagens" DROP CONSTRAINT "mensagens_adminId_fkey";

-- DropForeignKey
ALTER TABLE "mensagens" DROP CONSTRAINT "mensagens_adocaoId_fkey";

-- DropForeignKey
ALTER TABLE "mensagens" DROP CONSTRAINT "mensagens_adotanteId_fkey";

-- AlterTable
ALTER TABLE "mensagens" DROP COLUMN "adminId",
DROP COLUMN "adocaoId",
DROP COLUMN "adotanteId",
ADD COLUMN     "destinatarioId" TEXT NOT NULL,
ADD COLUMN     "lida" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "remetenteId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_remetenteId_fkey" FOREIGN KEY ("remetenteId") REFERENCES "adotantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "adotantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
