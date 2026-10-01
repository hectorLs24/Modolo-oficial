import React, { useState } from 'react';
import { X, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import { useReading } from '../context/ReadingContext';

interface FinishSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinishSessionModal: React.FC<FinishSessionModalProps> = ({ isOpen, onClose }) => {
  const { state, finishActiveSession } = useReading();
  const activeSession = state.activeSession;

  const currentBook = activeSession ? state.books.find((b) => b.id === activeSession.bookId) : null;
  const initialEndPage = currentBook ? Math.min(currentBook.totalPages, activeSession ? activeSession.startPage + 10 : 10) : 10;

  const [endPage, setEndPage] = useState<number>(initialEndPage);
  const [sessionNotes, setSessionNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !activeSession || !currentBook) return null;

  const elapsedMinutes = Math.max(1, Math.round(activeSession.elapsedSeconds / 60));
  const pagesRead = Math.max(0, endPage - activeSession.startPage);
  const pace = pagesRead > 0 ? (elapsedMinutes / pagesRead).toFixed(1) : '-';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (endPage < activeSession.startPage) {
      setError(`La página final (${endPage}) no puede ser menor a la inicial (${activeSession.startPage}).`);
      return;
    }
    if (endPage > currentBook.totalPages) {
      setError(`La página final no puede superar el total de páginas (${currentBook.totalPages}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await finishActiveSession(endPage, sessionNotes);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Error al registrar la sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="bg-stone-50 border border-stone-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <h2 className="font-serif text-lg font-bold text-stone-900">Completar Sesión de Lectura</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Resumen del libro y tiempo */}
          <div className="p-3.5 bg-stone-100 rounded-lg border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-800 truncate max-w-[200px]">{currentBook.title}</span>
              <span className="text-stone-500">{currentBook.author}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
              <div className="flex items-center gap-1.5 text-stone-700">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span className="font-semibold tabular-nums">{elapsedMinutes} minutos</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-700">
                <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                <span>Pág. inicial: <strong className="tabular-nums">{activeSession.startPage}</strong></span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              ¿En qué página terminaste? (Total: {currentBook.totalPages} pág.)
            </label>
            <input
              type="number"
              min={activeSession.startPage}
              max={currentBook.totalPages}
              required
              value={endPage}
              onChange={(e) => setEndPage(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 tabular-nums"
            />
          </div>

          {/* Cálculo en vivo con PPM */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-white border border-stone-200 rounded-xl text-center">
            <div>
              <span className="text-[10px] text-stone-500 block uppercase font-medium">Páginas</span>
              <span className="text-base font-bold text-stone-900 tabular-nums">+{pagesRead}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block uppercase font-medium">Velocidad</span>
              <span className="text-base font-bold text-amber-800 tabular-nums">
                {pagesRead > 0 ? Math.round((pagesRead * (currentBook.wordsPerPage || 275)) / elapsedMinutes) : 0}{' '}
                <span className="text-[10px] font-normal text-stone-500">ppm</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block uppercase font-medium">Ritmo</span>
              <span className="text-base font-bold text-stone-900 tabular-nums">
                {pace} <span className="text-[10px] font-normal text-stone-500">min/p</span>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Reflexiones o apuntes de la sesión (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ideas clave, citas memorables o sensaciones..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Finalizar y Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
