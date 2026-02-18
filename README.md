# Cegos Course Finder 🎓

Buscador inteligente de cursos de formación de **Cegos España**, potenciado por **Gemini AI**.

## 🌐 Demo en vivo

👉 [cegos-finder.vercel.app](https://cegos-finder.vercel.app)

## ✨ Características

- **Chat inteligente** con IA para encontrar cursos de formación
- **Catálogo completo** de Cegos España integrado como contexto
- **Recomendaciones personalizadas** con enlaces directos a cegos.es
- **Rutas de aprendizaje** estructuradas según necesidades
- **Historial de conversación** para consultas de seguimiento
- **Diseño responsive** con branding de Cegos

## 🛠️ Tecnologías

- **Next.js 16** - Framework React
- **Gemini 2.5 Flash** - Modelo de IA de Google
- **Vercel** - Hosting y despliegue
- **TypeScript** - Tipado estático

## 🚀 Desarrollo local

```bash
npm install
cp .env.example .env.local
# Añadir tu GEMINI_API_KEY
npm run dev
```

## 📋 Variables de entorno

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | API Key de Google AI Studio |

## 📦 Estructura

```
cegos-finder/
├── app/
│   ├── api/chat/route.ts    # API endpoint
│   ├── globals.css          # Estilos
│   ├── layout.tsx           # Layout
│   └── page.tsx             # Chat UI
├── lib/
│   └── gemini-client.ts     # Gemini AI client
└── vercel.json
```

## 📄 Licencia

MIT
