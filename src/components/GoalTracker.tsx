import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Clock,
  BookOpen,
  Calendar,
  Plus,
  Trash2,
  CheckCircle,
  X,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useReading } from '../context/ReadingContext';
import { Goal, GoalPeriod, GoalType } from '../types';

export const GoalTracker: React.FC = () => {
  const { state, stats, addGoal, deleteGoal } = useReading();
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);

  // Form states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('pages');
  const [goalTarget, setGoalTarget] = useState<number | ''>(50);
  const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>('weekly');
  const [error, setError] = useState<string | null>(null);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) {
      setError('El título de la meta es obligatorio.');
      return;
    }
    const t = Number(goalTarget);
    if (!t || t <= 0) {
      setError('El objetivo debe ser mayor a 0.');
      return;
    }

    try {
      await addGoal({
        title: goalTitle,
        type: goalType,
        target: t,
        period: goalPeriod,
      });
      setGoalTitle('');
      setGoalTarget(50);
      setError(null);
      setIsAddGoalOpen(false);
    } catch (err) {
      console.error(err);
      setError('Error al crear la meta.');
    }
  };

  const getPeriodLabel = (period: GoalPeriod) => {
    switch (period) {
      case 'daily':
        return 'Diario';
      case 'weekly':
        return 'Semanal';
      case 'monthly':
        return 'Mensual';
      case 'yearly':
        return 'Anual';
    }
  };

  const getUnitLabel = (type: GoalType) => {
    switch (type) {
      case 'pages':
        return 'páginas';
      case 'minutes':
        return 'minutos';
      case 'books':
        return 'libros';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. MÚSCULO METRICO (CINTA DE ESTADÍSTICAS VITALES) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Racha */}
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Racha Actual</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-bold text-stone-900 tabular-nums">
              {stats.currentStreakDays}
            </span>
            <span className="text-xs text-stone-500">días consecutivos</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Récord: <span className="tabular-nums font-medium text-stone-600">{stats.longestStreakDays} días</span>
          </p>
        </div>

        {/* Páginas Semanales */}
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Páginas Esta Semana</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-bold text-stone-900 tabular-nums">
              {stats.pagesReadThisWeek}
            </span>
            <span className="text-xs text-stone-500">páginas</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Total histórico: <span className="tabular-nums font-medium text-stone-600">{stats.totalPagesRead} pág.</span>
          </p>
        </div>

        {/* Tiempo Total de Enfoque */}
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Tiempo de Lectura</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-bold text-stone-900 tabular-nums">
              {Math.round(stats.totalMinutesRead / 60)}h{' '}
              <span className="text-lg">{stats.totalMinutesRead % 60}m</span>
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Hoy: <span className="tabular-nums font-medium text-stone-600">{stats.minutesReadToday} min</span>
          </p>
        </div>

        {/* Libros Concluidos */}
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Libros Terminados</span>
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-bold text-stone-900 tabular-nums">
              {stats.totalBooksRead}
            </span>
            <span className="text-xs text-stone-500">volúmenes</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            En lectura actual: <span className="tabular-nums font-medium text-stone-600">{stats.totalBooksInProgress}</span>
          </p>
        </div>
      </div>

      {/* 2. GESTIÓN DE METAS ACTIVAS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">Metas y Desafíos Activos</h3>
            <p className="text-xs text-stone-500">
              Se sincronizan y recalculan automáticamente con cada sesión de lectura registrada.
            </p>
          </div>

          <button
            onClick={() => setIsAddGoalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Definir Nueva Meta</span>
          </button>
        </div>

        {state.goals.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-stone-300 rounded-xl bg-white/50">
            <Target className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-700">No tienes metas configuradas</p>
            <p className="text-xs text-stone-500 mt-1">
              Fija un objetivo diario en minutos, un ritmo semanal de páginas o una meta anual de libros.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.goals.map((goal) => {
              const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));

              return (
                <div
                  key={goal.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-stone-300 transition-colors relative"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                          {getPeriodLabel(goal.period)}
                        </span>
                        <h4 className="font-serif text-base font-bold text-stone-900 mt-0.5">
                          {goal.title}
                        </h4>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la meta "${goal.title}"?`)) {
                            deleteGoal(goal.id);
                          }
                        }}
                        className="text-stone-300 hover:text-red-600 p-1 transition-colors cursor-pointer"
                        title="Eliminar meta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Numerical Progress */}
                    <div className="mt-4 flex items-baseline justify-between text-xs">
                      <div>
                        <span className="font-serif text-2xl font-bold text-stone-900 tabular-nums">
                          {goal.current}
                        </span>
                        <span className="text-stone-500 ml-1">
                          / {goal.target} {getUnitLabel(goal.type)}
                        </span>
                      </div>
                      <span className="font-semibold text-stone-700 tabular-nums">{percent}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          goal.completed ? 'bg-emerald-600' : 'bg-stone-900'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    {goal.completed ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>¡Objetivo alcanzado!</span>
                      </span>
                    ) : (
                      <span className="text-stone-500">
                        Faltan <strong className="tabular-nums text-stone-800">{Math.max(0, goal.target - goal.current)}</strong> {getUnitLabel(goal.type)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL PARA AGREGAR NUEVA META */}
      {isAddGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-stone-50 border border-stone-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-stone-800" />
                <h2 className="font-serif text-lg font-bold text-stone-900">Crear Meta de Lectura</h2>
              </div>
              <button
                onClick={() => setIsAddGoalOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Título de la meta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Lectura matutina 20 min"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                  >
                    <option value="pages">Páginas</option>
                    <option value="minutes">Minutos</option>
                    <option value="books">Libros terminados</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Periodo
                  </label>
                  <select
                    value={goalPeriod}
                    onChange={(e) => setGoalPeriod(e.target.value as GoalPeriod)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Cantidad Objetivo * ({getUnitLabel(goalType)})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 tabular-nums"
                />
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Guardar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
