export interface IAdmin {
  _id?: string;
  username: string;
  password?: string;
  createdAt?: string | Date;
}

export interface ITeacher {
  _id?: string;
  teacherId: string; // Unique Login Code or Phone number
  name: string;
  password?: string;
  pixeldrainApiKey: string;
  createdAt?: string | Date;
  videoCount?: number;
  totalStorageBytes?: number;
}

export interface IVideo {
  _id?: string;
  videoId: string; // Pixeldrain ID (e.g., "7a8b9c")
  teacherId: string; // Owner Teacher ID
  title: string;
  fileSize: number; // in bytes
  directPlaybackUrl: string; // formatted as https://pixeldrain.com/api/file/[id]
  uploadedAt: string | Date;
}

export interface AuthUser {
  role: 'admin' | 'teacher';
  username?: string;
  teacherId?: string;
  name?: string;
}

export interface StorageMetrics {
  totalTeachers: number;
  totalVideos: number;
  totalStorageBytes: number;
  formattedStorage: string;
  recentUploads: Array<{
    videoId: string;
    title: string;
    fileSize: number;
    uploadedAt: string;
    teacherName?: string;
    teacherId: string;
    directPlaybackUrl: string;
  }>;
}
