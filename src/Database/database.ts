import mongoose from 'mongoose';
import 'dotenv/config';

export async function connect(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    throw new Error('A variável MONGO_URL precisa estar configurada no .env.');
  }

  await mongoose.connect(mongoUrl);
  console.log('Connected to database');
}

export async function disconnect(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}
