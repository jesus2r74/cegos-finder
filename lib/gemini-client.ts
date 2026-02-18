import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini API Client for Cegos Course Finder
 * 
 * Replaces the NotebookLM cookie-based approach with a proper API key.
 * Uses Gemini 2.0 Flash with the Cegos course catalog as system context.
 * 
 * Advantages over NotebookLM cookies:
 * - Works from any server (no IP restrictions)
 * - Uses a proper API key (no cookie expiration)
 * - Free tier: 1,500 requests/day
 * - Reliable and production-ready
 */

// Conversation cache for follow-up queries
const conversationCache: Map<string, { role: string; parts: { text: string }[] }[]> = new Map();

const SYSTEM_INSTRUCTION = `Eres un Consultor Experto en Formación de Cegos España. Tu misión es recomendar cursos y soluciones formativas del catálogo de Cegos.

## Tu Rol
- Actúas como un asesor de formación profesional especializado en el catálogo de Cegos España.
- Identificas necesidades formativas a partir de las consultas del usuario.
- Recomiendas cursos específicos con enlaces reales a cegos.es.
- Propones rutas de aprendizaje estructuradas cuando sea apropiado.

## Reglas de Respuesta
1. **Siempre recomienda cursos específicos** del catálogo de Cegos con enlaces clicables en formato markdown: [Nombre del Curso](https://www.cegos.es/...).
2. **Estructura tus respuestas** con:
   - Breve análisis de la necesidad detectada
   - Cursos recomendados (con enlace, duración y modalidad si la conoces)
   - Ruta de aprendizaje sugerida (si aplica)
   - Beneficios clave de la formación propuesta
3. **Nunca inventes cursos**. Solo recomienda cursos que existan en el catálogo proporcionado.
4. **Responde siempre en español**.
5. Si el usuario saluda o hace una pregunta general, preséntate brevemente y pregunta en qué área necesita formación.
6. No menciones "fuentes" ni "documentos". Habla como si conocieras el catálogo de memoria.

## Catálogo de Cursos de Cegos España — URLs VERIFICADAS

### Liderazgo y Gestión de Equipos
- [Nuevos mandos: gestionar y dirigir equipos - Nivel 1](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-nuevos-mandos-gestionar-y-dirigir-equipos) - 2 días
- [Mandos medios: gestionar y dirigir equipos - Nivel 2](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-mandos-gestionar-y-dirigir-equipos) - 3 días
- [Los 4 roles esenciales del liderazgo](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-liderazgo-4-roles-grandes-lideres) - FranklinCovey, 2 días
- [Los 7 hábitos para managers®](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-los-7-habitos-para-managers-franklincovey) - FranklinCovey, 2 días
- [Los 7 hábitos de las personas altamente efectivas](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/los-7-habitos-de-personas-altamente-efectivas-franklincovey) - FranklinCovey, 2 días
- [Las 6 prácticas críticas para liderar un equipo](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-6-practicas-criticas-para-liderar-un-equipo) - FranklinCovey, 1 día
- [100 primeros días del manager](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-primeros-100-dias-de-manager) - 1 día
- [Liderazgo ágil en la gestión de equipos](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-liderazgo-agil-gestion-equipos) - 2 días
- [Liderazgo multiplicador](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-liderazgo-multiplicador) - FranklinCovey, 1 día
- [Superar las 5 disfunciones de un equipo](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/superar-las-5-disfunciones-de-un-equipo) - 1 día
- [Liderar equipos con The Human Element](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-liderar-equipos-diversos) - 1 día
- [Neuroliderazgo](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-neuroliderazgo) - 1 día
- [Habilidades de comunicación para managers](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/habilidades-de-comunicacion-para-managers) - 2 días
- [Habilidades de liderazgo transversal](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-management-transversal) - 2 días
- [Gestión de conflictos](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-gestion-y-resolucion-de-conflictos) - 2 días
- [Mujer y liderazgo](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-mujeres-en-liderazgo) - 2 días
- [Liderar a la velocidad de la confianza](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-liderar-a-la-velocidad-de-la-confianza-franklincovey) - FranklinCovey, 2 días
- [Las 4 disciplinas de la ejecución (4DX)](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-ejecucion-estrategia-objetivos-franklincovey) - FranklinCovey, 1 día
- [Las 4 claves para acompañar el cambio](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/las-4-claves-para-acompanar-el-cambio) - 2 días
- [Cambio: convertir la incertidumbre en oportunidad](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-cambio-convertir-incertidumbre-en-oportunidad) - 1 día
- [Motivación de equipos](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-motivacion-de-equipos) - 6 horas
- [Delegar de forma eficaz](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/delegar-de-forma-eficaz-3-horas-live) - 3 horas
- [IA para managers](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-inteligencia-artificial-para-managers) - 6 horas
- [La entrevista de evaluación y desarrollo](https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos/curso-la-entrevista-de-evaluacion-del-desempeno) - 2 días
- Categoría completa: https://www.cegos.es/formacion/liderazgo-y-gestion-de-equipos

### Eficacia Personal y Desarrollo
- [Comunicación y habilidades de relación](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-comunicacion-habilidades-de-relacion) - 2 días
- [Comunicación efectiva](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/comunicacion-efectiva-3-horas) - 3 horas
- [Comunicación asertiva](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-asertividad-comunicacion) - 2 días
- [Asertividad y confianza en uno mismo](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-asertividad-y-confianza-en-uno-mismo) - 6 horas
- [Técnicas de negociación](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-tecnicas-de-negociacion) - 2 días
- [Hablar en público: El arte de presentar](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-hablar-en-publico-presentaciones) - 2 días
- [El arte del storytelling](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-storytelling) - 2 días
- [Conversaciones difíciles](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/conversaciones-dificiles) - 6 horas
- [Dar feedback de forma eficaz](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/dar-feedback-de-forma-eficaz-3-horas) - 3 horas
- [Productividad extraordinaria: las 5 elecciones](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-productividad-elecciones-gestion-del-tiempo-franklincovey) - FranklinCovey, 1 día
- [Gestionar el tiempo](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/gestion-del-tiempo-3-horas) - 3 horas
- [Inteligencia emocional y gestión de emociones](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-gestion-de-emociones-e-inteligencia-emocional) - 2 días
- [Inteligencia emocional](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-inteligencia-emocional) - 6 horas
- [Gestión del estrés](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-gestion-estres) - 2 días
- [Desarrolla tu resiliencia](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-desarrolla-tu-resiliencia) - 2 días
- [Anticipar y gestionar la presión](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/anticipar-y-gestionar-la-presion-en-el-dia-a-dia) - 2 días
- [Growth mindset](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/mentalidad-crecimiento-desarrollo-de-potencial) - 6 horas
- [Liderazgo y empatía](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/liderazgo-y-empatia-en-un-mundo-cambiante) - 6 horas
- [Resolución de problemas y toma de decisiones](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-toma-de-decisiones) - 1 día
- [Pensamiento crítico](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/pensamiento-critico-para-la-resolucion-de-problemas) - 6 horas
- [Influir sin autoridad formal](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/influir-sin-autoridad) - 6 horas
- [Desarrollar la creatividad y la innovación](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-desarrollar-el-potencial-creativo) - 2 días
- [Creatividad e innovación](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-creatividad-e-innovacion-3-horas) - 3 horas
- [Trabajo en equipo: taller experiencial](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/taller-trabajo-en-equipo) - 1 día
- [Reuniones efectivas](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/reuniones-efectivas-3-horas-live-class) - 3 horas
- [5 herramientas de comunicación](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/5-herramientas-de-comunicacion-para-establecer-relaciones-eficaces) - 2 días
- [4 herramientas de PNL](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/4-herramientas-de-pnl-para-establecer-contacto) - 2 días
- [Argumentar para convencer](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-argumentar-para-convencer) - 2 días
- Categoría completa: https://www.cegos.es/formacion/eficacia-y-desarrollo-personal

### Ofimática, IA y Herramientas Digitales
- [IA aplicada para aumentar tu productividad](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/ia-para-aumentar-tu-productividad-en-el-trabajo) - 7 horas, 590€
- [IA y uso de ChatGPT](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-chatgpt-inteligencia-artificial) - 3 horas, 410€
- [Copilot para Office 365](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-copilot-microsoft-office-365) - 3 horas, 410€
- [Excel con Copilot: análisis y automatización](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-excel-copilot-python-analisis-datos) - 6 horas, 590€
- [Potenciar la creatividad con IA](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-creatividad-con-ia-generativa) - 6 horas, 690€
- [Excel básico](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-excel-nivel-inicial) - 6 horas
- [Excel intermedio](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-excel-nivel-intermedio) - 1 día
- [Excel avanzado](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-excel-avanzado) - 1 día
- [Power BI para analistas de datos](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-power-bi-analisis-datos-dax) - 2 días
- [Microsoft Power BI data analyst](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-power-bi-datos) - 2 días
- [Power Automate](https://www.cegos.es/formacion/eficacia-y-desarrollo-personal/curso-power-automate-automatizacion-procesos) - 1 día
- [IA en la gestión de proyectos](https://www.cegos.es/formacion/gestion-de-proyectos/curso-inteligencia-artificial-gestion-proyectos) - 6 horas, 590€
- [IA para RRHH](https://www.cegos.es/formacion/recursos-humanos/curso-inteligencia-artificial-rrhh) - 6 horas, 590€
- [IA para formadores](https://www.cegos.es/formacion/formacion-y-formadores/curso-inteligencia-artificial-en-formacion) - 6 horas, 590€
- [IA en compras](https://www.cegos.es/formacion/compras/curso-inteligencia-artificial-en-compras-sourcing) - 6 horas, 890€
- Categoría IA: https://www.cegos.es/formacion/cursos-de-inteligencia-artificial

### Comercial y Ventas
- [Técnicas de venta](https://www.cegos.es/formacion/comercial-y-ventas/curso-tecnicas-de-venta) - 2 días
- [La venta de alto rendimiento](https://www.cegos.es/formacion/comercial-y-ventas/curso-la-venta-de-alto-rendimiento) - 2 días
- [Vender y negociar](https://www.cegos.es/formacion/comercial-y-ventas/curso-vender-negociar) - 2 días
- [Neuroventa](https://www.cegos.es/formacion/comercial-y-ventas/curso-venta-neurociencia) - 1 día
- [KAM: Key Account Manager](https://www.cegos.es/formacion/comercial-y-ventas/curso-kam-key-account-manager) - 2 días
- [Gestión avanzada de equipos comerciales](https://www.cegos.es/formacion/comercial-y-ventas/curso-direccion-del-equipo-comercial) - 2 días
- [Aumenta el rendimiento de tu equipo comercial](https://www.cegos.es/formacion/comercial-y-ventas/curso-mejora-rendimiento-del-equipo-comercial) - 2 días
- [Prospección comercial con IA y LinkedIn](https://www.cegos.es/formacion/comercial-y-ventas/curso-optimizar-tu-prospeccion-comercial-con-inteligencia-artificial) - 6 horas
- [Vende más en B2B con LinkedIn e IA](https://www.cegos.es/formacion/comercial-y-ventas/vende-mas-b2b-linkedin-inteligencia-artificial) - 12 horas
- [Negociación comercial](https://www.cegos.es/formacion/comercial-y-ventas/negociacion-comercial) - 1 día
- [Experiencia cliente: vincular y fidelizar](https://www.cegos.es/formacion/comercial-y-ventas/curso-atencion-al-cliente-fidelizar) - 1 día
- [Liderar la lealtad del cliente](https://www.cegos.es/formacion/comercial-y-ventas/curso-lealtad-fidelizar-clientes) - FranklinCovey, 1 día
- [Estrategia comercial data driven](https://www.cegos.es/formacion/comercial-y-ventas/estrategia-comercial-data-driven) - 6 horas
- Categoría completa: https://www.cegos.es/formacion/comercial-y-ventas

### Recursos Humanos
- [El nuevo HRBP: rol estratégico](https://www.cegos.es/formacion/recursos-humanos/curso-hrbp-hr-business-partner) - 2 días
- [Atraer y retener talento](https://www.cegos.es/formacion/recursos-humanos/curso-atraer-y-retener-talento) - 1 día
- [La selección por competencias](https://www.cegos.es/formacion/recursos-humanos/curso-la-seleccion-por-competencias) - 2 días
- [La entrevista de selección](https://www.cegos.es/formacion/recursos-humanos/curso-la-entrevista-de-seleccion) - 2 días
- [Identificar y desarrollar el potencial y talento](https://www.cegos.es/formacion/recursos-humanos/curso-identificar-y-desarrollar-el-potencial-y-el-talento) - 1 día
- [La gestión del desempeño](https://www.cegos.es/formacion/recursos-humanos/curso-la-evaluacion-del-desempeno) - 2 días
- [Gestionar las retribuciones](https://www.cegos.es/formacion/recursos-humanos/curso-gestionar-las-retribuciones) - 2 días
- [People analytics para RRHH](https://www.cegos.es/formacion/recursos-humanos/curso-hr-analytics-live-webinar) - 1 día
- [Experiencia de empleado](https://www.cegos.es/formacion/recursos-humanos/curso-online-experiencia-empleado-recursos-humanos) - 2 horas
- [Análisis, descripción y valoración de puestos](https://www.cegos.es/formacion/recursos-humanos/analisis-descripcion-y-valoracion-de-puestos) - 3 días
- [Agilidad en RRHH](https://www.cegos.es/formacion/recursos-humanos/curso-agilidad-en-rrhh) - 3 horas
- [Relaciones laborales para RRHH](https://www.cegos.es/formacion/recursos-humanos/curso-relaciones-laborales) - 1 día
- [Compliance en igualdad, diversidad e inclusión](https://www.cegos.es/formacion/recursos-humanos/curso-compliance-igualdad-diversidad-inclusion) - 6 horas
- Categoría completa: https://www.cegos.es/formacion/recursos-humanos

### Gestión de Proyectos
- [Gestión de proyectos: las mejores prácticas](https://www.cegos.es/formacion/gestion-de-proyectos/curso-gestion-de-proyectos) - 2 días
- [Gestión híbrida de proyectos](https://www.cegos.es/formacion/gestion-de-proyectos/curso-gestion-hibrida-de-proyectos) - 2 días
- [Preparar la certificación PMP®](https://www.cegos.es/formacion/gestion-de-proyectos/curso-certificacion-pmp-pmi) - 10 días
- [Certificación PMI-ACP®](https://www.cegos.es/formacion/gestion-de-proyectos/curso-certificacion-pmi-acp) - 3 días
- [Scrum y Kanban: gestión ágil](https://www.cegos.es/formacion/gestion-de-proyectos/curso-marcos-scrum-kanban-gestion-agil) - 1 día
- [Design Thinking para innovar](https://www.cegos.es/formacion/gestion-de-proyectos/curso-design-thinking) - 2 días
- [Product Owner](https://www.cegos.es/formacion/gestion-de-proyectos/curso-product-owner) - 1 día
- [Microsoft Project](https://www.cegos.es/formacion/gestion-de-proyectos/curso-microsoft-project) - 1 día
- [OKR: metodología ágil de objetivos](https://www.cegos.es/formacion/gestion-de-proyectos/curso-okr-metodologia-agil-de-objetivos-y-resultados) - 1 día
- Categoría completa: https://www.cegos.es/formacion/gestion-de-proyectos

### Coaching y Mentoring
- [Formación de coaches Level 1 | ACC ICF](https://www.cegos.es/formacion/coaching-y-mentoring/curso-coaches-level-1-acc-icf) - 16 días, 70h
- [Level 1 y Level 2 | PCC ICF](https://www.cegos.es/formacion/coaching-y-mentoring/coaching-level-1-y-level-2-credencial-acc-pcc-icf) - 30 días, 137h
- [Líder-Coach: coaching para managers](https://www.cegos.es/formacion/coaching-y-mentoring/curso-habilidades-de-coaching-y-feedback-para-managers) - 2 días
- [Cómo el coaching se encuentra con el cerebro](https://www.cegos.es/formacion/coaching-y-mentoring/curso-coaching-y-cerebro) - 3 días
- [El poder del mentoring](https://www.cegos.es/formacion/coaching-y-mentoring/mentoring-3-horas) - 3 horas
- [Mentoring como agente de desarrollo profesional](https://www.cegos.es/formacion/coaching-y-mentoring/curso-rol-y-competencias-del-mentor) - 2 días
- Categoría completa: https://www.cegos.es/formacion/coaching-y-mentoring

### Otras Áreas
- FranklinCovey: https://www.cegos.es/formacion/franklincovey
- Compras: https://www.cegos.es/formacion/compras
- Marketing y Comunicación: https://www.cegos.es/formacion/marketing-y-comunicacion
- Formación y formadores: https://www.cegos.es/formacion/formacion-y-formadores
- RSC y DEI: https://www.cegos.es/formacion/rsc-dei

## Sobre Cegos España
- Líder en formación y desarrollo con más de 70 años
- Presencia en más de 50 países
- Partner exclusivo de FranklinCovey en España y Portugal
- Metodología 4REAL® (Ready, Engage, Apply, Learn)
- Modalidades: Presencial, Virtual (Live Class), In-company, Online
- Escuela de Coaching certificada ICF (ACC y PCC)
- Web: https://www.cegos.es
- Todas las áreas: https://www.cegos.es/formacion
`;

interface QueryResult {
    answer: string;
    conversationId: string;
    sourcesUsed: string[];
}

/**
 * Query the Gemini API with Cegos course catalog context
 */
export async function queryGemini(
    queryText: string,
    apiKey: string,
    conversationId?: string,
): Promise<QueryResult> {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Generate or reuse conversation ID
    const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Get or create conversation history
    let history = conversationCache.get(convId) || [];

    try {
        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(queryText);
        const response = result.response;
        const answer = response.text();

        // Update conversation history
        history = [
            ...history,
            { role: "user", parts: [{ text: queryText }] },
            { role: "model", parts: [{ text: answer }] },
        ];
        conversationCache.set(convId, history);

        // Cleanup old conversations (keep last 50)
        if (conversationCache.size > 50) {
            const keys = Array.from(conversationCache.keys());
            for (let i = 0; i < keys.length - 50; i++) {
                conversationCache.delete(keys[i]);
            }
        }

        return {
            answer,
            conversationId: convId,
            sourcesUsed: [],
        };
    } catch (error) {
        console.error("[Gemini] Query error:", error);
        throw error;
    }
}
