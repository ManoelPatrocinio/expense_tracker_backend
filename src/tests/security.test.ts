import assert from 'assert';
import mongoose from 'mongoose';
import { AuthenticatedUser } from '../middlewares/authMiddleware';
import { comparePassword, createToken, hashPassword, verifyToken } from '../utils/auth';
import { buildEventAccessFilter } from '../utils/eventAccess';

process.env.AUTH_JWT_SECRET = 'segredo-exclusivo-para-testes';

function runSecurityTests(): void {
  const passwordHash = hashPassword('senha123');
  assert.strictEqual(comparePassword('senha123', passwordHash), true);
  assert.strictEqual(comparePassword('senha-incorreta', passwordHash), false);

  const regularUser: AuthenticatedUser = {
    id: new mongoose.Types.ObjectId().toString(),
    name: 'Usuário Teste',
    email: 'usuario@teste.com',
    role: 'user',
  };

  const adminUser: AuthenticatedUser = {
    id: new mongoose.Types.ObjectId().toString(),
    name: 'Administrador',
    email: 'admin@teste.com',
    role: 'admin',
  };

  const userToken = createToken(regularUser);
  const decodedUserToken = verifyToken(userToken);
  assert.strictEqual(decodedUserToken.sub, regularUser.id);
  assert.strictEqual(decodedUserToken.role, 'user');

  const userFilter = buildEventAccessFilter(regularUser);
  assert.ok(userFilter.ownerId instanceof mongoose.Types.ObjectId);
  assert.strictEqual(String(userFilter.ownerId), regularUser.id);

  const adminFilter = buildEventAccessFilter(adminUser);
  assert.deepStrictEqual(adminFilter, {});

  console.log('Testes de autenticação e isolamento de registros executados com sucesso.');
}

runSecurityTests();
