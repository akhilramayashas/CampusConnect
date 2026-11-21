import type {
  CampusTelemetry,
  ComputedRoute,
  Facility,
  LiveFeedEntry,
  RouteStep,
  ShuttleStatus,
  SkybridgeLink,
  TransportMode,
} from '../src/types/campus.ts';

function rectFootprint(
  lat: number,
  lng: number,
  dLat: number,
  dLng: number,
  skew = 0
): [number, number][] {
  return [
    [lat + dLat, lng - dLng + skew],
    [lat + dLat, lng + dLng + skew],
    [lat - dLat, lng + dLng - skew],
    [lat - dLat, lng - dLng - skew],
  ];
}

export const CAMPUS_FACILITIES: Facility[] = [
  {
    id: 'quantum-biodome',
    name: 'Quantum & BioDome',
    sector: 'Sector Beta',
    quad: 'Bio-Research Quad IV',
    category: 'Research',
    coords: [37.5665, 126.978],
    footprint: [
      [37.56684, 126.97765],
      [37.56692, 126.97818],
      [37.56658, 126.97848],
      [37.56618, 126.97828],
      [37.56614, 126.97772],
      [37.56648, 126.97752],
    ],
    stories: 5,
    heightMeters: 28,
    status: 'Open Now',
    hours: '06:00 – 23:00',
    description:
      'Advanced biotechnology complex at Hokage School equipped with quantum physics laboratories, student research cleanrooms, and climate-controlled botanical pods.',
    occupancyPercent: 64,
    occupancyLabel: 'Plenty',
    airQualityPercent: 99.9,
    walkMinutesFromPlaza: 3,
    visitorAccess: 'Lobby & Guided Tours',
    rooms: [
      {
        id: 'qb-304',
        name: 'Room 304 · Quantum Seminar',
        floor: 'Level 3',
        capacity: 42,
        equipment: ['Holographic Projection', 'Acoustic Array'],
        available: false,
        studentOnly: false,
        nextFreeSlot: '15:30 – 16:30',
      },
      {
        id: 'qb-pod-2',
        name: 'Botanical Pod B2',
        floor: 'Level 2',
        capacity: 6,
        equipment: ['Climate Micro-Control', '4K Whiteboard'],
        available: true,
        studentOnly: false,
        nextFreeSlot: 'Available Now',
      },
      {
        id: 'qb-lab-108',
        name: 'Bio-Informatics Studio 108',
        floor: 'Level 1',
        capacity: 12,
        equipment: ['Workstation Cluster', 'Dual Fiber Uplink'],
        available: true,
        studentOnly: true,
        nextFreeSlot: 'Available Now',
      },
      {
        id: 'qb-clean-b1',
        name: 'Cleanroom Observation Bay',
        floor: 'Sub-Level B1',
        capacity: 8,
        equipment: ['HEPA Isolation', 'Spectrometer Feed'],
        available: true,
        studentOnly: true,
        nextFreeSlot: 'Available Now',
      },
    ],
    events: [
      {
        id: 'ev-quantum-2040',
        title: 'Quantum Computing in 2040',
        time: '14:00',
        room: 'Room 304',
        speaker: 'Prof. Dr. A. Kaluza',
        category: 'Lecture',
      },
      {
        id: 'ev-biodome-tour',
        title: 'Botanical Dome Ecology Walk',
        time: '16:30',
        room: 'Atrium Concourse',
        speaker: 'Dr. S. Min',
        category: 'Public Tour',
      },
    ],
  },
  {
    id: 'central-plaza',
    name: 'Central Plaza & Transit Hub',
    sector: 'Sector Alpha',
    quad: 'Main Concourse',
    category: 'Transit',
    coords: [37.5653, 126.9765],
    footprint: rectFootprint(37.5653, 126.9765, 0.00034, 0.00046, 0.00005),
    stories: 2,
    heightMeters: 12,
    status: '24/7 Access',
    hours: '24 Hours',
    description:
      'Primary Hokage School arrival concourse connecting autonomous loop shuttles, visitor welcome desks, and covered skybridge arteries.',
    occupancyPercent: 48,
    occupancyLabel: 'Open',
    airQualityPercent: 98.2,
    walkMinutesFromPlaza: 0,
    visitorAccess: 'Full Public Access',
    rooms: [
      {
        id: 'cp-pod-a',
        name: 'Transit Lounge Pod A',
        floor: 'Ground Level',
        capacity: 4,
        equipment: ['Wireless Charging', 'Display Dock'],
        available: true,
        studentOnly: false,
        nextFreeSlot: 'Available Now',
      },
      {
        id: 'cp-brief-2',
        name: 'Visitor Briefing Room 2',
        floor: 'Mezzanine',
        capacity: 16,
        equipment: ['Interactive Campus Map Table', 'Audio Loop'],
        available: true,
        studentOnly: false,
        nextFreeSlot: 'Available Now',
      },
    ],
    events: [
      {
        id: 'ev-campus-orientation',
        title: 'Hokage School Visitor Orientation',
        time: '13:30',
        room: 'Welcome Desk North',
        speaker: 'Campus Ambassadors',
        category: 'Public Tour',
      },
    ],
  },
  {
    id: 'aegis-library',
    name: 'Aegis Digital Library',
    sector: 'Sector Alpha',
    quad: 'North Academic Terrace',
    category: 'Study',
    coords: [37.5678, 126.9768],
    footprint: rectFootprint(37.5678, 126.9768, 0.00032, 0.00048),
    stories: 6,
    heightMeters: 34,
    status: 'Open Now',
    hours: '07:00 – 02:00',
    description:
      'Six-story acoustic study conservatory housing neural archive terminals, silent reading decks, and reservable group synthesis pods.',
    occupancyPercent: 72,
    occupancyLabel: 'Moderate',
    airQualityPercent: 99.1,
    walkMinutesFromPlaza: 4,
    visitorAccess: 'Full Public Access',
    rooms: [
      {
        id: 'lib-pod-412',
        name: 'Silent Synthesis Pod 412',
        floor: 'Level 4',
        capacity: 4,
        equipment: ['Noise Cancellation', 'Glass Writeboard'],
        available: true,
        studentOnly: false,
        nextFreeSlot: 'Available Now',
      },
      {
        id: 'lib-media-205',
        name: 'Spatial Media Booth 205',
        floor: 'Level 2',
        capacity: 8,
        equipment: ['3D Display Wall', 'Spatial Audio'],
        available: true,
        studentOnly: true,
        nextFreeSlot: 'Available Now',
      },
      {
        id: 'lib-reading-601',
        name: 'Skyline Reading Alcove 601',
        floor: 'Level 6',
        capacity: 2,
        equipment: ['Ergonomic Task Lighting', 'Power Rail'],
        available: false,
        studentOnly: false,
        nextFreeSlot: '16:00 – 17:00',
      },
    ],
    events: [
      {
        id: 'ev-archive-symposium',
        title: 'Open Scientific Archives Workshop',
        time: '15:00',
        room: 'Archive Hall 2B',
        speaker: 'M. Han, Chief Archivist',
        category: 'Workshop',
      },
    ],
  },
  {
    id: 'robotics-hall',
    name: 'Robotics & Systems Hall',
    sector: 'Sector Gamma',
    quad: 'East Innovation Wing',
    category: 'Research',
    coords: [37.5671, 126.9802],
    footprint: rectFootprint(37.5671, 126.9802, 0.00035, 0.00045, -0.00006),
    stories: 4,
    heightMeters: 22,
    status: 'Open Now',
    hours: '07:00 – 22:00',
    description:
      'Autonomous systems testing bay, micro-fabrication workshops, and drone kinematics arena connected by an elevated climate skybridge.',
    occupancyPercent: 55,
    occupancyLabel: 'Optimal',
    airQualityPercent: 98.7,
    walkMinutesFromPlaza: 5,
    visitorAccess: 'Lobby & Guided Tours',
    rooms: [
      {
        id: 'rob-bay-101',
        name: 'Prototyping Bench 101',
        floor: 'Level 1',
        capacity: 6,
        equipment: ['Oscilloscope Rig', '3D Sintering Access'],
        available: true,
        studentOnly: true,
        nextFreeSlot: 'Available Now',
      },
      {
        id: 'rob-conf-310',
        name: 'Systems Review Room 310',
        floor: 'Level 3',
        capacity: 14,
        equipment: ['Telemetry Wall', 'Video Conferencing'],
        available: true,
        studentOnly: false,
        nextFreeSlot: 'Available Now',
      },
    ],
    events: [
      {
        id: 'ev-autonomous-demo',
        title: 'Bipedal Locomotion Live Demo',
        time: '15:30',
        room: 'Atrium Test Arena',
        speaker: 'Autonomous Lab Team',
        category: 'Symposium',
      },
    ],
  },
  {
    id: 'helios-union',
    name: 'Helios Student Union',
    sector: 'Sector Delta',
    quad: 'South Courtyard',
    category: 'Commons',
    coords: [37.5646, 126.9788],
    footprint: rectFootprint(37.5646, 126.9788, 0.00032, 0.00044),
    stories: 3,
    heightMeters: 18,
    status: 'Open Now',
    hours: '06:30 – 23:30',
    description:
      'Hokage School social core featuring hydroponic dining kitchens, student project commons, health concierge, and sunlit terrace seating.',
    occupancyPercent: 79,
    occupancyLabel: 'Lively',
    airQualityPercent: 97.6,
    walkMinutesFromPlaza: 3,
    visitorAccess: 'Full Public Access',
    rooms: [
      {
        id: 'hu-collab-202',
        name: 'Commons Collab Booth 202',
        floor: 'Level 2',
        capacity: 6,
        equipment: ['Whiteboard', 'USB-C Hub'],
        available: true,
        studentOnly: false,
        nextFreeSlot: 'Available Now',
      },
      {
        id: 'hu-wellness-110',
        name: 'Quiet Reflection Suite 110',
        floor: 'Level 1',
        capacity: 2,
        equipment: ['Ambient Sound Masking'],
        available: true,
        studentOnly: false,
        nextFreeSlot: 'Available Now',
      },
    ],
    events: [
      {
        id: 'ev-founders-meetup',
        title: 'Campus Sustainability Showcase',
        time: '17:00',
        room: 'South Courtyard Stage',
        speaker: 'Green Grid Collective',
        category: 'Symposium',
      },
    ],
  },
  {
    id: 'genomics-annex',
    name: 'Genomics & Precision Health',
    sector: 'Sector Beta',
    quad: 'Clinical Annex',
    category: 'Research',
    coords: [37.5681, 126.9792],
    footprint: rectFootprint(37.5681, 126.9792, 0.00028, 0.00042),
    stories: 5,
    heightMeters: 26,
    status: 'Restricted Access',
    hours: '08:00 – 20:00',
    description:
      'High-throughput bio-sequencing laboratories, computational proteomics suites, and medical ethics lecture auditorium.',
    occupancyPercent: 41,
    occupancyLabel: 'Quiet',
    airQualityPercent: 99.9,
    walkMinutesFromPlaza: 6,
    visitorAccess: 'Badge Escort Required',
    rooms: [
      {
        id: 'gen-seq-204',
        name: 'Bio-Data Review Room 204',
        floor: 'Level 2',
        capacity: 10,
        equipment: ['Encrypted Terminal', '6K Genome Viewer'],
        available: true,
        studentOnly: true,
        nextFreeSlot: 'Available Now',
      },
      {
        id: 'gen-aud-100',
        name: 'Bio-Ethics Lecture Hall',
        floor: 'Level 1',
        capacity: 80,
        equipment: ['Simultaneous Translation', 'Lecture Capture'],
        available: false,
        studentOnly: false,
        nextFreeSlot: '16:30 – 17:30',
      },
    ],
    events: [
      {
        id: 'ev-proteomics-talk',
        title: 'Cellular Aging & Protein Folding',
        time: '14:30',
        room: 'Bio-Ethics Lecture Hall',
        speaker: 'Dr. H. Kwon',
        category: 'Lecture',
      },
    ],
  },
  {
    id: 'eco-observatory',
    name: 'Namsan Eco-Observatory',
    sector: 'Sector Epsilon',
    quad: 'Upper Ridge',
    category: 'Wellness',
    coords: [37.5639, 126.9752],
    footprint: rectFootprint(37.5639, 126.9752, 0.00028, 0.00036),
    stories: 4,
    heightMeters: 24,
    status: 'Open Now',
    hours: '06:00 – 21:00',
    description:
      'Elevated botanical promenade and atmospheric telemetry station overlooking Hokage School micro-grid solar canopy and urban forest.',
    occupancyPercent: 28,
    occupancyLabel: 'Very Quiet',
    airQualityPercent: 99.6,
    walkMinutesFromPlaza: 4,
    visitorAccess: 'Full Public Access',
    rooms: [
      {
        id: 'eco-deck-1',
        name: 'Canopy Study Pavilion',
        floor: 'Observation Deck',
        capacity: 8,
        equipment: ['Solar Power Bench', 'Weather Display'],
        available: true,
        studentOnly: false,
        nextFreeSlot: 'Available Now',
      },
    ],
    events: [
      {
        id: 'ev-air-telemetry',
        title: 'Urban Canopy Microclimate Briefing',
        time: '16:00',
        room: 'Observation Deck',
        speaker: 'Prof. J. Yoo',
        category: 'Public Tour',
      },
    ],
  },
  {
    id: 'kinetic-studio',
    name: 'Kinetic Media & Design Studio',
    sector: 'Sector Delta',
    quad: 'West Pavilion',
    category: 'Commons',
    coords: [37.5662, 126.9746],
    footprint: rectFootprint(37.5662, 126.9746, 0.00031, 0.0004),
    stories: 3,
    heightMeters: 16,
    status: 'Open Now',
    hours: '08:00 – 22:00',
    description:
      'Interdisciplinary pavilion for architectural fabrication, spatial sound design, and public interactive art exhibitions.',
    occupancyPercent: 52,
    occupancyLabel: 'Optimal',
    airQualityPercent: 98.5,
    walkMinutesFromPlaza: 3,
    visitorAccess: 'Full Public Access',
    rooms: [
      {
        id: 'kin-lab-12',
        name: 'Spatial Sound Lab 12',
        floor: 'Level 2',
        capacity: 5,
        equipment: ['Ambisonic Array', 'Acoustic Baffles'],
        available: true,
        studentOnly: true,
        nextFreeSlot: 'Available Now',
      },
      {
        id: 'kin-gal-1',
        name: 'Exhibition Critique Room',
        floor: 'Level 1',
        capacity: 18,
        equipment: ['Modular Lighting', 'Pin-Up Walls'],
        available: true,
        studentOnly: false,
        nextFreeSlot: 'Available Now',
      },
    ],
    events: [
      {
        id: 'ev-spatial-exhibit',
        title: 'Architecture of Light Exhibition',
        time: '13:00 – 19:00',
        room: 'Main Gallery',
        speaker: 'Design Faculty',
        category: 'Public Tour',
      },
    ],
  },
];

export const CAMPUS_SKYBRIDGES: SkybridgeLink[] = [
  {
    id: 'sb-alpha-beta',
    name: 'Alpha–Beta Covered Skybridge',
    fromId: 'central-plaza',
    toId: 'quantum-biodome',
    level: 'Level 2 Elevated Spine',
    accessible: true,
    climateControlled: true,
    path: [
      [37.5653, 126.9765],
      [37.5659, 126.9772],
      [37.5665, 126.978],
    ],
    status: 'Active',
  },
  {
    id: 'sb-bio-robotics',
    name: 'Bio–Robotics Skyway',
    fromId: 'quantum-biodome',
    toId: 'robotics-hall',
    level: 'Level 3 Glass Span',
    accessible: true,
    climateControlled: true,
    path: [
      [37.5665, 126.978],
      [37.5669, 126.9791],
      [37.5671, 126.9802],
    ],
    status: 'Active',
  },
  {
    id: 'sb-north-library',
    name: 'North Academic Skybridge',
    fromId: 'aegis-library',
    toId: 'quantum-biodome',
    level: 'Level 2 Quiet Deck',
    accessible: true,
    climateControlled: true,
    path: [
      [37.5678, 126.9768],
      [37.5672, 126.9774],
      [37.5665, 126.978],
    ],
    status: 'Active',
  },
  {
    id: 'sb-clinical-bridge',
    name: 'Clinical Genomics Bridge',
    fromId: 'quantum-biodome',
    toId: 'genomics-annex',
    level: 'Level 2 HEPA Corridor',
    accessible: true,
    climateControlled: true,
    path: [
      [37.5665, 126.978],
      [37.5673, 126.9787],
      [37.5681, 126.9792],
    ],
    status: 'Active',
  },
  {
    id: 'sb-south-union',
    name: 'South Courtyard Solar Skybridge',
    fromId: 'central-plaza',
    toId: 'helios-union',
    level: 'Level 2 Canopy Walk',
    accessible: true,
    climateControlled: true,
    path: [
      [37.5653, 126.9765],
      [37.5649, 126.9776],
      [37.5646, 126.9788],
    ],
    status: 'Active',
  },
];

export const SHUTTLE_LOOP_STOPS: {
  facilityId: string;
  label: string;
  coords: [number, number];
}[] = [
  { facilityId: 'central-plaza', label: 'Central Plaza Bay', coords: [37.5651, 126.9763] },
  { facilityId: 'kinetic-studio', label: 'Kinetic Studio West', coords: [37.5662, 126.9742] },
  { facilityId: 'aegis-library', label: 'Aegis Library Terrace', coords: [37.5681, 126.9766] },
  { facilityId: 'genomics-annex', label: 'Genomics Clinical Gate', coords: [37.5685, 126.9793] },
  { facilityId: 'robotics-hall', label: 'Robotics East Wing', coords: [37.5672, 126.9807] },
  { facilityId: 'helios-union', label: 'Helios Union South', coords: [37.5643, 126.979] },
  { facilityId: 'eco-observatory', label: 'Eco-Observatory Ridge', coords: [37.5637, 126.9752] },
  { facilityId: 'central-plaza', label: 'Central Plaza Bay', coords: [37.5651, 126.9763] },
];

function interpolateLoop(progress: number): {
  coords: [number, number];
  nextStop: (typeof SHUTTLE_LOOP_STOPS)[number];
  etaMinutes: number;
} {
  const segments = SHUTTLE_LOOP_STOPS.length - 1;
  const norm = ((progress % 1) + 1) % 1;
  const scaled = norm * segments;
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const start = SHUTTLE_LOOP_STOPS[idx];
  const end = SHUTTLE_LOOP_STOPS[idx + 1];
  const lat = start.coords[0] + (end.coords[0] - start.coords[0]) * frac;
  const lng = start.coords[1] + (end.coords[1] - start.coords[1]) * frac;
  const etaMinutes = Math.max(1, Math.ceil((1 - frac) * 3));
  return {
    coords: [Number(lat.toFixed(6)), Number(lng.toFixed(6))],
    nextStop: end,
    etaMinutes,
  };
}

export function getCampusTelemetry(): CampusTelemetry {
  const now = Date.now();
  const cycleSeconds = 72;
  const basePhase = (now / 1000 / cycleSeconds) % 1;

  const loopAPos = interpolateLoop(basePhase);
  const loopBPos = interpolateLoop(1 - ((basePhase + 0.35) % 1));
  const expressPos = interpolateLoop((basePhase * 1.25 + 0.62) % 1);

  const shuttles: ShuttleStatus[] = [
    {
      id: 'sh-loop-a',
      line: 'Hokage Loop A (Clockwise)',
      nextStop: loopAPos.nextStop.label,
      nextStopFacilityId: loopAPos.nextStop.facilityId,
      etaMinutes: loopAPos.etaMinutes,
      loadPercent: 32 + (Math.floor(now / 6000) % 7),
      status: loopAPos.etaMinutes <= 1 ? 'Boarding' : 'On Schedule',
      coords: loopAPos.coords,
      headingLabel: 'Clockwise Perimeter',
    },
    {
      id: 'sh-loop-b',
      line: 'Hokage Loop B (Counter-Clockwise)',
      nextStop: loopBPos.nextStop.label,
      nextStopFacilityId: loopBPos.nextStop.facilityId,
      etaMinutes: loopBPos.etaMinutes,
      loadPercent: 48 + (Math.floor(now / 8000) % 9),
      status: loopBPos.etaMinutes <= 1 ? 'Boarding' : 'On Schedule',
      coords: loopBPos.coords,
      headingLabel: 'Counter-Clockwise',
    },
    {
      id: 'sh-express',
      line: 'Research Quad Express',
      nextStop: expressPos.nextStop.label,
      nextStopFacilityId: expressPos.nextStop.facilityId,
      etaMinutes: expressPos.etaMinutes,
      loadPercent: 20 + (Math.floor(now / 9000) % 8),
      status: expressPos.etaMinutes <= 1 ? 'Boarding' : 'On Schedule',
      coords: expressPos.coords,
      headingLabel: 'Express Loop',
    },
  ];

  const occupancyOverrides: Record<string, number> = {};
  const wave = Math.floor(now / 9000);
  CAMPUS_FACILITIES.forEach((f, idx) => {
    const delta = ((wave + idx * 3) % 5) - 2;
    occupancyOverrides[f.id] = Math.min(96, Math.max(12, f.occupancyPercent + delta));
  });

  const timeLabel = new Date(now).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const liveFeed: LiveFeedEntry[] = [
    {
      id: `feed-sh-a-${wave}`,
      kind: 'Shuttle',
      sector: 'Perimeter Loop',
      facilityId: loopAPos.nextStop.facilityId,
      title: `${shuttles[0].line} approaching ${shuttles[0].nextStop}`,
      detail: `ETA ${shuttles[0].etaMinutes} min · Cabin load ${shuttles[0].loadPercent}% · ${shuttles[0].status}`,
      timestamp: timeLabel,
    },
    {
      id: 'feed-ev-quantum',
      kind: 'Event',
      sector: 'Sector Beta',
      facilityId: 'quantum-biodome',
      title: 'Quantum Computing in 2040 · Room 304',
      detail: 'Prof. Dr. A. Kaluza · Doors open at 14:00 in Quantum & BioDome',
      timestamp: 'Today 14:00',
    },
    {
      id: 'feed-sb-alpha',
      kind: 'Skybridge',
      sector: 'Sector Alpha',
      facilityId: 'central-plaza',
      title: 'Alpha–Beta Covered Skybridge operating nominally',
      detail: 'Step-free climate-controlled span connecting Central Plaza to Quantum & BioDome.',
      timestamp: 'Active',
    },
    {
      id: 'feed-fac-lib',
      kind: 'Facility',
      sector: 'Sector Alpha',
      facilityId: 'aegis-library',
      title: 'Aegis Digital Library study pods updated',
      detail: `Current occupancy ${occupancyOverrides['aegis-library']}% · 2 study pods open now.`,
      timestamp: timeLabel,
    },
    {
      id: 'feed-ev-robotics',
      kind: 'Event',
      sector: 'Sector Gamma',
      facilityId: 'robotics-hall',
      title: 'Bipedal Locomotion Live Demo · Atrium Test Arena',
      detail: 'Autonomous Lab Team · Starts at 15:30 in Robotics & Systems Hall',
      timestamp: 'Today 15:30',
    },
    {
      id: `feed-sh-b-${wave}`,
      kind: 'Shuttle',
      sector: 'Perimeter Loop',
      facilityId: loopBPos.nextStop.facilityId,
      title: `${shuttles[1].line} en route to ${shuttles[1].nextStop}`,
      detail: `ETA ${shuttles[1].etaMinutes} min · Cabin load ${shuttles[1].loadPercent}%`,
      timestamp: timeLabel,
    },
  ];

  return {
    campusName: 'Hokage School',
    temperatureC: 21,
    airPurityPercent: 98,
    smartGridGreenPercent: 99.8,
    campusDensity: 'Optimal',
    activeShuttles: shuttles.length,
    shuttleLoopPath: SHUTTLE_LOOP_STOPS.map((s) => s.coords),
    shuttles,
    alerts: [
      {
        id: 'al-1',
        sector: 'Sector Beta',
        title: 'Quantum & BioDome Cleanroom Airflow Nominal',
        detail: 'Air purity at 99.9%. All Level 1–3 study pods open for reservations.',
        severity: 'Nominal',
        timestamp: '2m ago',
      },
      {
        id: 'al-2',
        sector: 'Sector Alpha',
        title: 'Central Plaza Skybridge Elevator Active',
        detail: 'Step-free covered skybridge between Central Plaza and BioDome is open.',
        severity: 'Nominal',
        timestamp: '14m ago',
      },
      {
        id: 'al-3',
        sector: 'Sector Gamma',
        title: 'Robotics Atrium Live Demo Setup',
        detail: 'East Wing corridor seating reserved from 15:15–16:15 for bipedal locomotion demo.',
        severity: 'Advisory',
        timestamp: '28m ago',
      },
    ],
    liveFeed,
    occupancyOverrides,
    updatedAt: new Date(now).toISOString(),
  };
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return Math.round(2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function bearingCardinal(a: [number, number], b: [number, number]): string {
  const dLat = b[0] - a[0];
  const dLng = b[1] - a[1];
  const ns = dLat >= 0 ? 'north' : 'south';
  const ew = dLng >= 0 ? 'east' : 'west';
  if (Math.abs(dLat) > Math.abs(dLng) * 2) return ns;
  if (Math.abs(dLng) > Math.abs(dLat) * 2) return ew;
  return `${ns}-${ew}`;
}

export function computeCampusRoute(
  originId: string,
  destinationId: string,
  mode: TransportMode
): ComputedRoute | null {
  const origin = CAMPUS_FACILITIES.find((f) => f.id === originId);
  const destination = CAMPUS_FACILITIES.find((f) => f.id === destinationId);
  if (!origin || !destination) return null;

  if (origin.id === destination.id) {
    return {
      originId: origin.id,
      originName: origin.name,
      destinationId: destination.id,
      destinationName: destination.name,
      mode,
      distanceMeters: 0,
      durationMinutes: 0,
      accessible: true,
      path: [origin.coords],
      steps: [
        {
          instruction: `You are already at ${destination.name}. Check the facility panel for floor directories and available rooms.`,
          distanceMeters: 0,
          landmark: destination.quad,
        },
      ],
    };
  }

  const straight = haversineMeters(origin.coords, destination.coords);
  const detourFactor = mode === 'shuttle' ? 1.35 : mode === 'skybridge' ? 1.22 : 1.15;
  const distanceMeters = Math.max(95, Math.round(straight * detourFactor));

  const speedMetersPerMin = mode === 'shuttle' ? 220 : mode === 'skybridge' ? 68 : 78;
  const overheadMin = mode === 'shuttle' ? 2 : 0;
  const durationMinutes = Math.max(1, Math.round(distanceMeters / speedMetersPerMin) + overheadMin);

  const matchingSkybridge =
    mode === 'skybridge'
      ? CAMPUS_SKYBRIDGES.find(
          (sb) =>
            (sb.fromId === origin.id && sb.toId === destination.id) ||
            (sb.toId === origin.id && sb.fromId === destination.id)
        )
      : undefined;

  const midLat = (origin.coords[0] + destination.coords[0]) / 2;
  const midLng = (origin.coords[1] + destination.coords[1]) / 2;
  const offset = mode === 'shuttle' ? 0.00045 : mode === 'skybridge' ? -0.00025 : 0.00018;
  const waypoint: [number, number] = [midLat + offset, midLng - offset * 0.7];
  const path: [number, number][] = matchingSkybridge
    ? matchingSkybridge.fromId === origin.id
      ? matchingSkybridge.path
      : [...matchingSkybridge.path].reverse()
    : [origin.coords, waypoint, destination.coords];

  const cardinal = bearingCardinal(origin.coords, destination.coords);

  const steps: RouteStep[] =
    mode === 'shuttle'
      ? [
          {
            instruction: `Board Hokage Autonomous Loop Shuttle at ${origin.name} bay.`,
            distanceMeters: 40,
            landmark: `${origin.sector} Transit Gate`,
          },
          {
            instruction: `Ride ${cardinal} along the Hokage School perimeter loop toward ${destination.sector}.`,
            distanceMeters: Math.max(40, distanceMeters - 75),
            landmark: 'Autonomous Smart Corridor',
          },
          {
            instruction: `Exit at ${destination.name} drop-off pad and enter main concourse.`,
            distanceMeters: 35,
            landmark: destination.quad,
          },
        ]
      : mode === 'skybridge'
      ? [
          {
            instruction: `Take the accessible glass elevator to ${matchingSkybridge?.level ?? 'Skybridge Level 2'} inside ${origin.name}.`,
            distanceMeters: 30,
            landmark: matchingSkybridge?.name ?? 'Level 2 Skybridge Spine',
          },
          {
            instruction: `Follow the climate-controlled covered walkway ${cardinal} toward ${destination.sector}.`,
            distanceMeters: Math.max(45, distanceMeters - 60),
            landmark: 'Covered Pedestrian Deck',
          },
          {
            instruction: `Descend or cross directly into ${destination.name} upper atrium.`,
            distanceMeters: 30,
            landmark: destination.quad,
          },
        ]
      : [
          {
            instruction: `Exit ${origin.name} onto the landscaped courtyard path heading ${cardinal}.`,
            distanceMeters: Math.round(distanceMeters * 0.35),
            landmark: origin.quad,
          },
          {
            instruction: `Continue past the solar canopy walkway toward ${destination.sector}.`,
            distanceMeters: Math.round(distanceMeters * 0.45),
            landmark: 'Central Green Promenade',
          },
          {
            instruction: `Arrive at the main entrance of ${destination.name}.`,
            distanceMeters: Math.max(15, distanceMeters - Math.round(distanceMeters * 0.8)),
            landmark: destination.quad,
          },
        ];

  return {
    originId: origin.id,
    originName: origin.name,
    destinationId: destination.id,
    destinationName: destination.name,
    mode,
    distanceMeters,
    durationMinutes,
    accessible: mode !== 'walking' || distanceMeters < 450,
    path,
    steps,
  };
}
