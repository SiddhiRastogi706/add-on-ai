import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { walletBillingContext } from '../services/wallet-billing-context';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing. Server refusing to start in production.');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'marketmind_dev_jwt_secret_change_me';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const tokenFromQuery = req.query.token as string | undefined;

  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (tokenFromQuery) {
    token = tokenFromQuery.trim();
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is required. Please provide Authorization: Bearer <token>.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      organizationId: string;
      role: string;
    };

    if (!decoded.id || !decoded.organizationId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Malformed authentication token payload.',
      });
    }

    req.user = decoded;
    walletBillingContext.run({ organizationId: decoded.organizationId }, next);
  } catch (err: any) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.name === 'TokenExpiredError' ? 'Authentication token has expired' : 'Invalid authentication token',
    });
  }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const tokenFromQuery = req.query.token as string | undefined;

  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (tokenFromQuery) {
    token = tokenFromQuery.trim();
  }

  if (token && token !== 'null' && token !== 'undefined') {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.id && decoded.organizationId) {
        req.user = decoded;
        return walletBillingContext.run({ organizationId: decoded.organizationId }, next);
      }
    } catch {
      // Ignore token decoding failure in optional mode
    }
  }

  next();
}
