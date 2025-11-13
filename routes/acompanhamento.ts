import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// 🔹 Listar acompanhamentos (opcionalmente filtrando por adocaoId)
router.get("/", verificaToken, async (req, res) => {
  try {
    const { adocaoId } = req.query;
    const acompanhamentos = await prisma.acompanhamento.findMany({
      where: { adocaoId: adocaoId ? Number(adocaoId) : undefined },
      include: {
        adocao: true,
        usuario: true, // Admin que registrou
        vacinasAplicadas: true, // ✅ agora sem "vacina"
      },
      orderBy: { dataVisita: "desc" },
    });
    res.status(200).json(acompanhamentos);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao listar acompanhamentos", detalhes: error });
  }
});

// 🔹 Buscar acompanhamento por ID
router.get("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  try {
    const acompanhamento = await prisma.acompanhamento.findUnique({
      where: { id: Number(id) },
      include: {
        adocao: true,
        usuario: true,
        vacinasAplicadas: true, // ✅ idem aqui
      },
    });

    if (!acompanhamento) {
      return res.status(404).json({ erro: "Acompanhamento não encontrado" });
    }

    res.status(200).json(acompanhamento);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao buscar acompanhamento", detalhes: error });
  }
});

// 🔹 Criar acompanhamento
router.post("/", verificaToken, async (req, res) => {
  const { adocaoId, observacoes, proximaVisita, usuarioId } = req.body;

  if (!adocaoId || !usuarioId) {
    return res.status(400).json({
      erro: "Informe adocaoId e usuarioId (Admin que registrou a visita)",
    });
  }

  try {
    const acompanhamento = await prisma.acompanhamento.create({
      data: { adocaoId, observacoes, proximaVisita, usuarioId },
      include: {
        adocao: true,
        usuario: true,
        vacinasAplicadas: true,
      },
    });

    res.status(201).json(acompanhamento);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao criar acompanhamento", detalhes: error });
  }
});

// 🔹 Atualizar acompanhamento
router.patch("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  const { observacoes, proximaVisita, usuarioId } = req.body;

  try {
    const acompanhamento = await prisma.acompanhamento.update({
      where: { id: Number(id) },
      data: { observacoes, proximaVisita, usuarioId },
      include: {
        adocao: true,
        usuario: true,
        vacinasAplicadas: true,
      },
    });
    res.status(200).json(acompanhamento);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao atualizar acompanhamento", detalhes: error });
  }
});

// 🔹 Deletar acompanhamento
router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  try {
    const acompanhamento = await prisma.acompanhamento.delete({
      where: { id: Number(id) },
    });
    res.status(200).json({
      mensagem: "Acompanhamento deletado com sucesso",
      acompanhamento,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao deletar acompanhamento", detalhes: error });
  }
});

export default router;
