import { PrismaClient } from '@prisma/client';
import { Router } from "express";
// import { verificaToken } from "../middewares/verificaToken"; // Removido para teste

const prisma = new PrismaClient();
const router = Router();

// ID Fixo para testes (Simula o usuário logado)
// Você deve passar este ID via Body ou Query nas rotas que precisam.
// Vamos usar um ID de teste para fins didáticos.
const USER_ID_TESTE = "32697fec-8100-47ef-9e6e-6aa77f7f6f08"; 

/**
 * 📌 GET /mensagem/chats
 * Lista os chats onde o usuário está participando
 * Requer: ?userId=ID_DO_USUARIO_PARA_TESTE
 */
router.get("/chats", async (req, res) => {
  // SIMULAÇÃO: Pega o userId do query parameter para teste
  const userId = String(req.query.userId || USER_ID_TESTE); // Usamos o ID fixo se não for passado

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

// --- Nova Rota para buscar um CHAT específico (Para corrigir o front-end) ---
/**
 * 📌 GET /mensagem/chat/:chatId
 * Retorna o objeto Chat completo pelo ID.
 * Requer: ?userId=ID_DO_USUARIO_PARA_TESTE
 */
router.get("/chat/:chatId", async (req, res) => {
    const { chatId } = req.params;
    // SIMULAÇÃO: Pega o userId do query parameter para teste
    const userId = String(req.query.userId || USER_ID_TESTE); 

    try {
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                animal: true,
                mensagens: {
                    orderBy: { dataEnvio: "asc" }
                },
            }
        });

        if (!chat) {
            return res.status(404).json({ erro: "Chat não encontrado." });
        }

        // Validação de acesso (Mantida para fins de lógica, mas fraca sem token)
        if (chat.participante1Id !== userId && chat.participante2Id !== userId) {
             // Removido o 403 para não atrapalhar o debug, mas mantido o log
             console.log(`AVISO: Usuário ${userId} tentando acessar chat que não pertence a ele.`);
        }

        res.status(200).json(chat);
    } catch (error) {
        console.error("Erro ao buscar chat:", error);
        res.status(500).json({ erro: "Erro ao buscar chat." });
    }
});
// ----------------------------------------------------------------------------


/**
 * 📌 GET /mensagem/:chatId
 * Retorna todas as mensagens de um chat
 */
router.get("/:chatId", async (req, res) => {
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
 * Requer: remetenteId no body para teste
 */
router.post("/", async (req: any, res) => {
  try {
    // SIMULAÇÃO: remetenteId é passado no body, pois não há token
    const remetenteId = String(req.body.remetenteId || USER_ID_TESTE); 

    const { animalId, destinatarioId, conteudo } = req.body;
    
    if (!conteudo || !animalId || !destinatarioId || !remetenteId) { // Adiciona remetenteId à validação
      return res
        .status(400)
        .json({ erro: "Informe remetenteId, animalId, destinatarioId e conteudo." });
    }
    
    // Validação de segurança (evita self-chat)
    if (remetenteId === destinatarioId) {
        return res.status(400).json({ erro: "Não é possível iniciar um chat consigo mesmo." });
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
        remetenteId, // Usa o ID simulado
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
 * Requer: destinatarioId no body para teste
 */
router.patch("/chat/:chatId/lida", async (req: any, res) => {
  // SIMULAÇÃO: userId é o destinatario, passado no body
  const userId = String(req.body.userId || USER_ID_TESTE); 
  const { chatId } = req.params;

  try {
    const result = await prisma.mensagem.updateMany({
      where: {
        chatId,
        destinatarioId: userId, // Usa o ID simulado
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
 * Requer: ?userId=ID_DO_USUARIO_PARA_TESTE
 */
router.get("/nao-lidas", async (req: any, res) => {
  // SIMULAÇÃO: Pega o userId do query parameter para teste
  const userId = String(req.query.userId || USER_ID_TESTE);

  try {
    const count = await prisma.mensagem.count({
      where: {
        destinatarioId: userId, // Usa o ID simulado
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
