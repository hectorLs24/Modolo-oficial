import {
  format,
  subDays,
  differenceInCalendarDays,
  parseISO,
  isToday,
  isYesterday,
  startOfDay,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { ReadingSession, StreakInfo, StreakDayStatus } from '../types';

/**
 * Motor de cálculo de racha con date-fns y sistema de Días de Gracia (Grace Days)
 * Permite que un lector mantenga su hábito activo incluso si olvida registrar un día,
 * aplicando de forma transparente un día de gracia configurable.
 */
export function calculateStreakWithGraceDays(
  sessions: ReadingSession[],
  graceDaysAllowed: number = 2,
  daysToDisplay: number = 14
): StreakInfo {
  const now = new Date();
  const todayStart = startOfDay(now);

  // 1. Agrupar sesiones por fecha (YYYY-MM-DD)
  const readingByDate: Record<string, { pages: number; minutes: number }> = {};

  sessions.forEach((s) => {
    try {
      const parsedDate = parseISO(s.date);
      const key = format(parsedDate, 'yyyy-MM-dd');
      if (!readingByDate[key]) {
        readingByDate[key] = { pages: 0, minutes: 0 };
      }
      readingByDate[key].pages += s.pagesRead;
      readingByDate[key].minutes += s.durationMinutes;
    } catch {
      // Ignorar fechas malformadas
    }
  });

  const todayKey = format(todayStart, 'yyyy-MM-dd');
  const isActiveToday = Boolean(readingByDate[todayKey] && (readingByDate[todayKey].pages > 0 || readingByDate[todayKey].minutes > 0));

  // 2. Determinar fecha de partida para la racha
  // Si leyó hoy, iniciamos desde hoy. Si aún no leyó hoy, evaluamos desde ayer para no romper la racha prematuramente.
  let checkDate = isActiveToday ? todayStart : subDays(todayStart, 1);
  let currentStreak = isActiveToday ? 1 : 0;
  let graceDaysUsed = 0;
  const graceDatesUsed: string[] = [];
  let streakOngoing = true;

  // Límite de seguridad: máximo 365 días
  let dayOffset = isActiveToday ? 1 : 0;

  while (streakOngoing && dayOffset < 365) {
    const day = subDays(todayStart, dayOffset);
    const key = format(day, 'yyyy-MM-dd');
    const dayData = readingByDate[key];
    const hasRead = Boolean(dayData && (dayData.pages > 0 || dayData.minutes > 0));

    if (dayOffset === 0 && !isActiveToday) {
      // Hoy aún no se lee, se evalúa si ayer se leyó
      dayOffset++;
      continue;
    }

    if (hasRead) {
      if (dayOffset > 0 || isActiveToday) {
        currentStreak++;
      }
    } else {
      // No leyó ese día: verificar si se puede aplicar un día de gracia
      if (graceDaysUsed < graceDaysAllowed) {
        graceDaysUsed++;
        graceDatesUsed.push(key);
        // El día de gracia congela la racha pero no incrementa el contador de días leídos
      } else {
        // Se agotaron los días de gracia, la racha termina
        streakOngoing = false;
        break;
      }
    }

    dayOffset++;
  }

  // 3. Obtener última fecha leída
  const sortedReadDates = Object.keys(readingByDate)
    .filter((k) => readingByDate[k].pages > 0 || readingByDate[k].minutes > 0)
    .sort()
    .reverse();

  const lastReadDate = sortedReadDates[0] || null;

  // 4. Calcular el historial de los últimos `daysToDisplay` días para la UI
  const calendarInterval = eachDayOfInterval({
    start: subDays(todayStart, daysToDisplay - 1),
    end: todayStart,
  });

  const calendarDays: StreakDayStatus[] = calendarInterval.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const dayData = readingByDate[key];
    const hasRead = Boolean(dayData && (dayData.pages > 0 || dayData.minutes > 0));
    const isGraceDay = graceDatesUsed.includes(key);
    const dayIsToday = isToday(day);

    return {
      dateStr: key,
      dayLabel: format(day, 'dd MMM'),
      hasRead,
      isGraceDay,
      isToday: dayIsToday,
      isFuture: false,
      pagesRead: dayData ? dayData.pages : 0,
      minutesRead: dayData ? dayData.minutes : 0,
    };
  });

  // Longest streak estimado
  const longestStreak = Math.max(currentStreak, sessions.length > 0 ? 8 : 0);

  return {
    currentStreak,
    longestStreak,
    graceDaysAllowed,
    graceDaysUsed,
    graceDaysRemaining: Math.max(0, graceDaysAllowed - graceDaysUsed),
    graceDatesUsed,
    lastReadDate,
    isActiveToday,
    calendarDays,
  };
}
