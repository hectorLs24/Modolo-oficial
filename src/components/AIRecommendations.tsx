import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Plus,
  Check,
  Compass,
  ArrowRight,
  Loader2,
  RefreshCw,
  HelpCircle,
  BookmarkCheck,
} from 'lucide-react';
import { useReading } from '../context/ReadingContext';

export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  genre: string;
  estimatedPages: number;
  pitch: string;
  whyRecommended: string;
  similarityFactors: string[];
}

const FALLBACK_RECOMMENDATIONS: BookRecommendation[] = [
  {
    id: 'rec-1',
    title: 'Pedro Páramo',
    author: 'Juan Rulfo',
    genre: 'Realismo Mágico',
    estimatedPages: 128,
    pitch: 'Un viaje espectral al pueblo fantasmal de Comala donde los vivos y los muertos conversan.',
    whyRecommended: 'Es la piedra fundacional que inspiró a García Márquez para escribir Cien años de soledad. La atmósfera y el lirismo resonarán de inmediato con tus lecturas.',
    similarityFactors: ['Realismo Mágico latinoamericano', 'Frontera entre la memoria y la muerte', 'Brevedad e intensidad poética'],
  },
  {
    id: 'rec-2',
    title: 'Nunca me abandones',
    author: 'Kazuo Ishiguro',
    genre: 'Ficción Especulativa',
    estimatedPages: 360,
    pitch: 'Un internado inglés idílico oculta una verdad perturbadora sobre el destino de sus estudiantes.',
    whyRecommended: 'Comparte con Klara y el Sol la sensibilidad desgarradora de Ishiguro sobre la dignidad, la obsolescencia y qué significa verdaderamente ser amado.',
    similarityFactors: ['Mismo autor de Klara y el Sol', 'Exploración de la condición humana y la bioética', 'Voz narrativa íntima y contenida'],
  },
  {
    id: 'rec-3',
    title: 'El poder de los hábitos',
    author: 'Charles Duhigg',
    genre: 'Desarrollo Personal',
    estimatedPages: 380,
    pitch: 'La ciencia neurológica detrás de los bucles de hábitos y cómo reprogramar nuestras rutinas automáticas.',
    whyRecommended: 'Complementa a la perfección Hábitos Atómicos de James Clear, aportando estudios de caso profundos y el marco del bucle señal-rutina-recompensa.',
    similarityFactors: ['Ciencia de la conducta', 'Complemento directo a James Clear', 'Estructura práctica aplicable a la lectura'],
  },
  {
    id: 'rec-4',
    title: 'La invención de Morel',
    author: 'Adolfo Bioy Casares',
    genre: 'Fantasía / Misterio',
    estimatedPages: 160,
    pitch: 'Un fugitivo en una isla desierta descubre una máquina capaz de reproducir la eternidad.',
    whyRecommended: 'Considerada por Jorge Luis Borges como una obra maestra perfecta de la trama. Dialoga con las preguntas sobre realidad simulada y memoria presentes en tus lecturas.',
    similarityFactors: ['Clásico de la literatura en español', 'Trama de precisión geométrica', 'Reflexión sobre la inmortalidad y la proyección'],
  },
];

export const AIRecommendations: React.FC = () => {
  const { state, addBook } = useReading();
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>(FALLBACK_RECOMMENDATIONS);
  const [preferences, setPreferences] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userBooks: state.books.map((b) => ({
            title: b.title,
            author: b.author,
            genre: b.genre,
            status: b.status,
            rating: b.rating,
            notes: b.notes,
          })),
          userPreferences: preferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al consultar el servicio de recomendaciones.');
      }

      const data = await response.json();
      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
      }
    } catch (err: any) {
      console.warn('Fallo en la API, usando recomendaciones curadas locales:', err);
      setError('Servicio de IA respondiendo en modo local curado.');
      setRecommendations(FALLBACK_RECOMMENDATIONS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBook = async (rec: BookRecommendation) => {
    try {
      await addBook({
        title: rec.title,
        author: rec.author,
        totalPages: rec.estimatedPages || 250,
        genre: rec.genre,
        notes: `Recomendado por IA: ${rec.pitch}`,
      });
      setAddedIds((prev) => ({ ...prev, [rec.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [rec.id]: false }));
      }, 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Prompter */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center border border-amber-600/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Recomendaciones Literarias Explicadas
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200 rounded-md">
                  JSON responseSchema
                </span>
              </div>
              <p className="text-xs text-stone-500">
                La IA analiza los libros de tu biblioteca, géneros y notas para descubrir tus próximas lecturas ideales.
              </p>
            </div>
          </div>

          <button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analizando biblioteca...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generar Recomendaciones</span>
              </>
            )}
          </button>
        </div>

        {/* Campo de refinamiento */}
        <div className="space-y-2">
          <label htmlFor="rec-preferences" className="block text-xs font-semibold text-stone-700">
            ¿Buscas algo en específico? (Opcional)
          </label>
          <div className="flex gap-2">
            <input
              id="rec-preferences"
              type="text"
              placeholder="Ej. 'Quiero novelas de ciencia ficción corta', 'Ensayos de filosofía práctica'..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              className="flex-1 min-h-[44px] px-3.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 text-stone-900"
            />
            <button
              onClick={fetchRecommendations}
              disabled={isLoading}
              className="min-h-[44px] px-4 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              Aplicar
            </button>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            {error}
          </div>
        )}
      </div>

      {/* Grid de Recomendaciones Explicadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => {
          const isAdded = addedIds[rec.id];

          return (
            <div
              key={rec.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between hover:border-stone-300 hover:shadow-xs transition-all space-y-4"
            >
              <div className="space-y-3">
                {/* Cabecera del libro */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                      {rec.genre} · ~{rec.estimatedPages} pág.
                    </span>
                    <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 mt-0.5 leading-snug">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-stone-600 font-medium">{rec.author}</p>
                  </div>

                  <button
                    onClick={() => handleAddBook(rec)}
                    disabled={isAdded}
                    aria-label={`Añadir ${rec.title} a la biblioteca`}
                    className={`min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-900 hover:text-white border border-stone-200'
                    }`}
                  >
                    {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>

                {/* Gancho editorial (Pitch) */}
                <p className="text-xs text-stone-700 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50 leading-relaxed">
                  "{rec.pitch}"
                </p>

                {/* Explicación de afinidad (whyRecommended) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-stone-800 block">
                    ¿Por qué te lo recomendamos?
                  </span>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {rec.whyRecommended}
                  </p>
                </div>

                {/* Factores de afinidad (similarityFactors) con disciplina zero-pill */}
                {rec.similarityFactors && rec.similarityFactors.length > 0 && (
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block mb-1">
                      Conexión con tu perfil
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                      {rec.similarityFactors.map((factor, idx) => (
                        <React.Fragment key={factor}>
                          {idx > 0 && <span aria-hidden="true">·</span>}
                          <span>{factor}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botón inferior de adición */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-400">¿Listo para leerlo?</span>
                <button
                  onClick={() => handleAddBook(rec)}
                  disabled={isAdded}
                  className="font-semibold text-stone-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAdded ? 'Guardado en catálogo' : 'Añadir a mi catálogo'}</span>
                  {!isAdded && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
