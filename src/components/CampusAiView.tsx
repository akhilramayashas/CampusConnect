import React, { useState } from 'react';
import { Brain, MapPin, Send } from 'lucide-react';
import type { ChatMessage, Facility } from '../types/campus';

interface CampusAiViewProps {
  token: string;
  facilities: Facility[];
  selectedFacilityId: string;
  onJumpToFacility: (facilityId: string) => void;
}

const STARTER_PROMPTS = [
  'Where can I find a quiet empty study room right now?',
  'How do I walk from Central Plaza to the Quantum & BioDome?',
  'Which lectures or public tours are happening today?',
  'Which building currently has the cleanest air and lowest occupancy?',
];

export const CampusAiView: React.FC<CampusAiViewProps> = ({
  token,
  facilities,
  selectedFacilityId,
  onJumpToFacility,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Ask me about building hours, empty rooms, skybridges, shuttles, or today’s lectures across Hokage School.',
      recommendedFacilityIds: ['quantum-biodome', 'aegis-library'],
      timestamp: 'Now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: trimmed,
          selectedFacilityId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Campus AI could not complete your request.');
        return;
      }

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        recommendedFacilityIds: data.recommendedFacilityIds ?? [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setError('Unable to reach Campus AI service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-8 pb-20 md:pb-8">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col bg-[#0e131f] border border-slate-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Campus AI Wayfinding Concierge</h1>
              <p className="text-xs text-slate-400">
                Grounded in live Hokage School building occupancy, rooms, and lecture schedules.
              </p>
            </div>
          </div>
        </div>

        {/* Starter Questions */}
        <div className="px-5 py-3 border-b border-slate-800 bg-[#090e1a]/50 flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendQuestion(prompt)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-[#161b28] hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Conversation Thread */}
        <div className="flex-1 overflow-y-auto custom-scroll p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-500 text-slate-950 font-medium'
                    : 'bg-[#161b28] border border-slate-800 text-slate-200'
                }`}
              >
                <p>{msg.content}</p>
                {msg.recommendedFacilityIds && msg.recommendedFacilityIds.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap gap-2">
                    {msg.recommendedFacilityIds.map((fid) => {
                      const fac = facilities.find((f) => f.id === fid);
                      if (!fac) return null;
                      return (
                        <button
                          key={fid}
                          type="button"
                          onClick={() => onJumpToFacility(fid)}
                          className="px-2.5 py-1 rounded-lg bg-[#0e131f] hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-[11px] font-medium inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <MapPin className="w-3 h-3" /> Open {fac.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="bg-[#161b28] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400">
                Checking Hokage School facilities and live room availability...
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs"
            >
              {error}
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="p-4 border-t border-slate-800 bg-[#090e1a]/60 flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about rooms, walking times, accessibility, or events..."
            className="flex-1 bg-[#161b28] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
