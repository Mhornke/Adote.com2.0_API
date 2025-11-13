/*
  Warnings:

  - Added the required column `animalId` to the `adocoes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "adocoes" ADD COLUMN     "animalId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "adocoes" ADD CONSTRAINT "adocoes_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
