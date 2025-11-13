-- DropForeignKey
ALTER TABLE "adocoes" DROP CONSTRAINT "adocoes_pedidoId_fkey";

-- AlterTable
ALTER TABLE "adocoes" ALTER COLUMN "pedidoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "adocoes" ADD CONSTRAINT "adocoes_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
