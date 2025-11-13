// src/routes/animais.ts
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// GET /animais - lista (inclui especie e fotos)
router.get("/", async (req, res) => {
  try {
    const animais = await prisma.animal.findMany({
      include: {
        especie: true,
        fotos: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.status(200).json(animais);
  } catch (error) {
    res.status(400).json(error);
  }
});

// GET /animais/adotados
router.get("/adotados", async (req, res) => {
  try {
    const adotados = await prisma.animal.findMany({
      where: { disponivel: false },
      include: { especie: true, fotos: true },
      orderBy: { updatedAt: "desc" },
    });
    res.status(200).json(adotados);
  } catch (error) {
    res.status(400).json(error);
  }
});

// POST /animais - criar animal (opcional: enviar `fotos` array para criar fotos após criar animal)
router.post("/", verificaToken, async (req, res) => {
  const { nome, idade, sexo, descricao, porte, especieId, castracao, fotos } = req.body;

  if (!nome || idade === undefined || !sexo || !porte || !especieId) {
    return res.status(400).json({ erro: "Informe nome, sexo, idade, porte e especieId" });
  }

  try {
    // cria animal
    const animal = await prisma.animal.create({
      data: {
        nome,
        idade: Number(idade),
        sexo,
        descricao,
        porte,
        especieId: Number(especieId),
        castracao: castracao === true ? true : false
      }
    });

    // se vier fotos (array de { codigoFoto, descricao }), cria-las vinculadas
    if (Array.isArray(fotos) && fotos.length > 0) {
      const fotosData = fotos.map((f: any) => ({
        descricao: f.descricao ?? "",
        codigoFoto: f.codigoFoto,
        animalId: animal.id
      }));
      await prisma.foto.createMany({ data: fotosData });
      // recarrega animal com fotos
      const animalComFotos = await prisma.animal.findUnique({
        where: { id: animal.id },
        include: { especie: true, fotos: true }
      });
      return res.status(201).json(animalComFotos);
    }

    const animalSemFotos = await prisma.animal.findUnique({
      where: { id: animal.id },
      include: { especie: true, fotos: true }
    });

    res.status(201).json(animalSemFotos);
  } catch (error) {
    res.status(400).json(error);
  }
});

// DELETE /animais/:id
router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  try {
    // antes de deletar, podemos optar por deletar fotos vinculadas
    await prisma.foto.deleteMany({ where: { animalId: Number(id) }});
    const animal = await prisma.animal.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(animal);
  } catch (error) {
    res.status(400).json(error);
  }
});

// PUT /animais/:id - atualiza (se enviar fotos, substitui adicionando novas fotos; não remove automaticamente existentes)
router.put("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  const { nome, idade, sexo, descricao, porte, especieId, castracao, fotos } = req.body;

  if (!nome || idade === undefined || !sexo || !porte || !especieId) {
    return res.status(400).json({ erro: "Informe nome, idade, sexo, porte e especieId" });
  }

  try {
    const animal = await prisma.animal.update({
      where: { id: Number(id) },
      data: {
        nome,
        idade: Number(idade),
        sexo,
        descricao,
        porte,
        especieId: Number(especieId),
        castracao: castracao === true ? true : false
      }
    });

    // se vier fotos para adicionar
    if (Array.isArray(fotos) && fotos.length > 0) {
      const fotosData = fotos.map((f: any) => ({
        descricao: f.descricao ?? "",
        codigoFoto: f.codigoFoto,
        animalId: animal.id
      }));
      await prisma.foto.createMany({ data: fotosData });
    }

    const animalAtualizado = await prisma.animal.findUnique({
      where: { id: Number(id) },
      include: { especie: true, fotos: true }
    });

    res.status(200).json(animalAtualizado);
  } catch (error) {
    res.status(400).json(error);
  }
});

// GET /animais/pesquisa/:termo - mantém implementação adaptada (inclui fotos)
router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params;
  const termoNumero = Number(termo);

  if (isNaN(termoNumero)) {
    try {
      let termoCorrigido: string | undefined;
      if (termo.toLowerCase() === 'macho') termoCorrigido = 'Macho';
      else if (termo.toLowerCase() === 'femea' || termo.toLowerCase() === 'fêmea') termoCorrigido = 'Femea';
      else termoCorrigido = undefined;

      const animais = await prisma.animal.findMany({
        include: { especie: true, fotos: true },
        where: {
          OR: [
            { nome: { contains: termo } },
            { especie: { nome: { contains: termo } } },
            ...(termoCorrigido ? [{ sexo: termoCorrigido as 'Macho' | 'Femea' }] : [])
          ]
        }
      });
      res.status(200).json(animais);
    } catch (error) {
      res.status(400).json(error);
    }
  } else {
    try {
      const animais = await prisma.animal.findMany({
        include: { especie: true, fotos: true },
        where: { OR: [{ idade: termoNumero }] }
      });
      res.status(200).json(animais);
    } catch (error) {
      res.status(400).json(error);
    }
  }
});

// GET /animais/:id - inclui fotos
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const animal = await prisma.animal.findUnique({
      where: { id: Number(id) },
      include: { especie: true, fotos: true }
    });
    res.status(200).json(animal);
  } catch (error) {
    res.status(400).json(error);
  }
});

// PATCH /animais/:id - atualizar parcial (ex: disponivel)
router.patch("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  const updateData: any = {};
  const { disponivel, castracao } = req.body;

  if (disponivel !== undefined) updateData.disponivel = disponivel;
  if (castracao !== undefined) updateData.castracao = castracao;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ erro: "Nenhum campo válido para atualizar." });
  }

  try {
    const animalAtualizado = await prisma.animal.update({
      where: { id: Number(id) },
      data: updateData,
    });
    res.status(200).json(animalAtualizado);
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível atualizar o animal.", detalhes: error });
  }
});

export default router;
