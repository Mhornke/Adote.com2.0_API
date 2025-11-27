import { Router } from "express";
import { verificaToken } from "../middewares/verificaToken";

const router = Router();

// ... outras rotas ...

// ✅ ROTA PURA PARA VALIDAR TOKEN
// Se o middleware deixar passar, retorna 200 (OK). Se não, o middleware já retornou 401.
router.get("/validar-token", verificaToken, (req, res) => {
  // Não precisa buscar no banco se você só quer validar a assinatura do token
  res.status(200).json({ valido: true });
});

export default router;