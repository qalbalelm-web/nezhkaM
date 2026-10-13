import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AdminModel } from '../models/Admin.js';
import { generateToken } from '../middleware/auth.js';

export async function getSetupStatus(req: Request, res: Response) {
  try {
    const adminCount = await AdminModel.countDocuments();
    return res.json({
      isSetupComplete: adminCount > 0,
      hasAdmin: adminCount > 0,
      adminCount,
    });
  } catch (error: any) {
    console.error('Error checking setup status:', error);
    return res.status(500).json({ error: 'فشل التحقق من حالة إعداد النظام' });
  }
}

export async function performSetup(req: Request, res: Response) {
  try {
    const adminCount = await AdminModel.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({
        error: 'تم تهيئة النظام مسبقاً. تم إغلاق مسار الإعداد بشكل نهائي لأسباب أمنية.',
      });
    }

    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'اسم المستخدم الرئيسي يجب أن يتكون من 3 أحرف على الأقل' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور الرئيسية يجب أن تتكون من 6 خانات على الأقل' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await AdminModel.create({
      username: username.trim(),
      password: hashedPassword,
    });

    const token = generateToken({
      role: 'admin',
      username: newAdmin.username,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'تم تأسيس الحساب الرئيسي لمدير منصة قلب العلم بنجاح!',
      token,
      user: {
        role: 'admin',
        username: newAdmin.username,
      },
    });
  } catch (error: any) {
    console.error('Error performing initial setup:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء حفظ بيانات المدير الرئيسي' });
  }
}
