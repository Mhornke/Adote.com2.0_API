// src/routes/postComunidade.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// GET /postComunidade
router.get("/", async (req, res) => {
  try {
    const posts = await prisma.postComunidade.findMany({
      include: { comentarios: true, adotante: true },
      orderBy: { createdAt: "desc" }
    });
    res.status(200).json(posts);
  } catch (error) {
    res.status(400).json(error);
  }
});

// GET /postComunidade/:id
router.get("/:id", async (req, res) => {
  try {
    const post = await prisma.postComunidade.findUnique({
      where: { id: Number(req.params.id) },
      include: { comentarios: true, adotante: true }
    });
    res.status(200).json(post);
  } catch (error) {
    res.status(400).json(error);
  }
});

// POST /postComunidade
router.post("/", verificaToken, async (req, res) => {
  const { texto, curtida, adotanteId } = req.body;
  if (!texto || !adotanteId) return res.status(400).json({ erro: "Informe texto e adotanteId" });

  try {
    const post = await prisma.postComunidade.create({
      data: {
        texto,
        curtida: curtida ? Number(curtida) : 0,
        adotanteId
      },
      include: { adotante: true }
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json(error);
  }
});

// PATCH /postComunidade/:id
router.patch("/:id", verificaToken, async (req, res) => {
  const { texto, curtida } = req.body;
  try {
    const post = await prisma.postComunidade.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(texto !== undefined ? { texto } : {}),
        ...(curtida !== undefined ? { curtida: Number(curtida) } : {})
      }
    });
    res.status(200).json(post);
  } catch (error) {
    res.status(400).json(error);
  }
});

// DELETE /postComunidade/:id
router.delete("/:id", verificaToken, async (req, res) => {
  try {
    // opcional: deletar comentarios relacionados
    await prisma.comentario.deleteMany({ where: { postComunidadeId: Number(req.params.id) } });
    const excluido = await prisma.postComunidade.delete({ where: { id: Number(req.params.id) } });
    res.status(200).json(excluido);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
