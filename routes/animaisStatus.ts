import { Router } from "express";
import prisma from "../prisma"; // verifique se o caminho do seu prisma client está correto
const router = Router();

// Rota para animais encontrados/adotados
router.get("/status", async (req, res) => {
  try {
    // Animais "normais" adotados
    const adotados = await prisma.animal.findMany({
      where: { disponivel: false },
      select: {
        id: true,
        nome: true,
        fotos: { select: { codigoFoto: true } },
      },
    });

    // Animais perdidos/encontrados
    const encontrados = await prisma.animalPerdido.findMany({
      where: { encontrado: true },
      select: {
        id: true,
        nome: true,
        fotos: { select: { codigoFoto: true } },
      },
    });

    // Map para pegar a primeira foto e nome seguro
    const formatAdotados = adotados.map(a => ({
      id: a.id,
      nome: a.nome || "Sem nome",
      foto: a.fotos[0]?.codigoFoto || "", // ⚡ usa campo correto
      tipo: "adotado",
    }));

    const formatEncontrados = encontrados.map(a => ({
      id: a.id,
      nome: a.nome || "Sem nome",
      foto: a.fotos[0]?.codigoFoto || "",
      tipo: "encontrado",
    }));

    res.json([...formatAdotados, ...formatEncontrados]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar animais" });
  }
});

export default router;
