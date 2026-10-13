import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AdminModel } from '../models/Admin.js';
import { TeacherModel } from '../models/Teacher.js';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.js';

export async function unifiedLogin(req: Request, res: Response) {
  try {
    const identifier = req.body.identifier || req.body.username || req.body.teacherId;
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم / كود الدخول وكلمة المرور' });
    }

    const cleanId = String(identifier).trim();

    // 1. Check if identifier matches Master Admin
    const admin = await AdminModel.findOne({ username: cleanId });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (isMatch) {
        const token = generateToken({
          role: 'admin',
          username: admin.username,
        });

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
          success: true,
          token,
          user: {
            role: 'admin',
            username: admin.username,
          },
        });
      }
    }

    // 2. Check if identifier matches a Teacher
    const teacher = await TeacherModel.findOne({ teacherId: cleanId });
    if (teacher) {
      const isMatch = await bcrypt.compare(password, teacher.password);
      if (isMatch) {
        const token = generateToken({
          role: 'teacher',
          teacherId: teacher.teacherId,
          name: teacher.name,
        });

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
          success: true,
          token,
          user: {
            role: 'teacher',
            teacherId: teacher.teacherId,
            name: teacher.name,
          },
        });
      }
    }

    // If neither matched or password incorrect
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة، يرجى التأكد من اسم المستخدم أو كود الدخول وكلمة المرور' });
  } catch (error: any) {
    console.error('Unified login error:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء معالجة تسجيل الدخول' });
  }
}

export async function adminLogin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

    const admin = await AdminModel.findOne({ username: username.trim() });
    if (!admin) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const token = generateToken({
      role: 'admin',
      username: admin.username,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token,
      user: {
        role: 'admin',
        username: admin.username,
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'حدث خطأ في المصادقة' });
  }
}

export async function teacherLogin(req: Request, res: Response) {
  try {
    const { teacherId, password } = req.body;

    if (!teacherId || !password) {
      return res.status(400).json({ error: 'يرجى إدخال كود الدخول / رقم الهاتف وكلمة المرور' });
    }

    const teacher = await TeacherModel.findOne({ teacherId: teacherId.trim() });
    if (!teacher) {
      return res.status(401).json({ error: 'كود المعلم أو كلمة المرور غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'كود المعلم أو كلمة المرور غير صحيحة' });
    }

    const token = generateToken({
      role: 'teacher',
      teacherId: teacher.teacherId,
      name: teacher.name,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token,
      user: {
        role: 'teacher',
        teacherId: teacher.teacherId,
        name: teacher.name,
      },
    });
  } catch (error: any) {
    console.error('Teacher login error:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'غير مسجل الدخول' });
  }
  return res.json({ user: req.user });
}

export function logout(req: Request, res: Response) {
  res.clearCookie('token');
  return res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
}
