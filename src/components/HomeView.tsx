import React from 'react';
import {
  ArrowRight,
  Bookmark,
  CalendarCheck,
  Clock,
  Footprints,
  MapPin,
  Trash2,
} from 'lucide-react';
import type { CampusUser, Facility, RoomBooking } from '../types/campus';

interface HomeViewProps {
  user: CampusUser;
  facilities: Facility[];
  bookmarks: string[];
  rsvps: string[];
  bookings: RoomBooking[];
  onOpenFacilityOnMap: (facilityId: string) => void;
  onStartDirections: (facilityId: string) => void;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onToggleRsvp: (eventId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  facilities,
  bookmarks,
  rsvps,
  bookings,
  onOpenFacilityOnMap,
  onStartDirections,
  onCancelBooking,
  onToggleRsvp,
}) => {
  const bookmarkedFacilities = facilities.filter((f) => bookmarks.includes(f.id));
  const savedEvents = facilities.flatMap((f) =>
    f.events
      .filter((ev) => rsvps.includes(ev.id))
      .map((ev) => ({ ...ev, facilityId: f.id, facilityName: f.name }))
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scroll p-6 lg:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Hero Card */}
        <section className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#0e131f] min-h-[210px] flex items-end p-6 lg:p-8">
          <img
            src="/src/assets/images/campus_neoseoul_hero_1795251142305.jpg"
            alt="Hokage School twilight courtyard"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-45"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090e1a] via-[#090e1a]/80 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-mono text-cyan-400">
                {user.role === 'student' ? `Student Workspace · ${user.department}` : 'Visitor Pass Workspace'}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white [text-wrap:balance]">
                Welcome back, {user.name}
              </h1>
              <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
                Quick access to your saved Hokage School facilities, active room reservations, and upcoming lectures.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenFacilityOnMap('quantum-biodome')}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 self-start md:self-auto shrink-0 cursor-pointer"
            >
              <span>Open Explore Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Summary Metrics Row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0e131f] border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" /> Saved Buildings
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
              {bookmarkedFacilities.length}
            </div>
          </div>
          <div className="bg-[#0e131f] border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" /> Room Reservations
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
              {bookings.length}
            </div>
          </div>
          <div className="bg-[#0e131f] border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Scheduled Events
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
              {savedEvents.length}
            </div>
          </div>
        </section>

        {/* Saved Buildings & Active Reservations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookmarked Facilities */}
          <section className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Saved Campus Facilities</h2>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {bookmarkedFacilities.length} pinned
              </span>
            </div>

            {bookmarkedFacilities.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-[#161b28] rounded-xl border border-slate-800">
                No saved buildings yet. Bookmark any facility from Explore Map for fast wayfinding.
              </div>
            ) : (
              <div className="space-y-3">
                {bookmarkedFacilities.map((f) => (
                  <div
                    key={f.id}
                    className="bg-[#161b28] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{f.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {f.sector} · {f.occupancyPercent}% occupied · {f.airQualityPercent}% air
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onStartDirections(f.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        <Footprints className="w-3.5 h-3.5" /> Walk
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenFacilityOnMap(f.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Room Bookings */}
          <section className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Your Room Reservations</h2>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {bookings.length} active
              </span>
            </div>

            {bookings.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-[#161b28] rounded-xl border border-slate-800 space-y-3">
                <p>You have no active room reservations.</p>
                <button
                  type="button"
                  onClick={() => onOpenFacilityOnMap('quantum-biodome')}
                  className="px-3.5 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs cursor-pointer"
                >
                  Browse Available Rooms
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((bk) => (
                  <div
                    key={bk.id}
                    className="bg-[#161b28] border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{bk.roomName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {bk.facilityName} · {bk.slot} · {bk.purpose}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onStartDirections(bk.facilityId)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium cursor-pointer"
                      >
                        Route
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancelBooking(bk.id)}
                        aria-label={`Cancel reservation for ${bk.roomName}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Upcoming RSVPed Lectures */}
        <section className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Saved Lectures & Campus Events</h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {savedEvents.length} saved
            </span>
          </div>
          {savedEvents.length === 0 ? (
            <div className="p-5 text-xs text-slate-400 bg-[#161b28] rounded-xl border border-slate-800">
              RSVP to any lecture or tour from the Explore Map facility panel to track it here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-[#161b28] border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{ev.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {ev.time} · {ev.facilityName} · {ev.room}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onStartDirections(ev.facilityId)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 text-xs font-medium cursor-pointer"
                    >
                      Directions
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleRsvp(ev.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
