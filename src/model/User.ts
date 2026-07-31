import mongoose, { Document } from 'mongoose';
import { UserRole } from '../types/auth';
import { hashPassword } from '../utils/auth';

const Schema = mongoose.Schema;

export type UserDocument = Document & {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model<UserDocument>('User', userSchema);

export async function createDefaultUserIfNeeded(): Promise<void> {
  const defaultEmail = process.env.AUTH_DEFAULT_EMAIL;
  const defaultPassword = process.env.AUTH_DEFAULT_PASSWORD;
  const defaultName = process.env.AUTH_DEFAULT_NAME || 'Administrador';

  if (!defaultEmail || !defaultPassword) {
    return;
  }

  const normalizedEmail = defaultEmail.toLowerCase().trim();
  const existingUser = await userModel.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (existingUser.role !== 'admin') {
      existingUser.role = 'admin';
      await existingUser.save();
      console.log(`Usuário padrão promovido para administrador: ${normalizedEmail}`);
    }

    return;
  }

  await userModel.create({
    name: defaultName.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(defaultPassword),
    role: 'admin',
  });

  console.log(`Usuário administrador padrão criado: ${normalizedEmail}`);
}

export { userModel };
