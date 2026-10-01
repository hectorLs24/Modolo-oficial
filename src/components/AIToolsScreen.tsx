import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  MessageSquare,
  GraduationCap,
} from 'lucide-react';
import { AIRecommendations } from './AIRecommendations';
import { ChatNotes } from './ChatNotes';
import { ReadingQuiz } from './ReadingQuiz';

export type AISubTab = 'recommendations' | 'chat' | 'quiz';

interface AIToolsScreenProps {
  initialSubTab?: AISubTab;
}

export const AIToolsScreen: React.FC<AIToolsScreenProps> = ({ initialSubTab = 'recommendations' }) => {
  const [activeSubTab, setActiveSubTab] = useState<AISubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Kicker y Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <span>Inteligencia Literaria</span>
            <span aria-hidden="true">·</span>
            <span>Beta 3.0</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-800 font-semibold">Gemini 3.8 Flash</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            IA Lectora & Aprendizaje
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
            Recomendaciones explicadas con responseSchema estructurado, chat reflexivo sobre tus notas y cuestionarios con autoevaluación.
          </p>
        </div>

        {/* Segmented SubTab Control */}
        <div
          role="tablist"
          aria-label="Pestañas de herramientas de IA"
          className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-xl self-start sm:self-auto"
        >
          <button
            role="tab"
            aria-selected={activeSubTab === 'recommendations'}
            onClick={() => setActiveSubTab('recommendations')}
            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              activeSubTab === 'recommendations'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Recomendaciones</span>
          </button>
          <button
            role="tab"
            aria-selected={activeSubTab === 'chat'}
            onClick={() => setActiveSubTab('chat')}
            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              activeSubTab === 'chat'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat de Notas</span>
          </button>
          <button
            role="tab"
            aria-selected={activeSubTab === 'quiz'}
            onClick={() => setActiveSubTab('quiz')}
            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              activeSubTab === 'quiz'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Quiz & Evaluación</span>
          </button>
        </div>
      </div>

      {/* Render de Subpestañas */}
      {activeSubTab === 'recommendations' && <AIRecommendations />}
      {activeSubTab === 'chat' && <ChatNotes />}
      {activeSubTab === 'quiz' && <ReadingQuiz />}
    </div>
  );
};
