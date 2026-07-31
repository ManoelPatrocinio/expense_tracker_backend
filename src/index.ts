import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express } from 'express';
import { connect } from './Database/database';
import { createDefaultUserIfNeeded } from './model/User';
import { basic_routers } from './routes/routes';

dotenv.config();

const app: Express = express();
const port = Number(process.env.PORT || 3333);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(basic_routers);

async function bootstrap(): Promise<void> {
  try {
    await connect();
    await createDefaultUserIfNeeded();

    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Não foi possível iniciar o servidor.');
    console.error(error);
    process.exitCode = 1;
  }
}

bootstrap();
