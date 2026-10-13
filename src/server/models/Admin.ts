import mongoose, { Schema, Document } from 'mongoose';
import { getFallbackDb, saveFallbackDb, getIsMongoConnected } from '../config/db.js';
import crypto from 'crypto';

export interface IAdminDoc extends Document {
  username: string;
  password?: string;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdminDoc>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const AdminMongooseModel = mongoose.models.Admin || mongoose.model<IAdminDoc>('Admin', AdminSchema);

export class AdminModel {
  static async countDocuments(): Promise<number> {
    if (getIsMongoConnected()) {
      return await AdminMongooseModel.countDocuments();
    }
    const db = getFallbackDb();
    return db.admins.length;
  }

  static async findOne(query: { username?: string }): Promise<any | null> {
    if (getIsMongoConnected()) {
      return await AdminMongooseModel.findOne(query);
    }
    const db = getFallbackDb();
    if (query.username) {
      const match = db.admins.find(a => a.username.toLowerCase() === query.username?.toLowerCase());
      return match ? { ...match } : null;
    }
    return db.admins[0] ? { ...db.admins[0] } : null;
  }

  static async create(data: { username: string; password?: string }): Promise<any> {
    if (getIsMongoConnected()) {
      return await AdminMongooseModel.create(data);
    }
    const db = getFallbackDb();
    const newAdmin = {
      _id: crypto.randomUUID(),
      username: data.username.toLowerCase().trim(),
      password: data.password,
      createdAt: new Date().toISOString(),
    };
    db.admins.push(newAdmin);
    saveFallbackDb(db);
    return newAdmin;
  }
}
