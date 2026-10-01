import React from 'react';
import { Plus, Timer, Sparkles } from 'lucide-react';
import { useReading } from '../context/ReadingContext';
import { MainScreen } from './BottomNavBar';

interface HeaderProps {
  currentScreen: MainScreen;
  onSelectScreen: (screen: MainScreen) => void;
  onOpenAddBook: () => void;
  onOpenManualSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onSelectScreen,
  onOpenAddBook,
  onOpenManualSession,
}) => {
  const { state } = useReading();

  return (
    <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-serif text-lg font-bold shadow-xs select-none"
            aria-hidden="true"
          >
            L
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-stone-900">
            Lectura{' '}
            <span className="font-sans text-[11px] font-semibold tracking-wider text-amber-800 uppercase ml-1">
              Beta 2.0
            </span>
          </span>
        </div>

        {/* Zone 2: Navigation Links (Desktop view) */}
        <nav
          role="navigation"
          aria-label="Navegación principal superior"
          className="hidden md:flex items-center gap-1 lg:gap-2"
        >
          <button
            onClick={() => onSelectScreen('books')}
            aria-current={currentScreen === 'books' ? 'page' : undefined}
            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              currentScreen === 'books'
                ? 'bg-stone-200 text-stone-900 font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Biblioteca
          </button>
          <button
            onClick={() => onSelectScreen('sessions')}
            aria-current={currentScreen === 'sessions' ? 'page' : undefined}
            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              currentScreen === 'sessions'
                ? 'bg-stone-200 text-stone-900 font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span>Sesiones</span>
            {state.activeSession?.isRunning && (
              <span
                className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"
                aria-label="Cronómetro activo"
              />
            )}
          </button>
          <button
            onClick={() => onSelectScreen('analytics')}
            aria-current={currentScreen === 'analytics' ? 'page' : undefined}
            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              currentScreen === 'analytics'
                ? 'bg-stone-200 text-stone-900 font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Métricas SVG
          </button>
          <button
            onClick={() => onSelectScreen('streaks_goals')}
            aria-current={currentScreen === 'streaks_goals' ? 'page' : undefined}
            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              currentScreen === 'streaks_goals'
                ? 'bg-stone-200 text-stone-900 font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Racha & Metas
          </button>
        </nav>

        {/* Zone 3: Primary Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenManualSession}
            className="min-h-[44px] hidden sm:inline-flex items-center gap-1.5 px-3 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
          >
            <Timer className="w-4 h-4 text-stone-600" aria-hidden="true" />
            <span>Registrar Sesión</span>
          </button>
          <button
            onClick={onOpenAddBook}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Nuevo Libro</span>
          </button>
        </div>
      </div>
    </header>
  );
};
