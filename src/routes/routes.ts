import mongoose from 'mongoose';
import { Request, Response, Router } from 'express';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
  authMiddleware,
} from '../middlewares/authMiddleware';
import { eventModel } from '../model/Event';
import { userModel, UserDocument } from '../model/User';
import { AuthUserResponse, CreateUserRequest, LoginRequest } from '../types/auth';
import { EVENT_CATEGORIES, EventCategory } from '../types/event';
import { comparePassword, createToken, hashPassword, normalizeUserRole } from '../utils/auth';
import { buildEventAccessFilter } from '../utils/eventAccess';

const basic_routers = Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR_PATTERN = /^\d{4}$/;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[0-1])$/;

function toAuthUser(user: UserDocument): AuthUserResponse {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: normalizeUserRole(user.role),
  };
}

function getAuthenticatedUser(request: AuthenticatedRequest): AuthenticatedUser {
  if (!request.user) {
    throw new Error('Usuário autenticado não encontrado na requisição.');
  }

  return request.user;
}

function isEventCategory(category: unknown): category is EventCategory {
  return typeof category === 'string' && EVENT_CATEGORIES.includes(category as EventCategory);
}

basic_routers.get('/', (_request: Request, response: Response) => {
  return response.status(200).json({
    message: 'Expense Tracker API disponível.',
  });
});

basic_routers.post('/auth/login', async (request: Request, response: Response) => {
  const { email, password } = request.body as LoginRequest;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return response.status(400).json({
      message: 'E-mail e senha são obrigatórios.',
    });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user || !comparePassword(password, user.passwordHash)) {
      return response.status(401).json({
        message: 'E-mail ou senha inválidos.',
      });
    }

    const authUser = toAuthUser(user);
    const token = createToken(authUser);

    return response.status(200).json({
      token,
      user: authUser,
      message: 'Login realizado com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao validar login:', error);

    return response.status(500).json({
      message: 'Não foi possível validar o login, tente novamente.',
    });
  }
});

basic_routers.post('/auth/register', async (request: Request, response: Response) => {
  const { name, email, password, confirmPassword } = request.body as CreateUserRequest;
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
  const normalizedPassword = typeof password === 'string' ? password : '';
  const normalizedConfirmPassword =
    typeof confirmPassword === 'string' ? confirmPassword : '';

  if (!normalizedName || !normalizedEmail || !normalizedPassword || !normalizedConfirmPassword) {
    return response.status(400).json({
      message: 'Nome, e-mail, senha e confirmação de senha são obrigatórios.',
    });
  }

  if (normalizedName.length < 3) {
    return response.status(400).json({
      message: 'O nome precisa ter no mínimo 3 caracteres. f',
    });
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return response.status(400).json({
      message: 'Informe um e-mail válido.',
    });
  }

  if (normalizedPassword.length < 6) {
    return response.status(400).json({
      message: 'A senha precisa ter no mínimo 6 caracteres.',
    });
  }

  if (normalizedPassword !== normalizedConfirmPassword) {
    return response.status(400).json({
      message: 'A confirmação de senha não confere.',
    });
  }

  try {
    const userAlreadyExists = await userModel.exists({ email: normalizedEmail });

    if (userAlreadyExists) {
      return response.status(409).json({
        message: 'Já existe um usuário cadastrado com este e-mail.',
      });
    }

    const user = await userModel.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: hashPassword(normalizedPassword),
      role: 'user',
    });

    const authUser = toAuthUser(user);
    const token = createToken(authUser);

    return response.status(201).json({
      token,
      user: authUser,
      message: 'Usuário cadastrado com sucesso.',
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return response.status(409).json({
        message: 'Já existe um usuário cadastrado com este e-mail.',
      });
    }

    console.error('Erro ao cadastrar usuário:', error);

    return response.status(500).json({
      message: 'Não foi possível cadastrar o usuário, tente novamente.',
    });
  }
});

basic_routers.post(
  '/add_event',
  authMiddleware,
  async (request: AuthenticatedRequest, response: Response) => {
    const { date, category, title, value } = request.body;
    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const normalizedValue = Number(value);

    if (!DATE_PATTERN.test(String(date))) {
      return response.status(400).json({
        message: 'Informe uma data válida no formato AAAA-MM-DD.',
      });
    }

    if (!isEventCategory(category)) {
      return response.status(400).json({
        message: 'Informe uma categoria válida.',
      });
    }

    if (normalizedTitle.length < 3 || normalizedTitle.length > 100) {
      return response.status(400).json({
        message: 'O título precisa ter entre 3 e 100 caracteres.',
      });
    }

    if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
      return response.status(400).json({
        message: 'Informe um valor numérico válido e maior ou igual a zero.',
      });
    }

    try {
      const authenticatedUser = getAuthenticatedUser(request);
      const createdEvent = await eventModel.create({
        date,
        category,
        title: normalizedTitle,
        value: normalizedValue,
        ownerId: new mongoose.Types.ObjectId(authenticatedUser.id),
      });

      return response.status(201).json({
        message: 'Evento adicionado com sucesso.',
        event: createdEvent,
      });
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);

      return response.status(500).json({
        message: 'Não foi possível adicionar o evento, tente novamente.',
      });
    }
  }
);

basic_routers.get(
  '/list_by_date/:date',
  authMiddleware,
  async (request: AuthenticatedRequest, response: Response) => {
    const { date } = request.params;

    if (!MONTH_PATTERN.test(date)) {
      return response.status(400).json({
        message: 'Informe o mês no formato AAAA-MM.',
      });
    }

    try {
      const accessFilter = buildEventAccessFilter(getAuthenticatedUser(request));
      const eventsPerMonth = await eventModel
        .find({
          ...accessFilter,
          date: { $regex: `^${date}-` },
        })
        .sort({ date: 1, createdAt: 1 });

      return response.status(200).json({
        message: 'Eventos encontrados com sucesso.',
        events: eventsPerMonth,
      });
    } catch (error) {
      console.error('Erro ao listar eventos:', error);

      return response.status(500).json({
        message: 'Não foi possível retornar os eventos dessa data, tente novamente.',
      });
    }
  }
);

basic_routers.delete(
  '/remove_by_id/:eventId',
  authMiddleware,
  async (request: AuthenticatedRequest, response: Response) => {
    const { eventId } = request.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return response.status(400).json({
        message: 'Identificador do evento inválido.',
      });
    }

    try {
      const accessFilter = buildEventAccessFilter(getAuthenticatedUser(request));
      const deletedEvent = await eventModel.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(eventId),
        ...accessFilter,
      });

      if (!deletedEvent) {
        return response.status(404).json({
          message: 'Evento não encontrado ou sem permissão para removê-lo.',
        });
      }

      return response.status(200).json({
        message: 'Evento apagado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao apagar evento:', error);

      return response.status(500).json({
        message: 'Não foi possível apagar esse evento, tente novamente.',
      });
    }
  }
);

basic_routers.get(
  '/balance_by_category/:date',
  authMiddleware,
  async (request: AuthenticatedRequest, response: Response) => {
    const { date } = request.params;

    if (!MONTH_PATTERN.test(date)) {
      return response.status(400).json({
        message: 'Informe o mês no formato AAAA-MM.',
      });
    }

    try {
      const accessFilter = buildEventAccessFilter(getAuthenticatedUser(request));
      const eventsPerCategory = await eventModel.aggregate([
        {
          $match: {
            ...accessFilter,
            date: { $regex: `^${date}-` },
          },
        },
        {
          $group: {
            _id: '$category',
            value: { $sum: '$value' },
          },
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            value: 1,
          },
        },
        {
          $sort: {
            category: 1,
          },
        },
      ]);

      return response.status(200).json({
        message: 'Saldo por categoria calculado com sucesso.',
        balanceCategory: eventsPerCategory,
      });
    } catch (error) {
      console.error('Erro ao calcular saldo por categoria:', error);

      return response.status(500).json({
        message: 'Não foi possível retornar os eventos dessa data, tente novamente.',
      });
    }
  }
);

basic_routers.get(
  '/balance_by_year/:year',
  authMiddleware,
  async (request: AuthenticatedRequest, response: Response) => {
    const { year } = request.params;

    if (!YEAR_PATTERN.test(year)) {
      return response.status(400).json({
        message: 'Informe o ano no formato AAAA.',
      });
    }

    try {
      const accessFilter = buildEventAccessFilter(getAuthenticatedUser(request));
      const totals = await eventModel.aggregate<{ month: number; total: number }>([
        {
          $match: {
            ...accessFilter,
            date: { $regex: `^${year}-` },
            category: { $nin: ['income', 'investment'] },
          },
        },
        {
          $group: {
            _id: { $toInt: { $substrBytes: ['$date', 5, 2] } },
            total: { $sum: '$value' },
          },
        },
        {
          $project: {
            _id: 0,
            month: '$_id',
            total: 1,
          },
        },
      ]);

      const totalByMonth = new Map(totals.map((item) => [item.month, item.total]));
      const yearResult = Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        total: totalByMonth.get(index + 1) || 0,
      }));

      return response.status(200).json({
        message: 'Saldo anual calculado com sucesso.',
        yearResult,
      });
    } catch (error) {
      console.error('Erro ao calcular saldo anual:', error);

      return response.status(500).json({
        message: 'Não foi possível calcular o saldo anual, tente novamente.',
      });
    }
  }
);

export { basic_routers };
