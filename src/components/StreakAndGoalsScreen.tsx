import React, { useState } from 'react';
import {
  Flame,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle,
  X,
  Target,
  Clock,
  Sparkles,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  Copy,
  Check,
  Code2,
} from 'lucide-react';
import { useReading } from '../context/ReadingContext';
import { Goal, GoalPeriod, GoalType, StreakDayStatus } from '../types';
import { STORAGE_KEYS } from '../storage/storage';

export const StreakAndGoalsScreen: React.FC = () => {
  const {
    state,
    stats,
    graceDaysAllowed,
    setGraceDaysAllowed,
    addGoal,
    deleteGoal,
    storageAdapterName,
    exportBackup,
    importBackup,
    resetDefaults,
  } = useReading();

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<StreakDayStatus | null>(null);

  // Form states for new goal
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('pages');
  const [goalTarget, setGoalTarget] = useState<number | ''>(50);
  const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>('weekly');
  const [goalError, setGoalError] = useState<string | null>(null);

  // Storage states
  const [jsonExport, setJsonExport] = useState<string | null>(null);
  const [jsonImportInput, setJsonImportInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const streak = stats.streak;

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) {
      setGoalError('El título de la meta es obligatorio.');
      return;
    }
    const t = Number(goalTarget);
    if (!t || t <= 0) {
      setGoalError('El objetivo debe ser mayor a 0.');
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
      setGoalError(null);
      setIsAddGoalOpen(false);
    } catch (err) {
      console.error(err);
      setGoalError('Error al crear la meta.');
    }
  };

  const handleExport = async () => {
    const data = await exportBackup();
    setJsonExport(data);
  };

  const handleCopy = () => {
    if (!jsonExport) return;
    navigator.clipboard.writeText(jsonExport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!jsonExport) return;
    const blob = new Blob([jsonExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lectura_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonImportInput.trim()) return;
    try {
      const ok = await importBackup(jsonImportInput);
      if (ok) {
        setImportStatus('¡Datos importados y validados exitosamente!');
        setJsonImportInput('');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Error: formato JSON no válido para la capa de storage.');
      }
    } catch {
      setImportStatus('Error crítico al procesar el archivo JSON.');
    }
  };

  const handleResetData = async () => {
    if (confirm('¿Restaurar los datos de muestra originales de la Beta 1.2?')) {
      setIsResetting(true);
      await resetDefaults();
      setIsResetting(false);
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
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 1. SECCIÓN MOTOR DE RACHA CON DATE-FNS Y DÍAS DE GRACIA */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-2xl font-bold text-white">Racha de Lectura Activa</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-stone-800 text-amber-300 rounded border border-stone-700">
                  date-fns powered
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Calculada con calendario estricto y protección por días de gracia.
              </p>
            </div>
          </div>

          {/* Días de Gracia Badge & Stepper */}
          <div className="flex items-center gap-3 bg-stone-800/80 p-2.5 rounded-xl border border-stone-700 self-start sm:self-auto">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <span className="text-stone-300 block font-medium">Días de Gracia</span>
              <span className="text-[11px] text-stone-400">
                <strong className="text-emerald-400 tabular-nums">{streak.graceDaysRemaining}</strong> de{' '}
                <strong className="text-stone-200 tabular-nums">{streak.graceDaysAllowed}</strong> disponibles
              </span>
            </div>

            {/* Stepper para configurar días de gracia */}
            <div className="flex items-center gap-1 ml-2 border-l border-stone-700 pl-3">
              {[1, 2, 3].map((val) => (
                <button
                  key={val}
                  onClick={() => setGraceDaysAllowed(val)}
                  title={`Configurar ${val} días de gracia`}
                  className={`w-7 h-7 text-xs font-mono font-semibold rounded transition-colors cursor-pointer ${
                    graceDaysAllowed === val
                      ? 'bg-amber-400 text-stone-900 font-bold'
                      : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Display Central de Racha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="text-center md:text-left space-y-1">
            <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
              Racha actual consecutiva
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="font-mono text-5xl sm:text-6xl font-extrabold text-amber-400 tabular-nums">
                {streak.currentStreak}
              </span>
              <span className="text-stone-300 text-base font-serif">días</span>
            </div>
            <p className="text-xs text-stone-400">
              Récord histórico: <strong className="text-white tabular-nums">{streak.longestStreak} días</strong>
            </p>
          </div>

          {/* Explicación de gracia si hay días usados */}
          <div className="md:col-span-2 p-4 bg-stone-800/60 rounded-xl border border-stone-700 text-xs text-stone-300 space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>¿Cómo funcionan los Días de Gracia?</span>
            </div>
            <p className="text-stone-400 leading-relaxed">
              Si un día no puedes leer o se te olvida registrar, el sistema consume automáticamente 1 día de gracia disponible para{' '}
              <strong className="text-white">congelar tu racha</strong> en lugar de resetearla a cero. Al retomar al día siguiente, tu racha continúa intacta.
            </p>
            {streak.graceDatesUsed.length > 0 && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Tu racha fue protegida el día <strong className="font-mono">{streak.graceDatesUsed.join(', ')}</strong>.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Calendario Visual de los Últimos 14 Días */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-3">
            <span className="font-semibold uppercase tracking-wider text-stone-300">
              Historial de Racha (Últimas 2 Semanas)
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Leído
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Día de gracia
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-700" /> Sin registro
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
            {streak.calendarDays.map((day) => {
              const isSelected = selectedDayDetail?.dateStr === day.dateStr;

              let bgClass = 'bg-stone-800 text-stone-500 border-stone-700';
              if (day.hasRead) {
                bgClass = 'bg-emerald-600/90 text-white border-emerald-500 hover:bg-emerald-500';
              } else if (day.isGraceDay) {
                bgClass = 'bg-amber-600/90 text-white border-amber-500 hover:bg-amber-500';
              } else if (day.isToday) {
                bgClass = 'bg-stone-800 text-amber-400 border-amber-400/70 border-dashed animate-pulse';
              }

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDayDetail(day)}
                  title={`${day.dayLabel}: ${
                    day.hasRead
                      ? `${day.pagesRead} pág, ${day.minutesRead} min`
                      : day.isGraceDay
                      ? 'Día de gracia aplicado'
                      : 'Sin registro'
                  }`}
                  className={`min-h-[44px] flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer relative ${bgClass} ${
                    isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-stone-900 scale-105' : ''
                  }`}
                >
                  <span className="text-[10px] font-mono leading-none">{day.dayLabel.slice(0, 3)}</span>
                  <span className="text-xs font-bold font-mono mt-1 tabular-nums">
                    {day.dayLabel.slice(3).trim()}
                  </span>

                  {day.hasRead && (
                    <span className="text-[8px] font-mono text-emerald-200 mt-0.5 tabular-nums">
                      +{day.pagesRead}p
                    </span>
                  )}
                  {day.isGraceDay && (
                    <ShieldCheck className="w-3 h-3 text-amber-200 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Detalle interactivo al pulsar un día */}
          {selectedDayDetail && (
            <div className="mt-3 p-3 bg-stone-800 rounded-xl border border-stone-700 flex items-center justify-between text-xs animate-in fade-in">
              <div>
                <span className="font-semibold text-white">{selectedDayDetail.dayLabel}</span>
                <span className="text-stone-400 ml-2">
                  {selectedDayDetail.hasRead
                    ? `Lectura completada: ${selectedDayDetail.pagesRead} páginas en ${selectedDayDetail.minutesRead} minutos.`
                    : selectedDayDetail.isGraceDay
                    ? 'Día sin lectura rescatado por un día de gracia.'
                    : selectedDayDetail.isToday
                    ? 'Aún no registras lectura el día de hoy.'
                    : 'No hubo registro de lectura este día.'}
                </span>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. METAS ACTIVAS Y DESAFÍOS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900">Metas de Lectura Cuantitativas</h3>
            <p className="text-xs text-stone-500">
              Progreso dinámico calculado a partir de tus sesiones activas y libros finalizados.
            </p>
          </div>

          <button
            onClick={() => setIsAddGoalOpen(true)}
            className="self-start sm:self-auto min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Definir Nueva Meta</span>
          </button>
        </div>

        {state.goals.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-stone-300 rounded-2xl bg-white/50">
            <Target className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-700">No hay metas configuradas</p>
            <p className="text-xs text-stone-500 mt-1">
              Fija una meta diaria de minutos, semanal de páginas o anual de libros.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.goals.map((goal) => {
              const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));

              return (
                <div
                  key={goal.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between hover:border-stone-300 transition-colors"
                >
                  <div>
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
                        className="text-stone-300 hover:text-red-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
                        title="Eliminar meta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

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

                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          goal.completed ? 'bg-emerald-600' : 'bg-stone-900'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

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

      {/* 3. CAPA DE ALMACENAMIENTO Y EXPORTACIÓN JSON */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Capa de Almacenamiento (storage.ts)
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                  Activa
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Adaptador en ejecución: <strong className="text-stone-800 font-mono">{storageAdapterName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer border border-stone-300 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? 'Restaurando...' : 'Restaurar Datos Semilla'}</span>
          </button>
        </div>

        {/* Resumen de Entidades */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <div className="text-xs text-stone-500">Libros Almacenados</div>
            <div className="font-serif text-xl font-bold text-stone-900 mt-1 tabular-nums">
              {state.books.length} registros
            </div>
            <div className="text-[11px] text-stone-400 font-mono mt-1">{STORAGE_KEYS.BOOKS}</div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <div className="text-xs text-stone-500">Sesiones Registradas</div>
            <div className="font-serif text-xl font-bold text-stone-900 mt-1 tabular-nums">
              {state.sessions.length} registros
            </div>
            <div className="text-[11px] text-stone-400 font-mono mt-1">{STORAGE_KEYS.SESSIONS}</div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
            <div className="text-xs text-stone-500">Metas Configuradas</div>
            <div className="font-serif text-xl font-bold text-stone-900 mt-1 tabular-nums">
              {state.goals.length} registros
            </div>
            <div className="text-[11px] text-stone-400 font-mono mt-1">{STORAGE_KEYS.GOALS}</div>
          </div>
        </div>

        {/* Exportar / Importar JSON */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Exportación */}
          <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <h4 className="font-serif text-sm font-bold text-stone-900">Exportar Datos a JSON</h4>
            <p className="text-xs text-stone-500">
              Descarga un archivo con tus libros, sesiones, racha y metas.
            </p>
            <button
              onClick={handleExport}
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generar Respaldo JSON</span>
            </button>

            {jsonExport && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-mono text-[11px]">JSON listo</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="min-h-[44px] px-2 text-stone-600 hover:text-stone-900 text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado' : 'Copiar'}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="min-h-[44px] px-2 text-stone-600 hover:text-stone-900 text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={jsonExport}
                  className="w-full p-2 text-[10px] font-mono bg-white border border-stone-200 rounded-lg text-stone-800 resize-none"
                />
              </div>
            )}
          </div>

          {/* Importación */}
          <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
            <h4 className="font-serif text-sm font-bold text-stone-900">Importar Datos desde JSON</h4>
            <p className="text-xs text-stone-500">
              Pega un respaldo exportado para restaurar tu biblioteca y sesiones.
            </p>
            <form onSubmit={handleImport} className="space-y-3">
              <textarea
                rows={3}
                placeholder='Pega aquí el JSON {"books": [...], "sessions": [...]}'
                value={jsonImportInput}
                onChange={(e) => setJsonImportInput(e.target.value)}
                className="w-full p-2 text-xs font-mono bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-800 resize-none"
              />
              {importStatus && (
                <div className="p-2 text-xs rounded bg-stone-200 text-stone-800 font-medium">
                  {importStatus}
                </div>
              )}
              <button
                type="submit"
                disabled={!jsonImportInput.trim()}
                className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Validar e Importar Respaldo</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal para agregar meta */}
      {isAddGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-stone-800" />
                <h2 className="font-serif text-lg font-bold text-stone-900">Crear Meta de Lectura</h2>
              </div>
              <button
                onClick={() => setIsAddGoalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              {goalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {goalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Título de la meta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Lectura diaria 30 min"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full min-h-[44px] px-3 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
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
                    className="w-full min-h-[44px] px-3 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
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
                    className="w-full min-h-[44px] px-3 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800"
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
                  className="w-full min-h-[44px] px-3 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-800 tabular-nums"
                />
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(false)}
                  className="min-h-[44px] px-4 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer"
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
