import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Inicialización de Google GenAI en el servidor
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // =========================================================================
  // API ROUTE 1: Recomendaciones con responseSchema JSON estructurado y explicaciones
  // =========================================================================
  app.post('/api/ai/recommendations', async (req, res) => {
    try {
      const { userBooks, userSessions, userPreferences } = req.body;

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY no configurada en el servidor.',
        });
      }

      const booksSummary = Array.isArray(userBooks)
        ? userBooks
            .map(
              (b: any) =>
                `• "${b.title}" de ${b.author} (Género: ${b.genre}, Estado: ${b.status}, Rating: ${
                  b.rating || 'N/A'
                }/5${b.notes ? `, Notas: "${b.notes}"` : ''})`
            )
            .join('\n')
        : 'Sin historial previo.';

      const prompt = `Actúa como un crítico literario y bibliotecario de élite.
Analiza la siguiente biblioteca del lector y sus intereses:

HISTORIAL DE LECTURA DEL USUARIO:
${booksSummary}

PREFERENCIAS / SOLICITUD ADICIONAL:
${userPreferences || 'Recomienda libros afines de alta calidad con diversos niveles de desafío.'}

Genera exactamente 4 recomendaciones literarias personalizadas y de excelencia.
Cada recomendación debe incluir una explicación detallada de por qué le gustará basándose específicamente en sus libros leídos o notas, factores concretos de similitud y un gancho editorial cautivador (pitch).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'Eres un curador literario experto. Devuelve únicamente recomendaciones de libros reales y célebres respetando estrictamente el responseSchema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Lista de recomendaciones literarias explicadas.',
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: 'Identificador único' },
                title: { type: Type.STRING, description: 'Título exacto del libro' },
                author: { type: Type.STRING, description: 'Autor del libro' },
                genre: { type: Type.STRING, description: 'Género literario principal' },
                estimatedPages: { type: Type.INTEGER, description: 'Número aproximado de páginas' },
                pitch: {
                  type: Type.STRING,
                  description: 'Gancho editorial breve de 1 o 2 oraciones para cautivar al lector.',
                },
                whyRecommended: {
                  type: Type.STRING,
                  description:
                    'Explicación profunda de por qué se recomienda este libro en relación con las lecturas y notas del usuario.',
                },
                similarityFactors: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Lista de 2 a 4 motivos o paralelismos específicos.',
                },
              },
              required: [
                'id',
                'title',
                'author',
                'genre',
                'estimatedPages',
                'pitch',
                'whyRecommended',
                'similarityFactors',
              ],
            },
          },
        },
      });

      const responseText = response.text?.trim() || '[]';
      const recommendations = JSON.parse(responseText);
      return res.json({ recommendations });
    } catch (err: any) {
      console.error('[API /api/ai/recommendations] Error:', err);
      return res.status(500).json({
        error: 'No se pudieron generar las recomendaciones.',
        details: err?.message || String(err),
      });
    }
  });

  // =========================================================================
  // API ROUTE 2: Chat conversacional sobre tus notas y reflexiones
  // =========================================================================
  app.post('/api/ai/chat-notes', async (req, res) => {
    try {
      const { message, bookContext, conversationHistory } = req.body;

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY no configurada en el servidor.',
        });
      }

      let contextPrompt = 'El lector está explorando sus notas y aprendizajes de lectura.\n';

      if (bookContext) {
        contextPrompt += `\nLIBRO EN CONVERSACIÓN:
- Título: ${bookContext.title}
- Autor: ${bookContext.author}
- Género: ${bookContext.genre}
- Progreso: ${bookContext.currentPage} de ${bookContext.totalPages} páginas (${Math.round(
          (bookContext.currentPage / bookContext.totalPages) * 100
        )}%)
- Estado: ${bookContext.status}
- Notas del lector: "${bookContext.notes || 'Sin notas registradas aún'}"
`;
        if (Array.isArray(bookContext.sessions) && bookContext.sessions.length > 0) {
          contextPrompt += `\nNOTAS DE SESIONES PREVIAS DEL LIBRO:\n`;
          bookContext.sessions.forEach((s: any, idx: number) => {
            if (s.notes) {
              contextPrompt += `• Sesión ${idx + 1} (${s.pagesRead} pág.): "${s.notes}"\n`;
            }
          });
        }
      }

      const contents = [];
      if (Array.isArray(conversationHistory)) {
        for (const turn of conversationHistory) {
          contents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{ text: turn.text }],
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: `Eres Sócrates y Virgilio literario. Eres un compañero intelectual cálido, perspicaz y analítico que ayuda al lector a reflexionar sobre sus lecturas y notas.
${contextPrompt}
Responde con tono reflexivo, elocuente y ameno en español. Conecta las preguntas del lector con sus notas y el subtexto temático de la obra.`,
        },
      });

      return res.json({ reply: response.text });
    } catch (err: any) {
      console.error('[API /api/ai/chat-notes] Error:', err);
      return res.status(500).json({
        error: 'Error procesando el chat de notas.',
        details: err?.message || String(err),
      });
    }
  });

  // =========================================================================
  // API ROUTE 3: Generación de Quiz de comprensión y autoevaluación
  // =========================================================================
  app.post('/api/ai/quiz', async (req, res) => {
    try {
      const { book } = req.body;

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY no configurada en el servidor.',
        });
      }

      const prompt = `Crea un examen formativo interactivo (Quiz) de 4 preguntas de opción múltiple para autoevaluación sobre el libro:
Título: "${book.title}"
Autor: ${book.author}
Género: ${book.genre || 'Literatura'}
${book.notes ? `Notas del lector sobre el libro: "${book.notes}"` : ''}

Requisitos del Quiz:
- Preguntas estimulantes que prueben comprensión profunda, ideas filosóficas, simbolismos y trama principal.
- Cada pregunta debe tener exactamente 4 opciones de respuesta y 1 índice correcto (0, 1, 2 o 3).
- Incluye una explicación reflexiva ("explanation") para cada pregunta detallando por qué esa respuesta es la correcta y el significado detrás.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Título del quiz' },
              description: { type: Type.STRING, description: 'Breve introducción al quiz' },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Exactamente 4 opciones de respuesta',
                    },
                    correctIndex: { type: Type.INTEGER, description: 'Índice de la respuesta correcta (0-3)' },
                    explanation: {
                      type: Type.STRING,
                      description: 'Explicación completa de la respuesta para la autoevaluación formativa.',
                    },
                  },
                  required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
                },
              },
            },
            required: ['title', 'description', 'questions'],
          },
        },
      });

      const quizData = JSON.parse(response.text?.trim() || '{}');
      return res.json({ quiz: quizData });
    } catch (err: any) {
      console.error('[API /api/ai/quiz] Error:', err);
      return res.status(500).json({
        error: 'No se pudo generar el quiz.',
        details: err?.message || String(err),
      });
    }
  });

  // =========================================================================
  // Integración de Vite Middleware en Express
  // =========================================================================
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`[Lectura Server] Corriendo en http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[Lectura Server] Fallo al iniciar:', err);
});
