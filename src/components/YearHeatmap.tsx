import React, { useState, useMemo } from 'react';
import {
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  isSameDay,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Flame, Sparkles, BookOpen } from 'lucide-react';
import { useReading } from '../context/ReadingContext';

interface HeatmapDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  pages: number;
  minutes: number;
  words: number;
  level: 0 | 1 | 2 | 3 | 4;
  isCurrentDay: boolean;
}

export const YearHeatmap: React.FC = () => {
  const { state } = useReading();
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const now = useMemo(() => new Date(), []);

  // 1. Agrupar sesiones por fecha
  const dayStatsMap = useMemo(() => {
    const map: Record<string, { pages: number; minutes: number; words: number }> = {};
    state.sessions.forEach((s) => {
      try {
        const dStr = format(parseISO(s.date), 'yyyy-MM-dd');
        if (!map[dStr]) {
          map[dStr] = { pages: 0, minutes: 0, words: 0 };
        }
        map[dStr].pages += s.pagesRead;
        map[dStr].minutes += s.durationMinutes;
        map[dStr].words += s.wordsRead || s.pagesRead * 275;
      } catch {
        // Ignorar
      }
    });
    return map;
  }, [state.sessions]);

  // 2. Generar 52 semanas completas (12 meses)
  const { weeks, monthHeaders, totalYearPages, totalActiveDays, maxPagesSingleDay } = useMemo(() => {
    const startPeriod = startOfWeek(subWeeks(now, 51), { weekStartsOn: 1 });
    const endPeriod = endOfWeek(now, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start: startPeriod, end: endPeriod });

    let yearPages = 0;
    let activeDays = 0;
    let maxSingleDay = 0;

    const weeksArray: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    const monthHeadersList: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    allDays.forEach((day, index) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const data = dayStatsMap[dateStr] || { pages: 0, minutes: 0, words: 0 };

      yearPages += data.pages;
      if (data.pages > 0) activeDays++;
      if (data.pages > maxSingleDay) maxSingleDay = data.pages;

      // Escala de intensidad 0 - 4
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (data.pages >= 50) level = 4;
      else if (data.pages >= 30) level = 3;
      else if (data.pages >= 15) level = 2;
      else if (data.pages > 0) level = 1;

      const heatmapDay: HeatmapDay = {
        date: day,
        dateStr,
        pages: data.pages,
        minutes: data.minutes,
        words: data.words,
        level,
        isCurrentDay: isToday(day),
      };

      currentWeek.push(heatmapDay);

      // Comprobar inicio de mes para las etiquetas superiores
      const month = day.getMonth();
      const weekIdx = Math.floor(index / 7);
      if (month !== lastMonth && day.getDate() <= 7) {
        monthHeadersList.push({
          label: format(day, 'MMM', { locale: es }),
          weekIndex: weekIdx,
        });
        lastMonth = month;
      }

      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    return {
      weeks: weeksArray,
      monthHeaders: monthHeadersList,
      totalYearPages: yearPages,
      totalActiveDays: activeDays,
      maxPagesSingleDay: maxSingleDay,
    };
  }, [now, dayStatsMap]);

  // Colores por nivel de intensidad
  const getLevelColor = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 0:
        return 'bg-stone-200/70 border-stone-200/50 hover:border-stone-400';
      case 1:
        return 'bg-emerald-200 border-emerald-300 hover:border-emerald-500';
      case 2:
        return 'bg-emerald-400 border-emerald-500 hover:border-emerald-600';
      case 3:
        return 'bg-emerald-600 border-emerald-700 hover:border-emerald-800';
      case 4:
        return 'bg-emerald-800 border-emerald-900 hover:border-black';
    }
  };

  const dayLabels = ['L', '', 'M', '', 'V', '', 'D'];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
      {/* Header del Heatmap */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">
              Heatmap de Lectura de 12 Meses
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro visual continuo de tus 52 semanas de constancia y páginas leídas.
          </p>
        </div>

        {/* Resumen numérico */}
        <div className="flex items-center gap-4 text-xs text-stone-600 self-start sm:self-auto">
          <div>
            <strong className="text-stone-900 font-bold tabular-nums">{totalActiveDays}</strong>{' '}
            <span className="text-stone-500">días activos</span>
          </div>
          <div>
            <strong className="text-stone-900 font-bold tabular-nums">{totalYearPages}</strong>{' '}
            <span className="text-stone-500">páginas año</span>
          </div>
        </div>
      </div>

      {/* Grid del Heatmap con Scroll Horizontal Seguro */}
      <div className="overflow-x-auto pb-2 pt-1 select-none">
        <div className="min-w-[760px]">
          {/* Etiquetas de Meses */}
          <div className="flex text-[10px] font-sans text-stone-400 pl-6 mb-1 relative h-4">
            {monthHeaders.map((m, idx) => (
              <span
                key={m.label + idx}
                className="absolute capitalize font-medium"
                style={{ left: `${m.weekIndex * 14 + 24}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Días y Columnas de Semanas */}
          <div className="flex gap-1.5 items-start">
            {/* Días de la semana (L, M, V, D) */}
            <div className="flex flex-col gap-1 pr-1 text-[9px] font-mono text-stone-400 shrink-0 select-none">
              {dayLabels.map((lbl, idx) => (
                <div key={idx} className="h-3 w-4 flex items-center justify-center">
                  {lbl}
                </div>
              ))}
            </div>

            {/* Columnas de Semanas */}
            <div
              role="grid"
              aria-label="Mapa de calor de 12 meses de lectura"
              className="flex gap-1"
            >
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day) => {
                    const isHovered = hoveredDay?.dateStr === day.dateStr;

                    return (
                      <button
                        key={day.dateStr}
                        tabIndex={0}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onFocus={() => setHoveredDay(day)}
                        onBlur={() => setHoveredDay(null)}
                        aria-label={`${format(day.date, "EEEE d 'de' MMMM yyyy", {
                          locale: es,
                        })}: ${day.pages} páginas leídas`}
                        className={`w-3 h-3 rounded-xs border transition-all cursor-pointer relative ${getLevelColor(
                          day.level
                        )} ${day.isCurrentDay ? 'ring-1.5 ring-amber-500' : ''} ${
                          isHovered ? 'scale-125 z-10' : ''
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Leyenda de Intensidad */}
          <div className="flex items-center justify-between pt-4 text-xs text-stone-500">
            <span className="text-[11px] text-stone-400">
              Récord diario: <strong className="tabular-nums text-stone-700">{maxPagesSingleDay} pág.</strong>
            </span>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Menos</span>
              <div className="flex gap-1 items-center">
                <span className="w-2.5 h-2.5 rounded-xs bg-stone-200/70 border border-stone-300" />
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200 border border-emerald-300" />
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 border border-emerald-500" />
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 border border-emerald-700" />
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-800 border border-emerald-900" />
              </div>
              <span>Más páginas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip Dinámico / Detalle al posar el cursor o foco */}
      <div className="min-h-[32px] p-2 bg-stone-50 rounded-lg border border-stone-200/80 flex items-center justify-between text-xs transition-all">
        {hoveredDay ? (
          <>
            <div className="font-medium text-stone-800 capitalize">
              {format(hoveredDay.date, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </div>
            <div className="text-stone-600 tabular-nums">
              {hoveredDay.pages > 0 ? (
                <>
                  <strong className="text-emerald-700 font-bold">+{hoveredDay.pages} páginas</strong>{' '}
                  ({hoveredDay.minutes} min · ~{hoveredDay.words.toLocaleString()} palabras)
                </>
              ) : (
                <span className="text-stone-400 italic">Sin registro de lectura este día</span>
              )}
            </div>
          </>
        ) : (
          <div className="text-stone-400 italic text-[11px]">
            Pasa el cursor o selecciona cualquier día para inspeccionar el volumen de lectura.
          </div>
        )}
      </div>
    </div>
  );
};
