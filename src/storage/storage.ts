import { Book, ReadingSession, Goal } from '../types';
import { db } from './db';

/**
 * Interfaz formal para la capa de almacenamiento (StorageAdapter)
 * Permite desacoplar el estado de la aplicación del mecanismo de persistencia concreto
 * (LocalStorage, IndexedDB con Dexie, Cloud SQL o Memory).
 */
export interface StorageAdapter {
  name: string;
  isAvailable(): boolean;
  loadBooks(): Promise<Book[]>;
  saveBooks(books: Book[]): Promise<void>;
  loadSessions(): Promise<ReadingSession[]>;
  saveSessions(sessions: ReadingSession[]): Promise<void>;
  loadGoals(): Promise<Goal[]>;
  saveGoals(goals: Goal[]): Promise<void>;
  exportAll(): Promise<string>;
  importAll(jsonString: string): Promise<boolean>;
  clearAll(): Promise<void>;
  resetToDefaults(): Promise<{ books: Book[]; sessions: ReadingSession[]; goals: Goal[] }>;
}

export const STORAGE_KEYS = {
  BOOKS: 'lectura_beta_books_v1',
  SESSIONS: 'lectura_beta_sessions_v1',
  GOALS: 'lectura_beta_goals_v1',
};

// Helper para generar sesiones relativas a la fecha actual
const nowMs = Date.now();
const oneDayMs = 24 * 60 * 60 * 1000;

// Datos semilla de alta calidad enriquecidos para Beta 2.0
export const DEFAULT_BOOKS: Book[] = [
  {
    id: 'book-1',
    title: 'Cien años de soledad',
    author: 'Gabriel García Márquez',
    totalPages: 471,
    currentPage: 215,
    status: 'reading',
    genre: 'Realismo Mágico',
    coverColor: '#92400e', // Amber warm leather
    coverUrl: 'https://covers.openlibrary.org/b/id/11153216-M.jpg',
    wordsPerPage: 280,
    startedAt: '2026-09-15T00:00:00.000Z',
    rating: 5,
    notes: 'Relectura de Macondo y la estirpe de los Buendía. Capítulo 8 impresionante.',
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-09-30T18:20:00.000Z',
  },
  {
    id: 'book-2',
    title: 'Klara y el Sol',
    author: 'Kazuo Ishiguro',
    totalPages: 384,
    currentPage: 384,
    status: 'completed',
    genre: 'Ciencia Ficción Especulativa',
    coverColor: '#0f766e', // Teal deep
    coverUrl: 'https://covers.openlibrary.org/b/id/10582236-M.jpg',
    wordsPerPage: 260,
    startedAt: '2026-08-10T00:00:00.000Z',
    completedAt: '2026-09-02T14:30:00.000Z',
    rating: 5,
    notes: 'Una perspectiva conmovedora sobre la empatía y la inteligencia artificial.',
    createdAt: '2026-08-10T00:00:00.000Z',
    updatedAt: '2026-09-02T14:30:00.000Z',
  },
  {
    id: 'book-3',
    title: 'Fahrenheit 451',
    author: 'Ray Bradbury',
    totalPages: 249,
    currentPage: 0,
    status: 'to_read',
    genre: 'Distopía Clásica',
    coverColor: '#b91c1c', // Rust red
    coverUrl: 'https://covers.openlibrary.org/b/id/9255566-M.jpg',
    wordsPerPage: 270,
    notes: 'Recomendado para el club de lectura de otoño.',
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
  },
  {
    id: 'book-4',
    title: 'Hábitos Atómicos',
    author: 'James Clear',
    totalPages: 320,
    currentPage: 160,
    status: 'reading',
    genre: 'Desarrollo Personal',
    coverColor: '#1e3a8a', // Deep royal navy
    coverUrl: 'https://covers.openlibrary.org/b/id/12886417-M.jpg',
    wordsPerPage: 290,
    startedAt: '2026-09-18T00:00:00.000Z',
    rating: 4,
    notes: 'Aplicando la regla de los dos minutos a la rutina matutina de lectura.',
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-29T10:15:00.000Z',
  },
];

export const DEFAULT_SESSIONS: ReadingSession[] = [
  {
    id: 'sess-today',
    bookId: 'book-1',
    date: new Date(nowMs - 2 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 45,
    startPage: 185,
    endPage: 215,
    pagesRead: 30,
    wordsRead: 8400,
    wordsPerMinute: 187,
    paceMinPerPage: 1.5,
    notes: 'Capítulo fascinante sobre la llegada del ferrocarril a Macondo.',
  },
  {
    id: 'sess-yesterday',
    bookId: 'book-4',
    date: new Date(nowMs - 1 * oneDayMs).toISOString(),
    durationMinutes: 35,
    startPage: 140,
    endPage: 160,
    pagesRead: 20,
    wordsRead: 5800,
    wordsPerMinute: 166,
    paceMinPerPage: 1.75,
    notes: 'Diseñando el ambiente para eliminar la fricción de lectura.',
  },
  {
    id: 'sess-2d-ago',
    bookId: 'book-1',
    date: new Date(nowMs - 2 * oneDayMs).toISOString(),
    durationMinutes: 40,
    startPage: 160,
    endPage: 185,
    pagesRead: 25,
    wordsRead: 7000,
    wordsPerMinute: 175,
    paceMinPerPage: 1.6,
    notes: 'Aureliano Segundo y las mariposas amarillas.',
  },
  {
    id: 'sess-3d-ago',
    bookId: 'book-4',
    date: new Date(nowMs - 3 * oneDayMs).toISOString(),
    durationMinutes: 30,
    startPage: 120,
    endPage: 140,
    pagesRead: 20,
    wordsRead: 5800,
    wordsPerMinute: 193,
    paceMinPerPage: 1.5,
    notes: 'La importancia de las señales visuales en los hábitos.',
  },
  {
    id: 'sess-5d-ago',
    bookId: 'book-2',
    date: new Date(nowMs - 5 * oneDayMs).toISOString(),
    durationMinutes: 50,
    startPage: 340,
    endPage: 384,
    pagesRead: 44,
    wordsRead: 11440,
    wordsPerMinute: 228,
    paceMinPerPage: 1.14,
    notes: 'Final conmovedor de Klara y el Sol.',
  },
  {
    id: 'sess-6d-ago',
    bookId: 'book-2',
    date: new Date(nowMs - 6 * oneDayMs).toISOString(),
    durationMinutes: 45,
    startPage: 300,
    endPage: 340,
    pagesRead: 40,
    wordsRead: 10400,
    wordsPerMinute: 231,
    paceMinPerPage: 1.12,
    notes: 'Klara reflexionando sobre el corazón humano.',
  },
];

export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: 'Hábito diario: 30 minutos',
    type: 'minutes',
    target: 30,
    current: 45,
    period: 'daily',
    startDate: '2026-09-01T00:00:00.000Z',
    completed: true,
  },
  {
    id: 'goal-2',
    title: 'Ritmo semanal: 100 páginas',
    type: 'pages',
    target: 100,
    current: 75,
    period: 'weekly',
    startDate: '2026-09-28T00:00:00.000Z',
    completed: false,
  },
  {
    id: 'goal-3',
    title: 'Desafío 2026: 12 libros',
    type: 'books',
    target: 12,
    current: 1,
    period: 'yearly',
    startDate: '2026-01-01T00:00:00.000Z',
    completed: false,
  },
];

/**
 * IMPLEMENTACIÓN 1: DexieIndexedDbAdapter (Beta 2.0 con upgrade())
 * Almacenamiento primario de alto rendimiento sobre IndexedDB con esquema evolucionado.
 */
export class DexieIndexedDbAdapter implements StorageAdapter {
  name = 'IndexedDB con Dexie v2.0 (con upgrade())';

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  async loadBooks(): Promise<Book[]> {
    try {
      const count = await db.books.count();
      if (count === 0) {
        // Migración transparente desde LocalStorage si existía
        const legacyData = window.localStorage?.getItem(STORAGE_KEYS.BOOKS);
        if (legacyData) {
          try {
            const legacyBooks = JSON.parse(legacyData);
            if (Array.isArray(legacyBooks) && legacyBooks.length > 0) {
              await db.books.bulkPut(legacyBooks);
              return legacyBooks;
            }
          } catch {
            // Ignorar
          }
        }
        await db.books.bulkPut(DEFAULT_BOOKS);
        return DEFAULT_BOOKS;
      }
      return await db.books.toArray();
    } catch (e) {
      console.warn('[Dexie] Error al cargar libros de IndexedDB:', e);
      return DEFAULT_BOOKS;
    }
  }

  async saveBooks(books: Book[]): Promise<void> {
    try {
      await db.transaction('rw', db.books, async () => {
        await db.books.clear();
        await db.books.bulkPut(books);
      });
      // Sincronizar espejo en localStorage para redundancia
      window.localStorage?.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    } catch (e) {
      console.error('[Dexie] Error al guardar libros:', e);
    }
  }

  async loadSessions(): Promise<ReadingSession[]> {
    try {
      const count = await db.sessions.count();
      if (count === 0) {
        const legacyData = window.localStorage?.getItem(STORAGE_KEYS.SESSIONS);
        if (legacyData) {
          try {
            const legacySessions = JSON.parse(legacyData);
            if (Array.isArray(legacySessions) && legacySessions.length > 0) {
              await db.sessions.bulkPut(legacySessions);
              return legacySessions;
            }
          } catch {
            // Ignorar
          }
        }
        await db.sessions.bulkPut(DEFAULT_SESSIONS);
        return DEFAULT_SESSIONS;
      }
      return await db.sessions.toArray();
    } catch (e) {
      console.warn('[Dexie] Error al cargar sesiones de IndexedDB:', e);
      return DEFAULT_SESSIONS;
    }
  }

  async saveSessions(sessions: ReadingSession[]): Promise<void> {
    try {
      await db.transaction('rw', db.sessions, async () => {
        await db.sessions.clear();
        await db.sessions.bulkPut(sessions);
      });
      window.localStorage?.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('[Dexie] Error al guardar sesiones:', e);
    }
  }

  async loadGoals(): Promise<Goal[]> {
    try {
      const count = await db.goals.count();
      if (count === 0) {
        const legacyData = window.localStorage?.getItem(STORAGE_KEYS.GOALS);
        if (legacyData) {
          try {
            const legacyGoals = JSON.parse(legacyData);
            if (Array.isArray(legacyGoals) && legacyGoals.length > 0) {
              await db.goals.bulkPut(legacyGoals);
              return legacyGoals;
            }
          } catch {
            // Ignorar
          }
        }
        await db.goals.bulkPut(DEFAULT_GOALS);
        return DEFAULT_GOALS;
      }
      return await db.goals.toArray();
    } catch (e) {
      console.warn('[Dexie] Error al cargar metas de IndexedDB:', e);
      return DEFAULT_GOALS;
    }
  }

  async saveGoals(goals: Goal[]): Promise<void> {
    try {
      await db.transaction('rw', db.goals, async () => {
        await db.goals.clear();
        await db.goals.bulkPut(goals);
      });
      window.localStorage?.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error('[Dexie] Error al guardar metas:', e);
    }
  }

  async exportAll(): Promise<string> {
    const books = await this.loadBooks();
    const sessions = await this.loadSessions();
    const goals = await this.loadGoals();
    return JSON.stringify(
      {
        version: '2.0-beta',
        engine: 'IndexedDB-Dexie',
        schemaVersion: db.verno,
        timestamp: new Date().toISOString(),
        statsSummary: {
          totalBooks: books.length,
          totalSessions: sessions.length,
          totalGoals: goals.length,
        },
        books,
        sessions,
        goals,
      },
      null,
      2
    );
  }

  async importAll(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') return false;

      await db.transaction('rw', [db.books, db.sessions, db.goals], async () => {
        if (Array.isArray(parsed.books)) {
          await db.books.clear();
          await db.books.bulkPut(parsed.books);
        }
        if (Array.isArray(parsed.sessions)) {
          await db.sessions.clear();
          await db.sessions.bulkPut(parsed.sessions);
        }
        if (Array.isArray(parsed.goals)) {
          await db.goals.clear();
          await db.goals.bulkPut(parsed.goals);
        }
      });

      return true;
    } catch (e) {
      console.error('[Dexie] Error al importar datos en transacción atómica:', e);
      return false;
    }
  }

  async clearAll(): Promise<void> {
    await db.transaction('rw', [db.books, db.sessions, db.goals], async () => {
      await db.books.clear();
      await db.sessions.clear();
      await db.goals.clear();
    });
    window.localStorage?.removeItem(STORAGE_KEYS.BOOKS);
    window.localStorage?.removeItem(STORAGE_KEYS.SESSIONS);
    window.localStorage?.removeItem(STORAGE_KEYS.GOALS);
  }

  async resetToDefaults(): Promise<{ books: Book[]; sessions: ReadingSession[]; goals: Goal[] }> {
    await this.saveBooks(DEFAULT_BOOKS);
    await this.saveSessions(DEFAULT_SESSIONS);
    await this.saveGoals(DEFAULT_GOALS);
    return {
      books: DEFAULT_BOOKS,
      sessions: DEFAULT_SESSIONS,
      goals: DEFAULT_GOALS,
    };
  }
}

/**
 * IMPLEMENTACIÓN 2: LocalStorageAdapter (Fallback de contingencia)
 */
export class LocalStorageAdapter implements StorageAdapter {
  name = 'LocalStorageAdapter (Fallback)';

  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async loadBooks(): Promise<Book[]> {
    try {
      const data = window.localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (!data) {
        await this.saveBooks(DEFAULT_BOOKS);
        return DEFAULT_BOOKS;
      }
      return JSON.parse(data) as Book[];
    } catch {
      return DEFAULT_BOOKS;
    }
  }

  async saveBooks(books: Book[]): Promise<void> {
    window.localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }

  async loadSessions(): Promise<ReadingSession[]> {
    try {
      const data = window.localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!data) {
        await this.saveSessions(DEFAULT_SESSIONS);
        return DEFAULT_SESSIONS;
      }
      return JSON.parse(data) as ReadingSession[];
    } catch {
      return DEFAULT_SESSIONS;
    }
  }

  async saveSessions(sessions: ReadingSession[]): Promise<void> {
    window.localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  async loadGoals(): Promise<Goal[]> {
    try {
      const data = window.localStorage.getItem(STORAGE_KEYS.GOALS);
      if (!data) {
        await this.saveGoals(DEFAULT_GOALS);
        return DEFAULT_GOALS;
      }
      return JSON.parse(data) as Goal[];
    } catch {
      return DEFAULT_GOALS;
    }
  }

  async saveGoals(goals: Goal[]): Promise<void> {
    window.localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }

  async exportAll(): Promise<string> {
    const books = await this.loadBooks();
    const sessions = await this.loadSessions();
    const goals = await this.loadGoals();
    return JSON.stringify(
      {
        version: '2.0-beta',
        engine: 'LocalStorage',
        timestamp: new Date().toISOString(),
        books,
        sessions,
        goals,
      },
      null,
      2
    );
  }

  async importAll(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') return false;
      if (Array.isArray(parsed.books)) await this.saveBooks(parsed.books);
      if (Array.isArray(parsed.sessions)) await this.saveSessions(parsed.sessions);
      if (Array.isArray(parsed.goals)) await this.saveGoals(parsed.goals);
      return true;
    } catch {
      return false;
    }
  }

  async clearAll(): Promise<void> {
    window.localStorage.removeItem(STORAGE_KEYS.BOOKS);
    window.localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    window.localStorage.removeItem(STORAGE_KEYS.GOALS);
  }

  async resetToDefaults(): Promise<{ books: Book[]; sessions: ReadingSession[]; goals: Goal[] }> {
    await this.saveBooks(DEFAULT_BOOKS);
    await this.saveSessions(DEFAULT_SESSIONS);
    await this.saveGoals(DEFAULT_GOALS);
    return {
      books: DEFAULT_BOOKS,
      sessions: DEFAULT_SESSIONS,
      goals: DEFAULT_GOALS,
    };
  }
}

// Instancia singleton por defecto: Dexie IndexedDB con upgrade()
export const defaultStorageAdapter: StorageAdapter = new DexieIndexedDbAdapter();
