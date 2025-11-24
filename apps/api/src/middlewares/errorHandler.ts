import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
    
    // Capturar el stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (
  message: string,
  statusCode: number,
  code: string
) => {
  return new AppError(message, statusCode, code);
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log del error para debugging
  // console.error('Error occurred:', {
  //   message: err.message,
  //   stack: err.stack,
  //   url: req.url,
  //   method: req.method,
  //   ip: req.ip,
  //   timestamp: new Date().toISOString(),
  // });

  // Error conocido de la aplicación
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode,
      },
    });
  }

  // Errores de validación de Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Datos de entrada inválidos',
        code: 'VALIDATION_ERROR',
        details: err.message,
      },
    });
  }

  // Errores de sintaxis JSON
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'JSON inválido en el cuerpo de la petición',
        code: 'INVALID_JSON',
      },
    });
  }

  // Error JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token inválido',
        code: 'INVALID_TOKEN',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED',
      },
    });
  }

  // Error no manejado - genérico
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: {
      message: isDevelopment ? err.message : 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
      ...(isDevelopment && { stack: err.stack }),
    },
  });
};

// Middleware para manejar rutas no encontradas
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Ruta ${req.method} ${req.path} no encontrada`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
};

// Middleware async wrapper para capturar errores async
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

