import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  X,
  Plus,
  Check,
  Globe,
  HardDrive,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { searchOpenLibrary } from '../services/openLibrary';
import { OpenLibraryBookResult } from '../types';
import { useReading } from '../context/ReadingContext';

interface OpenLibrarySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpenLibrarySearchModal: React.FC<OpenLibrarySearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addBook } = useReading();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibraryBookResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [addedKey, setAddedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Búsqueda inicial predeterminada para que el modal no esté vacío al abrir
    const initialFetch = async () => {
      setIsLoading(true);
      const res = await searchOpenLibrary(query || 'literatura');
      setResults(res.results);
      setFromCache(res.fromCache);
      setIsLoading(false);
    };

    const timer = setTimeout(initialFetch, 300);
    return () => clearTimeout(timer);
  }, [isOpen, query]);

  if (!isOpen) return null;

  const handleAddBookFromOL = async (item: OpenLibraryBookResult) => {
    try {
      await addBook({
        title: item.title,
        author: item.author,
        totalPages: item.numberOfPages || 280,
        genre: item.subject && item.subject.length > 0 ? item.subject[0] : 'Literatura',
        coverColor: '#1e3a8a',
        isbn: item.isbn,
        notes: `Importado desde Open Library (${item.firstPublishYear || 'N/A'}).`,
      });
      setAddedKey(item.key);
      setTimeout(() => setAddedKey(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-stone-50 border border-stone-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center border border-amber-600/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-stone-900">
                  Explorar en Open Library
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                  Caché Offline Dexie
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Millones de títulos con portadas y páginas integradas con persistencia local.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input de Búsqueda */}
        <div className="p-4 border-b border-stone-200 bg-stone-100/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por título, autor, temática o ISBN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-10 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 text-stone-900"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 animate-spin" />
            )}
          </div>

          {/* Indicador de fuente (API o Caché Offline) */}
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-stone-500">
            <span>
              {results.length} resultados disponibles
            </span>
            {fromCache ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Servido desde caché IndexedDB (offline)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-stone-500">
                <Globe className="w-3.5 h-3.5" />
                <span>Consultado en vivo desde openlibrary.org</span>
              </span>
            )}
          </div>
        </div>

        {/* Lista de Resultados */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {results.length === 0 && !isLoading ? (
            <div className="text-center py-12 text-stone-500 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-stone-300" />
              <p className="text-sm font-semibold text-stone-700">No se encontraron títulos</p>
              <p className="text-xs text-stone-400">Prueba con palabras clave como autor, título o novela.</p>
            </div>
          ) : (
            results.map((book) => {
              const isAdded = addedKey === book.key;

              return (
                <div
                  key={book.key}
                  className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-start gap-4 hover:border-stone-300 hover:shadow-xs transition-all"
                >
                  {/* Portada */}
                  <div className="w-14 h-20 rounded-md bg-stone-100 border border-stone-200 shrink-0 overflow-hidden flex items-center justify-center text-stone-400 shadow-2xs">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={`Portada de ${book.title}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Si falla la imagen, mostrar contenedor estilizado
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <BookOpen className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  {/* Metadatos */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-sm font-bold text-stone-900 leading-snug line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-stone-600 font-medium">{book.author}</p>

                    {/* Clean unboxed metadata with · */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 mt-2">
                      <span className="tabular-nums">~{book.numberOfPages || 280} pág.</span>
                      {book.firstPublishYear && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{book.firstPublishYear}</span>
                        </>
                      )}
                      {book.subject && book.subject.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="line-clamp-1">{book.subject.slice(0, 2).join(' / ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Botón de Añadir a biblioteca */}
                  <button
                    onClick={() => handleAddBookFromOL(book)}
                    disabled={isAdded}
                    className={`min-h-[44px] shrink-0 inline-flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Agregado</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
