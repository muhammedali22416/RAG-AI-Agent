"use client";

import { useState, useRef, useEffect } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  products?: Product[];
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hey there! Looking for something specific today? Tell me your budget or requirements!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendToAgent = async (messageText: string) => {
    const userMsg: Message = { role: "user", content: messageText, timestamp: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, user_id: "guest" }),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, timestamp: getTime(), products: data.products },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Unable to connect to the assistant server. Please check backend status.",
          timestamp: getTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    sendToAgent(text);
  };

  const handleAddToCart = (product: Product) => {
    sendToAgent(`add ${product.name} to my cart`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-sm antialiased">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-violet-500/25 active:scale-95"
          aria-label="Open AI Assistant"
        >
          <svg
            className="h-7 w-7 transition-transform duration-300 group-hover:rotate-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {isOpen && (
        <div className="flex h-[580px] w-[380px] sm:w-[400px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 py-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 text-white shadow-md shadow-violet-500/20">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 leading-tight">TechStore Agent</h3>
                <p className="text-[11px] text-slate-400">RAG Powered Assistant</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed shadow-sm transition-all ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-br-xs"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.timestamp && <span className="mt-1 px-1 text-[10px] text-slate-500">{m.timestamp}</span>}

                {/* Product Cards */}
                {m.products && m.products.length > 0 && (
                  <div className="mt-2 flex gap-3 overflow-x-auto max-w-full pb-2">
                    {m.products.map((p) => (
                      <div
                        key={p.id}
                        className="min-w-[150px] max-w-[150px] flex-shrink-0 rounded-xl border border-slate-800 bg-slate-900 p-2.5 shadow-sm"
                      >
                        <div className="h-24 w-full overflow-hidden rounded-lg bg-slate-800 flex items-center justify-center">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-slate-600 text-[10px]">No image</span>
                          )}
                        </div>
                        <p className="mt-2 text-[11.5px] font-medium leading-snug text-slate-200 line-clamp-2">
                          {p.name}
                        </p>
                        <p className="mt-1 text-[12.5px] font-semibold text-violet-400">
                          Rs {p.price.toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleAddToCart(p)}
                          disabled={loading}
                          className="mt-2 w-full rounded-lg bg-violet-600 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-40"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 bg-slate-900/60 border border-slate-800/60 w-max px-3.5 py-2 rounded-2xl rounded-bl-xs">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400"></span>
                </div>
                <span className="text-[12px]">Searching store...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="border-t border-slate-800/80 bg-slate-900/40 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 focus-within:border-violet-500/60 focus-within:ring-1 focus-within:ring-violet-500/30 transition-all">
              <input
                className="flex-1 bg-transparent py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about watches, prices..."
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white transition-all hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9-7-9-7-9 7 9 7zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="mt-2 text-center text-[10px] text-slate-600">Powered by AI Agent & RAG</div>
          </div>
        </div>
      )}
    </div>
  );
}