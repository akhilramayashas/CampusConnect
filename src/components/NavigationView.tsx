import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Bus,
  CheckCircle2,
  Footprints,
  Map as MapIcon,
  ShieldCheck,
} from 'lucide-react';
import type { ComputedRoute, Facility, TransportMode } from '../types/campus';

interface NavigationViewProps {
  facilities: Facility[];
  initialDestinationId?: string;
  onShowRouteOnMap: (route: ComputedRoute) => void;
}

export const NavigationView: React.FC<NavigationViewProps> = ({
  facilities,
  initialDestinationId,
  onShowRouteOnMap,
}) => {
  const [originId, setOriginId] = useState('central-plaza');
  const [destinationId, setDestinationId] = useState(
    initialDestinationId && initialDestinationId !== 'central-plaza'
      ? initialDestinationId
      : 'quantum-biodome'
  );
  const [mode, setMode] = useState<TransportMode>('walking');
  const [route, setRoute] = useState<ComputedRoute | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchRoute = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/route?origin=${encodeURIComponent(originId)}&destination=${encodeURIComponent(
            destinationId
          )}&mode=${encodeURIComponent(mode)}`
        );
        const data = await res.json();
        if (!cancelled && data.route) {
          setRoute(data.route);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRoute();
    return () => {
      cancelled = true;
    };
  }, [originId, destinationId, mode]);

  const handleSwap = () => {
    setOriginId(destinationId);
    setDestinationId(originId);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scroll p-6 lg:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Campus Wayfinding & Route Planner</h1>
          <p className="text-xs text-slate-400 mt-1">
            Compute walking paths, covered accessible skybridge routes, or autonomous shuttle loops between any two campus buildings.
          </p>
        </div>

        {/* Route Controls */}
        <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-end">
            <label className="md:col-span-5 block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Starting Point</span>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full bg-[#161b28] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.sector})
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap origin and destination"
                className="p-2.5 rounded-xl bg-[#161b28] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <label className="md:col-span-5 block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Destination Facility</span>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full bg-[#161b28] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.sector})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Transport Mode Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                { id: 'walking', label: 'Courtyard Walk', icon: Footprints },
                { id: 'skybridge', label: 'Covered Skybridge', icon: ShieldCheck },
                { id: 'shuttle', label: 'Autonomous Shuttle', icon: Bus },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const active = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={`py-2.5 px-3.5 rounded-xl border text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
                    active
                      ? 'bg-cyan-500 text-slate-950 border-cyan-500 font-semibold'
                      : 'bg-[#161b28] text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Route Summary & Turn-by-Turn */}
        {loading ? (
          <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
            Computing optimal campus path...
          </div>
        ) : route ? (
          <div className="bg-[#0e131f] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="space-y-1">
                <div className="text-xs text-slate-400">
                  {route.originName} → {route.destinationName}
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-2xl font-bold font-mono tabular-nums text-white">
                    {route.durationMinutes} min
                  </span>
                  <span className="text-sm font-mono tabular-nums text-cyan-400">
                    {route.distanceMeters} meters
                  </span>
                  {route.accessible && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Step-Free Accessible
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onShowRouteOnMap(route)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <MapIcon className="w-4 h-4" />
                <span>Show Route on Map</span>
              </button>
            </div>

            <ol className="space-y-3">
              {route.steps.map((step, idx) => (
                <li
                  key={idx}
                  className="bg-[#161b28] border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-400 font-mono tabular-nums text-xs font-semibold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-medium text-slate-100">{step.instruction}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Landmark: {step.landmark}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
                    {step.distanceMeters} m
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
};
