// /app/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

type ChatMessage = {
  from: "user" | "bot";
  text: string;
};

const STORAGE_KEY = "miteni_session_id";

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  // Auto-scroll ai nuovi messaggi
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus automatico sull'input
  useEffect(() => {
    if (!isLoading && !done && !isLoadingSession) {
      inputRef.current?.focus();
    }
  }, [isLoading, done, isLoadingSession]);

  // Carica sessione esistente all'avvio
  useEffect(() => {
    if (hasInitialized.current) {
      console.log("⏭️ Skip: già inizializzato");
      return;
    }
    hasInitialized.current = true;

    const loadExistingSession = async () => {
      console.log("🔍 Inizio caricamento sessione...");
      
      try {
        const savedSessionId = localStorage.getItem(STORAGE_KEY);
        console.log("📦 localStorage check:", savedSessionId ? `Trovato: ${savedSessionId}` : "Vuoto");
        
        if (savedSessionId) {
          console.log("📂 Trovata sessione salvata:", savedSessionId);
          
          console.log("🌐 Chiamata API: GET /api/session?sessionId=" + savedSessionId);
          const response = await fetch(
            `/api/session?sessionId=${savedSessionId}`
          );
          
          console.log("📡 Response status:", response.status, response.ok ? "✅" : "❌");
          
          if (response.ok) {
            const data = await response.json();
            console.log("📄 Response data:", data);
            
            if (data.success && data.session) {
              console.log("✅ Sessione caricata con successo");
              console.log("📊 Dati sessione:", data.session);
              
              setSessionId(data.session.sessionId);
              
              const historyMessages: ChatMessage[] = (data.session.history || [])
                .filter((msg: any) => msg && msg.text && msg.from)
                .map((msg: any, index: number) => {
                  console.log(`   ${index + 1}. ${msg.from}: ${msg.text.substring(0, 50)}...`);
                  return {
                    from: msg.from as "user" | "bot",
                    text: msg.text
                  };
                });
              
              const uniqueMessages = historyMessages.filter((msg, idx) => {
                if (idx === 0) return true;
                const prev = historyMessages[idx - 1];
                return !(prev.from === msg.from && prev.text === msg.text);
              });
              
              console.log("🔄 Sessione ripristinata:");
              console.log("   Messaggi totali:", historyMessages.length);
              console.log("   Dopo rimozione duplicati:", uniqueMessages.length);
              
              setMessages(uniqueMessages);
              setDone(data.session.done || false);
              setSessionRestored(true);
              
              setIsLoadingSession(false);
              console.log("✋ STOP: Non chiamo initNewSession perché ho caricato sessione esistente");
              return;
            }
          }
          
          console.log("⚠️ Sessione non valida, inizio nuova");
          localStorage.removeItem(STORAGE_KEY);
        } else {
          console.log("🆕 Nessuna sessione salvata, inizio nuova");
        }
      } catch (error) {
        console.error("❌ Errore nel caricare sessione:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
      
      console.log("🚀 Chiamo initNewSession...");
      await initNewSession();
    };

    loadExistingSession();
  }, []);

  // Inizializza nuova sessione
  const initNewSession = async () => {
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      const raw = await res.text();
      console.log("🆕 Nuova sessione - status:", res.status);

      if (!res.ok) {
        setMessages([
          {
            from: "bot",
            text: "Al momento si è verificato un problema tecnico. La preghiamo di lasciare il suo numero e la ricontatteremo.",
          },
        ]);
        return;
      }

      const data = JSON.parse(raw);
      console.log("🆔 Nuova sessione creata, ID:", data.sessionId);
      setSessionId(data.sessionId);

      const botMsgs: ChatMessage[] = data.botMessages.map((t: string) => ({
        from: "bot",
        text: t,
      }));

      console.log("💬 Primo messaggio bot:", botMsgs);
      setMessages(botMsgs);
    } catch (error) {
      console.error("Init error:", error);
      setMessages([
        {
          from: "bot",
          text: "Errore di connessione. Si prega di ricaricare la pagina.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsLoadingSession(false);
    }
  };

  // Salva sessionId quando viene creato
  useEffect(() => {
    if (sessionId) {
      const oldSessionId = localStorage.getItem(STORAGE_KEY);
      if (oldSessionId !== sessionId) {
        console.log("🔄 SessionId cambiato!");
        console.log("   Vecchio:", oldSessionId);
        console.log("   Nuovo:", sessionId);
      }
      localStorage.setItem(STORAGE_KEY, sessionId);
      console.log("💾 SessionId salvato in localStorage:", sessionId);
    }
  }, [sessionId]);

  // Validazione input frontend
  const validateInput = (text: string): string | null => {
    if (text.trim().length === 0) {
      return "Il messaggio non può essere vuoto.";
    }
    
    if (text.trim().length < 1) {
      return "Scrivi almeno un carattere.";
    }
    
    if (text.length > 1000) {
      return "Il messaggio è troppo lungo (max 1000 caratteri).";
    }
    
    return null;
  };

  // Handle input change con validazione
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    
    const error = validateInput(value);
    setInputError(error);
  };

  // Invia messaggio
  const sendMessage = async () => {
    if (!input.trim() || isLoading || done) return;

    const error = validateInput(input);
    if (error) {
      setInputError(error);
      return;
    }

    const userText = input.trim();
    setInput("");
    setInputError(null);
    setIsLoading(true);

    const userMsg: ChatMessage = { from: "user", text: userText };
    setMessages((prev) => [...prev, userMsg]);

    console.log("📤 Invio messaggio:");
    console.log("   SessionId corrente:", sessionId);
    console.log("   Messaggio:", userText);

    setIsTyping(true);

    try {
      const payload = {
        sessionId,
        userMessage: userText,
      };
      
      console.log("📦 Payload invio:", payload);
      
      const res = await fetch("/api/message", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Errore nella risposta");
      }

      const data = await res.json();

      console.log("📥 Risposta ricevuta:");
      console.log("   SessionId nella risposta:", data.sessionId);
      console.log("   Messaggi bot:", data.botMessages?.length || 0);
      console.log("   Done:", data.done);

      if (data.sessionId) {
        if (data.sessionId !== sessionId) {
          console.log("⚠️ ATTENZIONE: SessionId cambiato nella risposta!");
          console.log("   Era:", sessionId);
          console.log("   Ora:", data.sessionId);
        }
        setSessionId(data.sessionId);
      }

      setIsTyping(false);

      if (data.botMessages && data.botMessages.length > 0) {
        const botMsgs: ChatMessage[] = data.botMessages.map((t: string) => ({
          from: "bot",
          text: t,
        }));

        setMessages((prev) => [...prev, ...botMsgs]);
      }

      if (data.done) {
        setDone(true);
        localStorage.removeItem(STORAGE_KEY);
        console.log("✅ Questionario completato, sessione rimossa");
      }
    } catch (error) {
      console.error("Send error:", error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Si è verificato un errore. La preghiamo di riprovare.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Ricomincia da zero
  const handleRestart = () => {
    if (confirm("Sei sicuro di voler ricominciare da zero? Tutti i dati inseriti andranno persi.")) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  // Loading iniziale
  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#00c4ff] mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-semibold">Caricamento in corso...</p>
          <p className="text-gray-500 text-sm mt-2">Ripristino della conversazione</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#e6f9ff] via-white to-[#e6f9ff]">
      {/* Header */}
      <header className="bg-white shadow-md py-5 px-6 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={120} 
              height={120}
              className="object-contain"
            />
          </div>
          
          <div className="flex items-center gap-3">
            {sessionId && (
              <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg font-mono border border-gray-200">
                ID: {sessionId.slice(0, 8)}
              </div>
            )}
            {messages.length > 0 && !done && (
              <button
                onClick={handleRestart}
                className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-all border border-red-200 hover:border-red-300"
                title="Ricomincia compilazione da zero"
              >
                Ricomincia
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Badge sessione ripristinata */}
      {sessionRestored && messages.length > 0 && (
        <div className="bg-green-50 border-b border-green-200 py-3 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-green-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="font-semibold">Conversazione ripresa dal punto in cui l'aveva lasciata</span>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pt-[120px] pb-[120px]">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && !done && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-[#00c4ff] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Benvenuto
              </h2>
              <p className="text-gray-600 text-lg max-w-lg mx-auto leading-relaxed">
                Assistente per la compilazione del questionario PFAS Miteni. Iniziamo quando è pronto.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            if (!msg || !msg.text) {
              console.warn(`⚠️ Messaggio ${idx} non valido:`, msg);
              return null;
            }
            
            return (
              <div
                key={`${msg.from}-${idx}-${msg.text.substring(0, 20)}`}
                className={`flex ${
                  msg.from === "user" ? "justify-end" : "justify-start"
                } animate-fadeIn`}
              >
                <div
                  className={`max-w-[75%] px-5 py-3 rounded-xl shadow-md ${
                    msg.from === "user"
                      ? "bg-[#00c4ff] text-white rounded-br-sm"
                      : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-5 py-3 rounded-xl rounded-bl-sm shadow-md">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-4 px-6 fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-4xl mx-auto">
          {done && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-3 bg-green-50 border-2 border-green-300 rounded-xl px-6 py-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <div className="text-left">
                  <p className="text-green-800 font-bold text-lg">
                    Questionario completato
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Grazie per aver fornito le informazioni. Sarà ricontattato al più presto.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!done && (
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  className={`w-full px-5 py-3 rounded-lg border-2 focus:outline-none focus:ring-4 transition-all text-gray-900 ${
                    inputError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-[#00c4ff] focus:ring-cyan-100"
                  }`}
                  placeholder={
                    isLoading
                      ? "Attendere..."
                      : "Scrivi la tua risposta..."
                  }
                  value={input}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || done}
                />
                {inputError && (
                  <p className="text-red-600 text-sm mt-1 ml-1 font-medium">
                    {inputError}
                  </p>
                )}
              </div>

              <button
                onClick={sendMessage}
                disabled={isLoading || done || !!inputError || !input.trim()}
                className={`px-8 py-3 rounded-lg font-semibold text-white shadow-lg transition-all ${
                  isLoading || done || !!inputError || !input.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#00c4ff] hover:bg-[#00b0e6] active:scale-95 hover:shadow-xl"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Invio...
                  </span>
                ) : (
                  "Invia"
                )}
              </button>
            </div>
          )}
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
