import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  // Log the request
  console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} from ${ip}`);
  
  // Log response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} - ${res.statusCode} - ${duration}ms`
    );
  });
  
  next();
}

export function errorLogger(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[${new Date().toISOString()}] Error: ${err.message}\n${err.stack}`);
  next(err);
}
