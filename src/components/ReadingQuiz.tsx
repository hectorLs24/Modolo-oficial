import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Loader2,
  BookOpen,
  Award,
} from 'lucide-react';
import { useReading } from '../context/ReadingContext';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizData {
  title: string;
  description: string;
  questions: QuizQuestion[];
}

const FALLBACK_QUIZZES: Record<string, QuizData> = {
  default: {
    title: 'Quiz de Comprensión Literaria y Temática',
    description: 'Pon a prueba tus reflexiones sobre el simbolismo, la trama y los dilemas filosóficos de la obra.',
    questions: [
      {
        id: 'q1',
        question: '¿Qué representa fundamentalmente la noción del tiempo circular en la obra de realismo mágico?',
        options: [
          'Un defecto cronológico en la narración lineal.',
          'La repetición de los errores humanos y la incapacidad de escapar del aislamiento histórico.',
          'Una justificación puramente mágica sin trasfondo social.',
          'Un recurso cómico para aligerar la tragedia.',
        ],
        correctIndex: 1,
        explanation: 'El tiempo circular simboliza la fatalidad de la estirpe que no aprende de su pasado, condenada a repetir nombres, pasiones y desdichas en un ciclo de soledad.',
      },
      {
        id: 'q2',
        question: 'En las obras de ficción especulativa, ¿cuál es el propósito de contrastar la inocencia de un observador artificial con la sociedad humana?',
        options: [
          'Demostrar la superioridad técnica de las máquinas.',
          'Desviar la atención de los problemas éticos.',
          'Resaltar las paradojas, el egoísmo y la necesidad de afecto intrínseca a la condición humana.',
          'Crear un villano insensible que destruye la sociedad.',
        ],
        correctIndex: 2,
        explanation: 'La perspectiva ingenua e hiperempática del autómata funciona como un espejo moral que desnuda las contradicciones y fragilidades de los humanos que lo crearon.',
      },
      {
        id: 'q3',
        question: 'Según los principios de cambio de hábitos y conducta lectora, ¿qué es más decisivo para mantener la constancia a largo plazo?',
        options: [
          'La fuerza de voluntad sobrehumana en momentos de agotamiento.',
          'El diseño del entorno y la reducción de la fricción inicial para que la acción sea inevitable.',
          'Comprar muchos libros de una sola vez.',
          'Fijar metas inalcanzables que generen culpabilidad.',
        ],
        correctIndex: 1,
        explanation: 'Hacer que la señal sea obvia y la acción sea sencilla (regla de los 2 minutos y diseño de espacio) supera sistemáticamente a la motivación esporádica.',
      },
      {
        id: 'q4',
        question: '¿Cuál es la función del olvido colectivo y la memoria manipulada en las distopías sobre libros?',
        options: [
          'Controlar el pensamiento crítico anulando el registro de la disidencia histórica.',
          'Ahorrar papel y recursos en las ciudades.',
          'Estimular el entretenimiento deportivo como única prioridad.',
          'Un simple conflicto generacional sin mayor alcance político.',
        ],
        correctIndex: 0,
        explanation: 'Al borrar la literatura y el pensamiento reflexivo, el poder totalitario elimina la capacidad de comparar el presente con otras formas posibles de existir y sentir.',
      },
    ],
  },
};

export const ReadingQuiz: React.FC = () => {
  const { state } = useReading();
  const [selectedBookId, setSelectedBookId] = useState<string>(
    state.books[0]?.id || ''
  );
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBook = state.books.find((b) => b.id === selectedBookId) || state.books[0];

  const handleGenerateQuiz = async () => {
    if (!selectedBook) return;
    setIsLoading(true);
    setError(null);
    setUserAnswers({});
    setIsSubmitted(false);

    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: selectedBook }),
      });

      if (!response.ok) {
        throw new Error('Fallo al generar el quiz con IA.');
      }

      const data = await response.json();
      if (data.quiz && Array.isArray(data.quiz.questions) && data.quiz.questions.length > 0) {
        setQuiz(data.quiz);
      } else {
        setQuiz(FALLBACK_QUIZZES.default);
      }
    } catch (err: any) {
      console.warn('Error al generar quiz con Gemini, usando quiz curado:', err);
      setError('Servicio de IA respondiendo en modo local formativo.');
      setQuiz(FALLBACK_QUIZZES.default);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  // Cálculo de resultados
  const calculateScore = () => {
    if (!quiz) return { correct: 0, total: 0, percent: 0 };
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    return {
      correct,
      total: quiz.questions.length,
      percent: Math.round((correct / quiz.questions.length) * 100),
    };
  };

  const score = calculateScore();

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-6">
      {/* Header del Quiz */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center border border-amber-600/20 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Quiz Literario con Autoevaluación
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200 rounded-md">
                Evaluación Formativa
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Genera preguntas de comprensión profunda y recibe retroalimentación reflexiva inmediata.
            </p>
          </div>
        </div>

        {/* Selector de libro y generador */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            disabled={isLoading}
            className="min-h-[44px] px-3 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 text-stone-900 font-medium truncate max-w-xs"
          >
            {state.books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} ({b.author})
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateQuiz}
            disabled={isLoading}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando Quiz...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Crear Quiz de este libro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          {error}
        </div>
      )}

      {/* Vista de Quiz */}
      {!quiz ? (
        <div className="py-12 text-center border border-dashed border-stone-200 rounded-xl bg-stone-50/50 space-y-3">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
          <h4 className="font-serif text-base font-bold text-stone-800">
            ¿Listo para poner a prueba tu lectura?
          </h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Selecciona un libro de tu biblioteca arriba y pulsa "Crear Quiz" para que Gemini formule preguntas analíticas sobre la trama, personajes y simbolismos.
          </p>
          <button
            onClick={handleGenerateQuiz}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Generar Quiz para "{selectedBook?.title || 'tu libro'}"</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
            <h4 className="font-serif text-base font-bold text-stone-900">{quiz.title}</h4>
            <p className="text-xs text-stone-600 mt-0.5">{quiz.description}</p>
          </div>

          {/* Preguntas */}
          <div className="space-y-6">
            {quiz.questions.map((q, qIdx) => {
              const selectedOption = userAnswers[qIdx];
              const isAnswered = selectedOption !== undefined;

              return (
                <div
                  key={q.id || qIdx}
                  className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-stone-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <h5 className="font-serif text-sm sm:text-base font-bold text-stone-900 leading-snug">
                      {q.question}
                    </h5>
                  </div>

                  {/* Opciones A, B, C, D */}
                  <div className="space-y-2 pt-1 pl-8">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOption === optIdx;
                      const isCorrect = q.correctIndex === optIdx;

                      let stateClass = 'bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100';

                      if (isSubmitted) {
                        if (isCorrect) {
                          stateClass = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
                        } else if (isSelected && !isCorrect) {
                          stateClass = 'bg-red-50 border-red-400 text-red-900';
                        } else {
                          stateClass = 'opacity-50 border-stone-200 text-stone-500';
                        }
                      } else if (isSelected) {
                        stateClass = 'bg-stone-900 border-stone-900 text-white font-medium';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          disabled={isSubmitted}
                          className={`w-full min-h-[44px] p-3 text-left text-xs sm:text-sm rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${stateClass}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[11px] font-bold ${
                                isSelected && !isSubmitted
                                  ? 'bg-white text-stone-900'
                                  : 'bg-black/5 text-current'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="leading-relaxed">{opt}</span>
                          </div>

                          {isSubmitted && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {isSubmitted && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explicación de Autoevaluación al enviar */}
                  {isSubmitted && (
                    <div className="ml-8 mt-3 p-3.5 bg-stone-100/90 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1 animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Autoevaluación Formativa:</span>
                      </div>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Barra de Envío y Resultados */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            {!isSubmitted ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-stone-500 font-medium">
                  Respondidas:{' '}
                  <strong className="text-stone-800 tabular-nums">
                    {Object.keys(userAnswers).length}
                  </strong>{' '}
                  de {quiz.questions.length} preguntas
                </span>
                <button
                  onClick={() => setIsSubmitted(true)}
                  disabled={Object.keys(userAnswers).length < quiz.questions.length}
                  className="min-h-[44px] px-6 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Finalizar y Autoevaluar
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold font-serif text-lg">
                    {score.percent}%
                  </div>
                  <div>
                    <h5 className="font-serif text-base font-bold text-stone-900">
                      Resultado: {score.correct} de {score.total} correctas
                    </h5>
                    <p className="text-xs text-stone-500">
                      {score.percent >= 75
                        ? '¡Comprensión sobresaliente de los temas de la obra!'
                        : 'Buen intento. Revisa las explicaciones para profundizar en los dilemas del libro.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setUserAnswers({});
                      setIsSubmitted(false);
                    }}
                    className="min-h-[44px] px-4 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reintentar</span>
                  </button>
                  <button
                    onClick={handleGenerateQuiz}
                    className="min-h-[44px] px-4 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Nuevo Quiz</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
