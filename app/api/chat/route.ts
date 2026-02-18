import { NextRequest, NextResponse } from "next/server";
import { queryGemini } from "@/lib/gemini-client";

export async function POST(request: NextRequest) {
    const API_KEY = process.env.GEMINI_API_KEY || "";

    try {
        const body = await request.json();
        const { message, conversationId } = body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return NextResponse.json(
                { error: "El mensaje es obligatorio" },
                { status: 400 }
            );
        }

        if (!API_KEY) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY no est\u00e1 configurado en el servidor. Contacta al administrador." },
                { status: 500 }
            );
        }

        const result = await queryGemini(
            message.trim(),
            API_KEY,
            conversationId || undefined
        );

        return NextResponse.json({
            answer: result.answer,
            conversationId: result.conversationId,
            sourcesUsed: result.sourcesUsed,
        });
    } catch (error) {
        console.error("Chat API error:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";

        if (errorMessage.includes("API_KEY") || errorMessage.includes("401") || errorMessage.includes("403")) {
            return NextResponse.json(
                { error: "La API Key de Gemini no es v\u00e1lida o ha sido revocada. Contacta al administrador." },
                { status: 503 }
            );
        }

        if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RATE_LIMIT")) {
            return NextResponse.json(
                { error: "Se ha alcanzado el l\u00edmite de consultas. Int\u00e9ntalo de nuevo en unos minutos." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: `Error al procesar tu consulta: ${errorMessage}` },
            { status: 500 }
        );
    }
}
