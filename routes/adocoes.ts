import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

//Criar adoção 
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
        animal: { include: { especie: true, fotos: true } },
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

//Listar todas as adoções
router.get("/", verificaToken, async (req, res) => {
  try {
    const adocoes = await prisma.adocao.findMany({
      include: {
        animal: { include: { especie: true, fotos: true } },
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

//Buscar uma adoção específica por ID
router.get("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  try {
    const adocao = await prisma.adocao.findUnique({
      where: { id: Number(id) },
      include: {
        animal: { include: { especie: true, fotos: true } },
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

//Impedir alterar adoção finalizada
function bloqueiaAlteracaoSeFinalizada(statusAtual: string) {
  return statusAtual === "Concluida" || statusAtual === "Cancelada";
}

//Atualizar status (Ativa ➝ Concluida / Cancelada)
router.patch("/:id/status", verificaToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ erro: "Informe o novo status da adoção." });
  }

  try {
    const adocaoAtual = await prisma.adocao.findUnique({
      where: { id: Number(id) }
    });

    if (!adocaoAtual) {
      return res.status(404).json({ erro: "Adoção não encontrada." });
    }

    //Se já estiver concluída ou cancelada → bloquear
    if (bloqueiaAlteracaoSeFinalizada(adocaoAtual.status)) {
      return res.status(403).json({
        erro: `A adoção já está ${adocaoAtual.status} e não pode ser alterada.`,
      });
    }

    const adocao = await prisma.adocao.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.status(200).json(adocao);
  } catch (error) {
    res.status(400).json(error);
  }
});

//Deletar adoção (apenas se não estiver concluída/cancelada)
router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  try {
    const adocaoAtual = await prisma.adocao.findUnique({
      where: { id: Number(id) }
    });

    if (!adocaoAtual) {
      return res.status(404).json({ erro: "Adoção não encontrada." });
    }

    //Impedir excluir se finalizada
    if (bloqueiaAlteracaoSeFinalizada(adocaoAtual.status)) {
      return res.status(403).json({
        erro: `A adoção ${adocaoAtual.status} não pode ser removida.`
      });
    }

    await prisma.adocao.delete({ where: { id: Number(id) } });
    res.status(200).json({ mensagem: "Adoção removida com sucesso." });
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;

