import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Box,
  Building2,
  Bus,
  Calendar,
  LocateFixed,
  Minus,
  Plus,
  Radio,
  Route as RouteIcon,
  Waypoints,
  X,
} from 'lucide-react';
import type {
  CampusTelemetry,
  ComputedRoute,
  Facility,
  SkybridgeLink,
} from '../types/campus';

interface CampusMapProps {
  facilities: Facility[];
  skybridges: SkybridgeLink[];
  telemetry: CampusTelemetry | null;
  selectedFacilityId: string;
  rsvps: string[];
  activeRoute: ComputedRoute | null;
  onSelectFacility: (facilityId: string) => void;
  onGetDirections: (facilityId: string) => void;
  onRouteViaSkybridge: (fromId: string, toId: string) => void;
  onOpenRoomFinder: (facilityId: string) => void;
  onToggleRsvp: (eventId: string) => void;
  onClearRoute: () => void;
}

const CATEGORIES: Array<'All' | Facility['category']> = [
  'All',
  'Research',
  'Study',
  'Transit',
  'Commons',
  'Wellness',
];

interface Palette3D {
  roof: string;
  sunlitWall: string;
  shadedWall: string;
  rim: string;
}

function getBuildingPalette(
  category: Facility['category'],
  isSelected: boolean,
  isRouteEndpoint: boolean
): Palette3D {
  if (isSelected) {
    return {
      roof: '#0ea5e9',
      sunlitWall: '#0284c7',
      shadedWall: '#0c4a6e',
      rim: '#7dd3fc',
    };
  }
  if (isRouteEndpoint) {
    return {
      roof: '#10b981',
      sunlitWall: '#059669',
      shadedWall: '#064e3b',
      rim: '#6ee7b7',
    };
  }
  switch (category) {
    case 'Research':
      return {
        roof: '#1e3a5f',
        sunlitWall: '#254b7a',
        shadedWall: '#102036',
        rim: '#38bdf8',
      };
    case 'Study':
      return {
        roof: '#233863',
        sunlitWall: '#2e4b85',
        shadedWall: '#131f3a',
        rim: '#60a5fa',
      };
    case 'Transit':
      return {
        roof: '#1b3b44',
        sunlitWall: '#265461',
        shadedWall: '#0f2329',
        rim: '#2dd4bf',
      };
    case 'Commons':
      return {
        roof: '#2d2d57',
        sunlitWall: '#3c3c73',
        shadedWall: '#181833',
        rim: '#a78bfa',
      };
    case 'Wellness':
      return {
        roof: '#183c36',
        sunlitWall: '#21544b',
        shadedWall: '#0d2420',
        rim: '#34d399',
      };
  }
}

function scalePolygonTowardsCenter(
  pts: [number, number][],
  factor: number
): [number, number][] {
  if (pts.length === 0) return pts;
  const avgLat = pts.reduce((acc, p) => acc + p[0], 0) / pts.length;
  const avgLng = pts.reduce((acc, p) => acc + p[1], 0) / pts.length;
  return pts.map(([lat, lng]) => [
    avgLat + (lat - avgLat) * factor,
    avgLng + (lng - avgLng) * factor,
  ]);
}

function shiftLatLngsByPixels(
  map: L.Map,
  coords: [number, number][],
  dx: number,
  dy: number
): [number, number][] {
  return coords.map(([lat, lng]) => {
    const pt = map.latLngToLayerPoint(L.latLng(lat, lng));
    const shifted = map.layerPointToLatLng(L.point(pt.x + dx, pt.y + dy));
    return [shifted.lat, shifted.lng];
  });
}

function shiftSinglePointByPixels(
  map: L.Map,
  coord: [number, number],
  dx: number,
  dy: number
): [number, number] {
  const pt = map.latLngToLayerPoint(L.latLng(coord[0], coord[1]));
  const shifted = map.layerPointToLatLng(L.point(pt.x + dx, pt.y + dy));
  return [shifted.lat, shifted.lng];
}

export const CampusMap: React.FC<CampusMapProps> = ({
  facilities,
  skybridges,
  telemetry,
  selectedFacilityId,
  rsvps,
  activeRoute,
  onSelectFacility,
  onGetDirections,
  onRouteViaSkybridge,
  onOpenRoomFinder,
  onToggleRsvp,
  onClearRoute,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const buildingsLayerRef = useRef<L.LayerGroup | null>(null);
  const skybridgesLayerRef = useRef<L.LayerGroup | null>(null);
  const shuttlesLayerRef = useRef<L.LayerGroup | null>(null);
  const eventsLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapZoom, setMapZoom] = useState(16);
  const [is3D, setIs3D] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'All' | Facility['category']>('All');
  const [showBuildings, setShowBuildings] = useState(true);
  const [showSkybridges, setShowSkybridges] = useState(true);
  const [showShuttles, setShowShuttles] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [liveFeedOpen, setLiveFeedOpen] = useState(false);

  const callbacksRef = useRef({
    onSelectFacility,
    onGetDirections,
    onRouteViaSkybridge,
    onOpenRoomFinder,
    onToggleRsvp,
  });
  callbacksRef.current = {
    onSelectFacility,
    onGetDirections,
    onRouteViaSkybridge,
    onOpenRoomFinder,
    onToggleRsvp,
  };

  const visibleFacilities = useMemo(() => {
    if (categoryFilter === 'All') return facilities;
    return facilities.filter((f) => f.category === categoryFilter);
  }, [facilities, categoryFilter]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([37.5662, 126.9776], 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);

    skybridgesLayerRef.current = L.layerGroup().addTo(map);
    buildingsLayerRef.current = L.layerGroup().addTo(map);
    shuttlesLayerRef.current = L.layerGroup().addTo(map);
    eventsLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const syncZoom = () => {
      setMapZoom(map.getZoom());
    };
    map.on('zoomend', syncZoom);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      map.off('zoomend', syncZoom);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render 3D Extruded Buildings (or 2D Plan when toggled)
  useEffect(() => {
    const map = mapRef.current;
    const layer = buildingsLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showBuildings) return;

    const zoomScale = Math.pow(2, (mapZoom - 16) * 0.85);

    // Painter's algorithm: draw northern buildings first, southern buildings on top
    const depthSorted = [...visibleFacilities].sort(
      (a, b) => b.coords[0] - a.coords[0]
    );

    depthSorted.forEach((facility) => {
      const isSelected = facility.id === selectedFacilityId;
      const isRouteEndpoint =
        activeRoute &&
        (activeRoute.originId === facility.id || activeRoute.destinationId === facility.id);

      const liveOccupancy =
        telemetry?.occupancyOverrides?.[facility.id] ?? facility.occupancyPercent;
      const openRooms = facility.rooms.filter((r) => r.available).length;
      const palette = getBuildingPalette(
        facility.category,
        isSelected,
        Boolean(isRouteEndpoint)
      );

      const buildPopupNode = () => {
        const root = document.createElement('div');
        root.className = 'min-w-[220px] space-y-2 text-xs text-slate-200';

        const header = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'font-bold text-white text-sm';
        title.textContent = facility.name;
        const meta = document.createElement('div');
        meta.className = 'text-[11px] text-slate-400';
        meta.textContent = `${facility.sector} · ${facility.stories}F (${facility.heightMeters}m)`;
        header.appendChild(title);
        header.appendChild(meta);

        const stats = document.createElement('div');
        stats.className =
          'grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono border-t border-slate-800';
        const occ = document.createElement('div');
        occ.innerHTML = `<span class="text-slate-400 block">Occupancy</span><span class="text-cyan-400 font-semibold">${liveOccupancy}%</span>`;
        const rms = document.createElement('div');
        rms.innerHTML = `<span class="text-slate-400 block">Open Rooms</span><span class="text-emerald-400 font-semibold">${openRooms} open</span>`;
        stats.appendChild(occ);
        stats.appendChild(rms);

        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-1.5 pt-1';

        const walkBtn = document.createElement('button');
        walkBtn.type = 'button';
        walkBtn.className =
          'flex-1 px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-[11px] cursor-pointer';
        walkBtn.textContent = 'Walk Here';
        walkBtn.onclick = () => {
          callbacksRef.current.onGetDirections(facility.id);
          map.closePopup();
        };

        const roomsBtn = document.createElement('button');
        roomsBtn.type = 'button';
        roomsBtn.className =
          'flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-[11px] cursor-pointer';
        roomsBtn.textContent = 'Find Rooms';
        roomsBtn.onclick = () => {
          callbacksRef.current.onSelectFacility(facility.id);
          callbacksRef.current.onOpenRoomFinder(facility.id);
          map.closePopup();
        };

        actions.appendChild(walkBtn);
        actions.appendChild(roomsBtn);

        root.appendChild(header);
        root.appendChild(stats);
        root.appendChild(actions);
        return root;
      };

      const baseFootprint = facility.footprint;
      const pxHeight = is3D
        ? Math.max(12, Math.min(72, facility.heightMeters * 1.45 * zoomScale))
        : 0;
      const dx = pxHeight * 0.38;
      const dy = -pxHeight * 0.92;

      if (is3D && pxHeight > 0) {
        // 1. Ground Cast Shadow (shifted southeast)
        const shadowFootprint = shiftLatLngsByPixels(
          map,
          baseFootprint,
          pxHeight * 0.52,
          pxHeight * 0.24
        );
        L.polygon(shadowFootprint, {
          stroke: false,
          fillColor: '#020617',
          fillOpacity: 0.56,
          interactive: false,
        }).addTo(layer);

        // 2. Ground Base Outline
        L.polygon(baseFootprint, {
          color: '#0f172a',
          weight: 1,
          fillColor: '#090e1a',
          fillOpacity: 0.5,
          interactive: false,
        }).addTo(layer);

        // 3. Compute Roof Polygon shifted in 3D isometric screen space
        const roofFootprint = shiftLatLngsByPixels(map, baseFootprint, dx, dy);

        // 4. Build & Depth-Sort Side Wall Faces
        const wallFaces: {
          midLat: number;
          coords: [number, number][];
          isSunlit: boolean;
        }[] = [];

        for (let i = 0; i < baseFootprint.length; i++) {
          const next = (i + 1) % baseFootprint.length;
          const b1 = baseFootprint[i];
          const b2 = baseFootprint[next];
          const r2 = roofFootprint[next];
          const r1 = roofFootprint[i];

          // Screen-space edge normal to determine sunlit vs shaded wall
          const p1 = map.latLngToLayerPoint(L.latLng(b1[0], b1[1]));
          const p2 = map.latLngToLayerPoint(L.latLng(b2[0], b2[1]));
          const ex = p2.x - p1.x;
          const ey = p2.y - p1.y;
          // Outward normal (assuming clockwise winding in screen space)
          const nx = ey;
          const ny = -ex;
          const lightDot = nx * -0.92 + ny * -0.38;

          wallFaces.push({
            midLat: (b1[0] + b2[0]) / 2,
            coords: [b1, b2, r2, r1],
            isSunlit: lightDot >= 0,
          });
        }

        // Draw back walls before front walls
        wallFaces.sort((w1, w2) => w2.midLat - w1.midLat);

        wallFaces.forEach((wall) => {
          const wallPoly = L.polygon(wall.coords, {
            color: palette.rim,
            weight: isSelected ? 1.2 : 0.75,
            opacity: isSelected ? 0.8 : 0.45,
            fillColor: wall.isSunlit ? palette.sunlitWall : palette.shadedWall,
            fillOpacity: 0.92,
          });
          wallPoly.bindTooltip(
            `${facility.name} · ${facility.stories}F · ${liveOccupancy}% occupied`,
            { direction: 'top', sticky: true }
          );
          wallPoly.bindPopup(buildPopupNode);
          wallPoly.on('click', () => {
            callbacksRef.current.onSelectFacility(facility.id);
          });
          wallPoly.addTo(layer);
        });

        // 5. Roof Cap
        const roofPoly = L.polygon(roofFootprint, {
          color: palette.rim,
          weight: isSelected ? 2.5 : 1.5,
          opacity: 0.95,
          fillColor: palette.roof,
          fillOpacity: isSelected ? 0.9 : 0.84,
        });
        roofPoly.bindTooltip(
          `${facility.name} · ${facility.stories}F · ${liveOccupancy}% occupied`,
          { direction: 'top', sticky: true }
        );
        roofPoly.bindPopup(buildPopupNode);
        roofPoly.on('click', () => {
          callbacksRef.current.onSelectFacility(facility.id);
        });
        roofPoly.addTo(layer);

        // 6. Architectural Roof Skylight / Geodesic Crown
        const insetRoof = scalePolygonTowardsCenter(roofFootprint, 0.56);
        L.polygon(insetRoof, {
          color: palette.rim,
          weight: 1,
          opacity: 0.45,
          fillColor: '#e0f2fe',
          fillOpacity: isSelected ? 0.2 : 0.08,
          interactive: false,
        }).addTo(layer);

        const roofCenter = shiftSinglePointByPixels(map, facility.coords, dx, dy);

        if (facility.id === 'quantum-biodome') {
          L.circleMarker(roofCenter, {
            radius: Math.max(6, 10 * zoomScale),
            color: '#7dd3fc',
            weight: 1.2,
            opacity: 0.65,
            fillColor: '#38bdf8',
            fillOpacity: 0.22,
            interactive: false,
          }).addTo(layer);
        }

        // Elevated Roof Anchor Pin + Selection Halo
        if (isSelected) {
          L.circleMarker(roofCenter, {
            radius: 17,
            color: '#38bdf8',
            weight: 1.2,
            opacity: 0.5,
            fillColor: '#38bdf8',
            fillOpacity: 0.14,
            interactive: false,
          }).addTo(layer);
        }

        const roofPin = L.circleMarker(roofCenter, {
          radius: isSelected ? 6.5 : 4.5,
          color: '#f8fafc',
          weight: 1.5,
          fillColor: isSelected ? '#38bdf8' : isRouteEndpoint ? '#10b981' : palette.rim,
          fillOpacity: 1,
        });
        roofPin.bindPopup(buildPopupNode);
        roofPin.on('click', () => {
          callbacksRef.current.onSelectFacility(facility.id);
        });
        roofPin.addTo(layer);

        // Compact Elevated Building Label
        const shortLabel = facility.name.split(' & ')[0].split(' · ')[0];
        const labelIcon = L.divIcon({
          className: 'hokage-building-label',
          html: `<div style="background:rgba(9,14,26,0.82);border:1px solid ${
            isSelected ? '#38bdf8' : 'rgba(148,163,184,0.35)'
          };color:${
            isSelected ? '#7dd3fc' : '#e2e8f0'
          };padding:1px 6px;border-radius:5px;font-size:10px;font-weight:600;white-space:nowrap;backdrop-filter:blur(4px);box-shadow:0 2px 8px rgba(0,0,0,0.45);transform:translate(-50%,-150%);">${shortLabel}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        L.marker(roofCenter, { icon: labelIcon, interactive: false }).addTo(layer);
      } else {
        // 2D Flat Architectural Footprint Mode
        const footprint = L.polygon(baseFootprint, {
          color: isSelected ? '#38bdf8' : isRouteEndpoint ? '#10b981' : '#475569',
          weight: isSelected ? 2.5 : 1.5,
          fillColor: isSelected ? '#0ea5e9' : isRouteEndpoint ? '#10b981' : '#1e293b',
          fillOpacity: isSelected ? 0.42 : 0.3,
        });
        footprint.bindTooltip(`${facility.name} · ${liveOccupancy}% occupied`, {
          direction: 'top',
          sticky: true,
        });
        footprint.bindPopup(buildPopupNode);
        footprint.on('click', () => {
          callbacksRef.current.onSelectFacility(facility.id);
        });
        footprint.addTo(layer);

        const marker = L.circleMarker(facility.coords, {
          radius: isSelected ? 8 : 6,
          color: isSelected ? '#e0f2fe' : isRouteEndpoint ? '#10b981' : '#38bdf8',
          weight: isSelected ? 2.5 : 1.5,
          fillColor: isSelected ? '#38bdf8' : isRouteEndpoint ? '#10b981' : '#0f172a',
          fillOpacity: 1,
        });
        marker.bindPopup(buildPopupNode);
        marker.on('click', () => {
          callbacksRef.current.onSelectFacility(facility.id);
        });
        marker.addTo(layer);
      }
    });
  }, [visibleFacilities, selectedFacilityId, activeRoute, showBuildings, telemetry, is3D, mapZoom]);

  // Render 3D Elevated Skybridges Layer
  useEffect(() => {
    const map = mapRef.current;
    const layer = skybridgesLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showSkybridges) return;

    const zoomScale = Math.pow(2, (mapZoom - 16) * 0.85);
    const elevationPx = is3D ? 18 * zoomScale : 0;
    const dx = elevationPx * 0.38;
    const dy = -elevationPx * 0.92;

    skybridges.forEach((sb) => {
      if (is3D) {
        // Ground-level shadow underneath the elevated skybridge
        L.polyline(sb.path, {
          color: '#020617',
          weight: 5,
          opacity: 0.45,
          interactive: false,
        }).addTo(layer);
      }

      const elevatedPath = is3D
        ? shiftLatLngsByPixels(map, sb.path, dx, dy)
        : sb.path;

      const span = L.polyline(elevatedPath, {
        color: '#a78bfa',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 5',
      });

      const buildSkybridgePopup = () => {
        const root = document.createElement('div');
        root.className = 'min-w-[205px] space-y-2 text-xs text-slate-200';
        const title = document.createElement('div');
        title.className = 'font-bold text-violet-300';
        title.textContent = sb.name;
        const detail = document.createElement('div');
        detail.className = 'text-[11px] text-slate-400';
        detail.textContent = `${sb.level} · ${sb.accessible ? 'Step-Free Elevator' : 'Stairs'} · ${sb.status}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
          'w-full mt-1 px-2.5 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-slate-950 font-semibold text-[11px] cursor-pointer';
        btn.textContent = 'Route via this Skybridge';
        btn.onclick = () => {
          callbacksRef.current.onRouteViaSkybridge(sb.fromId, sb.toId);
          map.closePopup();
        };
        root.appendChild(title);
        root.appendChild(detail);
        root.appendChild(btn);
        return root;
      };

      span.bindTooltip(`${sb.name} (${sb.level})`, { sticky: true });
      span.bindPopup(buildSkybridgePopup);
      span.addTo(layer);

      const midPoint = elevatedPath[Math.floor(elevatedPath.length / 2)];
      const node = L.circleMarker(midPoint, {
        radius: 5,
        color: '#ddd6fe',
        weight: 1.5,
        fillColor: '#8b5cf6',
        fillOpacity: 0.95,
      });
      node.bindTooltip(sb.name);
      node.bindPopup(buildSkybridgePopup);
      node.addTo(layer);
    });
  }, [skybridges, showSkybridges, is3D, mapZoom]);

  // Render Autonomous Shuttles & Perimeter Loop Layer
  useEffect(() => {
    const map = mapRef.current;
    const layer = shuttlesLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showShuttles || !telemetry) return;

    if (telemetry.shuttleLoopPath?.length > 1) {
      L.polyline(telemetry.shuttleLoopPath, {
        color: '#10b981',
        weight: 2.5,
        opacity: 0.55,
        dashArray: '3, 7',
      })
        .bindTooltip('Hokage School Autonomous Shuttle Loop', { sticky: true })
        .addTo(layer);
    }

    telemetry.shuttles.forEach((sh) => {
      const icon = L.divIcon({
        className: 'hokage-shuttle-icon',
        html: `<div style="display:flex;align-items:center;gap:4px;background:#064e3b;border:1.5px solid #34d399;color:#ecfdf5;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:700;font-family:'JetBrains Mono',monospace;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.5);"><span>BUS</span><span>${sh.etaMinutes}m</span></div>`,
        iconSize: [58, 22],
        iconAnchor: [29, 11],
      });

      const marker = L.marker(sh.coords, { icon });
      marker.bindPopup(() => {
        const root = document.createElement('div');
        root.className = 'min-w-[205px] space-y-2 text-xs text-slate-200';
        const title = document.createElement('div');
        title.className = 'font-bold text-emerald-300';
        title.textContent = sh.line;
        const info = document.createElement('div');
        info.className = 'text-[11px] text-slate-300 space-y-0.5';
        info.innerHTML = `<div>Next Stop: <strong>${sh.nextStop}</strong></div><div>ETA: <span class="font-mono text-emerald-400">${sh.etaMinutes} min</span> · Load: <span class="font-mono">${sh.loadPercent}%</span></div><div>Status: ${sh.status}</div>`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
          'w-full mt-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-[11px] cursor-pointer';
        btn.textContent = `Inspect ${sh.nextStop}`;
        btn.onclick = () => {
          callbacksRef.current.onSelectFacility(sh.nextStopFacilityId);
          map.closePopup();
        };
        root.appendChild(title);
        root.appendChild(info);
        root.appendChild(btn);
        return root;
      });
      marker.addTo(layer);
    });
  }, [telemetry, showShuttles]);

  // Render Campus Events Layer (elevated atop building roofs in 3D mode)
  useEffect(() => {
    const map = mapRef.current;
    const layer = eventsLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (!showEvents) return;

    const zoomScale = Math.pow(2, (mapZoom - 16) * 0.85);

    visibleFacilities.forEach((facility) => {
      if (facility.events.length === 0) return;
      const ev = facility.events[0];
      const isRsvped = rsvps.includes(ev.id);

      const pxHeight = is3D
        ? Math.max(12, Math.min(72, facility.heightMeters * 1.45 * zoomScale))
        : 0;
      const dx = pxHeight * 0.38 + 20;
      const dy = -pxHeight * 0.92 + 6;
      const pinCoords = is3D
        ? shiftSinglePointByPixels(map, facility.coords, dx, dy)
        : ([facility.coords[0] + 0.00024, facility.coords[1] + 0.00032] as [number, number]);

      const icon = L.divIcon({
        className: 'hokage-event-icon',
        html: `<div style="background:${
          isRsvped ? '#0c4a6e' : '#451a03'
        };border:1.5px solid ${
          isRsvped ? '#38bdf8' : '#fbbf24'
        };color:#f8fafc;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:600;font-family:'JetBrains Mono',monospace;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.45);">${ev.time}</div>`,
        iconSize: [48, 20],
        iconAnchor: [24, 10],
      });

      const marker = L.marker(pinCoords, { icon });
      marker.bindTooltip(`${ev.title} (${facility.name})`, { direction: 'top' });
      marker.bindPopup(() => {
        const root = document.createElement('div');
        root.className = 'min-w-[220px] space-y-2 text-xs text-slate-200';
        const title = document.createElement('div');
        title.className = 'font-bold text-amber-300';
        title.textContent = ev.title;
        const meta = document.createElement('div');
        meta.className = 'text-[11px] text-slate-300';
        meta.textContent = `${ev.time} · ${facility.name} · ${ev.room}`;
        const speaker = document.createElement('div');
        speaker.className = 'text-[11px] text-slate-400';
        speaker.textContent = `${ev.category} · ${ev.speaker}`;

        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-1.5 pt-1';

        const rsvpBtn = document.createElement('button');
        rsvpBtn.type = 'button';
        rsvpBtn.className = isRsvped
          ? 'flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-[11px] cursor-pointer'
          : 'flex-1 px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-[11px] cursor-pointer';
        rsvpBtn.textContent = isRsvped ? 'Saved' : 'RSVP';
        rsvpBtn.onclick = () => {
          callbacksRef.current.onToggleRsvp(ev.id);
          map.closePopup();
        };

        const goBtn = document.createElement('button');
        goBtn.type = 'button';
        goBtn.className =
          'flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-[11px] cursor-pointer';
        goBtn.textContent = 'Walk Here';
        goBtn.onclick = () => {
          callbacksRef.current.onGetDirections(facility.id);
          map.closePopup();
        };

        actions.appendChild(rsvpBtn);
        actions.appendChild(goBtn);
        root.appendChild(title);
        root.appendChild(meta);
        root.appendChild(speaker);
        root.appendChild(actions);
        return root;
      });
      marker.addTo(layer);
    });
  }, [visibleFacilities, showEvents, rsvps, is3D, mapZoom]);

  // Pan to selected facility when no route overrides camera
  useEffect(() => {
    const map = mapRef.current;
    if (!map || activeRoute) return;
    const selected = facilities.find((f) => f.id === selectedFacilityId);
    if (selected) {
      map.panTo(selected.coords, { animate: true, duration: 0.45 });
    }
  }, [selectedFacilityId, facilities, activeRoute]);

  // Render Active Computed Route
  useEffect(() => {
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    routeLayer.clearLayers();
    if (!activeRoute || activeRoute.path.length === 0) return;

    const lineColor =
      activeRoute.mode === 'shuttle'
        ? '#10b981'
        : activeRoute.mode === 'skybridge'
        ? '#a78bfa'
        : '#38bdf8';

    const zoomScale = Math.pow(2, (mapZoom - 16) * 0.85);
    const elevationPx = is3D && activeRoute.mode === 'skybridge' ? 18 * zoomScale : 0;
    const routePath =
      elevationPx > 0
        ? shiftLatLngsByPixels(map, activeRoute.path, elevationPx * 0.38, -elevationPx * 0.92)
        : activeRoute.path;

    const polyline = L.polyline(routePath, {
      color: lineColor,
      weight: 5,
      opacity: 0.95,
      dashArray: activeRoute.mode === 'walking' ? '8, 8' : undefined,
    }).addTo(routeLayer);

    if (routePath.length > 1) {
      map.fitBounds(polyline.getBounds(), { padding: [70, 70], maxZoom: 17 });
    } else {
      map.setView(routePath[0], 17);
    }
  }, [activeRoute, is3D, mapZoom]);

  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;
    const target = facilities.find((f) => f.id === selectedFacilityId);
    map.setView(target ? target.coords : [37.5662, 126.9776], 16, { animate: true });
  };

  return (
    <div className="relative flex-1 h-[400px] lg:h-full w-full overflow-hidden">
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Top Overlay: Category Filters + Layer Toggles + 3D Toggle */}
      <div className="absolute top-4 left-4 right-16 z-[400] flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#0e131f]/90 backdrop-blur-md border border-slate-800 pointer-events-auto shadow-lg">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Interactive Map Layer Switchers */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#0e131f]/90 backdrop-blur-md border border-slate-800 pointer-events-auto shadow-lg">
          <button
            type="button"
            onClick={() => setIs3D((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              is3D
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
            title="Toggle 3D extruded buildings and elevated skybridges"
          >
            <Box className="w-3.5 h-3.5" /> {is3D ? '3D Extrusions' : '2D Plan'}
          </button>
          <button
            type="button"
            onClick={() => setShowBuildings((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              showBuildings
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Buildings
          </button>
          <button
            type="button"
            onClick={() => setShowSkybridges((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              showSkybridges
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Waypoints className="w-3.5 h-3.5" /> Skybridges
          </button>
          <button
            type="button"
            onClick={() => setShowShuttles((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              showShuttles
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Bus className="w-3.5 h-3.5" /> Shuttles
          </button>
          <button
            type="button"
            onClick={() => setShowEvents((v) => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              showEvents
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Events
          </button>
        </div>
      </div>

      {/* Custom Map Zoom, Recenter & Live Feed Toggle */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-1.5 bg-[#0e131f]/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-lg">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="border-t border-slate-800" />
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter on selected facility"
          title="Recenter on selected facility"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-cyan-400 hover:bg-slate-800 transition cursor-pointer"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
        <div className="border-t border-slate-800" />
        <button
          type="button"
          onClick={() => setLiveFeedOpen((v) => !v)}
          aria-label="Toggle live campus feed"
          title="Toggle live campus feed"
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
            liveFeedOpen
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'text-emerald-400 hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
        </button>
      </div>

      {/* Live Map Feed Drawer */}
      {liveFeedOpen && telemetry && (
        <div className="absolute top-20 right-4 z-[400] w-80 max-w-[calc(100%-2rem)] bg-[#0e131f]/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hokage School Live Feed</span>
            </div>
            <button
              type="button"
              onClick={() => setLiveFeedOpen(false)}
              aria-label="Close live feed"
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto custom-scroll divide-y divide-slate-800/70">
            {telemetry.liveFeed.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.facilityId) {
                    onSelectFacility(item.facilityId);
                  }
                }}
                className="w-full p-3 text-left hover:bg-[#161b28] transition space-y-1 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
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
                    {item.kind} · {item.sector}
                  </span>
                  <span className="text-slate-500">{item.timestamp}</span>
                </div>
                <div className="text-xs font-semibold text-white">{item.title}</div>
                <div className="text-[11px] text-slate-400">{item.detail}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Legend + Live Feed Quick Button */}
      {!activeRoute && (
        <div className="absolute bottom-4 left-4 z-[400] hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl bg-[#0e131f]/90 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 shadow-lg">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/60 border border-cyan-400" />
            {is3D ? '3D Buildings' : 'Buildings'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-violet-400" />
            Skybridges
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Live Shuttles
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            Events
          </span>
          <button
            type="button"
            onClick={() => setLiveFeedOpen((v) => !v)}
            className="ml-1 pl-2.5 border-l border-slate-700 text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            {liveFeedOpen ? 'Hide Live Feed' : 'Live Feed'}
          </button>
        </div>
      )}

      {/* Active Route Floating Banner */}
      {activeRoute && (
        <div className="absolute bottom-4 left-4 right-4 lg:right-auto lg:max-w-md z-[400] bg-[#0e131f]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3.5 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
              <RouteIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {activeRoute.originName} → {activeRoute.destinationName}
              </div>
              <div className="text-[11px] font-mono tabular-nums text-cyan-400 mt-0.5">
                {activeRoute.durationMinutes} min · {activeRoute.distanceMeters} m ·{' '}
                {activeRoute.mode === 'skybridge'
                  ? 'Skybridge'
                  : activeRoute.mode === 'shuttle'
                  ? 'Shuttle'
                  : 'Walking'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearRoute}
            aria-label="Clear active route"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
