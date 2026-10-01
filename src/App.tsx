/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ReadingProvider, useReading } from './context/ReadingContext';
import { Header } from './components/Header';
import { BottomNavBar, MainScreen } from './components/BottomNavBar';
import { BookCatalog } from './components/BookCatalog';
import { SessionManager } from './components/SessionManager';
import { ReadingCharts } from './components/ReadingCharts';
import { StreakAndGoalsScreen } from './components/StreakAndGoalsScreen';
import { AddBookModal } from './components/AddBookModal';
import { ManualSessionModal } from './components/ManualSessionModal';
import { FinishSessionModal } from './components/FinishSessionModal';
import { ActiveTimerFloatingBar } from './components/ActiveTimerFloatingBar';
import { OpenLibrarySearchModal } from './components/OpenLibrarySearchModal';
import { AIToolsScreen, AISubTab } from './components/AIToolsScreen';

function AppContent() {
  const { startActiveSession } = useReading();
  const [currentScreen, setCurrentScreen] = useState<MainScreen>('books');
  const [aiSubTab, setAiSubTab] = useState<AISubTab>('recommendations');

  // Modals state
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isOpenLibraryOpen, setIsOpenLibraryOpen] = useState(false);
  const [manualSessionTargetBookId, setManualSessionTargetBookId] = useState<string | null>(null);
  const [isManualSessionOpen, setIsManualSessionOpen] = useState(false);
  const [isFinishSessionOpen, setIsFinishSessionOpen] = useState(false);

  const handleOpenManualSession = (bookId?: string) => {
    setManualSessionTargetBookId(bookId || null);
    setIsManualSessionOpen(true);
  };

  const handleStartSession = (bookId: string) => {
    startActiveSession(bookId);
    setCurrentScreen('sessions');
  };

  const handleNavigateToAI = (subTab: AISubTab = 'recommendations') => {
    setAiSubTab(subTab);
    setCurrentScreen('ai_tools');
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      {/* 1. Header Navigation Bar (Top Bar Contract) */}
      <Header
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        onOpenAddBook={() => setIsAddBookOpen(true)}
        onOpenManualSession={() => handleOpenManualSession()}
      />

      {/* 2. Main Content Viewport with 8px rhythm and safe bottom padding for bottom nav */}
      <main
        id="main-content"
        className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 md:pb-12"
      >
        {/* Screen 1: Biblioteca y Progreso de Libros */}
        {currentScreen === 'books' && (
          <section aria-labelledby="books-heading" className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                <span>Colección & Progreso</span>
                <span aria-hidden="true">·</span>
                <span>Beta 2.0</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-medium">Dexie IndexedDB con upgrade()</span>
              </div>
              <h1 id="books-heading" className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                Tu Biblioteca de Lectura
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
                Gestiona tus libros, actualiza páginas con un toque, busca en Open Library con caché offline e inicia sesiones cronometradas.
              </p>
            </div>

            <BookCatalog
              onStartSession={handleStartSession}
              onOpenManualSession={handleOpenManualSession}
              onOpenAddBook={() => setIsAddBookOpen(true)}
              onOpenOpenLibrarySearch={() => setIsOpenLibraryOpen(true)}
              onNavigateToAI={handleNavigateToAI}
            />
          </section>
        )}

        {/* Screen 2: Sesiones y Cronómetro */}
        {currentScreen === 'sessions' && (
          <section aria-labelledby="sessions-heading" className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                <span>Concentración & Cronómetro</span>
                <span aria-hidden="true">·</span>
                <span>Beta 2.0</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-800 font-medium">Medición de Palabras por Minuto (PPM)</span>
              </div>
              <h1 id="sessions-heading" className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                Sesiones y Ritmo de Lectura
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
                Mide tu tiempo de lectura activa en vivo o registra tus lecturas pasadas con cálculo de velocidad en palabras por minuto.
              </p>
            </div>

            <SessionManager
              onOpenManualSession={handleOpenManualSession}
              onOpenFinishSession={() => setIsFinishSessionOpen(true)}
            />
          </section>
        )}

        {/* Screen 3: Métricas, Gráficos SVG y Heatmap de 12 Meses */}
        {currentScreen === 'analytics' && (
          <section aria-labelledby="analytics-heading">
            <ReadingCharts />
          </section>
        )}

        {/* Screen 4: IA Lectora & Aprendizaje (Beta 3.0: Recomendaciones responseSchema, Chat de notas, Quiz formativo) */}
        {currentScreen === 'ai_tools' && (
          <section aria-labelledby="ai-heading">
            <AIToolsScreen initialSubTab={aiSubTab} />
          </section>
        )}

        {/* Screen 5: Racha con date-fns, Días de Gracia, Metas y Storage Dexie */}
        {currentScreen === 'streaks_goals' && (
          <section aria-labelledby="streaks-heading">
            <StreakAndGoalsScreen />
          </section>
        )}
      </main>

      {/* 3. Floating timer bar when active session is running and user is on another screen */}
      {currentScreen !== 'sessions' && (
        <div className="mb-14 sm:mb-0">
          <ActiveTimerFloatingBar
            onOpenFinishSession={() => setIsFinishSessionOpen(true)}
            onNavigateToSessions={() => setCurrentScreen('sessions')}
          />
        </div>
      )}

      {/* 4. Bottom Navigation Bar (Mobile / Touch First Pattern) */}
      <BottomNavBar
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
      />

      {/* 5. Modals */}
      <AddBookModal
        isOpen={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        onOpenOpenLibrarySearch={() => setIsOpenLibraryOpen(true)}
      />

      <OpenLibrarySearchModal
        isOpen={isOpenLibraryOpen}
        onClose={() => setIsOpenLibraryOpen(false)}
      />

      <ManualSessionModal
        isOpen={isManualSessionOpen}
        onClose={() => {
          setIsManualSessionOpen(false);
          setManualSessionTargetBookId(null);
        }}
        preselectedBookId={manualSessionTargetBookId}
      />

      <FinishSessionModal
        isOpen={isFinishSessionOpen}
        onClose={() => setIsFinishSessionOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ReadingProvider>
      <AppContent />
    </ReadingProvider>
  );
}
