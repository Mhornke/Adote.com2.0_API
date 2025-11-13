// src/routes/vacinasAplicadas.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// GET /vacinasAplicadas
router.get("/", verificaToken, async (req, res) => {
  try {
    const vacinasAplicadas = await prisma.vacinasAplicadas.findMany({
      include: { animal: true, acompanhamento: true }
    });
    res.status(200).json(vacinasAplicadas);
  } catch (error) {
    res.status(400).json(error);
  }
});

// GET /vacinasAplicadas/:id
router.get("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  try {
    const vacinaAplicada = await prisma.vacinasAplicadas.findUnique({
      where: { id: Number(id) },
      include: { animal: true, acompanhamento: true }
    });
    res.status(200).json(vacinaAplicada);
  } catch (error) {
    res.status(400).json(error);
  }
});

// POST /vacinasAplicadas
router.post("/", verificaToken, async (req, res) => {
  const { nome, animalId, acompanhamentoId, aplicadoPor, observacoes } = req.body;
  if (!nome || !animalId) return res.status(400).json({ erro: "Informe nome da vacina e animalId" });

  try {
    const vacinaAplicada = await prisma.vacinasAplicadas.create({
      data: { nome, animalId: Number(animalId), acompanhamentoId: acompanhamentoId ? Number(acompanhamentoId) : undefined, aplicadoPor, observacoes },
      include: { animal: true, acompanhamento: true }
    });
    res.status(201).json(vacinaAplicada);
  } catch (error) {
    res.status(400).json(error);
  }
});

// PATCH /vacinasAplicadas/:id
router.patch("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  const { nome, aplicadoPor, observacoes, acompanhamentoId } = req.body;

  try {
    const vacinaAplicada = await prisma.vacinasAplicadas.update({
      where: { id: Number(id) },
      data: {
        ...(nome ? { nome } : {}),
        ...(aplicadoPor ? { aplicadoPor } : {}),
        ...(observacoes ? { observacoes } : {}),
        ...(acompanhamentoId ? { acompanhamentoId: Number(acompanhamentoId) } : {})
      },
      include: { animal: true, acompanhamento: true }
    });
    res.status(200).json(vacinaAplicada);
  } catch (error) {
    res.status(400).json(error);
  }
});

// DELETE /vacinasAplicadas/:id
router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  try {
    const resposta = await prisma.vacinasAplicadas.delete({ where: { id: Number(id) } });
    res.status(200).json(resposta);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
