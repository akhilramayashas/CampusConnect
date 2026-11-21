import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  CalendarCheck,
  ChevronDown,
  LogOut,
  MapPin,
  Network,
  Search,
  UserCheck,
  X,
} from 'lucide-react';
import type {
  CampusTelemetry,
  CampusUser,
  Facility,
  NavSection,
  RoomBooking,
  UserRole,
} from '../types/campus';

interface TopBarProps {
  user: CampusUser;
  facilities: Facility[];
  telemetry: CampusTelemetry | null;
  bookmarksCount: number;
  bookings: RoomBooking[];
  onNavigate: (section: NavSection) => void;
  onSelectFacility: (facilityId: string) => void;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  facilities,
  telemetry,
  bookmarksCount,
  bookings,
  onNavigate,
  onSelectFacility,
  onSwitchRole,
  onLogout,
}) => {
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const profileWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      } else if (e.key === 'Escape') {
        setSearchFocused(false);
        setProfileOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (profileWrapRef.current && !profileWrapRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return facilities.slice(0, 5).map((f) => ({
        facilityId: f.id,
        title: f.name,
        subtitle: `${f.sector} · ${f.quad}`,
        kind: 'Facility',
      }));
    }
    const items: { facilityId: string; title: string; subtitle: string; kind: string }[] = [];
    for (const f of facilities) {
      if (
        f.name.toLowerCase().includes(q) ||
        f.sector.toLowerCase().includes(q) ||
        f.quad.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      ) {
        items.push({
          facilityId: f.id,
          title: f.name,
          subtitle: `${f.sector} · ${f.occupancyPercent}% occupied`,
          kind: 'Facility',
        });
      }
      for (const r of f.rooms) {
        if (r.name.toLowerCase().includes(q)) {
          items.push({
            facilityId: f.id,
            title: r.name,
            subtitle: `${f.name} · ${r.available ? 'Available Now' : `Next ${r.nextFreeSlot}`}`,
            kind: 'Room',
          });
        }
      }
      for (const ev of f.events) {
        if (ev.title.toLowerCase().includes(q) || ev.speaker.toLowerCase().includes(q)) {
          items.push({
            facilityId: f.id,
            title: ev.title,
            subtitle: `${f.name} · ${ev.time} · ${ev.room}`,
            kind: 'Event',
          });
        }
      }
    }
    return items.slice(0, 7);
  }, [facilities, query]);

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0e131f]/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-50">
      {/* Zone 1: Brand */}
      <button
        type="button"
        onClick={() => onNavigate('map')}
        className="flex items-center gap-3 text-left shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
          <Network className="w-4 h-4" />
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap">
            CampusConnect
            <span className="text-[10px] font-mono text-cyan-400">2036</span>
          </div>
          <p className="text-[11px] text-slate-400 whitespace-nowrap">Hokage School</p>
        </div>
      </button>

      {/* Zone 2: Live Search Bar */}
      <div ref={searchWrapRef} className="flex-1 max-w-xl relative">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchFocused(true);
            }}
            placeholder="Search campus facilities, rooms, or lectures..."
            aria-label="Search campus facilities, rooms, or lectures"
            className="w-full bg-[#161b28] border border-slate-800 text-xs rounded-lg pl-9 pr-16 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-11 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              searchInputRef.current?.focus();
              setSearchFocused(true);
            }}
            className="absolute right-2.5 text-[10px] font-mono text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded bg-slate-800 hover:text-white cursor-pointer"
          >
            ⌘K
          </button>
        </div>

        {searchFocused && (
          <div className="absolute left-0 right-0 mt-2 bg-[#0e131f] border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="px-3.5 py-2 border-b border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>{query ? 'Matching Campus Results' : 'Quick Jump Facilities'}</span>
              <span className="font-mono">{searchResults.length} shown</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center">
                No facilities, rooms, or lectures match &ldquo;{query}&rdquo;.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto custom-scroll divide-y divide-slate-800/70">
                {searchResults.map((item, idx) => (
                  <button
                    key={`${item.facilityId}-${idx}`}
                    type="button"
                    onClick={() => {
                      onSelectFacility(item.facilityId);
                      onNavigate('map');
                      setSearchFocused(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#161b28] transition flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-100 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 shrink-0">
                      {item.kind}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone 3: Telemetry + Role Switch + User Menu */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('live')}
          className="hidden xl:flex items-center gap-2.5 text-xs border-r border-slate-800 pr-4 text-slate-400 hover:text-slate-200 transition whitespace-nowrap cursor-pointer"
          title="Open Campus Live telemetry"
        >
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{telemetry?.campusName ?? 'Hokage School'}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums text-slate-200">
            {telemetry?.temperatureC ?? 21}°C
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400 tabular-nums">
            Air Purity {telemetry?.airPurityPercent ?? 98}%
          </span>
        </button>

        {/* Student / Visitor Segmented Switch */}
        <div
          className="flex items-center bg-[#161b28] p-1 rounded-lg border border-slate-800 text-xs font-medium shrink-0"
          role="group"
          aria-label="Campus access mode"
        >
          <button
            type="button"
            onClick={() => onSwitchRole('student')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
              user.role === 'student'
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => onSwitchRole('visitor')}
            className={`px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
              user.role === 'visitor'
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Visitor
          </button>
        </div>

        {/* User Profile Dropdown */}
        <div ref={profileWrapRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-[#161b28] transition cursor-pointer"
          >
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/40 bg-slate-800"
            />
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-200 whitespace-nowrap">
                {user.name}
              </div>
              <div className="text-[10px] font-mono text-cyan-400 whitespace-nowrap">
                {user.role === 'visitor' ? 'Visitor Pass' : user.department}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0e131f] border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-4 border-b border-slate-800">
                <div className="text-xs font-semibold text-white">{user.name}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</div>
                <div className="text-[11px] font-mono text-cyan-400 mt-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{user.role === 'student' ? 'Student Credentials Active' : 'Visitor Pass Active'}</span>
                </div>
              </div>
              <div className="p-2 space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('home');
                    setProfileOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-slate-300 hover:bg-[#161b28] flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5 text-cyan-400" /> Saved Buildings
                  </span>
                  <span className="font-mono tabular-nums text-slate-400">{bookmarksCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('home');
                    setProfileOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-slate-300 hover:bg-[#161b28] flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" /> Room Bookings
                  </span>
                  <span className="font-mono tabular-nums text-slate-400">{bookings.length}</span>
                </button>
                <div className="border-t border-slate-800 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 rounded-lg text-left text-rose-300 hover:bg-rose-950/50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out & Switch Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
