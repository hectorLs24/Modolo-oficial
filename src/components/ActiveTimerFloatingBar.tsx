import React from 'react';
import { Timer, Pause, Play, CheckCircle2 } from 'lucide-react';
import { useReading } from '../context/ReadingContext';

interface ActiveTimerFloatingBarProps {
  onOpenFinishSession: () => void;
  onNavigateToSessions: () => void;
}

export const ActiveTimerFloatingBar: React.FC<ActiveTimerFloatingBarProps> = ({
  onOpenFinishSession,
  onNavigateToSessions,
}) => {
  const { state, pauseActiveSession, resumeActiveSession } = useReading();
  const activeSession = state.activeSession;

  if (!activeSession) return null;

  const currentBook = state.books.find((b) => b.id === activeSession.bookId);
  if (!currentBook) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-stone-900/95 backdrop-blur text-stone-100 p-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-xl border border-stone-800 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
      <div
        onClick={onNavigateToSessions}
        className="flex items-center gap-3 cursor-pointer min-w-0"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <Timer className="w-4 h-4 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white truncate">{currentBook.title}</div>
          <div className="text-[11px] text-stone-400">
            Pág. inicial: <span className="tabular-nums text-stone-300">{activeSession.startPage}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-lg font-semibold tabular-nums text-amber-400">
          {formatTime(activeSession.elapsedSeconds)}
        </span>

        {activeSession.isRunning ? (
          <button
            onClick={pauseActiveSession}
            title="Pausar"
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={resumeActiveSession}
            title="Reanudar"
            className="p-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
        )}

        <button
          onClick={onOpenFinishSession}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Finalizar</span>
        </button>
      </div>
    </div>
  );
};
