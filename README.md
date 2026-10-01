Cómo se usa el flujo
El constructor de AI Studio no es un editor de código incremental: tú pegas un prompt y regenera la app entera. Por eso los 5 prompts tienen que ser completos y reescribir la versión anterior, no parches. El flujo es:
1. Abres aistudio.google.com/apps → New app
2. Pegas el prompt de Beta 1.0 → generas → Preview en modo móvil
3. En el mismo chat pegas el prompt de Beta 1.2 → regenera desde cero respetando lo anterior
4. Repites 3,0 y Official
5. Cada beta se guarda como copia (Preview → guardar versión) para poder comparar
Qué contiene cada prompt
Versión	Qué le pido al generador
Beta 1.0	Stack React+TS+Tailwind, tipos de Book/ReadingSession/Goal, Context con reducer, las 3 funciones P0, capa storage.ts con interfaz
Beta 1.2	Sistema de diseño (escala 8px, jerarquía), 4 pantallas con navegación inferior, racha con date-fns y días de gracia, charts SVG, a11y AA
Beta 2.0	IndexedDB con Dexie + upgrade(), búsqueda en Open Library con caché offline, import/export JSON, heatmap de 12 meses, palabras/minuto
Beta 3.0	Recomendaciones con responseSchema JSON estructurado, chat sobre tus notas, quiz con autoevaluación, recomendaciones explicadas
Official	Errores con boundaries, estados vacíos diseñados, optimistic updates, code-splitting, migración de esquema, PWA instalable, i18n, README de despliegue
