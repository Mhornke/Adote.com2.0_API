/*
  Warnings:

  - You are about to drop the column `destaque` on the `animais` table. All the data in the column will be lost.
  - You are about to drop the column `foto` on the `animais` table. All the data in the column will be lost.
  - You are about to drop the column `vacinaId` on the `vacinas_aplicadas` table. All the data in the column will be lost.
  - You are about to drop the `vacinas` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `nome` to the `vacinas_aplicadas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "fotos" DROP CONSTRAINT "fotos_animalId_fkey";

-- DropForeignKey
ALTER TABLE "vacinas_aplicadas" DROP CONSTRAINT "vacinas_aplicadas_vacinaId_fkey";

-- AlterTable
ALTER TABLE "animais" DROP COLUMN "destaque",
DROP COLUMN "foto",
ADD COLUMN     "castracao" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "fotos" ADD COLUMN     "animalPerdidoId" INTEGER,
ALTER COLUMN "animalId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "vacinas_aplicadas" DROP COLUMN "vacinaId",
ADD COLUMN     "nome" TEXT NOT NULL;

-- DropTable
DROP TABLE "vacinas";

-- CreateTable
CREATE TABLE "animais_perdidos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "encontrado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animais_perdidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts_comunidade" (
    "id" SERIAL NOT NULL,
    "texto" TEXT NOT NULL,
    "curtida" INTEGER NOT NULL,
    "adotanteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posts_comunidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" SERIAL NOT NULL,
    "texto" TEXT NOT NULL,
    "curtida" INTEGER NOT NULL,
    "adotanteId" TEXT NOT NULL,
    "postComunidadeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" SERIAL NOT NULL,
    "conteudo" TEXT NOT NULL,
    "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adotanteId" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    "adocaoId" INTEGER NOT NULL,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_animalPerdidoId_fkey" FOREIGN KEY ("animalPerdidoId") REFERENCES "animais_perdidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts_comunidade" ADD CONSTRAINT "posts_comunidade_adotanteId_fkey" FOREIGN KEY ("adotanteId") REFERENCES "adotantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_adotanteId_fkey" FOREIGN KEY ("adotanteId") REFERENCES "adotantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_postComunidadeId_fkey" FOREIGN KEY ("postComunidadeId") REFERENCES "posts_comunidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_adotanteId_fkey" FOREIGN KEY ("adotanteId") REFERENCES "adotantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_adocaoId_fkey" FOREIGN KEY ("adocaoId") REFERENCES "adocoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
