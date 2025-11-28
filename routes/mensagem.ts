import { PrismaClient } from '@prisma/client';
import { Router } from "express";
// import { verificaToken } from "../middewares/verificaToken"; // Removido para teste

const prisma = new PrismaClient();
const router = Router();


const USER_ID_TESTE = "32697fec-8100-47ef-9e6e-6aa77f7f6f08"; 


router.get("/chats", async (req, res) => {

  const userId = String(req.query.userId || USER_ID_TESTE);

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


router.get("/chat/:chatId", async (req, res) => {
    const { chatId } = req.params;

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

      
        if (chat.participante1Id !== userId && chat.participante2Id !== userId) {
           
             console.log(`AVISO: Usuário ${userId} tentando acessar chat que não pertence a ele.`);
        }

        res.status(200).json(chat);
    } catch (error) {
        console.error("Erro ao buscar chat:", error);
        res.status(500).json({ erro: "Erro ao buscar chat." });
    }
});
// ----------------------------------------------------------------------------



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



router.post("/", async (req: any, res) => {
  try {
    
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



router.patch("/chat/:chatId/lida", async (req: any, res) => {
  
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


router.delete("/chat/:chatId", verificaToken, async (req: any, res) => {
  const { chatId } = req.params;
  const userId = req.userLogadoId;

  try {
    
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) return res.status(404).json({ erro: "Chat não encontrado." });

    if (chat.participante1Id !== String(userId) && chat.participante2Id !== String(userId)) {
      return res.status(403).json({ erro: "Sem permissão para deletar este chat." });
    }

    // 2. Transação: Deleta as mensagens primeiro, depois o chat
    await prisma.$transaction([
      prisma.mensagem.deleteMany({
        where: { chatId: chatId },
      }),
      prisma.chat.delete({
        where: { id: chatId },
      }),
    ]);

    res.status(200).json({ mensagem: "Chat e mensagens excluídos com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao deletar chat." });
  }
});

router.get("/nao-lidas", async (req: any, res) => {
 
  const userId = String(req.query.userId || USER_ID_TESTE);

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
