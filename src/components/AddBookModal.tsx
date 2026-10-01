import React, { useState } from 'react';
import { X, BookPlus, Globe, Sparkles } from 'lucide-react';
import { useReading } from '../context/ReadingContext';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOpenLibrarySearch?: () => void;
}

const PRESET_COLORS = [
  { label: 'Cuero Ámbar', color: '#92400e' },
  { label: 'Esmeralda Oscuro', color: '#0f766e' },
  { label: 'Azul Noche', color: '#1e3a8a' },
  { label: 'Vino Tinto', color: '#991b1b' },
  { label: 'Pizarra Carbón', color: '#334155' },
  { label: 'Oliva Cálido', color: '#3f6212' },
];

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  onOpenOpenLibrarySearch,
}) => {
  const { addBook } = useReading();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState<number | ''>(0);
  const [genre, setGenre] = useState('');
  const [coverColor, setCoverColor] = useState(PRESET_COLORS[0].color);
  const [wordsPerPage, setWordsPerPage] = useState<number | ''>(275);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título del libro es obligatorio.');
      return;
    }
    if (!author.trim()) {
      setError('El autor es obligatorio.');
      return;
    }
    const pages = Number(totalPages);
    if (!pages || pages <= 0) {
      setError('El número total de páginas debe ser mayor a 0.');
      return;
    }

    const cur = Number(currentPage) || 0;
    if (cur < 0 || cur > pages) {
      setError(`La página actual debe estar entre 0 y ${pages}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addBook({
        title,
        author,
        totalPages: pages,
        currentPage: cur,
        genre: genre.trim() || 'Ficción',
        coverColor,
        wordsPerPage: Number(wordsPerPage) || 275,
        notes: notes.trim(),
      });
      // Limpiar formulario y cerrar
      setTitle('');
      setAuthor('');
      setTotalPages('');
      setCurrentPage(0);
      setGenre('');
      setWordsPerPage(275);
      setNotes('');
      setError(null);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al guardar el libro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-stone-50 border border-stone-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-stone-800" />
            <h2 className="font-serif text-lg font-bold text-stone-900">Agregar Nuevo Libro</h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt para Open Library */}
        {onOpenOpenLibrarySearch && (
          <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <Globe className="w-4 h-4 text-amber-700" />
              <span>¿Prefieres buscar la portada y páginas oficiales?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOpenLibrarySearch();
              }}
              className="font-bold text-amber-900 hover:underline cursor-pointer"
            >
              Buscar en Open Library →
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Título del libro *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Ficciones"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full min-h-[44px] px-3 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Autor / Autora *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Jorge Luis Borges"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full min-h-[44px] px-3 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Páginas totales *
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="Ej. 240"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full min-h-[44px] px-3 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Página actual (opcional)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full min-h-[44px] px-3 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Género / Categoría
              </label>
              <input
                type="text"
                placeholder="Ej. Cuento, Ensayo, Novela"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full min-h-[44px] px-3 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Palabras por página (PPM)
              </label>
              <input
                type="number"
                min="100"
                max="600"
                value={wordsPerPage}
                onChange={(e) => setWordsPerPage(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full min-h-[44px] px-3 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 tabular-nums"
                title="Promedio estándar ~275 palabras/página para calcular tu velocidad en palabras por minuto"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Tono de portada
            </label>
            <div className="flex items-center gap-3 pt-1">
              {PRESET_COLORS.map((item) => (
                <button
                  key={item.color}
                  type="button"
                  title={item.label}
                  onClick={() => setCoverColor(item.color)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    coverColor === item.color
                      ? 'ring-2 ring-stone-900 ring-offset-2 scale-110'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: item.color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Notas iniciales (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="¿Por qué quieres leerlo? ¿Quién te lo recomendó?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Libro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
