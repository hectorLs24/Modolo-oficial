import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Play,
  Plus,
  Minus,
  Check,
  MoreVertical,
  Trash2,
  Clock,
  Sparkles,
  Globe,
} from 'lucide-react';
import { useReading } from '../context/ReadingContext';
import { Book, BookStatus } from '../types';

interface BookCatalogProps {
  onStartSession: (bookId: string) => void;
  onOpenManualSession: (bookId: string) => void;
  onOpenAddBook: () => void;
  onOpenOpenLibrarySearch?: () => void;
}

export const BookCatalog: React.FC<BookCatalogProps> = ({
  onStartSession,
  onOpenManualSession,
  onOpenAddBook,
  onOpenOpenLibrarySearch,
}) => {
  const {
    state,
    setFilterStatus,
    setSearchQuery,
    updateBookProgress,
    setBookStatus,
    deleteBook,
  } = useReading();

  const [editingPageBookId, setEditingPageBookId] = useState<string | null>(null);
  const [tempPageInput, setTempPageInput] = useState<number>(0);
  const [menuOpenBookId, setMenuOpenBookId] = useState<string | null>(null);

  // Filtrado y búsqueda
  const filteredBooks = state.books.filter((book) => {
    // Filtro por estado
    if (state.filterStatus !== 'all' && book.status !== state.filterStatus) {
      return false;
    }
    // Filtro por texto de búsqueda
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      const matchTitle = book.title.toLowerCase().includes(q);
      const matchAuthor = book.author.toLowerCase().includes(q);
      const matchGenre = book.genre?.toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchGenre) return false;
    }
    return true;
  });

  const handleStartEditPage = (book: Book) => {
    setEditingPageBookId(book.id);
    setTempPageInput(book.currentPage);
  };

  const handleSavePage = (bookId: string) => {
    updateBookProgress(bookId, tempPageInput);
    setEditingPageBookId(null);
  };

  const handleQuickPageStep = (book: Book, delta: number) => {
    const next = Math.max(0, Math.min(book.totalPages, book.currentPage + delta));
    updateBookProgress(book.id, next);
  };

  const getStatusLabel = (status: BookStatus) => {
    switch (status) {
      case 'reading':
        return 'Leyendo ahora';
      case 'to_read':
        return 'Por leer';
      case 'completed':
        return 'Terminado';
      case 'abandoned':
        return 'Pausado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        {/* Segmented filter controls */}
        <div
          role="group"
          aria-label="Filtrar libros por estado de lectura"
          className="flex flex-wrap items-center gap-1 p-1 bg-stone-200/80 rounded-xl self-start"
        >
          <button
            onClick={() => setFilterStatus('all')}
            aria-pressed={state.filterStatus === 'all'}
            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              state.filterStatus === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Todos ({state.books.length})
          </button>
          <button
            onClick={() => setFilterStatus('reading')}
            aria-pressed={state.filterStatus === 'reading'}
            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              state.filterStatus === 'reading'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Leyendo ({state.books.filter((b) => b.status === 'reading').length})
          </button>
          <button
            onClick={() => setFilterStatus('to_read')}
            aria-pressed={state.filterStatus === 'to_read'}
            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              state.filterStatus === 'to_read'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Por leer ({state.books.filter((b) => b.status === 'to_read').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            aria-pressed={state.filterStatus === 'completed'}
            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              state.filterStatus === 'completed'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Terminados ({state.books.filter((b) => b.status === 'completed').length})
          </button>
        </div>

        {/* Search input & Open Library trigger */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <label htmlFor="search-books" className="sr-only">
              Buscar libros por título, autor o género
            </label>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden="true" />
            <input
              id="search-books"
              type="text"
              placeholder="Buscar en tu biblioteca..."
              value={state.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-3.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 text-stone-900 placeholder:text-stone-400"
            />
          </div>

          {onOpenOpenLibrarySearch && (
            <button
              onClick={onOpenOpenLibrarySearch}
              title="Buscar y agregar títulos de Open Library con carátula y páginas"
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold text-stone-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-xl transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
            >
              <Globe className="w-4 h-4 text-amber-800" />
              <span className="hidden sm:inline">Open Library</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista / Grid de Libros */}
      {filteredBooks.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-stone-300 rounded-xl bg-white/50 space-y-3">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">No se encontraron libros</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {state.searchQuery
              ? `No hay resultados para "${state.searchQuery}". Prueba con otro término.`
              : 'Tu catálogo está listo para recibir tus lecturas.'}
          </p>
          <button
            onClick={onOpenAddBook}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar tu primer libro</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBooks.map((book) => {
            const progressPercent = Math.min(
              100,
              Math.round((book.currentPage / book.totalPages) * 100)
            );
            const isEditingThis = editingPageBookId === book.id;
            const isMenuOpen = menuOpenBookId === book.id;

            return (
              <div
                key={book.id}
                className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-stone-300 hover:shadow-xs transition-all relative"
              >
                <div>
                  {/* Top card bar: Color spine accent + Title + Menu */}
                  <div className="flex items-start gap-3.5">
                    {/* Visual book spine / cover chip */}
                    <div
                      className="w-11 h-15 rounded-md shadow-xs shrink-0 flex flex-col justify-between p-1.5 text-white/90 border border-black/10"
                      style={{ backgroundColor: book.coverColor || '#334155' }}
                    >
                      <span className="text-[9px] font-serif font-bold uppercase tracking-wider line-clamp-1">
                        {book.title.slice(0, 10)}
                      </span>
                      <div className="w-full h-0.5 bg-white/30 rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-base font-bold text-stone-900 leading-snug line-clamp-1">
                            {book.title}
                          </h3>
                          <p className="text-xs text-stone-600 font-medium">{book.author}</p>
                        </div>

                        {/* Menu options */}
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpenBookId(isMenuOpen ? null : book.id)}
                            className="p-1 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 top-7 w-44 bg-white border border-stone-200 rounded-lg shadow-lg py-1 z-20 animate-in fade-in zoom-in-95 text-xs">
                              <button
                                onClick={() => {
                                  setBookStatus(
                                    book.id,
                                    book.status === 'completed' ? 'reading' : 'completed'
                                  );
                                  setMenuOpenBookId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-stone-100 text-stone-700 flex items-center justify-between"
                              >
                                <span>{book.status === 'completed' ? 'Marcar como Leyendo' : 'Marcar como Terminado'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  onOpenManualSession(book.id);
                                  setMenuOpenBookId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-stone-100 text-stone-700"
                              >
                                Registrar sesión manual
                              </button>
                              <div className="h-px bg-stone-100 my-1" />
                              <button
                                onClick={() => {
                                  if (confirm(`¿Seguro que deseas eliminar "${book.title}"?`)) {
                                    deleteBook(book.id);
                                  }
                                  setMenuOpenBookId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar libro</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Clean Unboxed Metadata with · separator */}
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-2">
                        <span>{book.genre || 'Literatura'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{book.totalPages} pág.</span>
                        <span aria-hidden="true">·</span>
                        <span className={book.status === 'completed' ? 'text-emerald-700 font-medium' : book.status === 'reading' ? 'text-amber-700 font-medium' : ''}>
                          {getStatusLabel(book.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Quote if present */}
                  {book.notes && (
                    <p className="text-xs text-stone-600 italic bg-stone-50 p-2.5 rounded-md border border-stone-150 mt-3 line-clamp-2">
                      "{book.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom section: Progress bar & inline updater & session launcher */}
                <div className="mt-4 pt-3 border-t border-stone-100 space-y-3">
                  {/* Progress Header & Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max={book.totalPages}
                            value={tempPageInput}
                            onChange={(e) => setTempPageInput(Number(e.target.value))}
                            className="w-16 px-1.5 py-0.5 text-xs bg-white border border-stone-400 rounded tabular-nums"
                            autoFocus
                          />
                          <span className="text-stone-400">/ {book.totalPages} pág.</span>
                          <button
                            onClick={() => handleSavePage(book.id)}
                            className="p-1 bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditPage(book)}
                          title="Haz clic para editar la página exacta"
                          className="hover:underline cursor-pointer flex items-center gap-1 text-stone-700 font-medium"
                        >
                          <span className="tabular-nums font-semibold">{book.currentPage}</span>
                          <span className="text-stone-400">/ {book.totalPages} páginas</span>
                        </button>
                      )}

                      <span className="font-semibold text-stone-800 tabular-nums">
                        {progressPercent}%
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor:
                            book.status === 'completed'
                              ? '#059669'
                              : book.coverColor || '#1c1917',
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    {/* Quick Step Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuickPageStep(book, -10)}
                        disabled={book.currentPage <= 0}
                        aria-label={`Retroceder 10 páginas en ${book.title}`}
                        title="Retroceder 10 páginas"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
                      >
                        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleQuickPageStep(book, 10)}
                        disabled={book.currentPage >= book.totalPages}
                        aria-label={`Avanzar 10 páginas en ${book.title}`}
                        title="Avanzar 10 páginas"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Launch Live Session Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenManualSession(book.id)}
                        className="min-h-[44px] px-3 text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
                      >
                        Registrar
                      </button>
                      <button
                        onClick={() => onStartSession(book.id)}
                        className="min-h-[44px] inline-flex items-center gap-2 px-4 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>Iniciar Lectura</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
