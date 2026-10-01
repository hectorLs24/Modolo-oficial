import React from 'react';
import { BookOpen, Timer, BarChart2, Flame, Sparkles } from 'lucide-react';
import { useReading } from '../context/ReadingContext';

export type MainScreen = 'books' | 'sessions' | 'analytics' | 'ai_tools' | 'streaks_goals';

interface BottomNavBarProps {
  currentScreen: MainScreen;
  onSelectScreen: (screen: MainScreen) => void;
}

interface NavItem {
  id: MainScreen;
  label: string;
  icon: React.ElementType;
  badge?: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentScreen,
  onSelectScreen,
}) => {
  const { state } = useReading();

  const navItems: NavItem[] = [
    {
      id: 'books',
      label: 'Biblioteca',
      icon: BookOpen,
    },
    {
      id: 'sessions',
      label: 'Sesiones',
      icon: Timer,
      badge: state.activeSession?.isRunning,
    },
    {
      id: 'analytics',
      label: 'Métricas',
      icon: BarChart2,
    },
    {
      id: 'ai_tools',
      label: 'IA Lectora',
      icon: Sparkles,
    },
    {
      id: 'streaks_goals',
      label: 'Racha',
      icon: Flame,
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Navegación principal de la aplicación"
      className="fixed bottom-0 left-0 right-0 z-40 bg-stone-50/95 backdrop-blur-md border-t border-stone-200 shadow-lg pb-safe"
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectScreen(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[48px] min-w-[44px] flex flex-col items-center justify-center relative rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 ${
                isActive
                  ? 'text-stone-900 font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-stone-900 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                  aria-hidden="true"
                />

                {item.badge && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-600 rounded-full border-2 border-white animate-pulse"
                    aria-label="Sesión de lectura en curso"
                  />
                )}
              </div>

              <span
                className={`text-[10px] mt-1 tracking-tight truncate max-w-[72px] ${
                  isActive ? 'font-bold text-stone-900' : 'font-medium text-stone-500'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <span
                  className="absolute bottom-1 w-5 h-0.5 bg-stone-900 rounded-full"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
