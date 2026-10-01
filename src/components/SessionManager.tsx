import React, { useState } from 'react';
import {
  Timer,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle2,
  Calendar,
  BookOpen,
  Trash2,
  Plus,
  Clock,
  Zap,
} from 'lucide-react';
import { useReading } from '../context/ReadingContext';

interface SessionManagerProps {
  onOpenManualSession: (bookId?: string) => void;
  onOpenFinishSession: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  onOpenManualSession,
  onOpenFinishSession,
}) => {
  const {
    state,
    startActiveSession,
    pauseActiveSession,
    resumeActiveSession,
    cancelActiveSession,
    deleteSession,
    stats,
  } = useReading();

  const [selectedBookToStart, setSelectedBookToStart] = useState<string>(
    state.books.find((b) => b.status === 'reading')?.id || (state.books[0]?.id || '')
  );

  const activeSession = state.activeSession;
  const activeBook = activeSession ? state.books.find((b) => b.id === activeSession.bookId) : null;

  // Formato mm:ss o hh:mm:ss para el cronómetro
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. SECCIÓN CRONÓMETRO DE LECTURA EN TIEMPO REAL */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <Timer className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif text-lg font-bold text-white">Cronómetro de Lectura Activa</h2>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            {activeSession ? (activeSession.isRunning ? 'EN CURSO' : 'PAUSADO') : 'LISTO'}
          </span>
        </div>

        {activeSession && activeBook ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs text-stone-400 tracking-wider uppercase font-medium">Leyendo actualmente</span>
              <h3 className="font-serif text-2xl font-bold text-white">{activeBook.title}</h3>
              <p className="text-xs text-stone-400 font-sans">
                {activeBook.author} · Página de partida: <span className="tabular-nums text-white font-semibold">{activeSession.startPage}</span>
              </p>
            </div>

            {/* Display Segundero Digital */}
            <div className="py-2" aria-live="polite">
              <span className="font-mono text-5xl sm:text-6xl font-semibold tracking-tight tabular-nums text-amber-400">
                {formatTime(activeSession.elapsedSeconds)}
              </span>
              <span className="sr-only">Tiempo transcurrido: {formatTime(activeSession.elapsedSeconds)}</span>
            </div>

            {/* Controles de Cronómetro */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {activeSession.isRunning ? (
                <button
                  onClick={pauseActiveSession}
                  className="min-h-[44px] px-5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Pause className="w-4 h-4" aria-hidden="true" />
                  <span>Pausar</span>
                </button>
              ) : (
                <button
                  onClick={resumeActiveSession}
                  className="min-h-[44px] px-5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                  <span>Reanudar</span>
                </button>
              )}

              <button
                onClick={onOpenFinishSession}
                className="min-h-[44px] px-6 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Finalizar y Guardar Sesión</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('¿Deseas descartar esta sesión activa sin guardar?')) {
                    cancelActiveSession();
                  }
                }}
                aria-label="Descartar sesión activa sin guardar"
                title="Descartar sesión"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Square className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center space-y-5 text-center">
            <div className="max-w-md space-y-2">
              <p className="text-sm text-stone-300">
                Elige un libro y enciende el cronómetro para registrar tu tiempo de concentración, calcular tu velocidad de lectura y avanzar tus metas.
              </p>
            </div>

            {state.books.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                <select
                  value={selectedBookToStart}
                  onChange={(e) => setSelectedBookToStart(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-800 border border-stone-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {state.books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.currentPage}/{b.totalPages} pág.)
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => startActiveSession(selectedBookToStart)}
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar Cronómetro</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-stone-500">Agrega un libro al catálogo primero.</p>
            )}
          </div>
        )}
      </div>

      {/* 2. RESUMEN DE SESIONES Y REGISTRO MANUAL */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">Historial de Lectura</h3>
            <p className="text-xs text-stone-500">
              {state.sessions.length} sesiones · {stats.totalMinutesRead} min · {stats.totalPagesRead} pág. ·{' '}
              <strong className="text-stone-800 font-semibold tabular-nums">
                {stats.totalWordsRead.toLocaleString()} palabras
              </strong>{' '}
              ({stats.avgWordsPerMinute} ppm de media)
            </p>
          </div>

          <button
            onClick={() => onOpenManualSession()}
            className="self-start sm:self-auto min-h-[44px] inline-flex items-center gap-1.5 px-4 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Sesión Manual</span>
          </button>
        </div>

        {/* Tabla / Lista de Sesiones */}
        {state.sessions.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-stone-300 rounded-xl bg-white/50">
            <Clock className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-700">Aún no hay sesiones registradas</p>
            <p className="text-xs text-stone-500 mt-1">
              Las sesiones concluidas mediante el cronómetro o agregadas manualmente aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-500 font-medium">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Libro</th>
                    <th className="py-3 px-4 text-right">Duración</th>
                    <th className="py-3 px-4 text-right">Páginas</th>
                    <th className="py-3 px-4 text-right">Velocidad (PPM)</th>
                    <th className="py-3 px-4 text-right">Ritmo</th>
                    <th className="py-3 px-4">Notas</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {state.sessions.map((session) => {
                    const book = state.books.find((b) => b.id === session.bookId);

                    return (
                      <tr key={session.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-stone-600">
                          {formatDate(session.date)}
                        </td>
                        <td className="py-3 px-4 font-medium text-stone-900 max-w-[180px] truncate">
                          {book ? book.title : 'Libro no disponible'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums text-stone-800 whitespace-nowrap">
                          {session.durationMinutes} min
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-stone-700 whitespace-nowrap">
                          <span className="font-semibold text-emerald-700">+{session.pagesRead}</span>
                          <span className="text-[11px] text-stone-400 ml-1">
                            ({session.startPage} → {session.endPage})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                          {session.wordsPerMinute ? (
                            <span className="font-bold text-amber-900">
                              {session.wordsPerMinute}{' '}
                              <span className="text-[10px] font-normal text-stone-400">ppm</span>
                            </span>
                          ) : (
                            <span className="text-stone-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-stone-600 whitespace-nowrap">
                          {session.paceMinPerPage ? (
                            <span>{session.paceMinPerPage} <span className="text-[10px] text-stone-400">min/p</span></span>
                          ) : (
                            <span className="text-stone-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-600 italic max-w-xs truncate">
                          {session.notes || <span className="text-stone-300 not-italic">-</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar esta sesión de lectura?')) {
                                deleteSession(session.id);
                              }
                            }}
                            aria-label="Eliminar sesión de lectura"
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                            title="Eliminar sesión"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
