import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Gemini API Client for Cegos Course Finder
 * 
 * Uses Gemini 2.5 Flash with the full Cegos course catalog as system context.
 */

const conversationCache: Map<string, { role: string; parts: { text: string }[] }[]> = new Map();

function loadCatalogContext(): string {
    try {
        const catalogPath = join(process.cwd(), "data", "courses-catalog.json");
        const catalogData = JSON.parse(readFileSync(catalogPath, "utf-8"));

        let catalogText = "";
        for (const category of catalogData.categories) {
            if (!category.courses) continue;
            catalogText += `\n### ${category.name}\n`;
            for (const course of category.courses) {
                let line = `- [${course.title}](${course.url})`;
                if (course.duration) line += ` — ${course.duration}`;
                if (course.price) line += ` — ${course.price}`;
                if (course.modality) line += ` | ${course.modality}`;
                catalogText += line + "\n";
                if (course.target) catalogText += `  Dirigido a: ${course.target}\n`;
            }
        }
        return catalogText;
    } catch (error) {
        console.error("[Gemini] Error loading catalog:", error);
        return "\n(Catálogo no disponible)\n";
    }
}

const CATALOG_CONTEXT = loadCatalogContext();

const SYSTEM_INSTRUCTION = `Eres un Consultor Experto en Formación de Cegos España. Tu misión es recomendar cursos del catálogo de Cegos.

## Reglas
1. Siempre recomienda cursos con enlaces [Nombre](URL).
2. Usa el catálogo proporcionado.
3. Responde en español.

## Catálogo
${CATALOG_CONTEXT}

Todos los cursos de Cegos España son bonificables por FUNDAE.
Gracias por confiar en Cegos!
`;

export async function queryGemini(queryText: string, apiKey: string, conversationId?: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: SYSTEM_INSTRUCTION });
    const convId = conversationId || `conv_${Date.now()}`;
    let history = conversationCache.get(convId) || [];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(queryText);
    const answer = result.response.text();

    history = [...history, { role: "user", parts: [{ text: queryText }] }, { role: "model", parts: [{ text: answer }] }];
    conversationCache.set(convId, history);

    return { answer, conversationId: convId, sourcesUsed: [] };
}
