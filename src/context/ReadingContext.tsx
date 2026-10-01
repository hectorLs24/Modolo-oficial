import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { Book, ReadingSession, Goal, BookStatus, ActiveReadingSession, ReadingStats, StreakInfo } from '../types';
import { StorageAdapter, defaultStorageAdapter } from '../storage/storage';
import { calculateStreakWithGraceDays } from '../utils/streakEngine';

// -----------------------------------------------------------------------------
// ESTADO Y ACCIONES DEL REDUCER
// -----------------------------------------------------------------------------

interface ReadingState {
  books: Book[];
  sessions: ReadingSession[];
  goals: Goal[];
  activeSession: ActiveReadingSession | null;
  filterStatus: BookStatus | 'all';
  searchQuery: string;
  selectedBookId: string | null;
  isLoading: boolean;
  lastSavedAt: string | null;
}

type ReadingAction =
  | { type: 'INIT_DATA'; payload: { books: Book[]; sessions: ReadingSession[]; goals: Goal[] } }
  | { type: 'ADD_BOOK'; payload: Book }
  | { type: 'UPDATE_BOOK'; payload: { id: string; updates: Partial<Book> } }
  | { type: 'DELETE_BOOK'; payload: string }
  | { type: 'UPDATE_BOOK_PAGE'; payload: { id: string; newPage: number } }
  | { type: 'SET_BOOK_STATUS'; payload: { id: string; status: BookStatus } }
  | { type: 'LOG_SESSION'; payload: ReadingSession }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'START_ACTIVE_SESSION'; payload: { bookId: string; startPage: number } }
  | { type: 'TICK_ACTIVE_SESSION' }
  | { type: 'PAUSE_ACTIVE_SESSION' }
  | { type: 'RESUME_ACTIVE_SESSION' }
  | { type: 'CANCEL_ACTIVE_SESSION' }
  | { type: 'FINISH_ACTIVE_SESSION' }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: { id: string; updates: Partial<Goal> } }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'SYNC_GOAL_PROGRESS'; payload: Goal[] }
  | { type: 'SET_FILTER_STATUS'; payload: BookStatus | 'all' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_BOOK'; payload: string | null }
  | { type: 'MARK_SAVED'; payload: string };

const initialState: ReadingState = {
  books: [],
  sessions: [],
  goals: [],
  activeSession: null,
  filterStatus: 'all',
  searchQuery: '',
  selectedBookId: null,
  isLoading: true,
  lastSavedAt: null,
};

function readingReducer(state: ReadingState, action: ReadingAction): ReadingState {
  switch (action.type) {
    case 'INIT_DATA':
      return {
        ...state,
        books: action.payload.books,
        sessions: action.payload.sessions,
        goals: action.payload.goals,
        isLoading: false,
        lastSavedAt: new Date().toISOString(),
      };

    case 'ADD_BOOK':
      return {
        ...state,
        books: [action.payload, ...state.books],
      };

    case 'UPDATE_BOOK':
      return {
        ...state,
        books: state.books.map((b) =>
          b.id === action.payload.id
            ? { ...b, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : b
        ),
      };

    case 'DELETE_BOOK':
      return {
        ...state,
        books: state.books.filter((b) => b.id !== action.payload),
        sessions: state.sessions.filter((s) => s.bookId !== action.payload),
        selectedBookId: state.selectedBookId === action.payload ? null : state.selectedBookId,
      };

    case 'UPDATE_BOOK_PAGE': {
      const { id, newPage } = action.payload;
      return {
        ...state,
        books: state.books.map((book) => {
          if (book.id !== id) return book;
          const validPage = Math.max(0, Math.min(book.totalPages, newPage));
          const isCompleted = validPage >= book.totalPages;
          const isStarting = validPage > 0 && book.status === 'to_read';

          let nextStatus: BookStatus = book.status;
          let completedAt = book.completedAt;
          let startedAt = book.startedAt;

          if (isCompleted) {
            nextStatus = 'completed';
            completedAt = completedAt || new Date().toISOString();
          } else if (isStarting) {
            nextStatus = 'reading';
            startedAt = startedAt || new Date().toISOString();
          } else if (book.status === 'completed' && validPage < book.totalPages) {
            nextStatus = 'reading';
            completedAt = undefined;
          }

          return {
            ...book,
            currentPage: validPage,
            status: nextStatus,
            startedAt,
            completedAt,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    }

    case 'SET_BOOK_STATUS':
      return {
        ...state,
        books: state.books.map((book) => {
          if (book.id !== action.payload.id) return book;
          const newStatus = action.payload.status;
          return {
            ...book,
            status: newStatus,
            currentPage: newStatus === 'completed' ? book.totalPages : (newStatus === 'to_read' ? 0 : book.currentPage),
            completedAt: newStatus === 'completed' ? (book.completedAt || new Date().toISOString()) : undefined,
            startedAt: newStatus === 'reading' && !book.startedAt ? new Date().toISOString() : book.startedAt,
            updatedAt: new Date().toISOString(),
          };
        }),
      };

    case 'LOG_SESSION':
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
      };

    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.id !== action.payload),
      };

    case 'START_ACTIVE_SESSION':
      return {
        ...state,
        activeSession: {
          bookId: action.payload.bookId,
          startPage: action.payload.startPage,
          startTime: Date.now(),
          isRunning: true,
          elapsedSeconds: 0,
        },
      };

    case 'TICK_ACTIVE_SESSION':
      if (!state.activeSession || !state.activeSession.isRunning) return state;
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          elapsedSeconds: state.activeSession.elapsedSeconds + 1,
        },
      };

    case 'PAUSE_ACTIVE_SESSION':
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          isRunning: false,
        },
      };

    case 'RESUME_ACTIVE_SESSION':
      if (!state.activeSession) return state;
      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          isRunning: true,
        },
      };

    case 'CANCEL_ACTIVE_SESSION':
    case 'FINISH_ACTIVE_SESSION':
      return {
        ...state,
        activeSession: null,
      };

    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, action.payload],
      };

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? { ...g, ...action.payload.updates } : g
        ),
      };

    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      };

    case 'SYNC_GOAL_PROGRESS':
      return {
        ...state,
        goals: action.payload,
      };

    case 'SET_FILTER_STATUS':
      return {
        ...state,
        filterStatus: action.payload,
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'SET_SELECTED_BOOK':
      return {
        ...state,
        selectedBookId: action.payload,
      };

    case 'MARK_SAVED':
      return {
        ...state,
        lastSavedAt: action.payload,
      };

    default:
      return state;
  }
}

// -----------------------------------------------------------------------------
// CONTEXT CONTRACT & INTERFACES (P0 EXPLICIT SPEC)
// -----------------------------------------------------------------------------

export interface ReadingContextType {
  // Estado
  state: ReadingState;
  storageAdapterName: string;
  stats: ReadingStats;

  // Filtros y selección
  setFilterStatus: (status: BookStatus | 'all') => void;
  setSearchQuery: (query: string) => void;
  setSelectedBookId: (id: string | null) => void;

  // =========================================================================
  // FUNCIÓN P0.1: GESTIÓN DE LIBROS Y PROGRESO DE LECTURA (Book & Progress)
  // =========================================================================
  addBook: (bookInput: {
    title: string;
    author: string;
    totalPages: number;
    currentPage?: number;
    genre?: string;
    coverColor?: string;
    coverUrl?: string;
    wordsPerPage?: number;
    notes?: string;
    isbn?: string;
  }) => Promise<Book>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  updateBookProgress: (id: string, newPage: number) => Promise<void>;
  setBookStatus: (id: string, status: BookStatus) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;

  // =========================================================================
  // FUNCIÓN P0.2: REGISTRO Y CRONÓMETRO DE SESIÓN DE LECTURA (Sessions & Timer)
  // =========================================================================
  startActiveSession: (bookId: string) => void;
  pauseActiveSession: () => void;
  resumeActiveSession: () => void;
  finishActiveSession: (endPage: number, notes?: string) => Promise<ReadingSession | null>;
  cancelActiveSession: () => void;
  logManualSession: (sessionInput: {
    bookId: string;
    date: string;
    durationMinutes: number;
    startPage: number;
    endPage: number;
    notes?: string;
  }) => Promise<ReadingSession>;
  deleteSession: (sessionId: string) => Promise<void>;

  // =========================================================================
  // FUNCIÓN P0.3: SISTEMA DE METAS Y ESTADÍSTICAS (Goals & Milestones)
  // =========================================================================
  addGoal: (goalInput: {
    title: string;
    type: 'pages' | 'minutes' | 'books';
    target: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  recalculateGoals: () => void;

  // Metas y Racha
  graceDaysAllowed: number;
  setGraceDaysAllowed: (days: number) => void;

  // Acciones de persistencia y exportación
  exportBackup: () => Promise<string>;
  importBackup: (json: string) => Promise<boolean>;
  resetDefaults: () => Promise<void>;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

// -----------------------------------------------------------------------------
// PROVIDER
// -----------------------------------------------------------------------------

interface ReadingProviderProps {
  children: React.ReactNode;
  storage?: StorageAdapter;
}

export const ReadingProvider: React.FC<ReadingProviderProps> = ({
  children,
  storage = defaultStorageAdapter,
}) => {
  const [state, dispatch] = useReducer(readingReducer, initialState);
  const [graceDaysAllowed, setGraceDaysAllowed] = useState<number>(2);
  const isInitialLoad = useRef(true);

  // 1. Cargar datos iniciales desde la capa de storage
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [books, sessions, goals] = await Promise.all([
          storage.loadBooks(),
          storage.loadSessions(),
          storage.loadGoals(),
        ]);
        if (isMounted) {
          dispatch({
            type: 'INIT_DATA',
            payload: { books, sessions, goals },
          });
        }
      } catch (e) {
        console.error('Error inicializando almacenamiento:', e);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [storage]);

  // 2. Cronómetro activo con setInterval de 1 segundo
  useEffect(() => {
    if (!state.activeSession?.isRunning) return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_ACTIVE_SESSION' });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.activeSession?.isRunning]);

  // 3. Sincronizar automáticamente cambios de datos hacia storage
  useEffect(() => {
    if (isInitialLoad.current) {
      if (!state.isLoading) {
        isInitialLoad.current = false;
      }
      return;
    }

    const syncStorage = async () => {
      await Promise.all([
        storage.saveBooks(state.books),
        storage.saveSessions(state.sessions),
        storage.saveGoals(state.goals),
      ]);
      dispatch({ type: 'MARK_SAVED', payload: new Date().toISOString() });
    };

    syncStorage();
  }, [state.books, state.sessions, state.goals, state.isLoading, storage]);

  // 4. Recalcular progreso de metas basándose en sesiones y libros
  const recalculateGoals = useCallback(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Inicio de semana (lunes)
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday).getTime();

    // Inicio de año
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

    const updatedGoals = state.goals.map((goal) => {
      let progress = 0;

      if (goal.type === 'minutes') {
        if (goal.period === 'daily') {
          progress = state.sessions
            .filter((s) => new Date(s.date).getTime() >= todayStart)
            .reduce((acc, s) => acc + s.durationMinutes, 0);
        } else if (goal.period === 'weekly') {
          progress = state.sessions
            .filter((s) => new Date(s.date).getTime() >= weekStart)
            .reduce((acc, s) => acc + s.durationMinutes, 0);
        } else {
          progress = state.sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
        }
      } else if (goal.type === 'pages') {
        if (goal.period === 'daily') {
          progress = state.sessions
            .filter((s) => new Date(s.date).getTime() >= todayStart)
            .reduce((acc, s) => acc + s.pagesRead, 0);
        } else if (goal.period === 'weekly') {
          progress = state.sessions
            .filter((s) => new Date(s.date).getTime() >= weekStart)
            .reduce((acc, s) => acc + s.pagesRead, 0);
        } else {
          progress = state.sessions.reduce((acc, s) => acc + s.pagesRead, 0);
        }
      } else if (goal.type === 'books') {
        if (goal.period === 'yearly') {
          progress = state.books.filter((b) => {
            if (b.status !== 'completed' || !b.completedAt) return false;
            return new Date(b.completedAt).getTime() >= yearStart;
          }).length;
        } else {
          progress = state.books.filter((b) => b.status === 'completed').length;
        }
      }

      return {
        ...goal,
        current: progress,
        completed: progress >= goal.target,
      };
    });

    // Solo despacha si hay diferencias reales
    const hasChanged = JSON.stringify(updatedGoals) !== JSON.stringify(state.goals);
    if (hasChanged) {
      dispatch({ type: 'SYNC_GOAL_PROGRESS', payload: updatedGoals });
    }
  }, [state.books, state.sessions, state.goals]);

  // Recalcular metas cuando cambian libros o sesiones
  useEffect(() => {
    if (!state.isLoading) {
      recalculateGoals();
    }
  }, [state.books, state.sessions, state.isLoading, recalculateGoals]);

  // =========================================================================
  // IMPLEMENTACIÓN DE LAS 3 FUNCIONES P0
  // =========================================================================

  // P0.1: Gestión de Libros y Progreso
  const addBook = async (input: {
    title: string;
    author: string;
    totalPages: number;
    currentPage?: number;
    genre?: string;
    coverColor?: string;
    coverUrl?: string;
    wordsPerPage?: number;
    notes?: string;
    isbn?: string;
  }): Promise<Book> => {
    const cur = input.currentPage || 0;
    const isCompleted = cur >= input.totalPages && input.totalPages > 0;
    const isReading = cur > 0 && !isCompleted;
    const now = new Date().toISOString();

    const newBook: Book = {
      id: 'book-' + Date.now(),
      title: input.title.trim(),
      author: input.author.trim(),
      totalPages: Math.max(1, input.totalPages),
      currentPage: Math.max(0, Math.min(input.totalPages, cur)),
      status: isCompleted ? 'completed' : isReading ? 'reading' : 'to_read',
      genre: input.genre?.trim() || 'General',
      coverColor: input.coverColor || '#334155',
      coverUrl: input.coverUrl,
      wordsPerPage: input.wordsPerPage || 275,
      notes: input.notes?.trim() || '',
      isbn: input.isbn?.trim() || '',
      startedAt: isReading || isCompleted ? now : undefined,
      completedAt: isCompleted ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    dispatch({ type: 'ADD_BOOK', payload: newBook });
    return newBook;
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    dispatch({ type: 'UPDATE_BOOK', payload: { id, updates } });
  };

  const updateBookProgress = async (id: string, newPage: number) => {
    dispatch({ type: 'UPDATE_BOOK_PAGE', payload: { id, newPage } });
  };

  const setBookStatus = async (id: string, status: BookStatus) => {
    dispatch({ type: 'SET_BOOK_STATUS', payload: { id, status } });
  };

  const deleteBook = async (id: string) => {
    dispatch({ type: 'DELETE_BOOK', payload: id });
  };

  // P0.2: Registro y Cronómetro de Sesión de Lectura
  const startActiveSession = (bookId: string) => {
    const targetBook = state.books.find((b) => b.id === bookId);
    const startPage = targetBook ? targetBook.currentPage : 0;
    dispatch({ type: 'START_ACTIVE_SESSION', payload: { bookId, startPage } });
  };

  const pauseActiveSession = () => {
    dispatch({ type: 'PAUSE_ACTIVE_SESSION' });
  };

  const resumeActiveSession = () => {
    dispatch({ type: 'RESUME_ACTIVE_SESSION' });
  };

  const finishActiveSession = async (endPage: number, notes?: string): Promise<ReadingSession | null> => {
    if (!state.activeSession) return null;

    const { bookId, startPage, elapsedSeconds } = state.activeSession;
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const pagesRead = Math.max(0, endPage - startPage);
    const paceMinPerPage = pagesRead > 0 ? Number((durationMinutes / pagesRead).toFixed(2)) : undefined;

    const targetBook = state.books.find((b) => b.id === bookId);
    const wordsPerPage = targetBook?.wordsPerPage || 275;
    const wordsRead = pagesRead * wordsPerPage;
    const wordsPerMinute = pagesRead > 0 ? Math.round(wordsRead / Math.max(1, durationMinutes)) : undefined;

    const newSession: ReadingSession = {
      id: 'sess-' + Date.now(),
      bookId,
      date: new Date().toISOString(),
      durationMinutes,
      startPage,
      endPage,
      pagesRead,
      wordsRead,
      wordsPerMinute,
      paceMinPerPage,
      notes: notes?.trim() || '',
    };

    // Registrar la sesión
    dispatch({ type: 'LOG_SESSION', payload: newSession });

    // Actualizar página del libro automáticamente
    dispatch({ type: 'UPDATE_BOOK_PAGE', payload: { id: bookId, newPage: endPage } });

    // Limpiar sesión activa
    dispatch({ type: 'FINISH_ACTIVE_SESSION' });

    return newSession;
  };

  const cancelActiveSession = () => {
    dispatch({ type: 'CANCEL_ACTIVE_SESSION' });
  };

  const logManualSession = async (input: {
    bookId: string;
    date: string;
    durationMinutes: number;
    startPage: number;
    endPage: number;
    notes?: string;
  }): Promise<ReadingSession> => {
    const pagesRead = Math.max(0, input.endPage - input.startPage);
    const paceMinPerPage =
      pagesRead > 0 ? Number((input.durationMinutes / pagesRead).toFixed(2)) : undefined;

    const targetBook = state.books.find((b) => b.id === input.bookId);
    const wordsPerPage = targetBook?.wordsPerPage || 275;
    const wordsRead = pagesRead * wordsPerPage;
    const wordsPerMinute =
      pagesRead > 0 ? Math.round(wordsRead / Math.max(1, input.durationMinutes)) : undefined;

    const newSession: ReadingSession = {
      id: 'sess-' + Date.now(),
      bookId: input.bookId,
      date: input.date,
      durationMinutes: Math.max(1, input.durationMinutes),
      startPage: input.startPage,
      endPage: input.endPage,
      pagesRead,
      wordsRead,
      wordsPerMinute,
      paceMinPerPage,
      notes: input.notes?.trim() || '',
    };

    dispatch({ type: 'LOG_SESSION', payload: newSession });
    // Si la página final supera el progreso actual del libro, actualizar
    const currentBook = state.books.find((b) => b.id === input.bookId);
    if (currentBook && input.endPage > currentBook.currentPage) {
      dispatch({ type: 'UPDATE_BOOK_PAGE', payload: { id: input.bookId, newPage: input.endPage } });
    }

    return newSession;
  };

  const deleteSession = async (sessionId: string) => {
    dispatch({ type: 'DELETE_SESSION', payload: sessionId });
  };

  // P0.3: Sistema de Metas y Estadísticas
  const addGoal = async (input: {
    title: string;
    type: 'pages' | 'minutes' | 'books';
    target: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }): Promise<Goal> => {
    const newGoal: Goal = {
      id: 'goal-' + Date.now(),
      title: input.title.trim(),
      type: input.type,
      target: Math.max(1, input.target),
      current: 0,
      period: input.period,
      startDate: new Date().toISOString(),
      completed: false,
    };
    dispatch({ type: 'ADD_GOAL', payload: newGoal });
    return newGoal;
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    dispatch({ type: 'UPDATE_GOAL', payload: { id, updates } });
  };

  const deleteGoal = async (id: string) => {
    dispatch({ type: 'DELETE_GOAL', payload: id });
  };

  // Respaldo y Restauración
  const exportBackup = async (): Promise<string> => {
    return storage.exportAll();
  };

  const importBackup = async (json: string): Promise<boolean> => {
    const success = await storage.importAll(json);
    if (success) {
      const [books, sessions, goals] = await Promise.all([
        storage.loadBooks(),
        storage.loadSessions(),
        storage.loadGoals(),
      ]);
      dispatch({ type: 'INIT_DATA', payload: { books, sessions, goals } });
    }
    return success;
  };

  const resetDefaults = async () => {
    const reset = await storage.resetToDefaults();
    dispatch({ type: 'INIT_DATA', payload: reset });
  };

  // Filtros de navegación
  const setFilterStatus = (status: BookStatus | 'all') => {
    dispatch({ type: 'SET_FILTER_STATUS', payload: status });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const setSelectedBookId = (id: string | null) => {
    dispatch({ type: 'SET_SELECTED_BOOK', payload: id });
  };

  // Estadísticas globales derivadas
  const stats: ReadingStats = useMemo(() => {
    const totalBooksRead = state.books.filter((b) => b.status === 'completed').length;
    const totalBooksInProgress = state.books.filter((b) => b.status === 'reading').length;
    const totalPagesRead = state.sessions.reduce((acc, s) => acc + s.pagesRead, 0);
    const totalMinutesRead = state.sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    // Calcular velocidad media (minutos por página)
    const validSessionsWithPace = state.sessions.filter((s) => s.paceMinPerPage && s.paceMinPerPage > 0);
    const avgPaceMinPerPage =
      validSessionsWithPace.length > 0
        ? Number(
            (
              validSessionsWithPace.reduce((acc, s) => acc + (s.paceMinPerPage || 0), 0) /
              validSessionsWithPace.length
            ).toFixed(1)
          )
        : 1.5;

    // Páginas esta semana
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday).getTime();
    const pagesReadThisWeek = state.sessions
      .filter((s) => new Date(s.date).getTime() >= weekStart)
      .reduce((acc, s) => acc + s.pagesRead, 0);

    // Minutos hoy
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const minutesReadToday = state.sessions
      .filter((s) => new Date(s.date).getTime() >= todayStart)
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    // Total de palabras y velocidad en Palabras Por Minuto (WPM / ppm)
    const totalWordsRead = state.sessions.reduce(
      (acc, s) => acc + (s.wordsRead || s.pagesRead * 275),
      0
    );
    const sessionsWithWpm = state.sessions.filter((s) => s.wordsPerMinute && s.wordsPerMinute > 0);
    const avgWordsPerMinute =
      sessionsWithWpm.length > 0
        ? Math.round(
            sessionsWithWpm.reduce((acc, s) => acc + (s.wordsPerMinute || 0), 0) /
              sessionsWithWpm.length
          )
        : Math.round(275 / (avgPaceMinPerPage || 1.5));

    // Motor de cálculo de racha con date-fns y sistema de días de gracia
    const streak = calculateStreakWithGraceDays(state.sessions, graceDaysAllowed, 14);

    return {
      totalBooksRead,
      totalBooksInProgress,
      totalPagesRead,
      totalMinutesRead,
      totalWordsRead,
      avgWordsPerMinute,
      currentStreakDays: streak.currentStreak,
      longestStreakDays: streak.longestStreak,
      avgPaceMinPerPage,
      pagesReadThisWeek,
      minutesReadToday,
      streak,
    };
  }, [state.books, state.sessions, graceDaysAllowed]);

  const contextValue: ReadingContextType = {
    state,
    storageAdapterName: storage.name,
    stats,
    graceDaysAllowed,
    setGraceDaysAllowed,
    setFilterStatus,
    setSearchQuery,
    setSelectedBookId,
    // P0.1
    addBook,
    updateBook,
    updateBookProgress,
    setBookStatus,
    deleteBook,
    // P0.2
    startActiveSession,
    pauseActiveSession,
    resumeActiveSession,
    finishActiveSession,
    cancelActiveSession,
    logManualSession,
    deleteSession,
    // P0.3
    addGoal,
    updateGoal,
    deleteGoal,
    recalculateGoals,
    // Storage utilities
    exportBackup,
    importBackup,
    resetDefaults,
  };

  return <ReadingContext.Provider value={contextValue}>{children}</ReadingContext.Provider>;
};

export const useReading = (): ReadingContextType => {
  const context = useContext(ReadingContext);
  if (!context) {
    throw new Error('useReading debe usarse dentro de un ReadingProvider');
  }
  return context;
};
