import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let isMongoConnected = false;
let activeMongoUri: string | null = null;

// Data directory for persistent local fallback
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'storage_db.json');
const CONFIG_FILE = path.join(DATA_DIR, 'db_config.json');

export interface FallbackDatabase {
  admins: any[];
  teachers: any[];
  videos: any[];
}

function ensureDataFile(): FallbackDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData: FallbackDatabase = {
      admins: [],
      teachers: [],
      videos: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    const initialData: FallbackDatabase = { admins: [], teachers: [], videos: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

export function saveFallbackDb(data: FallbackDatabase) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getFallbackDb(): FallbackDatabase {
  return ensureDataFile();
}

function getSavedMongoUri(): string | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return cfg.mongodbUri || null;
    }
  } catch {}
  return null;
}

export function saveMongoUriConfig(uri: string) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ mongodbUri: uri }, null, 2), 'utf-8');
}

export async function connectToMongoUri(uri: string): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    isMongoConnected = true;
    activeMongoUri = uri;
    saveMongoUriConfig(uri);
    return true;
  } catch (err) {
    console.warn('MongoDB connection failed with provided URI:', err);
    throw err;
  }
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || getSavedMongoUri();

  if (uri) {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isMongoConnected = true;
      activeMongoUri = uri;
      console.log('MongoDB successfully connected via Mongoose.');
      return;
    } catch (err) {
      console.warn('MongoDB connection failed, falling back to local persistent store:', err);
    }
  }

  // If no URI or connection fails, initialize local persistent fallback store
  console.log('Initializing local persistent storage engine for Mongoose schemas...');
  ensureDataFile();
  console.log(`Local persistent database active at: ${DB_FILE}`);
}

export function getIsMongoConnected(): boolean {
  return isMongoConnected;
}

export function getActiveMongoUri(): string | null {
  return activeMongoUri || process.env.MONGODB_URI || getSavedMongoUri();
}
