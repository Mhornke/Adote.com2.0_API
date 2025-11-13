import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.get("/gerais", async (req, res) => {
  try {
    const adotantes = await prisma.adotante.count()
    const animais = await prisma.animal.count()
    const pedidos = await prisma.pedido.count()
    res.status(200).json({ adotantes, animais, pedidos })
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/animaisEspecie", async (req, res) => {
  try {
    const animais = await prisma.animal.groupBy({
      by: ['especieId'],
      _count: {
        id: true, 
      }
    })

    // Para cada carro, inclui o nome da marca relacionada ao marcaId
    const animaisEspecie = await Promise.all(
      animais.map(async (animal) => {
        const especie = await prisma.especie.findUnique({
          where: { id: animal.especieId }
        })
        return {
          especie: especie?.nome, 
          num: animal._count.id
        }
      })
    )
    res.status(200).json(animaisEspecie)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router
