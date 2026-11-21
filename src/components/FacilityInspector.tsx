import React from 'react';
import {
  Bookmark,
  CheckCircle2,
  Clock,
  DoorOpen,
  Footprints,
  Navigation2,
  ShieldAlert,
} from 'lucide-react';
import type { ComputedRoute, Facility, UserRole } from '../types/campus';

interface FacilityInspectorProps {
  facility: Facility;
  facilities: Facility[];
  userRole: UserRole;
  isBookmarked: boolean;
  rsvps: string[];
  activeRoute: ComputedRoute | null;
  onSelectFacility: (facilityId: string) => void;
  onToggleBookmark: (facilityId: string) => void;
  onToggleRsvp: (eventId: string) => void;
  onGetDirections: (facilityId: string) => void;
  onOpenRoomFinder: () => void;
  onOpenFullPlanner: (destinationId: string) => void;
}

export const FacilityInspector: React.FC<FacilityInspectorProps> = ({
  facility,
  facilities,
  userRole,
  isBookmarked,
  rsvps,
  activeRoute,
  onSelectFacility,
  onToggleBookmark,
  onToggleRsvp,
  onGetDirections,
  onOpenRoomFinder,
  onOpenFullPlanner,
}) => {
  const availableRoomsCount = facility.rooms.filter(
    (r) => r.available && (userRole === 'student' || !r.studentOnly)
  ).length;

  const isRouteToHere = activeRoute?.destinationId === facility.id;

  return (
    <aside className="w-full lg:w-96 bg-[#0e131f] border-t lg:border-t-0 lg:border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto custom-scroll z-10 pb-20 md:pb-5">
      <div className="space-y-4">
        {/* Quick Facility Switcher & Status */}
        <div className="flex items-center justify-between gap-2">
          <select
            aria-label="Select campus facility"
            value={facility.id}
            onChange={(e) => onSelectFacility(e.target.value)}
            className="bg-[#161b28] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 max-w-[62%]"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono ${
                facility.status === 'Restricted Access' ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {facility.status}
            </span>
            <button
              type="button"
              onClick={() => onToggleBookmark(facility.id)}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark facility'}
              title={isBookmarked ? 'Saved to bookmarks' : 'Save facility'}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isBookmarked
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  : 'bg-[#161b28] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Facility Title & Location */}
        <div>
          <h1 className="text-lg font-bold text-white leading-snug">{facility.name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {facility.sector} · {facility.quad} · {facility.stories}F ({facility.heightMeters}m) · {facility.hours}
          </p>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-[#161b28] p-3.5 rounded-xl border border-slate-800">
          {facility.description}
        </p>

        {/* Visitor Access Notice when in Visitor Mode */}
        {userRole === 'visitor' && (
          <div className="bg-[#161b28] border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">{facility.visitorAccess}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Visitor mode active. Public halls and open tours are highlighted below.
              </div>
            </div>
          </div>
        )}

        {/* Occupancy & Air Quality Metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-[#161b28] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Occupancy</span>
            <strong className="text-cyan-400 text-sm tabular-nums mt-0.5 block">
              {facility.occupancyPercent}% ({facility.occupancyLabel})
            </strong>
          </div>
          <div className="bg-[#161b28] p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Air Quality</span>
            <strong className="text-emerald-400 text-sm tabular-nums mt-0.5 block">
              {facility.airQualityPercent}% Clean
            </strong>
          </div>
        </div>

        {/* Inline Active Route Steps */}
        {isRouteToHere && activeRoute && (
          <div className="bg-[#161b28] border border-cyan-500/30 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Navigation2 className="w-3.5 h-3.5" /> Route from {activeRoute.originName}
              </span>
              <button
                type="button"
                onClick={() => onOpenFullPlanner(facility.id)}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
              >
                Change Origin
              </button>
            </div>
            <ol className="space-y-2 text-[11px] text-slate-300">
              {activeRoute.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-mono tabular-nums text-cyan-400 shrink-0">0{i + 1}.</span>
                  <span>{step.instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Upcoming Lectures & Events */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Upcoming Lectures & Events</span>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {facility.events.length} scheduled
            </span>
          </div>
          <div className="space-y-2">
            {facility.events.map((ev) => {
              const isRsvped = rsvps.includes(ev.id);
              return (
                <div
                  key={ev.id}
                  className="bg-[#161b28] p-3 rounded-xl border border-slate-800 space-y-2"
                >
                  <div className="flex justify-between items-start gap-2 text-xs font-semibold text-white">
                    <span className="leading-snug">{ev.title}</span>
                    <span className="text-cyan-400 text-[11px] font-mono tabular-nums shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {ev.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-400 truncate">
                      {ev.room} · {ev.speaker}
                    </p>
                    <button
                      type="button"
                      onClick={() => onToggleRsvp(ev.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition shrink-0 flex items-center gap-1 cursor-pointer ${
                        isRsvped
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isRsvped ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Saved
                        </>
                      ) : (
                        'RSVP'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
        <button
          type="button"
          onClick={() => onGetDirections(facility.id)}
          className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Footprints className="w-4 h-4" />
          <span>
            {facility.walkMinutesFromPlaza === 0
              ? 'Show Route From BioDome'
              : `Get Walking Directions (${facility.walkMinutesFromPlaza} min)`}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenRoomFinder}
          className="w-full py-2.5 px-4 rounded-xl bg-[#161b28] hover:bg-slate-800 text-slate-200 font-medium text-xs border border-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <DoorOpen className="w-4 h-4 text-cyan-400" />
          <span>Find Empty Rooms Here ({availableRoomsCount} open)</span>
        </button>
      </div>
    </aside>
  );
};
