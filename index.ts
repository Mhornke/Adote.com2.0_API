import express from 'express'
import cors from 'cors'

// Rotas
import especiesRoutes from './routes/especies'
import animaisRoutes from './routes/animais'
import fotosRoutes from './routes/fotos'
import adotantesRoutes from './routes/adotantes'
import pedidosRoutes from './routes/pedidos'
import adminsRoutes from './routes/admins'
import dashboardRoutes from './routes/dashboard'
import adocoesRoutes from './routes/adocoes'
import acompanhamentoRoutes from './routes/acompanhamento'
import vacinasAplicadasRoutes from './routes/vacinasAplicadas'
import comentariosRoutes from './routes/comentario'
import mensagensRoutes from './routes/mensagem'
import postsComunidadeRoutes from './routes/postComunidade'
import animaisPerdidosRoutes from './routes/animalPerdido'

const app = express()
const port = 3004

// Middlewares
app.use(express.json())
app.use(cors())

// Rotas principais
app.use('/especies', especiesRoutes)
app.use('/animais', animaisRoutes)
app.use('/fotos', fotosRoutes)
app.use('/adotantes', adotantesRoutes)
app.use('/pedidos', pedidosRoutes)
app.use('/admins', adminsRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/adocoes', adocoesRoutes)
app.use('/acompanhamento', acompanhamentoRoutes)
app.use('/vacinas-aplicadas', vacinasAplicadasRoutes)
app.use('/comentarios', comentariosRoutes)
app.use('/mensagens', mensagensRoutes)
app.use('/posts-comunidade', postsComunidadeRoutes)
app.use('/animais-perdidos', animaisPerdidosRoutes)

// Rota raiz
app.get('/', (req, res) => {
  res.send('🐾 API do Sistema de Canil rodando com sucesso!')
})

// Inicialização
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta: ${port}`)
})
