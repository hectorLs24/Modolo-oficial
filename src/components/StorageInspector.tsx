import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  Code2,
  Copy,
  Check,
  HardDrive,
  FileJson,
} from 'lucide-react';
import { useReading } from '../context/ReadingContext';
import { STORAGE_KEYS } from '../storage/storage';

export const StorageInspector: React.FC = () => {
  const { state, storageAdapterName, exportBackup, importBackup, resetDefaults } = useReading();
  const [jsonExport, setJsonExport] = useState<string | null>(null);
  const [jsonImportInput, setJsonImportInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

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
    if (confirm('¿Restaurar los datos de muestra originales de la Beta 1.0?')) {
      setIsResetting(true);
      await resetDefaults();
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. ESTADO DE LA CAPA DE ALMACENAMIENTO */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer border border-stone-300 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? 'Restaurando...' : 'Restaurar Datos Semilla'}</span>
          </button>
        </div>

        {/* Resumen de Entidades */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <div className="text-xs text-stone-500">Entidad: Libros</div>
            <div className="font-serif text-xl font-bold text-stone-900 mt-1 tabular-nums">
              {state.books.length} registros
            </div>
            <div className="text-[11px] text-stone-400 font-mono mt-1">{STORAGE_KEYS.BOOKS}</div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <div className="text-xs text-stone-500">Entidad: Sesiones</div>
            <div className="font-serif text-xl font-bold text-stone-900 mt-1 tabular-nums">
              {state.sessions.length} registros
            </div>
            <div className="text-[11px] text-stone-400 font-mono mt-1">{STORAGE_KEYS.SESSIONS}</div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200">
            <div className="text-xs text-stone-500">Entidad: Metas</div>
            <div className="font-serif text-xl font-bold text-stone-900 mt-1 tabular-nums">
              {state.goals.length} registros
            </div>
            <div className="text-[11px] text-stone-400 font-mono mt-1">{STORAGE_KEYS.GOALS}</div>
          </div>
        </div>

        {state.lastSavedAt && (
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 pt-4 mt-4 border-t border-stone-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Última sincronización a disco: {new Date(state.lastSavedAt).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* 2. DEFINICIÓN DE LA INTERFAZ FORMAL (CÓDIGO Y ARQUITECTURA) */}
      <div className="bg-stone-900 text-stone-100 rounded-xl p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-stone-800 text-stone-300">
          <Code2 className="w-4 h-4 text-amber-400" />
          <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-400">
            src/storage/storage.ts · StorageAdapter Interface
          </h4>
        </div>
        <pre className="mt-4 text-xs font-mono text-stone-300 overflow-x-auto leading-relaxed p-3 bg-stone-950 rounded-lg border border-stone-800">
{`export interface StorageAdapter {
  name: string;
  isAvailable(): boolean;
  loadBooks(): Promise<Book[]>;
  saveBooks(books: Book[]): Promise<void>;
  loadSessions(): Promise<ReadingSession[]>;
  saveSessions(sessions: ReadingSession[]): Promise<void>;
  loadGoals(): Promise<Goal[]>;
  saveGoals(goals: Goal[]): Promise<void>;
  exportAll(): Promise<string>;
  importAll(jsonString: string): Promise<boolean>;
  clearAll(): Promise<void>;
  resetToDefaults(): Promise<{ books: Book[]; sessions: ReadingSession[]; goals: Goal[] }>;
}`}
        </pre>
      </div>

      {/* 3. EXPORTAR / IMPORTAR COPIAS DE SEGURIDAD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportación */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-stone-700" />
            <h4 className="font-serif text-base font-bold text-stone-900">Exportar Datos a JSON</h4>
          </div>
          <p className="text-xs text-stone-500">
            Descarga un respaldo completo con todos tus libros, páginas leídas, sesiones y metas.
          </p>

          <button
            onClick={handleExport}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generar Exportación JSON</span>
          </button>

          {jsonExport && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-mono">Payload listo</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 text-[11px] cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 text-[11px] cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar archivo</span>
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                rows={6}
                value={jsonExport}
                className="w-full p-2.5 text-[11px] font-mono bg-stone-50 border border-stone-200 rounded-lg text-stone-800 resize-none"
              />
            </div>
          )}
        </div>

        {/* Importación */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-stone-700" />
            <h4 className="font-serif text-base font-bold text-stone-900">Importar Datos desde JSON</h4>
          </div>
          <p className="text-xs text-stone-500">
            Pega una copia de respaldo previamente exportada para hidratar el almacenamiento.
          </p>

          <form onSubmit={handleImport} className="space-y-3">
            <textarea
              rows={4}
              placeholder='Pega aquí el JSON {"books": [...], "sessions": [...]}'
              value={jsonImportInput}
              onChange={(e) => setJsonImportInput(e.target.value)}
              className="w-full p-2.5 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-800 resize-none"
            />

            {importStatus && (
              <div className="p-2.5 text-xs rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                {importStatus}
              </div>
            )}

            <button
              type="submit"
              disabled={!jsonImportInput.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Respaldo</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
