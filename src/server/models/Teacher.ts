import mongoose, { Schema, Document } from 'mongoose';
import { getFallbackDb, saveFallbackDb, getIsMongoConnected } from '../config/db.js';
import crypto from 'crypto';

export interface ITeacherDoc extends Document {
  teacherId: string;
  name: string;
  password?: string;
  pixeldrainApiKey: string;
  createdAt: Date;
}

const TeacherSchema = new Schema<ITeacherDoc>({
  teacherId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  pixeldrainApiKey: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const TeacherMongooseModel = mongoose.models.Teacher || mongoose.model<ITeacherDoc>('Teacher', TeacherSchema);

export class TeacherModel {
  static async countDocuments(): Promise<number> {
    if (getIsMongoConnected()) {
      return await TeacherMongooseModel.countDocuments();
    }
    const db = getFallbackDb();
    return db.teachers.length;
  }

  static async find(): Promise<any[]> {
    if (getIsMongoConnected()) {
      return await TeacherMongooseModel.find().select('-password').sort({ createdAt: -1 });
    }
    const db = getFallbackDb();
    return db.teachers.map(t => {
      const { password, ...rest } = t;
      return rest;
    });
  }

  static async findOne(query: { teacherId?: string }): Promise<any | null> {
    if (getIsMongoConnected()) {
      return await TeacherMongooseModel.findOne(query);
    }
    const db = getFallbackDb();
    if (query.teacherId) {
      const match = db.teachers.find(t => t.teacherId.trim() === query.teacherId?.trim());
      return match ? { ...match } : null;
    }
    return null;
  }

  static async findById(id: string): Promise<any | null> {
    if (getIsMongoConnected()) {
      return await TeacherMongooseModel.findById(id);
    }
    const db = getFallbackDb();
    const match = db.teachers.find(t => t._id === id || t.teacherId === id);
    return match ? { ...match } : null;
  }

  static async create(data: {
    teacherId: string;
    name: string;
    password?: string;
    pixeldrainApiKey: string;
  }): Promise<any> {
    if (getIsMongoConnected()) {
      return await TeacherMongooseModel.create(data);
    }
    const db = getFallbackDb();
    const newTeacher = {
      _id: crypto.randomUUID(),
      teacherId: data.teacherId.trim(),
      name: data.name.trim(),
      password: data.password,
      pixeldrainApiKey: data.pixeldrainApiKey.trim(),
      createdAt: new Date().toISOString(),
    };
    db.teachers.push(newTeacher);
    saveFallbackDb(db);
    const { password, ...safeTeacher } = newTeacher;
    return safeTeacher;
  }

  static async findByIdAndDelete(id: string): Promise<any> {
    if (getIsMongoConnected()) {
      return await TeacherMongooseModel.findByIdAndDelete(id);
    }
    const db = getFallbackDb();
    const index = db.teachers.findIndex(t => t._id === id || t.teacherId === id);
    if (index !== -1) {
      const removed = db.teachers.splice(index, 1)[0];
      saveFallbackDb(db);
      return removed;
    }
    return null;
  }
}
