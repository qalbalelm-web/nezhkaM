import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { TeacherModel } from '../models/Teacher.js';
import { VideoModel } from '../models/Video.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function getTeachers(req: AuthenticatedRequest, res: Response) {
  try {
    const teachers = await TeacherModel.find();
    const allVideos = await VideoModel.find();

    // Map each teacher to include their video count & storage consumption
    const enrichedTeachers = teachers.map(teacher => {
      const teacherVideos = allVideos.filter(v => v.teacherId === teacher.teacherId);
      const videoCount = teacherVideos.length;
      const totalStorageBytes = teacherVideos.reduce((acc, v) => acc + (v.fileSize || 0), 0);

      // Mask pixeldrain key for display (show only first 4 chars + ****)
      const rawKey = teacher.pixeldrainApiKey || '';
      const maskedKey = rawKey.length > 6 
        ? rawKey.slice(0, 4) + '••••••••' + rawKey.slice(-2) 
        : '••••••••';

      return {
        ...teacher,
        maskedApiKey: maskedKey,
        videoCount,
        totalStorageBytes,
        formattedStorage: formatBytes(totalStorageBytes),
      };
    });

    return res.json({ teachers: enrichedTeachers });
  } catch (error: any) {
    console.error('Error fetching teachers:', error);
    return res.status(500).json({ error: 'فشل تحميل قائمة المدرسين' });
  }
}

export async function createTeacher(req: AuthenticatedRequest, res: Response) {
  try {
    const { teacherId, name, password, pixeldrainApiKey } = req.body;

    if (!teacherId || !name || !password || !pixeldrainApiKey) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة (الكود/الهاتف، الاسم، كلمة المرور، مفتاح Pixeldrain API)' });
    }

    const trimmedTeacherId = teacherId.trim();
    const existing = await TeacherModel.findOne({ teacherId: trimmedTeacherId });
    if (existing) {
      return res.status(400).json({ error: 'كود المدرس أو رقم الهاتف مسجل مسبقاً' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newTeacher = await TeacherModel.create({
      teacherId: trimmedTeacherId,
      name: name.trim(),
      password: hashedPassword,
      pixeldrainApiKey: pixeldrainApiKey.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'تم إضافة المدرس بنجاح',
      teacher: newTeacher,
    });
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    return res.status(500).json({ error: 'فشل في حفظ بيانات المدرس الجديد' });
  }
}

export async function deleteTeacher(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'معرف المدرس مطلوب' });
    }

    const teacher = await TeacherModel.findById(id);
    if (!teacher) {
      return res.status(404).json({ error: 'المدرس غير موجود' });
    }

    await TeacherModel.findByIdAndDelete(teacher._id || teacher.teacherId);
    // Remove all associated videos
    await VideoModel.deleteMany({ teacherId: teacher.teacherId });

    return res.json({
      success: true,
      message: `تم حذف المدرس (${teacher.name}) وجميع سجلات فيديوهاته بنجاح`,
    });
  } catch (error: any) {
    console.error('Error deleting teacher:', error);
    return res.status(500).json({ error: 'فشل في حذف حساب المدرس' });
  }
}

export async function getStorageMetrics(req: AuthenticatedRequest, res: Response) {
  try {
    const totalTeachers = await TeacherModel.countDocuments();
    const allVideos = await VideoModel.find();
    const teachers = await TeacherModel.find();

    const totalVideos = allVideos.length;
    const totalStorageBytes = allVideos.reduce((sum, v) => sum + (v.fileSize || 0), 0);

    const teacherMap = new Map<string, string>();
    teachers.forEach(t => teacherMap.set(t.teacherId, t.name));

    const recentUploads = allVideos.slice(0, 8).map(v => ({
      videoId: v.videoId,
      title: v.title,
      fileSize: v.fileSize,
      formattedSize: formatBytes(v.fileSize),
      uploadedAt: v.uploadedAt,
      teacherId: v.teacherId,
      teacherName: teacherMap.get(v.teacherId) || v.teacherId,
      directPlaybackUrl: v.directPlaybackUrl,
    }));

    return res.json({
      metrics: {
        totalTeachers,
        totalVideos,
        totalStorageBytes,
        formattedStorage: formatBytes(totalStorageBytes),
        recentUploads,
      },
    });
  } catch (error: any) {
    console.error('Error getting metrics:', error);
    return res.status(500).json({ error: 'فشل جلب إحصائيات التخزين' });
  }
}

export async function getDatabaseStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const isConnected = (await import('../config/db.js')).getIsMongoConnected();
    const activeUri = (await import('../config/db.js')).getActiveMongoUri();
    const teachersCount = await TeacherModel.countDocuments();
    const videosCount = await VideoModel.countDocuments();

    // Mask URI for display (show protocol and host, hide password)
    let maskedUri = null;
    if (activeUri) {
      maskedUri = activeUri.replace(/:\/\/(.*?):(.*?)@/, '://***:***@');
    }

    return res.json({
      isMongoConnected: isConnected,
      storageType: isConnected ? 'MongoDB Cloud Atlas (حفظ سحابي دائم 100%)' : 'المخزن المحلي المستمر (.data/storage_db.json)',
      maskedUri,
      teachersCount,
      videosCount,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'فشل فحص حالة قاعدة البيانات' });
  }
}

export async function updateMongoConnection(req: AuthenticatedRequest, res: Response) {
  try {
    const { mongodbUri } = req.body;
    if (!mongodbUri || typeof mongodbUri !== 'string') {
      return res.status(400).json({ error: 'يرجى تقديم رابط اتصال MongoDB صالح' });
    }

    const { connectToMongoUri } = await import('../config/db.js');
    await connectToMongoUri(mongodbUri.trim());

    return res.json({
      success: true,
      message: 'تم الاتصال بقاعدة بيانات MongoDB السحابية بنجاح! يتم الآن حفظ جميع البيانات بشكل دائم.',
    });
  } catch (error: any) {
    return res.status(400).json({
      error: 'فشل الاتصال بقاعدة بيانات MongoDB: ' + (error.message || 'تحقق من صحة الرابط واسم المستخدم وكلمة المرور وصلاحية الشبكة 0.0.0.0/0 في Atlas'),
    });
  }
}

export async function exportDatabaseBackup(req: AuthenticatedRequest, res: Response) {
  try {
    const teachers = await TeacherModel.find();
    const videos = await VideoModel.find();

    const backupData = {
      platform: 'مخزن منصة قلب العلم',
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      teachers,
      videos,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="science_heart_backup_${Date.now()}.json"`);
    return res.json(backupData);
  } catch (error: any) {
    return res.status(500).json({ error: 'فشل استخراج النسخة الاحتياطية' });
  }
}

export async function restoreDatabaseBackup(req: AuthenticatedRequest, res: Response) {
  try {
    const { teachers, videos } = req.body;

    if (!Array.isArray(teachers) || !Array.isArray(videos)) {
      return res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح (يجب أن يحتوي على مصفوفتي teachers و videos)' });
    }

    let restoredTeachers = 0;
    let restoredVideos = 0;

    for (const t of teachers) {
      if (t.teacherId && t.name) {
        const exists = await TeacherModel.findOne({ teacherId: t.teacherId });
        if (!exists) {
          await TeacherModel.create({
            teacherId: t.teacherId,
            name: t.name,
            password: t.password || 'password123',
            pixeldrainApiKey: t.pixeldrainApiKey || '',
          });
          restoredTeachers++;
        }
      }
    }

    for (const v of videos) {
      if (v.videoId && v.teacherId && v.title) {
        const exists = await VideoModel.findOne({ videoId: v.videoId, teacherId: v.teacherId });
        if (!exists) {
          await VideoModel.create({
            videoId: v.videoId,
            teacherId: v.teacherId,
            title: v.title,
            fileSize: v.fileSize || 0,
            directPlaybackUrl: v.directPlaybackUrl || `https://pixeldrain.com/api/file/${v.videoId}`,
          });
          restoredVideos++;
        }
      }
    }

    return res.json({
      success: true,
      message: `تم استرجاع النسخة الاحتياطية بنجاح! تم استعادة (${restoredTeachers}) معلم و (${restoredVideos}) فيديو.`,
      restoredTeachers,
      restoredVideos,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'فشل استعادة النسخة الاحتياطية: ' + error.message });
  }
}

