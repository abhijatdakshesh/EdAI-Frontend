"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { ChatMessage, ChatState } from './types';
import { STUDENT_SUGGESTIONS, PARENT_SUGGESTIONS, TEACHER_SUGGESTIONS, PUBLIC_SUGGESTIONS } from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

const MOCK_RESPONSES: Record<string, string> = {
  default: "You have 4 classes today. First class is DBMS at 9:00 AM in Room LH-101 with Prof. Kumar. Your overall attendance is 78% — you're doing well!",
  attendance: "Your attendance: DBMS 82% ✅, OS 74% ⚠️ (needs 3 more classes), DSA 91% ✅, MATHS 68% 🚨 (needs 8 more classes). Focus on Maths — you need 8 consecutive classes to reach 75%.",
  fee: "Your fee status: Total ₹85,000 — Paid ₹60,000 — Balance ₹25,000. Due date: 15th May 2026.",
  schedule: "Today's schedule: 9:00 AM DBMS (LH-101), 10:00 AM OS (LH-102), 11:00 AM Break, 11:55 AM DSA Lab (LAB-CS-A), 1:30 PM Maths (LH-201).",
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('attendance') || lower.includes('detained')) return MOCK_RESPONSES['attendance'] ?? '';
  if (lower.includes('fee') || lower.includes('paid')) return MOCK_RESPONSES['fee'] ?? '';
  if (lower.includes('schedule') || lower.includes('today') || lower.includes('class')) return MOCK_RESPONSES['schedule'] ?? '';
  return MOCK_RESPONSES['default'] ?? '';
}

const CONSENT_TEXT = "Ed8AI will use your academic data (attendance, marks, fees, schedule) to answer your questions. Data is processed securely. By continuing, you consent to this use under DPDP Act 2023.";

export default function ChatbotWidget() {
  const { data: session } = useSession();
  const [state, setState] = useState<ChatState>({
    conversationId: null,
    messages: [],
    isTyping: false,
    isOpen: false,
    isConnected: false,
    hasConsented: false,
    wsError: false,
  });
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<string>(
    typeof window !== 'undefined' ? (localStorage.getItem('ed8ai-chat-lang') ?? 'en') : 'en'
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const role = (session?.user as Record<string, string> | undefined)?.role ?? 'STUDENT';
  const suggestions = !session ? PUBLIC_SUGGESTIONS
    : role === 'TEACHER' || role === 'FACULTY' || role === 'HOD' ? TEACHER_SUGGESTIONS
    : role === 'PARENT' ? PARENT_SUGGESTIONS
    : STUDENT_SUGGESTIONS;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isTyping]);

  // Connect WebSocket when widget opens and user has consented (logged-in only).
  // Anonymous visitors skip WS entirely and use POST /chatbot/public/ask via REST.
  useEffect(() => {
    if (!state.isOpen || !state.hasConsented) return;
    if (!session) {
      // Public mode — no WS, no auth, no streaming. Mark "online" so status
      // doesn't read "○ Connecting...".
      setState(s => ({ ...s, isConnected: true }));
      return;
    }
    if (USE_MOCK) {
      setState(s => ({ ...s, isConnected: true }));
      return;
    }

    const token = (session as unknown as Record<string, string>).accessToken;
    let socket: any;

    import('socket.io-client').then(({ io }) => {
      socket = io(`${API_URL}/chat`, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 3,
      });

      socket.on('connect', () => setState(s => ({ ...s, isConnected: true })));
      socket.on('disconnect', () => setState(s => ({ ...s, isConnected: false })));

      socket.on('chat:typing', ({ conversationId }: { conversationId: string }) => {
        setState(s => ({ ...s, isTyping: true, conversationId }));
      });

      socket.on('chat:chunk', ({ conversationId, text }: { conversationId: string; text: string }) => {
        setState(s => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'assistant' && s.isTyping) {
            // Append to streaming message
            msgs[msgs.length - 1] = { ...last, content: last.content + text };
          } else {
            msgs.push({
              id: `${Date.now()}-stream`,
              role: 'assistant',
              content: text,
              timestamp: new Date().toISOString(),
            });
          }
          return { ...s, conversationId, messages: msgs };
        });
      });

      socket.on('chat:done', ({ conversationId }: { conversationId: string }) => {
        setState(s => ({ ...s, isTyping: false, conversationId }));
      });

      socket.io.on('reconnect_failed', () => {
        setState(s => ({ ...s, wsError: true }));
      });

      socket.on('chat:error', () => {
        setState(s => ({
          ...s,
          isTyping: false,
          messages: [...s.messages, {
            id: `${Date.now()}-err`,
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
            timestamp: new Date().toISOString(),
          }],
        }));
      });

      // Signal consent to backend
      if (state.conversationId) {
        socket.emit('chat:consent', { conversationId: state.conversationId });
      }

      socketRef.current = socket;
    });

    return () => { socket?.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isOpen, state.hasConsented, session]);

  const grantConsent = useCallback(() => {
    setState(s => ({ ...s, hasConsented: true }));
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setState(s => ({ ...s, messages: [...s.messages, userMsg], isTyping: true }));
    setInput('');

    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 1200));
      const response = getMockResponse(text);
      setState(s => ({
        ...s,
        isTyping: false,
        messages: [...s.messages, {
          id: `${Date.now()}-bot`,
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        }],
      }));
      return;
    }

    // Public (no session) path — call anonymous endpoint, no token, no conversationId
    if (!session) {
      try {
        const res = await fetch(`/api/chatbot/public/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json() as { message: string; timestamp: string };
        setState(s => ({
          ...s,
          isTyping: false,
          messages: [...s.messages, {
            id: `${Date.now()}-bot`,
            role: 'assistant',
            content: data.message,
            timestamp: data.timestamp,
          }],
        }));
      } catch {
        setState(s => ({
          ...s,
          isTyping: false,
          messages: [...s.messages, {
            id: `${Date.now()}-err`,
            role: 'assistant',
            content: 'Sorry, I could not reach the server. Please try again.',
            timestamp: new Date().toISOString(),
          }],
        }));
      }
      return;
    }

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('chat:message', { message: text, conversationId: state.conversationId, language });
    } else {
      // REST fallback
      try {
        // Relative URL — hits the Next.js /api/chatbot/message route which
        // wraps the access token via next-auth and proxies to the chatbot
        // service. Previously we called `${API_URL}/api/chatbot/message`
        // which pointed at the identity service and 404'd — the visible
        // symptom of KAN-22/33/36/39/43/44/47/50/53/60/64/70/71/76/79/86/88.
        const res = await fetch(`/api/chatbot/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, conversationId: state.conversationId }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json() as { conversationId: string; message: string; timestamp: string };
        setState(s => ({
          ...s,
          isTyping: false,
          conversationId: data.conversationId,
          messages: [...s.messages, {
            id: `${Date.now()}-bot`,
            role: 'assistant',
            content: data.message,
            timestamp: data.timestamp,
          }],
        }));
      } catch {
        // Auth REST failed (e.g. token invalid for newly-created users) —
        // fall back to the anonymous /chatbot/public/ask endpoint so the
        // user still gets a useful Gemini reply instead of an error.
        try {
          const pub = await fetch(`/api/chatbot/public/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
          });
          if (!pub.ok) throw new Error(`${pub.status}`);
          const data = await pub.json() as { message: string; timestamp: string };
          setState(s => ({
            ...s,
            isTyping: false,
            messages: [...s.messages, {
              id: `${Date.now()}-bot`,
              role: 'assistant',
              content: data.message,
              timestamp: data.timestamp,
            }],
          }));
        } catch {
          setState(s => ({
            ...s,
            isTyping: false,
            messages: [...s.messages, {
              id: `${Date.now()}-err`,
              role: 'assistant',
              content: 'Sorry, I could not reach the server. Please try again.',
              timestamp: new Date().toISOString(),
            }],
          }));
        }
      }
    }
  }, [session, state.conversationId, language]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const openChat = () => {
    setState(s => {
      if (s.messages.length === 0) {
        const greeting = !session
          ? "Welcome to RV College of Engineering! I can help with general college info — programs, departments, admissions, placements, and campus life. Log in for personal academic data."
          : role === 'TEACHER' || role === 'FACULTY'
          ? "Hello! I'm your Ed8AI assistant. Ask me about your schedule, at-risk students, or attendance data."
          : role === 'PARENT'
          ? "Namaste! I'm Ed8AI, your child's academic companion. Ask me anything about their progress."
          : "Hi! I'm Ed8AI, your personal academic assistant. Ask me about your classes, attendance, marks, or fees!";
        return {
          ...s,
          isOpen: true,
          messages: [{ id: 'greeting', role: 'assistant', content: greeting, timestamp: new Date().toISOString() }],
        };
      }
      return { ...s, isOpen: true };
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const showConsent = state.isOpen && !state.hasConsented;
  const showChat = state.isOpen && state.hasConsented;

  return (
    <>
      {/* Floating button */}
      {!state.isOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          title="Chat with Ed8AI"
          aria-label="Open Ed8AI chat"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white animate-pulse" />
        </button>
      )}

      {/* DPDP Consent modal */}
      {showConsent && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">AI</div>
            <p className="font-semibold text-sm">Ed8AI Assistant</p>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-4">{CONSENT_TEXT}</p>
          <div className="flex gap-2">
            <button
              onClick={grantConsent}
              className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              I Consent
            </button>
            <button
              onClick={() => setState(s => ({ ...s, isOpen: false }))}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chat window */}
      {showChat && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">AI</div>
              <div>
                <p className="font-semibold text-sm">Ed8AI Assistant</p>
                <p className="text-xs text-blue-200">
                  {state.isConnected || USE_MOCK ? '● Online' : state.wsError ? '● REST mode' : '○ Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={e => { setLanguage(e.target.value); localStorage.setItem('ed8ai-chat-lang', e.target.value); }}
                className="text-xs bg-white/20 text-white rounded px-1 py-0.5 border border-white/30 outline-none cursor-pointer"
                title="Response language"
              >
                <option value="en">EN</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
                <option value="te">తెలుగు</option>
              </select>
              <button
                onClick={() => setState(s => ({ ...s, isOpen: false }))}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Close chat"
              >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {state.messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {state.isTyping && state.messages[state.messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips — only on first message */}
          {state.messages.length <= 1 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <div className="flex gap-1 overflow-x-auto pb-1">
                {suggestions.slice(0, 3).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => void sendMessage(s)}
                    className="whitespace-nowrap text-xs bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-full px-3 py-1 transition-colors flex-shrink-0"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
                disabled={state.isTyping}
                aria-label="Chat message input"
              />
              <button
                onClick={() => void sendMessage(input)}
                disabled={!input.trim() || state.isTyping}
                className="text-blue-600 disabled:text-gray-300 transition-colors"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
