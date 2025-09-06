import { Request, Response, NextFunction } from 'express';
import createHttpError, { HttpError } from 'http-errors';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error | HttpError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  console.error(`[${new Date().toISOString()}] Error:`, err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle HTTP errors
  if ('status' in err && 'expose' in err) {
    return res.status(err.statusCode || 500).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle other errors
  res.status(500).json({
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { message: err.message, stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(createHttpError(404, 'Not Found'));
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
