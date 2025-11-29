import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"
import { verificaToken } from "../middewares/verificaToken"

const prisma = new PrismaClient()
const router = Router()

// Listar todos os admins
router.get("/", verificaToken, async (req, res) => {
  try {
    const admins = await prisma.admin.findMany()
    res.status(200).json(admins)
  } catch (error) {
    res.status(400).json(error)
  }
})

// Função para validar complexidade da senha
function validaSenha(senha: string) {
  const mensa: string[] = []

  if (senha.length < 8)
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")

  let pequenas = 0, grandes = 0, numeros = 0, simbolos = 0

  for (const letra of senha) {
    if ((/[a-z]/).test(letra)) pequenas++
    else if ((/[A-Z]/).test(letra)) grandes++
    else if ((/[0-9]/).test(letra)) numeros++
    else simbolos++
  }

  if (pequenas === 0 || grandes === 0 || numeros === 0 || simbolos === 0)
    mensa.push("Erro... senha deve possuir letras minúsculas, maiúsculas, números e símbolos")

  return mensa
}

// Criar admin
router.post("/", async (req, res) => {
  const { nome, email, senha, role } = req.body

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Informe nome, email e senha" })
  }

  const erros = validaSenha(senha)
  if (erros.length > 0)
    return res.status(400).json({ erro: erros.join("; ") })

  const hash = bcrypt.hashSync(senha, bcrypt.genSaltSync(12))

  try {
    const totalAdmins = await prisma.admin.count()

    let novaRole = role || "admin"

    if (totalAdmins === 0) {
      // Primeiro admin criado vira MASTER automaticamente
      novaRole = "master"
    } else {
      // Já existe admin -> precisa token e o token deve ser MASTER
      if (!req.headers.authorization) {
        return res.status(401).json({ erro: "Token é necessário para criar novos admins" })
      }

      const token = req.headers.authorization.split(" ")[1]
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_KEY as string)
        if (decoded.role !== "master") {
          return res.status(403).json({ erro: "Apenas admins master podem criar novos admins" })
        }
      } catch (err) {
        return res.status(401).json({ erro: "Token inválido" })
      }
    }

    const admin = await prisma.admin.create({
      data: {
        nome,
        email,
        senha: hash,
        role: novaRole,
        ativo: true
      }
    })

    res.status(201).json(admin)

  } catch (error) {
    res.status(400).json(error)
  }
})

// Login admin
router.post("/login", async (req, res) => {
  const { email, senha } = req.body
  const mensaPadrao = "Login ou senha incorretos"

  if (!email || !senha)
    return res.status(400).json({ erro: mensaPadrao })

  try {
    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    if (!admin)
      return res.status(400).json({ erro: mensaPadrao })

    // 🚨 BLOQUEIO SE ESTIVER INATIVO
    if (!admin.ativo) {
      return res.status(403).json({ erro: "Administrador inativo. Contate o responsável do sistema." })
    }

    // Validar senha
    if (bcrypt.compareSync(senha, admin.senha)) {
      const token = jwt.sign(
        {
          admin_logado_id: admin.id,
          admin_logado_nome: admin.nome,
          role: admin.role
        },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      )

      return res.status(200).json({
        id: admin.id,
        nome: admin.nome,
        role: admin.role,
        token
      })
    }

    return res.status(400).json({ erro: mensaPadrao })

  } catch (error: any) {
    console.error("Erro detalhado no login:", error)
    return res.status(500).json({ erro: "Erro interno do servidor", detalhe: error.message })
  }
})

// Atualizar admin
router.patch("/:id", verificaToken, async (req, res) => {
  const { id } = req.params
  const { nome, email, senha, role, ativo } = req.body

  const dados: any = {}

  if (nome) dados.nome = nome
  if (email) dados.email = email
  if (role) dados.role = role
  if (ativo !== undefined) dados.ativo = ativo

  if (senha) {
    const erros = validaSenha(senha)
    if (erros.length > 0)
      return res.status(400).json({ erro: erros.join("; ") })

    dados.senha = bcrypt.hashSync(senha, bcrypt.genSaltSync(12))
  }

  try {
    const admin = await prisma.admin.update({
      where: { id: Number(id) },
      data: dados
    })
    res.status(200).json(admin)

  } catch (error) {
    res.status(400).json(error)
  }
});
// Excluir admin
router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ erro: "Token necessário" });

    const decoded: any = jwt.verify(token, process.env.JWT_KEY as string);

    // Apenas MASTER pode excluir admin
    if (decoded.role !== "master") {
      return res.status(403).json({ erro: "Apenas admins MASTER podem excluir outros admins" });
    }

    // Impedir que um admin delete sua própria conta
    if (decoded.admin_logado_id == Number(id)) {
      return res.status(400).json({ erro: "Você não pode excluir sua própria conta" });
    }

    await prisma.admin.delete({
      where: { id: Number(id) }
    });

    return res.status(200).json({ mensagem: "Admin removido com sucesso" });

  } catch (error) {
    console.log("Erro ao deletar admin:", error);
    return res.status(400).json({ erro: "Erro ao excluir admin", detalhe: error });
  }
});


export default router
