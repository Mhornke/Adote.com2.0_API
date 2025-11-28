import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

/**
 * 📌 GET /mensagem/chats
 * Lista os chats onde o usuário participa
 */
router.get("/chats", verificaToken, async (req: any, res) => {
  const userId = String(req.userLogadoId);

  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { participante1Id: userId },
          { participante2Id: userId },
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        mensagens: {
          orderBy: { dataEnvio: "asc" },
        },
        animal: true,
      },
    });

    return res.status(200).json(chats);
  } catch (error) {
    console.error("Erro ao listar chats:", error);
    return res.status(500).json({ erro: "Erro ao listar chats." });
  }
});

/**
 * 📌 GET /mensagem/chat/:chatId
 * Retorna todas as mensagens de um chat específico
 */
router.get("/chat/:chatId", verificaToken, async (req: any, res) => {
  const { chatId } = req.params;
  const userId = String(req.userLogadoId);

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        mensagens: {
          orderBy: { dataEnvio: "asc" },
        },
        animal: true,
      },
    });

    if (!chat) {
      return res.status(404).json({ erro: "Chat não encontrado." });
    }

    if (chat.participante1Id !== userId && chat.participante2Id !== userId) {
      return res.status(403).json({ erro: "Sem permissão para acessar este chat." });
    }

    return res.status(200).json(chat);
  } catch (error) {
    console.error("Erro ao buscar chat:", error);
    return res.status(500).json({ erro: "Erro ao buscar chat." });
  }
});

/**
 * 📌 POST /mensagem
 * Envia mensagem dentro de um chat
 */
router.post("/", verificaToken, async (req: any, res) => {
  try {
    const remetenteId = String(req.userLogadoId);
    const { animalId, destinatarioId, conteudo } = req.body;

    if (!conteudo || !animalId || !destinatarioId || !remetenteId) {
      return res.status(400).json({
        erro: "Informe remetenteId, animalId, destinatarioId e conteudo.",
      });
    }

    if (remetenteId === destinatarioId) {
      return res
        .status(400)
        .json({ erro: "Não é possível iniciar um chat consigo mesmo." });
    }

    // Procura chat existente
    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { participante1Id: remetenteId, participante2Id: destinatarioId },
          { participante1Id: destinatarioId, participante2Id: remetenteId },
        ],
      },
    });

    // Se não existir, cria
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          participante1Id: remetenteId,
          participante2Id: destinatarioId,
          animalId,
        },
      });
    }

const mensagem = await prisma.mensagem.create({
  data: {
    conteudo,
    remetenteId,
    destinatarioId,
    animalId, 
    chatId: chat.id,
  },
});


    return res.status(201).json(mensagem);
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return res.status(500).json({ erro: "Erro ao enviar mensagem." });
  }
});

/**
 * 📌 PATCH /mensagem/chat/:chatId/lida
 * Marca TODAS as mensagens como lidas
 */
router.patch("/chat/:chatId/lida", verificaToken, async (req: any, res) => {
  const { chatId } = req.params;
  const userId = String(req.userLogadoId);

  try {
    const result = await prisma.mensagem.updateMany({
      where: {
        chatId,
        destinatarioId: userId,
        lida: false,
      },
      data: { lida: true },
    });

    return res.status(200).json({
      mensagem: `${result.count} mensagens marcadas como lidas.`,
    });
  } catch (error) {
    console.error("Erro ao marcar como lido:", error);
    return res.status(500).json({ erro: "Erro ao marcar mensagens como lidas." });
  }
});

/**
 * 📌 GET /mensagem/nao-lidas
 * Retorna número total de mensagens não lidas
 */
router.get("/nao-lidas", verificaToken, async (req: any, res) => {
  const userId = String(req.userLogadoId);

  try {
    const count = await prisma.mensagem.count({
      where: {
        destinatarioId: userId,
        lida: false,
      },
    });

    return res.status(200).json({ totalNaoLidas: count });
  } catch (error) {
    console.error("Erro ao contar mensagens:", error);
    return res.status(500).json({ erro: "Erro ao contar mensagens não lidas." });
  }
});

/**
 * 📌 DELETE /mensagem/chat/:chatId
 * Deleta o chat e todas as mensagens
 */
router.delete("/chat/:chatId", verificaToken, async (req: any, res) => {
  const { chatId } = req.params;
  const userId = String(req.userLogadoId);

  try {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      return res.status(404).json({ erro: "Chat não encontrado." });
    }

    if (chat.participante1Id !== userId && chat.participante2Id !== userId) {
      return res
        .status(403)
        .json({ erro: "Sem permissão para deletar este chat." });
    }

    await prisma.$transaction([
      prisma.mensagem.deleteMany({ where: { chatId } }),
      prisma.chat.delete({ where: { id: chatId } }),
    ]);

    return res.status(200).json({
      mensagem: "Chat e mensagens excluídos com sucesso.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao deletar chat." });
  }
});

export default router;
