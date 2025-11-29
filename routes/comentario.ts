// src/routes/comentario.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();
// post de postecomunidade
router.post("/posts", async (req, res) => {
  try {
    const { texto, adotanteId, fotos } = req.body;

    const novoPost = await prisma.postComunidade.create({
      data: {
        texto,
        adotanteId,
        curtida: 0,

        fotos: {
          create: fotos.map((url: string) => ({
            descricao: "foto do post",
            codigoFoto: url
          }))
        }
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

// POST /comentario
router.post("/comentario", verificaToken, async (req, res) => {
  const { texto, curtida, postComunidadeId } = req.body;

  const adotanteId = req.userLogadoId; 

  if (!texto) return res.status(400).json({ erro: "Informe o texto" });

  try {
    const comentario = await prisma.comentario.create({
      data: {
        texto,
        curtida: curtida ? Number(curtida) : 0,
        adotanteId: String(adotanteId), 
        postComunidadeId: postComunidadeId ? Number(postComunidadeId) : undefined
      },
      include: { adotante: true, postComunidade: true }
    });

    res.status(201).json(comentario);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const posts = await prisma.postComunidade.findMany({
      orderBy: { createdAt: "desc" }, 
      include: {
        adotante: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        },
        fotos: true,

        comentarios: {
          include: {
            adotante: {
              select: {
                id: true,
                nome: true
              }
            }
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
    console.error("Erro ao buscar feed:", error);
    res.status(500).json({ erro: "Erro ao buscar publicações." });
  }
});


router.patch("/:id", verificaToken, async (req, res) => {
  const { texto, curtida } = req.body;
  const adotanteId = req.userLogadoId;
  const comentarioId = Number(req.params.id);

  try {
    // 1. Verifica se o comentário existe e se pertence ao usuário
    const comentario = await prisma.comentario.findUnique({
      where: { id: comentarioId }
    });

    if (!comentario) {
      return res.status(404).json({ erro: "Comentário não encontrado" });
    }

    if (comentario.adotanteId !== String(adotanteId)) {
      return res.status(403).json({ erro: "Você não pode editar este comentário" });
    }

    // 2. Atualiza
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
//temporario
router.delete("/comentarios/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.comentario.delete({
      where: { id }
    });

    res.json({ mensagem: "Comentário deletado." });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao deletar comentário." });
  }
});

// DELETE /comentario/:id
//router.delete("/comentario/:id", async (req, res) => {
//  const adotanteId = req.userLogadoId;
 // const comentarioId = Number(req.params.id);

 // try {
  //  const comentario = await prisma.comentario.findUnique({
   //   where: { id: comentarioId }
   // });

   //if (!comentario) {
    //  return res.status(404).json({ erro: "Comentário não encontrado" });
   // }
//
  // if (comentario.adotanteId !== String(adotanteId)) {
 ///  return res.status(403).json({ erro: "Você não pode excluir este comentário" });
 // }

  //  const excluido = await prisma.comentario.delete({
  //    where: { id: comentarioId }
  //  });

//    res.status(200).json(excluido);
////  } catch (error) {
//    res.status(400).json(error);
//  }
//});
// DELETE /post/:id
router.delete("/poste/:id", verificaToken, async (req, res) => {
  const adotanteId = req.userLogadoId;
  const postId = Number(req.params.id);

  try {
    // Verifica se o post existe
    const post = await prisma.postComunidade.findUnique({
      where: { id: postId },
      include: { fotos: true }
    });

    if (!post) {
      return res.status(404).json({ erro: "Post não encontrado" });
    }

    // Impede deletar post de outro usuário
    if (post.adotanteId !== String(adotanteId)) {
      return res.status(403).json({ erro: "Você não pode excluir este post" });
    }

    // Deleta fotos vinculadas ao post
    await prisma.foto.deleteMany({
      where: { postComunidadeId: postId }
    });

    // Agora deleta o post
    const excluido = await prisma.postComunidade.delete({
      where: { id: postId }
    });

    res.status(200).json({
      mensagem: "Post excluído com sucesso",
      post: excluido
    });
  } catch (error) {
    console.error("Erro ao excluir post:", error);
    res.status(500).json({ erro: "Erro ao excluir post." });
  }
});


export default router;
