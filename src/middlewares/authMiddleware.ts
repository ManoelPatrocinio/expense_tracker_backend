import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../types/auth';
import { verifyToken } from '../utils/auth';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

export function authMiddleware(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return response.status(401).json({ message: 'Token de autenticação não informado.' });
  }

  const [type, token] = authorization.split(' ');

  if (type !== 'Bearer' || !token) {
    return response.status(401).json({ message: 'Formato de token inválido.' });
  }

  try {
    const payload = verifyToken(token);

    request.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };

    return next();
  } catch (error: any) {
    return response.status(401).json({ message: error?.message || 'Token inválido.' });
  }
}
