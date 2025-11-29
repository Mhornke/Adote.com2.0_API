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

// POST /animais - criar animal
router.post("/", verificaToken, async (req, res) => {
  const { nome, idade, sexo, descricao, porte, especieId, castracao, fotos } = req.body;

  if (!nome || idade === undefined || !sexo || !porte || !especieId) {
    return res.status(400).json({ erro: "Informe nome, sexo, idade, porte e especieId" });
  }

  try {
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

    if (Array.isArray(fotos) && fotos.length > 0) {
      const fotosData = fotos.map((f: any) => ({
        descricao: f.descricao ?? "",
        codigoFoto: f.codigoFoto,
        animalId: animal.id
      }));
      await prisma.foto.createMany({ data: fotosData });

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
    await prisma.foto.deleteMany({ where: { animalId: Number(id) }});
    const animal = await prisma.animal.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(animal);
  } catch (error) {
    res.status(400).json(error);
  }
});

// PUT /animais/:id - atualizar
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

// Função auxiliar para identificar intenções de busca específicas
// Retorna um objeto com o tipo de filtro e o valor, ou null
function analisarIntencao(termo: string) {
  const t = termo.trim().toLowerCase();
  
  // Mapeamento de Sexo
  if (['macho', 'masculino'].includes(t)) return { tipo: 'sexo', valor: 'Macho' };
  if (['fêmea', 'femea', 'feminino'].includes(t)) return { tipo: 'sexo', valor: 'Femea' };

  // Mapeamento de Porte
  if (['pequeno', 'p'].includes(t)) return { tipo: 'porte', valor: 'Pequeno' };
  if (['medio', 'médio', 'm'].includes(t)) return { tipo: 'porte', valor: 'Medio' };
  if (['grande', 'g'].includes(t)) return { tipo: 'porte', valor: 'Grande' };

  // Mapeamento de Espécie (Assumindo que o nome da espécie no banco seja exato)
  if (['gato', 'gatinho', 'felino'].includes(t)) return { tipo: 'especie', valor: 'Gato' };
  if (['cachorro', 'cão', 'cao', 'canino'].includes(t)) return { tipo: 'especie', valor: 'Cachorro' };

  return null;
}

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params;

  
  const termoNumero = Number(termo);

  if (!isNaN(termoNumero)) {
    try {
      const animais = await prisma.animal.findMany({
        include: { especie: true, fotos: true }, 
        where: {
          disponivel: true,
          OR: [
            { idade: termoNumero },
            { id: termoNumero } 
          ]
        }
      });
      return res.status(200).json(animais);
    } catch (error) {
      return res.status(400).json(error);
    }
  }

  // Busca Textual (Nome, Descrição, Espécie, Sexo, Porte)
  try {
    const intencao = analisarIntencao(termo);
    
    // Lista de condições de busca (OR)
    const condicoes: any[] = [
      // Busca genérica por texto (nome e descrição)
      { nome: { contains: termo, mode: 'insensitive' } },
      { descricao: { contains: termo, mode: 'insensitive' } },
      { especie: { nome: { contains: termo, mode: 'insensitive' } } }
    ];

    // Se identificamos que o usuário digitou uma categoria (ex: "Macho"),
    // adicionamos essa busca específica com prioridade/exatidão.
    if (intencao) {
      if (intencao.tipo === 'sexo') {
        condicoes.push({ sexo: intencao.valor });
      }
      if (intencao.tipo === 'porte') {
        condicoes.push({ porte: intencao.valor });
      }
      // Se for espécie, já é coberto pelo contains acima, mas podemos reforçar
      if (intencao.tipo === 'especie') {
        condicoes.push({ especie: { nome: { equals: intencao.valor as string, mode: 'insensitive' } } });
      }
    }

    const animais = await prisma.animal.findMany({
      include: {
        especie: true,
        fotos: true // Recomendado incluir a primeira foto na listagem
      },
      where: {
        disponivel: true, // Garante que só traz animais disponíveis
        OR: condicoes
      },
      orderBy: {
        updatedAt: 'desc' // Traz os mais recentes primeiro
      }
    });

    return res.status(200).json(animais);

  } catch (error) {
    console.error(error); // Log do erro para debug
    return res.status(400).json({ erro: "Erro ao realizar pesquisa" });
  }
});
// GET /animais/:id
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

// PATCH /animais/:id — SOMENTE disponivel/castracao
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
    // 🔍 Verificar se existe adoção vinculada
    const adocaoVinculada = await prisma.adocao.findFirst({
      where: { animalId: Number(id) },
      select: { status: true }
    });

    // ❌ Bloqueia se tentar alterar `disponivel` e existir adoção ativa/concluída
    if (updateData.disponivel !== undefined) {
      if (adocaoVinculada &&
         (adocaoVinculada.status === "Ativa" || adocaoVinculada.status === "Concluida")) 
      {
        return res.status(403).json({
          erro: `Este animal não pode ser marcado como disponível, pois possui uma adoção ${adocaoVinculada.status}.`
        });
      }
    }

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


