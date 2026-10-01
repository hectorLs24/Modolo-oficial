import Dexie, { Table } from 'dexie';
import { Book, ReadingSession, Goal, OpenLibraryBookResult } from '../types';

export interface OpenLibraryCacheRecord {
  query: string;
  results: OpenLibraryBookResult[];
  cachedAt: number;
}

/**
 * Base de datos Dexie con versionado y función upgrade() formal
 * Permite evolucionar el esquema desde la versión 1 a la versión 2 agregando soporte
 * para palabras por minuto (WPM), palabras por página y caché offline de Open Library.
 */
export class LecturaDatabase extends Dexie {
  books!: Table<Book, string>;
  sessions!: Table<ReadingSession, string>;
  goals!: Table<Goal, string>;
  openLibraryCache!: Table<OpenLibraryCacheRecord, string>;

  constructor() {
    super('LecturaBetaDB');

    // Esquema Versión 1 original
    this.version(1).stores({
      books: 'id, title, author, status, genre, createdAt',
      sessions: 'id, bookId, date, pagesRead, durationMinutes',
      goals: 'id, type, period, completed',
    });

    // Esquema Versión 2: añade palabras/minuto, wordsPerPage y caché offline con upgrade()
    this.version(2)
      .stores({
        books: 'id, title, author, status, genre, wordsPerPage, createdAt',
        sessions: 'id, bookId, date, pagesRead, durationMinutes, wordsPerMinute',
        goals: 'id, type, period, completed',
        openLibraryCache: 'query, cachedAt',
      })
      .upgrade(async (tx) => {
        // Función upgrade(): migra y enriquece registros preexistentes en la BD
        const booksTable = tx.table('books');
        await booksTable.toCollection().modify((book: Partial<Book>) => {
          if (!book.wordsPerPage) {
            book.wordsPerPage = 275; // 275 palabras/página (estándar editorial)
          }
        });

        const sessionsTable = tx.table('sessions');
        await sessionsTable.toCollection().modify((session: Partial<ReadingSession>) => {
          if (!session.wordsPerMinute && session.durationMinutes && session.pagesRead) {
            const words = session.pagesRead * 275;
            session.wordsRead = words;
            session.wordsPerMinute = Math.round(words / Math.max(1, session.durationMinutes));
          }
        });
      });
  }
}

export const db = new LecturaDatabase();
