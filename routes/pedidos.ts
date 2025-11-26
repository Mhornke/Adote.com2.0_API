import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import nodemailer from "nodemailer";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// Função para enviar e-mail
async function enviaEmail(nome: string, email: string, descricao: string, resposta: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: "7ded87001@smtp-brevo.com",
      pass: "H8ryhM4gntx7BdsG",
    },
  });

  await transporter.sendMail({
    from: 'dieizonos@gmail.com',
    to: email,
    subject: "Re: Pedido de adoção",
    text: resposta,
    html: `<h3>Estimado Adotante ${nome}</h3>
           <h3>Pedido: ${descricao}</h3>
           <p>${resposta}</p>`
  });
}

// Criar pedido e enviar e-mail de confirmação automática
router.post("/", async (req, res) => {
  const { adotanteId, animalId, descricao } = req.body;
  if (!adotanteId || !animalId || !descricao)
    return res.status(400).json({ erro: "Informe adotanteId, animalId e descrição!" });

  try {
    const pedido = await prisma.pedido.create({
      data: { adotanteId, animalId, descricao },
      include: {
        // 🔒 SEGURANÇA: Usamos 'select' para não trazer a senha
        adotante: {
          select: {
            id: true,
            nome: true,
            email: true,
            fone: true
          }
        },
        animal: {
          include: { especie: true, fotos: true }
        }
      }
    });

    // O TypeScript agora sabe que pedido.adotante tem 'nome' e 'email'
    await enviaEmail(
      pedido.adotante.nome,
      pedido.adotante.email,
      descricao,
      "Recebemos seu pedido de adoção. Em breve você receberá a análise do nosso time."
    );

    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Verificar se usuário já enviou pedido para um animal específico
router.get("/verificar", async (req, res) => {
  const { adotanteId, animalId } = req.query;

  if (!adotanteId || !animalId) {
    return res.status(400).json({ erro: "Informe adotanteId e animalId" });
  }

  try {
    const pedidoExistente = await prisma.pedido.findFirst({
      where: {
        adotanteId: String(adotanteId),
        animalId: Number(animalId)
      }
    });

    res.status(200).json({ 
      jaEnviado: !!pedidoExistente,
      pedido: pedidoExistente 
    });

  } catch (error) {
    res.status(500).json({ erro: "Erro ao verificar status do pedido", detalhes: error });
  }
});


router.patch("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  const { resposta, aprovado, usuarioId } = req.body;

  if (!resposta) return res.status(400).json({ erro: "Informe a resposta deste pedido." });

  try {
    
    await prisma.pedido.update({
      where: { id: Number(id) },
      data: { resposta }
    });

    
    const dados = await prisma.pedido.findUnique({
      where: { id: Number(id) },
      include: {        
        adotante: {
          select: {
            id: true,
            nome: true,
            email: true,
            fone: true
          }
        },
        animal: { include: { especie: true, fotos: true } }
      }
    });

    if (!dados) return res.status(404).json({ erro: "Pedido não encontrado" });

    const mensagem = aprovado 
      ? `Parabéns! Seu pedido foi aprovado. Você agora é o responsável pelo animal ${dados.animal.nome}.`
      : "Infelizmente seu pedido de adoção foi recusado.";

    await enviaEmail(dados.adotante.nome, dados.adotante.email, dados.descricao, mensagem);

    if (aprovado) {
      //  Cria registro na tabela de adoções
      const novaAdocao = await prisma.adocao.create({
        data: {
          pedido: { connect: { id: Number(dados.id) } },
          adotante: { connect: { id: dados.adotante.id } },
          animal: { connect: { id: Number(dados.animal.id) } },
          dataAdocao: new Date()
        }
      });

      //  Cria o primeiro acompanhamento automático
      await prisma.acompanhamento.create({
        data: {
          adocaoId: novaAdocao.id,
          observacoes: "Adoção.",
          proximaVisita: null,
          usuarioId: usuarioId
        }
      });

      //  Marca animal como indisponível
      await prisma.animal.update({
        where: { id: Number(dados.animal.id) },
        data: { disponivel: false }
      });

      //  Rejeita automaticamente os outros pedidos do mesmo animal
      await prisma.pedido.updateMany({
        where: {
          animalId: Number(dados.animal.id),
          id: { not: Number(dados.id) },
        },
        data: {
          aprovado: false,
          resposta: "Outro pedido foi aprovado para este animal.",
        },
      });
    }

    // Retorna os dados atualizados
    res.status(200).json(dados);
  } catch (error) {
    res.status(400).json(error);
  }
});

// ✅ Listar pedidos
router.get("/", async (req, res) => {
  try {
    const { adotanteId } = req.query;

    const pedidos = await prisma.pedido.findMany({
      where: { adotanteId: adotanteId ? String(adotanteId) : undefined },
      include: {
        // 🔒 SEGURANÇA: Selecionando apenas campos públicos na listagem também
        adotante: {
          select: {
            id: true,
            nome: true,
            email: true,
            fone: true
          }
        },
        animal: {
          include: { especie: true, fotos: true }
        }
      }
    });

    res.status(200).json(pedidos);
  } catch (error) {
    res.status(400).json(error);
  }
});

// ✅ Deletar pedido
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pedido = await prisma.pedido.delete({ where: { id: Number(id) } });
    res.status(200).json(pedido);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
