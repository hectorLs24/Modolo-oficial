# Lectura — Plataforma de Seguimiento de Lectura & Curaduría IA
**Versión Oficial 3.0**

Una aplicación web progresiva (PWA) de alto rendimiento, diseñada para lectores exigentes con persistencia local en IndexedDB (Dexie), motor de rachas con días de gracia (`date-fns`), visualizaciones vectoriales SVG nativas y capacidades cognitivas impulsadas por Google Gemini (`gemini-3.8-flash`).

---

## 🌟 Características Principales

- **Gestión de Biblioteca & Progreso (P0.1)**: Catálogo editorial con filtros por estado (`reading`, `to_read`, `completed`, `abandoned`), control táctil de páginas y carátulas personalizadas.
- **Sesiones & Cronómetro en Vivo (P0.2)**: Cronómetro interactivo segundo a segundo, registro retroactivo y cálculo automático de palabras por minuto (PPM) y ritmo de lectura (`min/p`).
- **Rachas & Días de Gracia (P0.3)**: Motor de cálculo con `date-fns` que tolera ausencias planificadas mediante días de gracia configurables.
- **Gráficos SVG Nativos & Heatmap de 12 Meses**: Gráficos de barras, curvas de área y donut sin dependencias externas pesadas, junto a una matriz anual de 52 semanas tipo GitHub.
- **Persistencia con Dexie & Migración de Esquema**:
  - `v1`: Esquema relacional inicial para libros, sesiones y metas.
  - `v2`: Incorporación de métricas de palabras por minuto (`WPM`) y caché offline de Open Library.
  - `v3` (Oficial): Tabla de ajustes persistentes (`settings`), índices de rating y migración automatizada sin pérdida de datos.
- **Búsqueda en Open Library con Caché Offline**: Consulta de metadatos, portadas y número de páginas con respaldo local en Dexie.
- **Inteligencia Literaria (Gemini 3.8 Flash)**:
  - Recomendaciones explicadas con `responseSchema` JSON estricto (`pitch`, `whyRecommended`, `similarityFactors`).
  - Chat socrático sobre notas personales y contexto de lectura.
  - Generación de cuestionarios formativos con autoevaluación y explicaciones pedagógicas.
- **PWA Instalable & Modo Offline**:
  - Service worker configurado con `vite-plugin-pwa` y Workbox.
  - Web App Manifest completo con iconos 192px, 512px y maskable para Android.
  - Botón de instalación in-app integrado con guía para iOS Safari.
  - Indicador de estado de conectividad en tiempo real.
- **Internacionalización (i18n)**: Soporte completo en español (`es`) e inglés (`en`) con cambio instantáneo y persistencia.
- **Resiliencia & Rendimiento**:
  - `ErrorBoundary` reactivo para aislar fallos de renderizado.
  - `Code-Splitting` mediante `React.lazy` y `<Suspense>` con esqueletos visuales para reducir el bundle inicial.
  - Actualizaciones optimistas en todas las mutaciones del usuario.
  - Accesibilidad WCAG 2.1 AA (contraste superior a 4.5:1, etiquetas ARIA, navegación por teclado).

---

## 🏗️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons |
| **PWA & Offline** | Vite Plugin PWA, Workbox, Service Workers, Web App Manifest |
| **Persistencia** | Dexie.js (IndexedDB v3 con upgrade), LocalStorage fallback |
| **Backend / Proxy** | Express 4, Node.js 22, Tsx |
| **Modelos de IA** | `@google/genai` TypeScript SDK con `gemini-3.8-flash` |
| **Fecha & Tiempo** | `date-fns` |

---

## 🚀 Requisitos Previos

- **Node.js**: versión 20.x o superior (recomendado Node 22).
- **npm** o **bun** instalado.
- **GEMINI_API_KEY**: Clave de API de Google Gemini (suministrada automáticamente en Google AI Studio o configurada en `.env`).

---

## 🛠️ Instalación y Desarrollo Local

1. **Clonar o descargar el repositorio**:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd lectura
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
   Asegúrate de definir `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   PORT=3000
   ```

4. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se iniciará en `http://localhost:3000` con Express sirviendo los endpoints `/api/ai/*` y el middleware de Vite para HMR.

---

## 📦 Construcción y Despliegue en Producción

### 1. Compilación del Frontend
Para generar los archivos estáticos optimizados y el service worker de la PWA:
```bash
npm run build
```
Esto genera el directorio `/dist` con todos los assets divididos en chunks optimizados por `React.lazy`.

### 2. Ejecución en Producción
Inicia el servidor Node.js/Express:
```bash
npm run start
```
Express detectará automáticamente `NODE_ENV=production` y servirá el contenido estático compilado desde `/dist`, manteniendo activas las rutas de la API de Gemini.

### 3. Despliegue en Google Cloud Run / AI Studio
La aplicación está configurada para empaquetarse en contenedores Docker estándar:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📱 Guía de Instalación PWA

### En Google Chrome / Android
1. Abre la aplicación en el navegador.
2. Haz clic en el botón destacado **«Instalar App»** situado en la barra superior.
3. Confirma la instalación para añadir el icono a tu pantalla de inicio o cajón de aplicaciones.

### En iOS Safari (iPhone / iPad)
1. Pulsa el botón **Compartir** (icono de rectángulo con flecha hacia arriba) en la barra de Safari.
2. Desplázate hacia abajo y selecciona **«Añadir a la pantalla de inicio»**.
3. Pulsa **Añadir**. La app se abrirá en modo `standalone` a pantalla completa y con acceso offline.

---

## 🗄️ Esquema de Base de Datos y Migración Dexie

La base de datos local `LecturaBetaDB` evoluciona progresivamente:
- **v1**: Tablas `books`, `sessions` y `goals`.
- **v2**: Agrega `wordsPerPage`, `wordsPerMinute` y la tabla de caché `openLibraryCache` con TTL de 7 días.
- **v3**: Agrega la tabla `settings`, campo de auditoría `updatedAt`, índice de `rating` y migración segura automática mediante `db.version(3).upgrade(tx)`.

Para exportar o restaurar respaldos de datos en formato JSON, dirígete a la pestaña **Racha & Metas** > **Capa de Almacenamiento**.

---

## 🧪 Verificación y Calidad de Código

- **Verificación de tipos y linter**:
  ```bash
  npm run lint
  ```
- **Auditoría de PWA**:
  Ejecuta Google Lighthouse en la pestaña Application/PWA de DevTools para validar la instalación, Service Worker y Manifest.
