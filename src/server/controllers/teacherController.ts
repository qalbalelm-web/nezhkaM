import { Response } from 'express';
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

export async function getTeacherProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const teacherId = req.user?.teacherId;
    if (!teacherId) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    const teacher = await TeacherModel.findOne({ teacherId });
    if (!teacher) {
      return res.status(404).json({ error: 'بيانات المدرس غير موجودة' });
    }

    const myVideos = await VideoModel.find({ teacherId });
    const totalStorageBytes = myVideos.reduce((acc, v) => acc + (v.fileSize || 0), 0);

    return res.json({
      teacher: {
        teacherId: teacher.teacherId,
        name: teacher.name,
        videoCount: myVideos.length,
        totalStorageBytes,
        formattedStorage: formatBytes(totalStorageBytes),
      },
    });
  } catch (error: any) {
    console.error('Error fetching teacher profile:', error);
    return res.status(500).json({ error: 'فشل جلب بيانات المدرس' });
  }
}

export async function getUploadCredentials(req: AuthenticatedRequest, res: Response) {
  try {
    const teacherId = req.user?.teacherId;
    if (!teacherId) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    const teacher = await TeacherModel.findOne({ teacherId });
    if (!teacher || !teacher.pixeldrainApiKey) {
      return res.status(400).json({ error: 'لم يتم العثور على مفتاح Pixeldrain API الخاص بهذا الحساب' });
    }

    // Returns the credentials strictly to this authenticated teacher for direct browser-to-Pixeldrain upload
    return res.json({
      uploadUrl: 'https://pixeldrain.com/api/file',
      apiKey: teacher.pixeldrainApiKey,
      teacherId: teacher.teacherId,
    });
  } catch (error: any) {
    console.error('Error getting upload credentials:', error);
    return res.status(500).json({ error: 'فشل جلب تصريح الرفع' });
  }
}

export async function getMyVideos(req: AuthenticatedRequest, res: Response) {
  try {
    const teacherId = req.user?.teacherId;
    if (!teacherId) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    // Absolute isolation: query strictly filters by logged-in teacherId
    const videos = await VideoModel.find({ teacherId });

    const formattedVideos = videos.map(v => ({
      _id: v._id,
      videoId: v.videoId,
      teacherId: v.teacherId,
      title: v.title,
      fileSize: v.fileSize,
      formattedSize: formatBytes(v.fileSize),
      directPlaybackUrl: v.directPlaybackUrl || `https://pixeldrain.com/api/file/${v.videoId}`,
      uploadedAt: v.uploadedAt,
    }));

    return res.json({ videos: formattedVideos });
  } catch (error: any) {
    console.error('Error getting teacher videos:', error);
    return res.status(500).json({ error: 'فشل جلب قائمة الفيديوهات' });
  }
}

export async function registerVideo(req: AuthenticatedRequest, res: Response) {
  try {
    const teacherId = req.user?.teacherId;
    if (!teacherId) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    const { videoId, title, fileSize } = req.body;

    if (!videoId || !title) {
      return res.status(400).json({ error: 'معرف الفيديو من Pixeldrain وعنوان الفيديو مطلوبان' });
    }

    const cleanVideoId = String(videoId).trim();
    // Verify if already registered
    const existing = await VideoModel.findOne({ videoId: cleanVideoId, teacherId });
    if (existing) {
      return res.json({
        success: true,
        message: 'الفيديو مسجل مسبقاً',
        video: existing,
      });
    }

    // Standard raw playback URL bypassing Pixeldrain UI
    const directPlaybackUrl = `https://pixeldrain.com/api/file/${cleanVideoId}`;

    const newVideo = await VideoModel.create({
      videoId: cleanVideoId,
      teacherId,
      title: String(title).trim(),
      fileSize: Number(fileSize) || 0,
      directPlaybackUrl,
    });

    return res.status(201).json({
      success: true,
      message: 'تم تسجيل الفيديو بنجاح في قاعدة البيانات',
      video: {
        ...newVideo,
        formattedSize: formatBytes(newVideo.fileSize),
      },
    });
  } catch (error: any) {
    console.error('Error registering video:', error);
    return res.status(500).json({ error: 'فشل تسجيل الفيديو في قاعدة البيانات' });
  }
}

export async function deleteMyVideo(req: AuthenticatedRequest, res: Response) {
  try {
    const teacherId = req.user?.teacherId;
    const { id } = req.params;

    if (!teacherId || !id) {
      return res.status(400).json({ error: 'بيانات غير كافية' });
    }

    const video = await VideoModel.findOne({ videoId: id, teacherId }) || await VideoModel.findOne({ _id: id, teacherId });
    if (!video) {
      return res.status(404).json({ error: 'الفيديو غير موجود أو لا تملك صلاحية حذفه' });
    }

    // Attempt to delete from Pixeldrain if teacher has API key
    try {
      const teacher = await TeacherModel.findOne({ teacherId });
      if (teacher?.pixeldrainApiKey) {
        const authHeader = 'Basic ' + Buffer.from(`:${teacher.pixeldrainApiKey}`).toString('base64');
        await fetch(`https://pixeldrain.com/api/file/${video.videoId}`, {
          method: 'DELETE',
          headers: {
            Authorization: authHeader,
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Could not delete file from Pixeldrain upstream (may already be deleted):', e);
    }

    await VideoModel.findByIdAndDelete(video._id || video.videoId, teacherId);

    return res.json({
      success: true,
      message: 'تم حذف الفيديو بنجاح',
    });
  } catch (error: any) {
    console.error('Error deleting video:', error);
    return res.status(500).json({ error: 'فشل حذف الفيديو' });
  }
}
