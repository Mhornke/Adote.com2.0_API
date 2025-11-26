import { User } from "../interfaces/User";

declare global {
  namespace Express {
    interface Request {
      userLogadoId?: number;
      userLogado?: User; // caso queira armazenar o usuário inteiro
    }
  }
}
export{}