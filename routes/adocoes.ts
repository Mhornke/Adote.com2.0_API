import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// ✅ Criar adoção (com ou sem pedido)
router.post("/", verificaToken, async (req, res) => {
  const { adotanteId, animalId, pedidoId, dataAdocao } = req.body;

  if (!adotanteId || !animalId) {
    return res.status(400).json({ erro: "Informe adotanteId e animalId!" });
  }

  try {
    const adocao = await prisma.adocao.create({
      data: {
        adotante: { connect: { id: adotanteId } },
        animal: { connect: { id: animalId } },
        ...(pedidoId && { pedido: { connect: { id: pedidoId } } }),
        dataAdocao: dataAdocao ? new Date(dataAdocao) : new Date(),
      },
      include: {
        animal: { include: { especie: true, fotos: true } }, // ✅ incluir fotos e espécie
        adotante: true,
        pedido: true,
      },
    });

    res.status(201).json(adocao);
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao criar adoção." });
  }
});

// ✅ Listar todas as adoções (com animal, adotante, pedido e acompanhamentos)
router.get("/", verificaToken, async (req, res) => {
  try {
    const adocoes = await prisma.adocao.findMany({
      include: {
        animal: { include: { especie: true, fotos: true } }, // ✅ incluir fotos e espécie
        adotante: true,
        pedido: true,
        acompanhamentos: true,
      },
    });
    res.status(200).json(adocoes);
  } catch (error) {
    res.status(400).json(error);
  }
});

// ✅ Buscar uma adoção específica por ID
router.get("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  try {
    const adocao = await prisma.adocao.findUnique({
      where: { id: Number(id) },
      include: {
        animal: { include: { especie: true, fotos: true } }, // ✅ incluir fotos e espécie
        adotante: true,
        pedido: true,
        acompanhamentos: true,
      },
    });

    if (!adocao) {
      return res.status(404).json({ erro: "Adoção não encontrada." });
    }

    res.status(200).json(adocao);
  } catch (error) {
    res.status(400).json(error);
  }
});

// ✅ Atualizar status (Ativa, Concluída ou Cancelada)
router.patch("/:id/status", verificaToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ erro: "Informe o novo status da adoção." });
  }

  try {
    const adocao = await prisma.adocao.update({
      where: { id: Number(id) },
      data: { status },
    });
    res.status(200).json(adocao);
  } catch (error) {
    res.status(400).json(error);
  }
});

// ✅ Deletar uma adoção (caso necessário, apenas admins)
router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.adocao.delete({ where: { id: Number(id) } });
    res.status(200).json({ mensagem: "Adoção removida com sucesso." });
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
