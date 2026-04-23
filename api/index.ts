// Handler serverless da Vercel: exporta o app Express como default.
// A Vercel (via @vercel/node) aceita (req, res) compatível com http.IncomingMessage/ServerResponse,
// que é exatamente o que uma app Express implementa ao ser chamada como função.
//
// Todas as rotas definidas no app (prefixo /api/*) ficam disponíveis porque o
// vercel.json reescreve /api/(.*) → /api (este arquivo).
import { createApp } from '../backend/src/app';

const app = createApp();

export default app;
