// src/routes/comentario.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

/* ============================
      CRIAR COMENTÁRIO
   ============================ */
router.post("/", verificaToken, async (req, res) => {
  const { texto, curtida, postComunidadeId } = req.body;

  const adotanteId = req.userLogadoId;

  if (!texto) return res.status(400).json({ erro: "Informe o texto" });
  if (!postComunidadeId) return res.status(400).json({ erro: "Informe postComunidadeId" });

  try {
    const comentario = await prisma.comentario.create({
      data: {
        texto,
        curtida: curtida ? Number(curtida) : 0,
        adotanteId: String(adotanteId),
        postComunidadeId: Number(postComunidadeId)
      },
      include: {
        adotante: { select: { id: true, nome: true } }
      }
    });

    res.status(201).json(comentario);
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
});

/* ============================
      LISTAR COMENTÁRIOS DE UM POST
   ============================ */
router.get("/post/:postId", async (req, res) => {
  try {
    const postId = Number(req.params.postId);

    const comentarios = await prisma.comentario.findMany({
      where: { postComunidadeId: postId },
      include: {
        adotante: { select: { id: true, nome: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json(comentarios);
  } catch (error) {
    console.error("Erro ao buscar comentários:", error);
    res.status(500).json({ erro: "Erro ao buscar comentários." });
  }
});

/* ============================
      EDITAR COMENTÁRIO
   ============================ */
router.patch("/:id", verificaToken, async (req, res) => {
  const { texto, curtida } = req.body;
  const comentarioId = Number(req.params.id);
  const adotanteId = req.userLogadoId;

  try {
    const comentario = await prisma.comentario.findUnique({
      where: { id: comentarioId }
    });

    if (!comentario) {
      return res.status(404).json({ erro: "Comentário não encontrado" });
    }

    if (comentario.adotanteId !== String(adotanteId)) {
      return res.status(403).json({ erro: "Você não pode editar este comentário" });
    }

    const atualizado = await prisma.comentario.update({
      where: { id: comentarioId },
      data: {
        ...(texto !== undefined ? { texto } : {}),
        ...(curtida !== undefined ? { curtida: Number(curtida) } : {})
      }
    });

    res.status(200).json(atualizado);
  } catch (error) {
    res.status(400).json(error);
  }
});

/* ============================
      DELETAR COMENTÁRIO
   ============================ */
router.delete("/:id", verificaToken, async (req, res) => {
  const comentarioId = Number(req.params.id);
  const adotanteId = req.userLogadoId;

  try {
    const comentario = await prisma.comentario.findUnique({
      where: { id: comentarioId }
    });

    if (!comentario) {
      return res.status(404).json({ erro: "Comentário não encontrado" });
    }

    if (comentario.adotanteId !== String(adotanteId)) {
      return res.status(403).json({ erro: "Você não pode excluir este comentário" });
    }

    await prisma.comentario.delete({
      where: { id: comentarioId }
    });

    res.status(200).json({ mensagem: "Comentário deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar comentário:", error);
    res.status(500).json({ erro: "Erro ao deletar comentário." });
  }
});

export default router;
