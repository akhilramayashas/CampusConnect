import React from 'react';
import { Brain, Home, Map, Radio, Route } from 'lucide-react';
import type { CampusTelemetry, NavSection } from '../types/campus';

interface SidebarProps {
  activeSection: NavSection;
  telemetry: CampusTelemetry | null;
  onNavigate: (section: NavSection) => void;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'map', label: 'Explore Map', icon: Map },
  { id: 'navigation', label: 'Navigation', icon: Route },
  { id: 'live', label: 'Campus Live', icon: Radio },
  { id: 'ai', label: 'Campus AI', icon: Brain },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, telemetry, onNavigate }) => {
  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-800 bg-[#0e131f] flex-col justify-between shrink-0">
        <nav className="p-4 space-y-1" aria-label="Primary campus navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 font-medium border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => onNavigate('live')}
          className="p-4 border-t border-slate-800 bg-[#090e1a]/60 hover:bg-[#161b28]/60 transition text-left cursor-pointer"
        >
          <div className="text-[11px] font-mono text-slate-400 mb-2">Campus Telemetry</div>
          <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Smart Grid</span>
              <span className="text-emerald-400 tabular-nums">
                {telemetry?.smartGridGreenPercent ?? 99.8}% Green
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Campus Density</span>
              <span className="text-cyan-400">{telemetry?.campusDensity ?? 'Optimal'}</span>
            </div>
          </div>
        </button>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e131f]/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 px-1 py-1"
        aria-label="Mobile campus navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
                active ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="truncate">{item.label.replace('Explore ', '')}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
