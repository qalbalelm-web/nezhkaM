import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'science_heart_platform_secret_jwt_key_2026_qalb_alelm';

export interface AuthenticatedRequest extends Request {
  user?: {
    role: 'admin' | 'teacher';
    username?: string;
    teacherId?: string;
    name?: string;
  };
}

export function generateToken(payload: {
  role: 'admin' | 'teacher';
  username?: string;
  teacherId?: string;
  name?: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'غير مصرح: يرجى تسجيل الدخول أولاً' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'جلسة العمل منتهية أو غير صالحة. يرجى تسجيل الدخول مجدداً' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'محظور: هذه الصفحة مخصصة لمدير النظام فقط' });
    }
    next();
  });
}

export function requireTeacher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    if (req.user?.role !== 'teacher' || !req.user?.teacherId) {
      return res.status(403).json({ error: 'محظور: هذه الصفحة مخصصة للمدرسين المصرح لهم فقط' });
    }
    next();
  });
}
