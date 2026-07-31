export type UserRole = 'admin' | 'user';

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthUserResponse = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginResponse = {
  token: string;
  user: AuthUserResponse;
  message: string;
};

export type TokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
};

export type CreateUserRequest = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};
