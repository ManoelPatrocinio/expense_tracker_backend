import mongoose from 'mongoose';
import { AuthenticatedUser } from '../middlewares/authMiddleware';

export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'admin';
}

export function buildEventAccessFilter(user: AuthenticatedUser): Record<string, unknown> {
  if (isAdmin(user)) {
    return {};
  }

  if (!mongoose.Types.ObjectId.isValid(user.id)) {
    throw new Error('Identificador do usuário autenticado é inválido.');
  }

  return {
    ownerId: new mongoose.Types.ObjectId(user.id),
  };
}
