import * as SQLite from 'expo-sqlite';

export type DbItem = {
  id: string;
  title: string;
  description: string;
  content: string;
  tag: string;
  type: 'snippet' | 'link' | 'note';
  emoji: string;
  createdAt: string;
  fileExtension?: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('stickybook.db');
  }
  return dbPromise;
}

export async function initDatabase() {
  try {
    const db = await getDb();
    // Enable WAL journal mode and create our main schema
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        tag TEXT NOT NULL,
        type TEXT NOT NULL,
        emoji TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    // Migration to safely add fileExtension column if it doesn't already exist
    try {
      await db.execAsync('ALTER TABLE items ADD COLUMN fileExtension TEXT;');
      console.log('Added fileExtension column to items table.');
    } catch (e) {
      // Column already exists or table does not exist
    }

    console.log('SQLite Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize SQLite Database:', error);
  }
}

export async function getDbItems(): Promise<DbItem[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync('SELECT * FROM items ORDER BY id DESC');
    return rows as DbItem[];
  } catch (error) {
    console.error('Failed to fetch items from SQLite:', error);
    return [];
  }
}

export async function addDbItem(item: DbItem): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO items (id, title, description, content, tag, type, emoji, createdAt, fileExtension) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        item.id,
        item.title,
        item.description || '',
        item.content,
        item.tag,
        item.type,
        item.emoji,
        item.createdAt,
        item.fileExtension || '',
      ]
    );
  } catch (error) {
    console.error('Failed to save item to SQLite:', error);
    throw error;
  }
}

export async function updateDbItem(item: DbItem): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      'UPDATE items SET title = ?, description = ?, content = ?, tag = ?, type = ?, emoji = ?, createdAt = ?, fileExtension = ? WHERE id = ?',
      [
        item.title,
        item.description || '',
        item.content,
        item.tag,
        item.type,
        item.emoji,
        item.createdAt,
        item.fileExtension || '',
        item.id,
      ]
    );
  } catch (error) {
    console.error('Failed to update item in SQLite:', error);
    throw error;
  }
}

export async function deleteDbItem(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
  } catch (error) {
    console.error('Failed to delete item from SQLite:', error);
    throw error;
  }
}
