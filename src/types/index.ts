export type BookStatus = 'to_read' | 'reading' | 'completed' | 'abandoned';

export type GoalType = 'pages' | 'minutes' | 'books';
export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  genre: string;
  coverColor?: string;
  coverUrl?: string;
  openLibraryId?: string;
  wordsPerPage?: number; // Palabras promedio por página (por defecto ~275)
  rating?: number; // 1-5
  notes?: string;
  isbn?: string;
  startedAt?: string; // ISO date string
  completedAt?: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  date: string; // ISO date string
  durationMinutes: number;
  startPage: number;
  endPage: number;
  pagesRead: number;
  wordsRead?: number; // Total palabras leídas en la sesión
  wordsPerMinute?: number; // Velocidad de lectura en palabras por minuto (PPM / WPM)
  paceMinPerPage?: number; // Minutos por página
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  current: number;
  period: GoalPeriod;
  startDate: string;
  endDate?: string;
  completed: boolean;
}

export interface ActiveReadingSession {
  bookId: string;
  startPage: number;
  startTime: number; // Timestamp ms
  isRunning: boolean;
  elapsedSeconds: number;
  notes?: string;
}

export interface StreakDayStatus {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Lun", "Mar", "01 Oct"
  hasRead: boolean;
  isGraceDay: boolean;
  isToday: boolean;
  isFuture: boolean;
  pagesRead: number;
  minutesRead: number;
  wordsRead?: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  graceDaysAllowed: number;
  graceDaysUsed: number;
  graceDaysRemaining: number;
  graceDatesUsed: string[];
  lastReadDate: string | null;
  isActiveToday: boolean;
  calendarDays: StreakDayStatus[];
}

export interface ReadingStats {
  totalBooksRead: number;
  totalBooksInProgress: number;
  totalPagesRead: number;
  totalMinutesRead: number;
  totalWordsRead: number;
  avgWordsPerMinute: number; // PPM promedio global
  currentStreakDays: number;
  longestStreakDays: number;
  avgPaceMinPerPage: number;
  pagesReadThisWeek: number;
  minutesReadToday: number;
  streak: StreakInfo;
}

export interface OpenLibraryBookResult {
  key: string;
  title: string;
  author: string;
  firstPublishYear?: number;
  coverUrl?: string;
  coverId?: number;
  numberOfPages?: number;
  isbn?: string;
  subject?: string[];
}
