import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// Função auxiliar — mesma usada nas vacinas
function adocaoNaoAtiva(status: string) {
  return status !== "Ativa"; // Concluida ou Cancelada → bloquear
}

// 🔹 Listar acompanhamentos
router.get("/", verificaToken, async (req, res) => {
  try {
    const { adocaoId } = req.query;
    const acompanhamentos = await prisma.acompanhamento.findMany({
      where: { adocaoId: adocaoId ? Number(adocaoId) : undefined },
      include: {
        adocao: true,
        usuario: true,
        vacinasAplicadas: true,
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
        vacinasAplicadas: true,
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
    const adocao = await prisma.adocao.findUnique({
      where: { id: Number(adocaoId) },
    });

    if (!adocao) {
      return res.status(404).json({ erro: "Adoção não encontrada" });
    }

    // ⛔ Bloquear se adoção estiver concluída/cancelada
    if (adocaoNaoAtiva(adocao.status)) {
      return res.status(403).json({
        erro: `Não é possível registrar acompanhamento porque a adoção está ${adocao.status}.`,
      });
    }

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
    const acompanhamentoAtual = await prisma.acompanhamento.findUnique({
      where: { id: Number(id) },
      include: { adocao: true },
    });

    if (!acompanhamentoAtual) {
      return res.status(404).json({ erro: "Acompanhamento não encontrado" });
    }

    // ⛔ Bloquear se adoção não estiver ativa
    if (adocaoNaoAtiva(acompanhamentoAtual.adocao.status)) {
      return res.status(403).json({
        erro: `A adoção está ${acompanhamentoAtual.adocao.status}. Não é possível editar acompanhamentos.`,
      });
    }

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
    const acompanhamentoAtual = await prisma.acompanhamento.findUnique({
      where: { id: Number(id) },
      include: { adocao: true },
    });

    if (!acompanhamentoAtual) {
      return res.status(404).json({ erro: "Acompanhamento não encontrado" });
    }

    // ⛔ Travar se adoção estiver concluída/cancelada
    if (adocaoNaoAtiva(acompanhamentoAtual.adocao.status)) {
      return res.status(403).json({
        erro: `A adoção está ${acompanhamentoAtual.adocao.status}. Não é possível excluir acompanhamentos.`,
      });
    }

    const deletado = await prisma.acompanhamento.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({
      mensagem: "Acompanhamento deletado com sucesso",
      acompanhamento: deletado,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ erro: "Erro ao deletar acompanhamento", detalhes: error });
  }
});

export default router;
