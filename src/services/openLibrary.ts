import { OpenLibraryBookResult } from '../types';
import { db } from '../storage/db';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días de validez en caché offline

// Conjunto curated offline de respaldo en caso de sandbox sin salida a internet
const OFFLINE_CURATED_CATALOG: OpenLibraryBookResult[] = [
  {
    key: '/works/OL102749W',
    title: 'Cien años de soledad',
    author: 'Gabriel García Márquez',
    firstPublishYear: 1967,
    coverUrl: 'https://covers.openlibrary.org/b/id/11153216-M.jpg',
    numberOfPages: 471,
    isbn: '9780307474728',
    subject: ['Realismo Mágico', 'Novela Latinoamericana', 'Clásicos'],
  },
  {
    key: '/works/OL1168007W',
    title: 'Don Quijote de la Mancha',
    author: 'Miguel de Cervantes',
    firstPublishYear: 1605,
    coverUrl: 'https://covers.openlibrary.org/b/id/12845623-M.jpg',
    numberOfPages: 863,
    isbn: '9788424116286',
    subject: ['Clásicos', 'Literatura Española', 'Aventura'],
  },
  {
    key: '/works/OL1168212W',
    title: '1984',
    author: 'George Orwell',
    firstPublishYear: 1949,
    coverUrl: 'https://covers.openlibrary.org/b/id/7222246-M.jpg',
    numberOfPages: 328,
    isbn: '9780451524935',
    subject: ['Distopía', 'Ciencia Ficción', 'Filosofía Política'],
  },
  {
    key: '/works/OL893415W',
    title: 'El Principito',
    author: 'Antoine de Saint-Exupéry',
    firstPublishYear: 1943,
    coverUrl: 'https://covers.openlibrary.org/b/id/8314134-M.jpg',
    numberOfPages: 96,
    isbn: '9780156012195',
    subject: ['Fábula', 'Filosofía', 'Infantil y Juvenil'],
  },
  {
    key: '/works/OL893541W',
    title: 'Fahrenheit 451',
    author: 'Ray Bradbury',
    firstPublishYear: 1953,
    coverUrl: 'https://covers.openlibrary.org/b/id/9255566-M.jpg',
    numberOfPages: 249,
    isbn: '9781451673319',
    subject: ['Distopía', 'Libros Prohibidos', 'Ciencia Ficción'],
  },
  {
    key: '/works/OL257943W',
    title: 'Dune',
    author: 'Frank Herbert',
    firstPublishYear: 1965,
    coverUrl: 'https://covers.openlibrary.org/b/id/10522444-M.jpg',
    numberOfPages: 688,
    isbn: '9780441013593',
    subject: ['Ciencia Ficción Épica', 'Espacio', 'Ecología'],
  },
  {
    key: '/works/OL19632711W',
    title: 'Hábitos Atómicos',
    author: 'James Clear',
    firstPublishYear: 2018,
    coverUrl: 'https://covers.openlibrary.org/b/id/12886417-M.jpg',
    numberOfPages: 320,
    isbn: '9780735211292',
    subject: ['Desarrollo Personal', 'Productividad', 'Psicología'],
  },
  {
    key: '/works/OL20846876W',
    title: 'Klara y el Sol',
    author: 'Kazuo Ishiguro',
    firstPublishYear: 2021,
    coverUrl: 'https://covers.openlibrary.org/b/id/10582236-M.jpg',
    numberOfPages: 384,
    isbn: '9780593318171',
    subject: ['Inteligencia Artificial', 'Ficción Especulativa', 'Drama'],
  },
];

export async function searchOpenLibrary(
  query: string
): Promise<{ results: OpenLibraryBookResult[]; fromCache: boolean }> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return { results: [], fromCache: false };
  }

  // 1. Verificar caché offline en Dexie (IndexedDB)
  try {
    const cached = await db.openLibraryCache.get(cleanQuery);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return { results: cached.results, fromCache: true };
    }
  } catch (err) {
    console.warn('[OpenLibrary] Error al leer caché en IndexedDB:', err);
  }

  // 2. Intentar petición a Open Library API
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
      cleanQuery
    )}&limit=10&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median,isbn,subject`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const docs = Array.isArray(data.docs) ? data.docs : [];

      const results: OpenLibraryBookResult[] = docs.map((doc: any) => {
        const coverId = doc.cover_i;
        const coverUrl = coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
          : undefined;

        return {
          key: doc.key || 'ol-' + Math.random().toString(36).slice(2, 9),
          title: doc.title || 'Sin título',
          author: Array.isArray(doc.author_name) ? doc.author_name[0] : 'Autor desconocido',
          firstPublishYear: doc.first_publish_year,
          coverId,
          coverUrl,
          numberOfPages: doc.number_of_pages_median || 280,
          isbn: Array.isArray(doc.isbn) ? doc.isbn[0] : undefined,
          subject: Array.isArray(doc.subject) ? doc.subject.slice(0, 3) : [],
        };
      });

      // Guardar en caché Dexie si obtuvimos resultados
      if (results.length > 0) {
        try {
          await db.openLibraryCache.put({
            query: cleanQuery,
            results,
            cachedAt: Date.now(),
          });
        } catch (cacheErr) {
          console.warn('[OpenLibrary] No se pudo escribir en caché Dexie:', cacheErr);
        }
      }

      return { results, fromCache: false };
    }
  } catch (netErr) {
    console.warn('[OpenLibrary] Red no disponible o timeout, buscando en catálogo de respaldo:', netErr);
  }

  // 3. Fallback inteligente: buscar en caché previa o en catálogo offline curated
  try {
    const staleCache = await db.openLibraryCache.get(cleanQuery);
    if (staleCache && staleCache.results.length > 0) {
      return { results: staleCache.results, fromCache: true };
    }
  } catch {
    // ignorar
  }

  // Filtrar del catálogo offline integrado
  const matches = OFFLINE_CURATED_CATALOG.filter(
    (b) =>
      b.title.toLowerCase().includes(cleanQuery) ||
      b.author.toLowerCase().includes(cleanQuery) ||
      (b.subject && b.subject.some((s) => s.toLowerCase().includes(cleanQuery)))
  );

  return { results: matches.length > 0 ? matches : OFFLINE_CURATED_CATALOG.slice(0, 4), fromCache: true };
}
