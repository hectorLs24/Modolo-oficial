import React, { useState } from 'react';
import { X, Calendar, Clock, BookOpen } from 'lucide-react';
import { useReading } from '../context/ReadingContext';

interface ManualSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBookId?: string | null;
}

export const ManualSessionModal: React.FC<ManualSessionModalProps> = ({
  isOpen,
  onClose,
  preselectedBookId,
}) => {
  const { state, logManualSession } = useReading();

  const [bookId, setBookId] = useState(
    preselectedBookId || (state.books.length > 0 ? state.books[0].id : '')
  );

  const selectedBook = state.books.find((b) => b.id === bookId) || state.books[0];

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(30);
  const [startPage, setStartPage] = useState<number | ''>(
    selectedBook ? selectedBook.currentPage : 0
  );
  const [endPage, setEndPage] = useState<number | ''>(
    selectedBook ? Math.min(selectedBook.totalPages, selectedBook.currentPage + 15) : 15
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cuando cambia el libro seleccionado, actualizar páginas si el usuario aún no las ha modificado mucho
  const handleBookChange = (newBookId: string) => {
    setBookId(newBookId);
    const book = state.books.find((b) => b.id === newBookId);
    if (book) {
      setStartPage(book.currentPage);
      setEndPage(Math.min(book.totalPages, book.currentPage + 15));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId) {
      setError('Debes seleccionar un libro.');
      return;
    }
    const dur = Number(durationMinutes);
    if (!dur || dur <= 0) {
      setError('La duración debe ser mayor a 0 minutos.');
      return;
    }
    const start = Number(startPage);
    const end = Number(endPage);
    if (end < start) {
      setError(`La página final (${end}) no puede ser inferior a la página inicial (${start}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await logManualSession({
        bookId,
        date: new Date(date).toISOString(),
        durationMinutes: dur,
        startPage: start,
        endPage: end,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al registrar la sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="bg-stone-50 border border-stone-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-stone-800" />
            <h2 className="font-serif text-lg font-bold text-stone-900">Registrar Sesión Manual</h2>
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

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Libro *
            </label>
            <select
              value={bookId}
              onChange={(e) => handleBookChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
            >
              {state.books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} ({book.currentPage}/{book.totalPages} pág.)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Fecha y hora
              </label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Duración (minutos) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Página inicial *
              </label>
              <input
                type="number"
                min="0"
                required
                value={startPage}
                onChange={(e) => setStartPage(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Página final alcanzada *
              </label>
              <input
                type="number"
                min="0"
                required
                value={endPage}
                onChange={(e) => setEndPage(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Notas o citas de la sesión
            </label>
            <textarea
              rows={2}
              placeholder="Reflexiones, ideas o pasajes destacados..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {isSubmitting ? 'Guardando...' : 'Registrar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
