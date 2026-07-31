import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { userModel } from '../model/User';
import { UserRole } from '../types/auth';
import { hashPassword } from '../utils/auth';

dotenv.config();

type CreateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
};

type ValidCreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

function getArgumentValue(argumentName: string): string | undefined {
  const argument = process.argv.find((currentArgument) =>
    currentArgument.startsWith(`--${argumentName}=`)
  );

  if (!argument) {
    return undefined;
  }

  return argument.replace(`--${argumentName}=`, '').trim();
}

function getCreateUserInput(): CreateUserInput {
  return {
    name: getArgumentValue('name') || process.env.USER_NAME,
    email: getArgumentValue('email') || process.env.USER_EMAIL,
    password: getArgumentValue('password') || process.env.USER_PASSWORD,
    role: getArgumentValue('role') || process.env.USER_ROLE || 'user',
  };
}

function validateInput(input: CreateUserInput): ValidCreateUserInput {
  const errors: string[] = [];

  if (!input.name) {
    errors.push('Informe o nome com --name="Nome do Usuário" ou USER_NAME no .env.');
  }

  if (!input.email) {
    errors.push('Informe o e-mail com --email="usuario@email.com" ou USER_EMAIL no .env.');
  }

  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push('Informe um e-mail válido.');
  }

  if (!input.password) {
    errors.push('Informe a senha com --password="123456" ou USER_PASSWORD no .env.');
  }

  if (input.password && input.password.length < 6) {
    errors.push('A senha precisa ter no mínimo 6 caracteres.');
  }

  if (input.role !== 'admin' && input.role !== 'user') {
    errors.push('O perfil deve ser "admin" ou "user".');
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return {
    name: input.name!.trim(),
    email: input.email!.toLowerCase().trim(),
    password: input.password!,
    role: input.role as UserRole,
  };
}

async function connectDatabase(): Promise<void> {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    throw new Error('A variável MONGO_URL precisa estar configurada no .env.');
  }

  await mongoose.connect(mongoUrl);
}

async function createUser(): Promise<void> {
  const input = validateInput(getCreateUserInput());

  await connectDatabase();

  const userAlreadyExists = await userModel.findOne({ email: input.email });

  if (userAlreadyExists) {
    throw new Error(`Já existe um usuário cadastrado com o e-mail ${input.email}.`);
  }

  const user = await userModel.create({
    name: input.name,
    email: input.email,
    passwordHash: hashPassword(input.password),
    role: input.role,
  });

  console.log('Usuário criado com sucesso!');
  console.log(`ID: ${user._id}`);
  console.log(`Nome: ${user.name}`);
  console.log(`E-mail: ${user.email}`);
  console.log(`Perfil: ${user.role}`);
}

createUser()
  .catch((error: Error) => {
    console.error('Não foi possível criar o usuário.');
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
