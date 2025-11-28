// routes/animaisStatus.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

// GET /animais/status
router.get("/", async (req: any, res) => {
  try {
   const encontrados = await prisma.animalPerdido.findMany({
  where: { encontrado: true },
  select: {
    id: true,
    nome: true,
    fotos: { select: { url: true } },
  },
});

// Garantindo que nome nunca seja null
const encontradosComNome = encontrados.map(a => ({
  ...a,
  nome: a.nome || "Sem nome",
}));


    const adotados = await prisma.animal.findMany({
      where: { disponivel: false },
      select: {
        id: true,
        nome: true,
        fotos: { select: { url: true } },
      },
    });

    res.json({ encontrados, adotados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar animais" });
  }
});

export default router;
