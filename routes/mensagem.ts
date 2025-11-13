// src/routes/mensagem.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// ✅ GET /mensagem/:adotanteId1/:adotanteId2
// Lista todas as mensagens trocadas entre dois adotantes
router.get("/:adotanteId1/:adotanteId2", verificaToken, async (req, res) => {
  const { adotanteId1, adotanteId2 } = req.params;

  try {
    const mensagens = await prisma.mensagem.findMany({
      where: {
        OR: [
          { remetenteId: adotanteId1, destinatarioId: adotanteId2 },
          { remetenteId: adotanteId2, destinatarioId: adotanteId1 },
        ],
      },
      orderBy: { dataEnvio: "asc" },
      include: {
        remetente: true,
        destinatario: true,
      },
    });

    res.status(200).json(mensagens);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao buscar mensagens", detalhes: error });
  }
});

// ✅ POST /mensagem
// Cria uma nova mensagem entre adotantes
router.post("/", verificaToken, async (req, res) => {
  try {
    const { conteudo, remetenteId, destinatarioId } = req.body;

    if (!conteudo || !remetenteId || !destinatarioId) {
      return res
        .status(400)
        .json({ erro: "Informe o conteúdo, remetenteId e destinatarioId." });
    }

    const mensagem = await prisma.mensagem.create({
      data: {
        conteudo,
        dataEnvio: new Date(),
        remetenteId,
        destinatarioId,
      },
      include: {
        remetente: true,
        destinatario: true,
      },
    });

    res.status(201).json(mensagem);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao criar mensagem", detalhes: error });
  }
});

// ✅ PATCH /mensagem/:id/lida
// Marca uma mensagem como lida
router.patch("/:id/lida", verificaToken, async (req, res) => {
  const { id } = req.params;

  try {
    const mensagem = await prisma.mensagem.update({
      where: { id: Number(id) },
      data: { lida: true },
    });

    res.status(200).json(mensagem);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao marcar como lida", detalhes: error });
  }
});

export default router;
