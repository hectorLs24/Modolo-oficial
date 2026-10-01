import React, { useState, useMemo } from 'react';
import {
  format,
  subDays,
  startOfDay,
  eachDayOfInterval,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart2,
  TrendingUp,
  PieChart,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useReading } from '../context/ReadingContext';
import { YearHeatmap } from './YearHeatmap';

export const ReadingCharts: React.FC = () => {
  const { state, stats } = useReading();
  const [rangeDays, setRangeDays] = useState<7 | 14>(7);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const now = new Date();
  const today = startOfDay(now);

  // 1. Datos diarios de los últimos N días
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(today, rangeDays - 1),
      end: today,
    });

    const dayMap: Record<string, { pages: number; minutes: number }> = {};
    days.forEach((d) => {
      dayMap[format(d, 'yyyy-MM-dd')] = { pages: 0, minutes: 0 };
    });

    state.sessions.forEach((s) => {
      try {
        const dStr = format(parseISO(s.date), 'yyyy-MM-dd');
        if (dayMap[dStr]) {
          dayMap[dStr].pages += s.pagesRead;
          dayMap[dStr].minutes += s.durationMinutes;
        }
      } catch {
        // Ignorar fechas inválidas
      }
    });

    return days.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const data = dayMap[key] || { pages: 0, minutes: 0 };
      return {
        dateStr: key,
        label: format(day, 'EEE d', { locale: es }),
        fullDate: format(day, "d 'de' MMMM", { locale: es }),
        pages: data.pages,
        minutes: data.minutes,
      };
    });
  }, [state.sessions, rangeDays, today]);

  // Cálculos para Gráfico 1: Páginas Leídas por Día (SVG Bar Chart)
  const maxPages = Math.max(10, ...dailyData.map((d) => d.pages));
  const avgPages = Math.round(
    dailyData.reduce((acc, d) => acc + d.pages, 0) / dailyData.length
  );

  // Dimensiones del gráfico de barras SVG
  const barChartWidth = 600;
  const barChartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const plotWidth = barChartWidth - paddingX * 2;
  const plotHeight = barChartHeight - paddingY * 2;
  const barSlotWidth = plotWidth / dailyData.length;
  const barWidth = Math.min(32, barSlotWidth * 0.6);

  // Cálculos para Gráfico 2: Minutos de Lectura (SVG Area Chart)
  const maxMinutes = Math.max(45, ...dailyData.map((d) => d.minutes));
  const areaPoints = dailyData.map((d, i) => {
    const x = paddingX + i * (plotWidth / (dailyData.length - 1 || 1));
    const y = barChartHeight - paddingY - (d.minutes / maxMinutes) * plotHeight;
    return { x, y, minutes: d.minutes, date: d.label, fullDate: d.fullDate };
  });

  const linePathD = areaPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaPathD = `${linePathD} L ${areaPoints[areaPoints.length - 1]?.x || 0},${
    barChartHeight - paddingY
  } L ${areaPoints[0]?.x || 0},${barChartHeight - paddingY} Z`;

  // Cálculos para Gráfico 3: Distribución por Género (SVG Donut Chart)
  const genreDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    state.books.forEach((b) => {
      const g = b.genre?.trim() || 'General';
      counts[g] = (counts[g] || 0) + 1;
    });

    const total = state.books.length || 1;
    const colors = [
      '#92400e', // Amber
      '#0f766e', // Teal
      '#1e3a8a', // Deep Blue
      '#b91c1c', // Rust Red
      '#3f6212', // Warm Olive
      '#475569', // Slate
    ];

    let currentOffset = 0;
    const slices = Object.entries(counts).map(([genre, count], idx) => {
      const percentage = (count / total) * 100;
      const strokeDash = `${percentage} ${100 - percentage}`;
      const offset = 100 - currentOffset + 25; // Centrado arriba
      currentOffset += percentage;

      return {
        genre,
        count,
        percentage: Math.round(percentage),
        color: colors[idx % colors.length],
        strokeDash,
        offset,
      };
    });

    return { slices, total: state.books.length };
  }, [state.books]);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 1. Header con selector de rango */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
            Análisis de Hábitos de Lectura
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Gráficos vectoriales SVG nativos calculados directamente desde tus sesiones registradas.
          </p>
        </div>

        {/* Range Selector Buttons (Accessible touch targets) */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setRangeDays(7)}
            aria-pressed={rangeDays === 7}
            className={`min-h-[44px] px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              rangeDays === 7
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Últimos 7 días
          </button>
          <button
            onClick={() => setRangeDays(14)}
            aria-pressed={rangeDays === 14}
            className={`min-h-[44px] px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              rangeDays === 14
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Últimos 14 días
          </button>
        </div>
      </div>

      {/* 2. Grid de Gráficos SVG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 1: Páginas Leídas por Día (SVG Bar Chart) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-amber-700" />
              <h3 className="font-serif text-base font-bold text-stone-900">Páginas Leídas por Día</h3>
            </div>
            <span className="text-xs text-stone-500">
              Media: <strong className="tabular-nums text-stone-800">{avgPages} pág/día</strong>
            </span>
          </div>

          {/* SVG Canvas Bar Chart */}
          <div className="relative w-full aspect-[20/11] select-none">
            <svg
              viewBox={`0 0 ${barChartWidth} ${barChartHeight}`}
              className="w-full h-full overflow-visible"
              role="img"
              aria-label="Gráfico de barras de páginas leídas por día"
            >
              <desc>Páginas leídas en los últimos {rangeDays} días</desc>

              {/* Líneas guía horizontales */}
              {[0, 0.5, 1].map((ratio) => {
                const y = barChartHeight - paddingY - ratio * plotHeight;
                const val = Math.round(ratio * maxPages);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={barChartWidth - paddingX}
                      y2={y}
                      stroke="#e7e5e4"
                      strokeWidth="1"
                      strokeDasharray={ratio === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-stone-400"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Línea de promedio */}
              {avgPages > 0 && (
                <line
                  x1={paddingX}
                  y1={barChartHeight - paddingY - (avgPages / maxPages) * plotHeight}
                  x2={barChartWidth - paddingX}
                  y2={barChartHeight - paddingY - (avgPages / maxPages) * plotHeight}
                  stroke="#d97706"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}

              {/* Barras de datos */}
              {dailyData.map((d, i) => {
                const xCenter = paddingX + i * barSlotWidth + barSlotWidth / 2;
                const barH = (d.pages / maxPages) * plotHeight;
                const y = barChartHeight - paddingY - barH;
                const isHovered = hoveredBarIndex === i;

                return (
                  <g
                    key={d.dateStr}
                    tabIndex={0}
                    role="button"
                    aria-label={`${d.fullDate}: ${d.pages} páginas leídas`}
                    onMouseEnter={() => setHoveredBarIndex(i)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    onFocus={() => setHoveredBarIndex(i)}
                    onBlur={() => setHoveredBarIndex(null)}
                    className="cursor-pointer focus:outline-none"
                  >
                    {/* Hitbox invisible para interacción táctil/ratón */}
                    <rect
                      x={paddingX + i * barSlotWidth}
                      y={paddingY}
                      width={barSlotWidth}
                      height={plotHeight}
                      fill="transparent"
                    />

                    {/* Barra visual */}
                    <rect
                      x={xCenter - barWidth / 2}
                      y={d.pages > 0 ? y : barChartHeight - paddingY - 2}
                      width={barWidth}
                      height={d.pages > 0 ? barH : 2}
                      rx={3}
                      fill={isHovered ? '#1c1917' : d.pages > 0 ? '#92400e' : '#e7e5e4'}
                      className="transition-colors duration-150"
                    />

                    {/* Etiqueta X */}
                    <text
                      x={xCenter}
                      y={barChartHeight - paddingY + 16}
                      textAnchor="middle"
                      className={`text-[9px] font-sans ${
                        isHovered ? 'fill-stone-900 font-bold' : 'fill-stone-500'
                      }`}
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Tooltip flotante interactivo */}
            {hoveredBarIndex !== null && dailyData[hoveredBarIndex] && (
              <div
                className="absolute z-20 pointer-events-none bg-stone-900 text-stone-100 text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-stone-800 -translate-x-1/2 -translate-y-full transition-all"
                style={{
                  left: `${
                    ((paddingX +
                      hoveredBarIndex * barSlotWidth +
                      barSlotWidth / 2) /
                      barChartWidth) *
                    100
                  }%`,
                  top: `${
                    ((barChartHeight -
                      paddingY -
                      (dailyData[hoveredBarIndex].pages / maxPages) * plotHeight) /
                      barChartHeight) *
                    100
                  }%`,
                  marginTop: '-8px',
                }}
              >
                <div className="font-semibold text-white">{dailyData[hoveredBarIndex].fullDate}</div>
                <div className="text-[11px] text-amber-300 tabular-nums">
                  {dailyData[hoveredBarIndex].pages} páginas · {dailyData[hoveredBarIndex].minutes} min
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO 2: Minutos de Enfoque (SVG Area / Line Chart) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-700" />
              <h3 className="font-serif text-base font-bold text-stone-900">Tiempo de Lectura (Minutos)</h3>
            </div>
            <span className="text-xs text-stone-500">
              Total periodo: <strong className="tabular-nums text-stone-800">{dailyData.reduce((acc, d) => acc + d.minutes, 0)} min</strong>
            </span>
          </div>

          <div className="relative w-full aspect-[20/11] select-none">
            <svg
              viewBox={`0 0 ${barChartWidth} ${barChartHeight}`}
              className="w-full h-full overflow-visible"
              role="img"
              aria-label="Gráfico de área de minutos leídos por día"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Guías horizontales */}
              {[0, 0.5, 1].map((ratio) => {
                const y = barChartHeight - paddingY - ratio * plotHeight;
                const val = Math.round(ratio * maxMinutes);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={barChartWidth - paddingX}
                      y2={y}
                      stroke="#e7e5e4"
                      strokeWidth="1"
                      strokeDasharray={ratio === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-stone-400"
                    >
                      {val}m
                    </text>
                  </g>
                );
              })}

              {/* Área con gradiente */}
              {areaPathD && <path d={areaPathD} fill="url(#areaGradient)" />}

              {/* Línea suave */}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Puntos y etiquetas interactivas */}
              {areaPoints.map((pt, i) => {
                const isHovered = hoveredPointIndex === i;
                return (
                  <g
                    key={pt.date + i}
                    onMouseEnter={() => setHoveredPointIndex(i)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? '#1c1917' : '#0f766e'}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all"
                    />
                    <text
                      x={pt.x}
                      y={barChartHeight - paddingY + 16}
                      textAnchor="middle"
                      className={`text-[9px] font-sans ${
                        isHovered ? 'fill-stone-900 font-bold' : 'fill-stone-500'
                      }`}
                    >
                      {pt.date}
                    </text>
                  </g>
                );
              })}
            </svg>

            {hoveredPointIndex !== null && areaPoints[hoveredPointIndex] && (
              <div
                className="absolute z-20 pointer-events-none bg-stone-900 text-stone-100 text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-stone-800 -translate-x-1/2 -translate-y-full transition-all"
                style={{
                  left: `${(areaPoints[hoveredPointIndex].x / barChartWidth) * 100}%`,
                  top: `${(areaPoints[hoveredPointIndex].y / barChartHeight) * 100}%`,
                  marginTop: '-8px',
                }}
              >
                <div className="font-semibold text-white">{areaPoints[hoveredPointIndex].fullDate}</div>
                <div className="text-[11px] text-teal-300 tabular-nums">
                  {areaPoints[hoveredPointIndex].minutes} minutos de lectura
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. GRÁFICO 3: Distribución por Géneros & Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Donut Chart SVG */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-700" />
            <h3 className="font-serif text-base font-bold text-stone-900">
              Distribución del Catálogo por Género
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* SVG Donut */}
            <div className="relative w-44 h-44 shrink-0">
              <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
                {/* Círculo base de fondo */}
                <circle
                  cx="21"
                  cy="21"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke="#f5f5f4"
                  strokeWidth="6"
                />

                {/* Segmentos de Dona */}
                {genreDistribution.slices.map((slice) => (
                  <circle
                    key={slice.genre}
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="6"
                    strokeDasharray={slice.strokeDash}
                    strokeDashoffset={slice.offset}
                    className="transition-all hover:opacity-80"
                  />
                ))}
              </svg>

              {/* Centro de la dona con métrica */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-serif text-2xl font-bold text-stone-900 tabular-nums">
                  {genreDistribution.total}
                </span>
                <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                  Libros
                </span>
              </div>
            </div>

            {/* Leyenda y Desglose */}
            <div className="space-y-2.5 w-full max-w-xs">
              {genreDistribution.slices.map((slice) => (
                <div key={slice.genre} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="font-medium text-stone-700">{slice.genre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-stone-500">{slice.count} vol.</span>
                    <span className="tabular-nums font-semibold text-stone-800 w-8 text-right">
                      {slice.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen de Eficiencia y Ritmo con Palabras por Minuto */}
        <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Ritmo de Lectura</span>
            </div>
            <h4 className="font-serif text-lg font-bold text-white">Velocidad y Palabras por Minuto</h4>
            
            {/* Display PPM */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-extrabold tabular-nums text-amber-400">
                {stats.avgWordsPerMinute}
              </span>
              <span className="text-sm font-semibold text-stone-200">ppm / WPM</span>
            </div>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              Equivale a <strong className="text-white tabular-nums">{stats.avgPaceMinPerPage} min/pág</strong> (~
              {Math.round(60 / (stats.avgPaceMinPerPage || 1.5))} pág/hora).
            </p>

            <div className="mt-4 pt-3 border-t border-stone-800 text-xs text-stone-300">
              <span className="text-stone-400">Palabras acumuladas:</span>{' '}
              <strong className="text-amber-300 tabular-nums">
                {stats.totalWordsRead.toLocaleString()} palabras
              </strong>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-800 text-[11px] text-stone-400">
            Velocidad promedio calculada a partir de 275 palabras/página o densidad calibrada por libro.
          </div>
        </div>
      </div>

      {/* 4. Heatmap Anual de 12 Meses */}
      <YearHeatmap />
    </div>
  );
};
