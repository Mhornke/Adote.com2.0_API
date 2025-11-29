// src/routes/fotos.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// GET /fotos
router.get("/", async (req, res) => {
  try {
    const fotos = await prisma.foto.findMany({
      include: {
        animalNormal: true,
        animalPerdido: true
      },
      orderBy: { id: "desc" }
    });
    res.status(200).json(fotos);
  } catch (error) {
    res.status(400).json(error);
  }
});

// GET /fotos/:id
router.get("/:id", async (req, res) => {
  try {
    const foto = await prisma.foto.findUnique({
      where: { id: Number(req.params.id) },
      include: { animalNormal: true, animalPerdido: true }
    });
    res.status(200).json(foto);
  } catch (error) {
    res.status(400).json(error);
  }
});

// POST /fotos (protected)
router.post("/", verificaToken, async (req, res) => {
  const { descricao, codigoFoto, animalId, animalPerdidoId } = req.body;
  if (!codigoFoto) return res.status(400).json({ erro: "Informe codigoFoto" });

  if (!animalId && !animalPerdidoId) {
    return res.status(400).json({ erro: "Informe animalId ou animalPerdidoId" });
  }

  try {
    const foto = await prisma.foto.create({
      data: {
        descricao: descricao ?? "",
        codigoFoto,
        animalId: animalId ? Number(animalId) : undefined,
        animalPerdidoId: animalPerdidoId ? Number(animalPerdidoId) : undefined,
        postComunidadeId: postComunidadeId ? Number(postComunidadeId) : undefined
      }
    });
    res.status(201).json(foto);
  } catch (error) {
    res.status(400).json(error);
  }
});

// PATCH /fotos/:id - atualiza descricao ou vinculo
router.patch("/:id", verificaToken, async (req, res) => {
  const { descricao, animalId, animalPerdidoId } = req.body;
  try {
    const fotoAtualizada = await prisma.foto.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(descricao !== undefined ? { descricao } : {}),
        ...(animalId !== undefined ? { animalId: Number(animalId) } : {}),
        ...(animalPerdidoId !== undefined ? { animalPerdidoId: Number(animalPerdidoId) } : {})
      }
    });
    res.status(200).json(fotoAtualizada);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.put("/:id", verificaToken, async (req, res) => {
  const { descricao, codigoFoto, animalId, animalPerdidoId } = req.body;

  if (!codigoFoto) return res.status(400).json({ erro: "Informe codigoFoto" });

  try {
    const fotoAtualizada = await prisma.foto.update({
      where: { id: Number(req.params.id) },
      data: {
        descricao: descricao ?? "",
        codigoFoto,
        ...(animalId !== undefined ? { animalId: Number(animalId) } : {}),
        ...(animalPerdidoId !== undefined ? { animalPerdidoId: Number(animalPerdidoId) } : {})
      }
    });
    res.status(200).json(fotoAtualizada);
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível atualizar a foto.", detalhes: error });
  }
});

// DELETE /fotos/:id
router.delete("/:id", verificaToken, async (req, res) => {
  try {
    const foto = await prisma.foto.delete({ where: { id: Number(req.params.id) } });
    res.status(200).json(foto);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;

