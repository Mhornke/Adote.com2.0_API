-- CreateEnum
CREATE TYPE "Portes" AS ENUM ('Pequeno', 'Medio', 'Grande');

-- CreateEnum
CREATE TYPE "Sexos" AS ENUM ('Macho', 'Femea');

-- CreateEnum
CREATE TYPE "StatusAdocao" AS ENUM ('Ativa', 'Concluida', 'Cancelada');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('master', 'admin', 'veterinario');

-- CreateTable
CREATE TABLE "especies" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "especies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animais" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "idade" INTEGER NOT NULL,
    "sexo" "Sexos" NOT NULL,
    "destaque" BOOLEAN NOT NULL DEFAULT true,
    "foto" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "porte" "Portes" NOT NULL DEFAULT 'Medio',
    "especieId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "animais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "codigoFoto" TEXT NOT NULL,
    "animalId" INTEGER NOT NULL,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adotantes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "fone" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "recoveryCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adotantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "adotanteId" TEXT NOT NULL,
    "animalId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "resposta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adocoes" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "adotanteId" TEXT NOT NULL,
    "dataAdocao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusAdocao" NOT NULL DEFAULT 'Ativa',

    CONSTRAINT "adocoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acompanhamentos" (
    "id" SERIAL NOT NULL,
    "adocaoId" INTEGER NOT NULL,
    "dataVisita" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "proximaVisita" TIMESTAMP(3),
    "usuarioId" INTEGER,

    CONSTRAINT "acompanhamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacinas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "fabricante" TEXT,
    "lote" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "validade" TIMESTAMP(3),

    CONSTRAINT "vacinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacinas_aplicadas" (
    "id" SERIAL NOT NULL,
    "vacinaId" INTEGER NOT NULL,
    "animalId" INTEGER NOT NULL,
    "acompanhamentoId" INTEGER,
    "dataAplicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aplicadoPor" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "vacinas_aplicadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "adotantes_email_key" ON "adotantes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "adocoes_pedidoId_key" ON "adocoes"("pedidoId");

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_especieId_fkey" FOREIGN KEY ("especieId") REFERENCES "especies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_adotanteId_fkey" FOREIGN KEY ("adotanteId") REFERENCES "adotantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adocoes" ADD CONSTRAINT "adocoes_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adocoes" ADD CONSTRAINT "adocoes_adotanteId_fkey" FOREIGN KEY ("adotanteId") REFERENCES "adotantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos" ADD CONSTRAINT "acompanhamentos_adocaoId_fkey" FOREIGN KEY ("adocaoId") REFERENCES "adocoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos" ADD CONSTRAINT "acompanhamentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacinas_aplicadas" ADD CONSTRAINT "vacinas_aplicadas_vacinaId_fkey" FOREIGN KEY ("vacinaId") REFERENCES "vacinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacinas_aplicadas" ADD CONSTRAINT "vacinas_aplicadas_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacinas_aplicadas" ADD CONSTRAINT "vacinas_aplicadas_acompanhamentoId_fkey" FOREIGN KEY ("acompanhamentoId") REFERENCES "acompanhamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
