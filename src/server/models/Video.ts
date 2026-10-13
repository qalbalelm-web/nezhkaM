import mongoose, { Schema, Document } from 'mongoose';
import { getFallbackDb, saveFallbackDb, getIsMongoConnected } from '../config/db.js';
import crypto from 'crypto';

export interface IVideoDoc extends Document {
  videoId: string;
  teacherId: string;
  title: string;
  fileSize: number;
  directPlaybackUrl: string;
  uploadedAt: Date;
}

const VideoSchema = new Schema<IVideoDoc>({
  videoId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  teacherId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  fileSize: {
    type: Number,
    required: true,
    default: 0,
  },
  directPlaybackUrl: {
    type: String,
    required: true,
    trim: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export const VideoMongooseModel = mongoose.models.Video || mongoose.model<IVideoDoc>('Video', VideoSchema);

export class VideoModel {
  static async countDocuments(query?: { teacherId?: string }): Promise<number> {
    if (getIsMongoConnected()) {
      return await VideoMongooseModel.countDocuments(query || {});
    }
    const db = getFallbackDb();
    if (query?.teacherId) {
      return db.videos.filter(v => v.teacherId === query.teacherId).length;
    }
    return db.videos.length;
  }

  static async find(query?: { teacherId?: string }): Promise<any[]> {
    if (getIsMongoConnected()) {
      return await VideoMongooseModel.find(query || {}).sort({ uploadedAt: -1 });
    }
    const db = getFallbackDb();
    let results = [...db.videos];
    if (query?.teacherId) {
      results = results.filter(v => v.teacherId === query.teacherId);
    }
    return results.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  static async findOne(query: { videoId?: string; teacherId?: string; _id?: string }): Promise<any | null> {
    if (getIsMongoConnected()) {
      return await VideoMongooseModel.findOne(query);
    }
    const db = getFallbackDb();
    const match = db.videos.find(v => {
      let ok = true;
      if (query.videoId && v.videoId !== query.videoId) ok = false;
      if (query.teacherId && v.teacherId !== query.teacherId) ok = false;
      if (query._id && v._id !== query._id) ok = false;
      return ok;
    });
    return match ? { ...match } : null;
  }

  static async create(data: {
    videoId: string;
    teacherId: string;
    title: string;
    fileSize: number;
    directPlaybackUrl: string;
  }): Promise<any> {
    if (getIsMongoConnected()) {
      return await VideoMongooseModel.create(data);
    }
    const db = getFallbackDb();
    const newVideo = {
      _id: crypto.randomUUID(),
      videoId: data.videoId.trim(),
      teacherId: data.teacherId.trim(),
      title: data.title.trim(),
      fileSize: Number(data.fileSize) || 0,
      directPlaybackUrl: data.directPlaybackUrl.trim(),
      uploadedAt: new Date().toISOString(),
    };
    db.videos.push(newVideo);
    saveFallbackDb(db);
    return newVideo;
  }

  static async findByIdAndDelete(id: string, teacherId?: string): Promise<any> {
    if (getIsMongoConnected()) {
      const q: any = { _id: id };
      if (teacherId) q.teacherId = teacherId;
      return await VideoMongooseModel.findOneAndDelete(q);
    }
    const db = getFallbackDb();
    const index = db.videos.findIndex(v => (v._id === id || v.videoId === id) && (!teacherId || v.teacherId === teacherId));
    if (index !== -1) {
      const removed = db.videos.splice(index, 1)[0];
      saveFallbackDb(db);
      return removed;
    }
    return null;
  }

  static async deleteMany(query: { teacherId: string }): Promise<number> {
    if (getIsMongoConnected()) {
      const res = await VideoMongooseModel.deleteMany(query);
      return res.deletedCount || 0;
    }
    const db = getFallbackDb();
    const initialCount = db.videos.length;
    db.videos = db.videos.filter(v => v.teacherId !== query.teacherId);
    saveFallbackDb(db);
    return initialCount - db.videos.length;
  }
}
