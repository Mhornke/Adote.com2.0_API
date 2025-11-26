import jwt from "jsonwebtoken";

interface UserPayload {
  id: string;
  nome: string;
}

// Adicionamos o parâmetro 'manterConectado' com valor padrão false
export function gerarTokenAdotante(usuario: UserPayload, manterConectado: boolean = false): string {
  
  if (!process.env.JWT_KEY) {
    throw new Error("A variável de ambiente JWT_KEY não está definida!");
  }

  const payload = {
    userLogadoId: usuario.id,
    userLogadoNome: usuario.nome
  };

  // Lógica: Se manterConectado for true, 7 dias ('7d'). Se não, 1 hora ('1h').
  const tempoDeVida = manterConectado ? '7d' : '1h';

  const token = jwt.sign(payload, process.env.JWT_KEY, {
    expiresIn: tempoDeVida, 
  });

  return token;
}
