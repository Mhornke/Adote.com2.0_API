import { PrismaClient } from '@prisma/client';
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";
import { describe } from 'node:test';

const prisma = new PrismaClient();
const router = Router();

/**
 * 📌 GET /mensagem/chats
 * Lista os chats onde o usuário está participando
 */
router.get("/chats", verificaToken, async (req: any, res) => {
  const userId = String(req.userLogadoId);

  try {
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { participante1Id: userId },
          { participante2Id: userId },
         
        ]
      },
      orderBy: { updatedAt : "asc" },
      include: {
        animal: true,
        mensagens: {
          orderBy: { dataEnvio : "asc" }
        }
      }
    });

    res.status(200).json(chats);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao buscar chats" });
  }
});


/**
 * 📌 GET /mensagem/:chatId
 * Retorna todas as mensagens de um chat
 */
router.get("/:chatId", verificaToken, async (req, res) => {
  try {
    const { chatId } = req.params;

    const mensagens = await prisma.mensagem.findMany({
      where: { chatId },
      orderBy: { dataEnvio : "asc" }
    });

    return res.status(200).json(mensagens);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return res.status(500).json({ erro: "Erro ao buscar mensagens." });
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
    
    if (!conteudo || !animalId || !destinatarioId ) {
      return res
        .status(400)
        .json({ erro: "Informe chatId, destinatarioId e conteudo." });
    }

    let chat = await prisma.chat.findFirst ({
      where: {
        animalId,
        OR : [
          {participante1Id: remetenteId, participante2Id: destinatarioId},
          {participante1Id: destinatarioId, participante2Id: remetenteId}
        ]
      }
    })
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          animalId,
          participante1Id: remetenteId,
          participante2Id: destinatarioId
        }
      })
    }

    const mensagem = await prisma.mensagem.create({
      data: {
        conteudo,
        remetenteId,
        destinatarioId,
        animalId,
        chatId: chat.id
        
      },
    });

    res.status(201).json({mensagem, chat});
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao criar mensagem" });
  }
});


/**
 * 📌 PATCH /mensagem/chat/:chatId/lida
 * Marca TODAS as mensagens como lidas nesse chat
 */
router.patch("/chat/:chatId/lida", verificaToken, async (req: any, res) => {
  const userId = String(req.userLogadoId);
  const { chatId } = req.params;

  try {
    const result = await prisma.mensagem.updateMany({
      where: {
        chatId,
        destinatarioId: userId,
        lida: false
      },
      data: { lida: true },
    });

    res.status(200).json({ mensagensAtualizadas: result.count });
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao marcar como lida" });
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
        lida: false
      }
    });

    res.status(200).json({ naoLidas: count });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: "Erro ao buscar mensagens não lidas." });
  }
});

export default router;
