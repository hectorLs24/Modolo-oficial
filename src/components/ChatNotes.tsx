import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  BookOpen,
  Sparkles,
  Bot,
  User,
  Loader2,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { useReading } from '../context/ReadingContext';
import { Book } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const ChatNotes: React.FC = () => {
  const { state } = useReading();
  const [selectedBookId, setSelectedBookId] = useState<string>(
    state.books[0]?.id || ''
  );
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      role: 'model',
      text: '¡Hola! Soy tu asistente de lectura y reflexión. Selecciona cualquier libro de tu biblioteca para dialogar sobre tus notas, explorar significados ocultos o conectar ideas entre tus obras favoritas.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedBook = state.books.find((b) => b.id === selectedBookId) || state.books[0];

  // Sesiones asociadas al libro
  const bookSessions = state.sessions.filter((s) => s.bookId === selectedBook?.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputMessage).trim();
    if (!message || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          bookContext: selectedBook
            ? {
                title: selectedBook.title,
                author: selectedBook.author,
                genre: selectedBook.genre,
                currentPage: selectedBook.currentPage,
                totalPages: selectedBook.totalPages,
                status: selectedBook.status,
                notes: selectedBook.notes,
                sessions: bookSessions.map((s) => ({
                  pagesRead: s.pagesRead,
                  notes: s.notes,
                  date: s.date,
                })),
              }
            : null,
          conversationHistory: messages.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Fallo en la comunicación con el servidor.');
      }

      const data = await response.json();
      const modelReply = data.reply || 'No se obtuvo respuesta del modelo.';

      const botMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'model',
        text: modelReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.warn('Error en chat de notas:', err);
      // Fallback inteligente reflexivo
      const fallbackReplies: Record<string, string> = {
        default: `Sobre "${selectedBook?.title || 'tu lectura'}": a partir de tus notas y progreso (${selectedBook?.currentPage || 0}/${selectedBook?.totalPages || 0} pág.), el autor parece plantear una tensión fundamental entre la memoria y la identidad. ¿Qué pasaje específico te ha generado mayor impacto hasta ahora?`,
      };

      const botMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'model',
        text: fallbackReplies.default,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    `¿Qué ideas clave resumen mis notas sobre ${selectedBook?.title || 'este libro'}?`,
    '¿Cuál es el dilema filosófico central de la obra?',
    '¿Qué conexiones temáticas existen con otros clásicos?',
    'Genera una pregunta profunda para reflexionar en mi próxima sesión.',
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col h-[680px]">
      {/* Top Bar con Selector de Libro y Contexto de Notas */}
      <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center border border-amber-600/20 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900">
              Diálogo sobre tus Notas
            </h3>
            <p className="text-xs text-stone-500">
              Conversación contextual con Gemini basada en tus anotaciones y sesiones.
            </p>
          </div>
        </div>

        {/* Selector de Libro para enfocar el contexto */}
        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <label htmlFor="select-book-chat" className="text-xs font-semibold text-stone-600 whitespace-nowrap">
            Libro:
          </label>
          <select
            id="select-book-chat"
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="min-h-[44px] px-3 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 text-stone-900 font-medium max-w-xs truncate"
          >
            {state.books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} ({b.author})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Banner de Notas Activas del Libro */}
      {selectedBook && (
        <div className="px-5 py-2.5 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <span className="truncate">
              Notas activas:{' '}
              <strong className="text-stone-800 font-medium italic">
                "{selectedBook.notes || 'Sin notas registradas en ficha'}"
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-stone-400 tabular-nums shrink-0 ml-2">
            {bookSessions.filter((s) => s.notes).length} notas de sesión
          </span>
        </div>
      )}

      {/* Mensajes del Chat */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-stone-900 text-white'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-amber-800" />}
              </div>

              <div className="space-y-1">
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-stone-900 text-white rounded-tr-none'
                      : 'bg-stone-100 text-stone-900 border border-stone-200/80 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <div
                  className={`text-[10px] text-stone-400 px-1 font-mono tabular-nums ${
                    isUser ? 'text-right' : ''
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] items-center text-xs text-stone-500 italic">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300 shrink-0">
              <Loader2 className="w-4 h-4 animate-spin text-amber-800" />
            </div>
            <div className="p-3 bg-stone-100 border border-stone-200 rounded-2xl rounded-tl-none">
              Gemini está sintetizando tus notas y reflexiones...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preguntas Rápidas Sugeridas */}
      <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap text-xs">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-[11px] font-semibold text-stone-500 shrink-0">Ideas:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="px-2.5 py-1 text-[11px] bg-white hover:bg-stone-200 border border-stone-300 rounded-lg text-stone-700 transition-colors cursor-pointer shrink-0"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input de Mensaje */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-white border-t border-stone-200 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder={`Escribe una pregunta sobre tus notas de "${selectedBook?.title || 'tu libro'}"...`}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isLoading}
          className="flex-1 min-h-[44px] px-4 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 text-stone-900 placeholder:text-stone-400"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          aria-label="Enviar mensaje a Gemini"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
