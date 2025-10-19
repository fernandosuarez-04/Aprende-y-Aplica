import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { createError } from './errorHandler';

// Extender el tipo Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      throw createError(
        'Token de acceso requerido',
        401,
        'MISSING_TOKEN'
      );
    }

    // Verificar JWT
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    
    // Añadir información del usuario a la request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(createError('Token inválido', 401, 'INVALID_TOKEN'));
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return next(createError('Token expirado', 401, 'TOKEN_EXPIRED'));
    }

    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Usuario no autenticado', 401, 'UNAUTHENTICATED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError(
        'No tienes permisos para acceder a este recurso',
        403,
        'INSUFFICIENT_PERMISSIONS'
      ));
    }

    next();
  };
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // En optionalAuth, los errores de token se ignoran
    next();
  }
};

