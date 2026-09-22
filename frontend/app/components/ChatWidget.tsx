"use client";

import { useState, useRef, useEffect } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category?: string;
  wc_id?: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  products?: Product[];
  cart_action?: { wc_id: number; quantity: number } | null;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hey there! Looking for something specific today? Tell me your budget or requirements!",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleWidgetState = (openState: boolean) => {
    setIsOpen(openState);
    if (typeof window !== "undefined") {
      window.parent.postMessage(openState ? "open-chat" : "close-chat", "*");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sendToAgent = async (messageText: string) => {
    const userMsg: Message = {
      role: "user",
      content: messageText,
      timestamp: getTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("https://rag-ai-agent-three.vercel.app/chat", {
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

if (data.cart_action?.wc_id) {
  window.open(
    `https://teststore.kllakar.pk/?add-to-cart=${data.cart_action.wc_id}&quantity=${data.cart_action.quantity}`,
    "_top"
  );
}
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Unable to connect to the assistant server. Please check backend status.",
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
    if (product.wc_id) {
      window.open(
        `https://teststore.kllakar.pk/?add-to-cart=${product.wc_id}`,
        "_top",
      );
    }
  };

  return (
    <div className="w-full h-full min-h-screen flex items-end justify-end p-2 font-sans text-sm antialiased select-none bg-transparent">
      {!isOpen ? (
        <button
          onClick={() => toggleWidgetState(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#6316FF] to-[#EA16B3] text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Open AI Assistant"
        >
          <svg
            className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12"
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
      ) : (
        <div className="flex h-full w-full max-h-[620px] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/95 text-slate-100 shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-slate-800/60 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#6316FF] to-[#EA16B3] text-white shadow-md">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950"></span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm leading-tight">
                  TechStore Agent
                </h3>
                <p className="text-[10px] text-slate-400 tracking-wide">
                  RAG Powered Assistant
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleWidgetState(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm transition-all ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-[#6316FF] to-[#EA16B3] text-white rounded-br-none"
                      : "bg-slate-900 border border-slate-800/80 text-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.timestamp && (
                  <span className="mt-1 px-1 text-[9.5px] text-slate-500">
                    {m.timestamp}
                  </span>
                )}

                {/* Product Recommendations Horizontal List */}
                {m.products && m.products.length > 0 && (
                  <div className="mt-2 flex gap-2.5 overflow-x-auto max-w-full pb-1">
                    {m.products.map((p) => (
                      <div
                        key={p.id}
                        className="min-w-[145px] max-w-[145px] flex-shrink-0 rounded-xl border border-slate-800 bg-slate-900/90 p-2.5 shadow-sm"
                      >
                        <div className="h-24 w-full overflow-hidden rounded-lg bg-slate-800/80 flex items-center justify-center">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-slate-500 text-[10px]">
                              No Image
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-[11px] font-medium leading-snug text-slate-200 line-clamp-2">
                          {p.name}
                        </p>
                        <p className="mt-1 text-[12px] font-semibold text-pink-400">
                          Rs {p.price.toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleAddToCart(p)}
                          disabled={loading}
                          className="mt-2 w-full rounded-lg bg-gradient-to-r from-[#6316FF] to-[#EA16B3] py-1.5 text-[10.5px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
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
              <div className="flex items-center gap-2 text-slate-400 bg-slate-900/80 border border-slate-800/80 w-max px-3.5 py-2 rounded-2xl rounded-bl-none">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-500 [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-500 [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-500"></span>
                </div>
                <span className="text-[11.5px] text-slate-400">
                  Searching store...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Section */}
          <div className="border-t border-slate-800/60 bg-slate-900/50 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1 focus-within:border-[#6316FF] transition-all">
              <input
                className="flex-1 bg-transparent py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about watches, prices..."
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-[#6316FF] to-[#EA16B3] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9-7-9-7-9 7 9 7zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-1.5 text-center text-[9.5px] text-slate-500">
              Powered by AI Agent &amp; RAG
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
