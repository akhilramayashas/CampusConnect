import React, { useMemo, useState } from 'react';
import {
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  Footprints,
  MapPin,
  Radio,
  RefreshCw,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import type { CampusEvent, CampusTelemetry, Facility } from '../types/campus';

interface CampusLiveViewProps {
  facilities: Facility[];
  telemetry: CampusTelemetry | null;
  rsvps: string[];
  onRefreshTelemetry: () => Promise<void>;
  onInspectFacility: (facilityId: string) => void;
  onGetDirections: (facilityId: string) => void;
  onToggleRsvp: (eventId: string) => void;
}

const EVENT_CATEGORIES: Array<'All' | CampusEvent['category']> = [
  'All',
  'Lecture',
  'Workshop',
  'Public Tour',
  'Symposium',
];

export const CampusLiveView: React.FC<CampusLiveViewProps> = ({
  facilities,
  telemetry,
  rsvps,
  onRefreshTelemetry,
  onInspectFacility,
  onGetDirections,
  onToggleRsvp,
}) => {
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [eventFilter, setEventFilter] = useState<'All' | CampusEvent['category']>('All');
  const [feedFilter, setFeedFilter] = useState<'All' | 'Shuttle' | 'Event' | 'Skybridge' | 'Facility'>('All');
  const [refreshing, setRefreshing] = useState(false);

  const sectors = useMemo(
    () => ['All', ...Array.from(new Set(facilities.map((f) => f.sector)))],
    [facilities]
  );

  const filteredFacilities = useMemo(() => {
    if (sectorFilter === 'All') return facilities;
    return facilities.filter((f) => f.sector === sectorFilter);
  }, [facilities, sectorFilter]);

  const allEvents = useMemo(() => {
    const items = facilities.flatMap((f) =>
      f.events.map((ev) => ({
        ...ev,
        facilityId: f.id,
        facilityName: f.name,
        sector: f.sector,
      }))
    );
    if (eventFilter === 'All') return items;
    return items.filter((e) => e.category === eventFilter);
  }, [facilities, eventFilter]);

  const filteredFeed = useMemo(() => {
    const feed = telemetry?.liveFeed ?? [];
    if (feedFilter === 'All') return feed;
    return feed.filter((item) => item.kind === feedFilter);
  }, [telemetry, feedFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefreshTelemetry();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scroll p-6 lg:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Hokage School Live Feed & Events</h1>
            <p className="text-xs text-slate-400 mt-1">
              Live streaming shuttle tracking, building occupancy, skybridge status, and today&apos;s campus events.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-[#161b28] hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition flex items-center gap-2 self-start cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {/* Top Environmental KPI Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0e131f] border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Outdoor Microclimate
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
              {telemetry?.temperatureC ?? 21}°C
            </div>
          </div>
          <div className="bg-[#0e131f] border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Wind className="w-3.5 h-3.5 text-emerald-400" /> Campus Air Purity
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-2">
              {telemetry?.airPurityPercent ?? 98}%
            </div>
          </div>
          <div className="bg-[#0e131f] border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Smart Grid Renewable
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-2">
              {telemetry?.smartGridGreenPercent ?? 99.8}%
            </div>
          </div>
          <div className="bg-[#0e131f] border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Bus className="w-3.5 h-3.5 text-cyan-400" /> Active Shuttles
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
              {telemetry?.activeShuttles ?? 3} Live
            </div>
          </div>
        </section>

        {/* Live Stream Feed + Autonomous Shuttles */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Real-Time Campus Feed */}
          <section className="lg:col-span-7 bg-[#0e131f] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Real-Time Campus Feed</span>
              </h2>
              <div className="flex flex-wrap gap-1 p-1 bg-[#161b28] rounded-xl border border-slate-800">
                {(['All', 'Shuttle', 'Event', 'Skybridge', 'Facility'] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setFeedFilter(kind)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                      feedFilter === kind
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scroll pr-1">
              {filteredFeed.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#161b28] border border-slate-800 rounded-xl p-3.5 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span
                        className={
                          item.kind === 'Shuttle'
                            ? 'text-emerald-400'
                            : item.kind === 'Event'
                            ? 'text-amber-400'
                            : item.kind === 'Skybridge'
                            ? 'text-violet-400'
                            : 'text-cyan-400'
                        }
                      >
                        {item.kind}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{item.sector}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400 tabular-nums">{item.timestamp}</span>
                    </div>
                    <div className="text-xs font-semibold text-white">{item.title}</div>
                    <p className="text-[11px] text-slate-400">{item.detail}</p>
                  </div>
                  {item.facilityId && (
                    <button
                      type="button"
                      onClick={() => onInspectFacility(item.facilityId!)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0e131f] hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] font-medium shrink-0 cursor-pointer"
                    >
                      Map
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Autonomous Loop Shuttles */}
          <section className="lg:col-span-5 bg-[#0e131f] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white">Live Shuttle Fleet</h2>
            <div className="space-y-3">
              {(telemetry?.shuttles ?? []).map((sh) => (
                <div
                  key={sh.id}
                  className="bg-[#161b28] border border-slate-800 rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-white">{sh.line}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Next stop: {sh.nextStop} · Load {sh.loadPercent}%
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold font-mono tabular-nums text-cyan-400">
                        {sh.etaMinutes} min
                      </div>
                      <div className="text-[11px] text-emerald-400">{sh.status}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                    <span className="font-mono text-slate-500 tabular-nums">
                      GPS {sh.coords[0].toFixed(4)}, {sh.coords[1].toFixed(4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onInspectFacility(sh.nextStopFacilityId)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                    >
                      Track Stop on Map
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* All Hokage School Events Directory */}
        <section className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Hokage School Events & Lectures</span>
            </h2>
            <div className="flex flex-wrap gap-1 p-1 bg-[#161b28] rounded-xl border border-slate-800">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setEventFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    eventFilter === cat
                      ? 'bg-cyan-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allEvents.map((ev) => {
              const isRsvped = rsvps.includes(ev.id);
              return (
                <div
                  key={ev.id}
                  className="bg-[#161b28] border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-amber-400">{ev.category}</span>
                      <span className="text-cyan-400 tabular-nums flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ev.time}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white">{ev.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {ev.facilityName} · {ev.room} · {ev.speaker}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => onToggleRsvp(ev.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                        isRsvped
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isRsvped ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                        </>
                      ) : (
                        'RSVP'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onGetDirections(ev.facilityId)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Footprints className="w-3.5 h-3.5" /> Directions
                    </button>
                    <button
                      type="button"
                      onClick={() => onInspectFacility(ev.facilityId)}
                      className="px-3 py-1.5 rounded-lg bg-[#0e131f] hover:bg-slate-800 text-slate-300 text-xs font-medium transition ml-auto cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sector Filter + Facility Live Occupancy Table */}
        <section className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white">Facility Occupancy & Environmental Feed</h2>
            <div className="flex flex-wrap gap-1 p-1 bg-[#161b28] rounded-xl border border-slate-800">
              {sectors.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSectorFilter(sec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    sectorFilter === sec
                      ? 'bg-cyan-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-medium">Facility</th>
                  <th className="py-2.5 px-3 font-medium">Sector</th>
                  <th className="py-2.5 px-3 font-medium">Occupancy</th>
                  <th className="py-2.5 px-3 font-medium text-right">Air Purity</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredFacilities.map((f) => {
                  const occ = telemetry?.occupancyOverrides?.[f.id] ?? f.occupancyPercent;
                  return (
                    <tr key={f.id} className="hover:bg-[#161b28]/60 transition">
                      <td className="py-3 px-3 font-semibold text-white">{f.name}</td>
                      <td className="py-3 px-3 text-slate-400">{f.sector}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                occ >= 75 ? 'bg-amber-400' : 'bg-cyan-400'
                              }`}
                              style={{ width: `${occ}%` }}
                            />
                          </div>
                          <span className="font-mono tabular-nums text-slate-200">{occ}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-400">
                        {f.airQualityPercent}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onInspectFacility(f.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#161b28] hover:bg-slate-800 border border-slate-700 text-cyan-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          <MapPin className="w-3 h-3" /> Map
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
