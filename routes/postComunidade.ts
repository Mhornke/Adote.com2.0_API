// src/routes/postComunidade.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

/* =====================================
   LISTAR TODOS OS POSTS (FEED)
   ===================================== */
router.get("/", async (req, res) => {
  try {
    const posts = await prisma.postComunidade.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        adotante: {
          select: { id: true, nome: true, email: true }
        },
        fotos: true,
        comentarios: {
          include: {
            adotante: { select: { id: true, nome: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: { comentarios: true }
        }
      }
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
    res.status(500).json({ erro: "Erro ao buscar publicações." });
  }
});

/* =====================================
   LISTAR UM ÚNICO POST
   ===================================== */
router.get("/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);

    const post = await prisma.postComunidade.findUnique({
      where: { id: postId },
      include: {
        adotante: { select: { id: true, nome: true, email: true } },
        fotos: true,
        comentarios: {
          include: {
            adotante: { select: { id: true, nome: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    res.status(200).json(post);
  } catch (error) {
    res.status(400).json(error);
  }
});

/* =====================================
   CRIAR POST COM FOTOS
   ===================================== */
router.post("/", verificaToken, async (req, res) => {
  try {
    const { texto, fotos } = req.body;
    const adotanteId = req.userLogadoId;

    if (!texto)
      return res.status(400).json({ erro: "Informe o texto" });

    const novoPost = await prisma.postComunidade.create({
      data: {
        texto,
        adotanteId: String(adotanteId),
        curtida: 0,

        // Cria fotos vinculadas ao post
        fotos: fotos?.length
          ? {
              create: fotos.map((url: string) => ({
                descricao: "foto do post",
                codigoFoto: url
              }))
            }
          : undefined
      },
      include: {
        fotos: true,
        adotante: {
          select: { id: true, nome: true, email: true }
        },
        comentarios: true
      }
    });

    res.status(201).json(novoPost);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: "Erro ao criar post" });
  }
});

/* =====================================
   EDITAR POST (texto/curtida)
   ===================================== */
router.patch("/:id", verificaToken, async (req, res) => {
  const postId = Number(req.params.id);
  const adotanteId = req.userLogadoId;
  const { texto, curtida } = req.body;

  try {
    const post = await prisma.postComunidade.findUnique({
      where: { id: postId }
    });

    if (!post)
      return res.status(404).json({ erro: "Post não encontrado" });

    if (post.adotanteId !== String(adotanteId))
      return res.status(403).json({ erro: "Você não pode editar este post" });

    const atualizado = await prisma.postComunidade.update({
      where: { id: postId },
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
// Backend (Node.js/Prisma)
router.patch("/:id/curtir", verificaToken, async (req, res) => {
  const postId = Number(req.params.id);
  const { tipo } = req.body; // "add" ou "remove"

  try {
    // 1. Defina a operação baseada no tipo
    let operacaoCurtida;
    
    if (tipo === 'add') {
      operacaoCurtida = { increment: 1 };
    } else if (tipo === 'remove') {
      operacaoCurtida = { decrement: 1 };
    } else {
      return res.status(400).json({ erro: "Tipo de operação inválida" });
    }

    // 2. Atualiza
    const atualizado = await prisma.postComunidade.update({
      where: { id: postId },
      data: {
        curtida: operacaoCurtida // Passa apenas o objeto correto
      }
    });

    res.status(200).json(atualizado);
  } catch (error) {
    console.error("Erro no backend:", error); // Isso vai aparecer no terminal do servidor
    res.status(400).json({ erro: "Falha ao atualizar curtida", detalhes: error });
  }
});
/* =====================================
   DELETAR POST (fotos + comentários)
   ===================================== */
router.delete("/:id", verificaToken, async (req, res) => {
  const postId = Number(req.params.id);
  const adotanteId = req.userLogadoId;

  try {
    const post = await prisma.postComunidade.findUnique({
      where: { id: postId },
      include: { fotos: true }
    });

    if (!post)
      return res.status(404).json({ erro: "Post não encontrado" });

    if (post.adotanteId !== String(adotanteId))
      return res.status(403).json({ erro: "Você não pode excluir este post" });

    // Deleta fotos vinculadas ao post
    await prisma.foto.deleteMany({
      where: { postComunidadeId: postId }
    });

    // Deleta comentários vinculados ao post
    await prisma.comentario.deleteMany({
      where: { postComunidadeId: postId }
    });

    // Deleta o post
    await prisma.postComunidade.delete({
      where: { id: postId }
    });

    res.status(200).json({ mensagem: "Post excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir post:", error);
    res.status(500).json({ erro: "Erro ao excluir post." });
  }
});

export default router;
