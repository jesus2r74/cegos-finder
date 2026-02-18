"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

const CEGOS_LOGO_URL = "https://www.cegos.es/assets/media/img/logo/100_logo_cegos-d9a7dd23.webp";

// Simple Markdown renderer (no external deps)
function renderMarkdown(text: string): string {
  let html = text
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--cegos-teal); text-decoration: underline; font-weight: 600;">$1</a>')
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr />')
    // Unordered lists
    .replace(/^[\u2022\-\*] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Paragraphs - wrap remaining text blocks
  html = html.split('\n\n').map(block => {
    if (block.match(/^<(h[1-3]|ul|ol|blockquote|hr|li)/)) return block;
    if (block.trim() === '') return '';
    return `<p>${block.replace(/\n/g, '<br />')}</p>`;
  }).join('\n');

  return html;
}

const SUGGESTIONS = [
  "Necesito formaci\u00f3n en liderazgo para directivos en proceso de cambio",
  "\u00bfQu\u00e9 cursos ten\u00e9is de gesti\u00f3n del tiempo y productividad?",
  "Formaci\u00f3n para mejorar la comunicaci\u00f3n en equipos remotos",
  "Cursos sobre inteligencia emocional y gesti\u00f3n del estr\u00e9s",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [inputValue]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          conversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.error || "Error al procesar tu consulta",
          isError: true,
        };
        setMessages(prev => [...prev, errMsg]);
      } else {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.answer,
        };
        setMessages(prev => [...prev, assistantMsg]);
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
      }
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Error de conexi\u00f3n. Verifica tu conexi\u00f3n a internet e int\u00e9ntalo de nuevo.",
        isError: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setInputValue("");
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <img src={CEGOS_LOGO_URL} alt="Cegos Logo" className="header-logo-img" />
          <div>
            <h2>Course Finder</h2>
            <span className="subtitle">Consultor Experto en Formaci\u00f3n</span>
          </div>
        </div>
        <button className="btn-new-chat" onClick={startNewChat}>
          \u2728 Nueva consulta
        </button>
      </header>

      {/* Messages */}
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <img src={CEGOS_LOGO_URL} alt="Cegos 100 Years" className="welcome-logo" />
            <h3>\u00bfC\u00f3mo podemos ayudarte hoy?</h3>
            <p>
              Como expertos en L&D, te ayudamos a encontrar las soluciones de formaci\u00f3n
              que mejor se adaptan a los retos de tu organizaci\u00f3n.
              Dime qu\u00e9 competencias buscas desarrollar.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === "assistant" ? "C" : "U"}
                </div>
                <div
                  className={`message-content ${msg.isError ? "message-error" : ""}`}
                  dangerouslySetInnerHTML={{
                    __html: msg.role === "assistant"
                      ? renderMarkdown(msg.content)
                      : msg.content.replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            ))}
            {isLoading && (
              <div className="typing-indicator" style={{ marginTop: '10px' }}>
                <div className="message assistant">
                  <div className="message-avatar pulsing" style={{ background: "var(--cegos-teal)" }}>
                    C
                  </div>
                  <div className="message-content">
                    <div className="consulting-thinking">
                      <span className="thinking-text">
                        Estamos analizando tus necesidades para dise\u00f1ar la ruta formativa ideal...
                      </span>
                      <p style={{ fontSize: '13px', opacity: 0.8, margin: '8px 0 0 0', lineHeight: '1.4' }}>
                        Este proceso puede tardar hasta un minuto mientras elaboramos una propuesta completa y personalizada para tu organizaci\u00f3n.
                      </p>
                      <div className="loading-bar-wrapper">
                        <div className="loading-bar-progress"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-area">
        <form className="input-wrapper" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe las necesidades de formaci\u00f3n de tu equipo..."
            rows={1}
            disabled={isLoading}
            id="chat-input"
          />
          <button
            type="submit"
            className="btn-send"
            disabled={!inputValue.trim() || isLoading}
            id="send-button"
          >
            \u2191
          </button>
        </form>
        <div className="input-hint">
          Expertos en Formaci\u00f3n y Desarrollo \u00b7 100 a\u00f1os transformando personas y empresas
        </div>
      </div>
    </div>
  );
}
