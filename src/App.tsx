import { useCallback, useEffect, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { CampusAiView } from './components/CampusAiView';
import { CampusLiveView } from './components/CampusLiveView';
import { CampusMap } from './components/CampusMap';
import { FacilityInspector } from './components/FacilityInspector';
import { HomeView } from './components/HomeView';
import { NavigationView } from './components/NavigationView';
import { RoomFinderModal } from './components/RoomFinderModal';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import type {
  CampusTelemetry,
  CampusUser,
  ComputedRoute,
  Facility,
  FacilityRoom,
  NavSection,
  RoomBooking,
  SkybridgeLink,
  UserRole,
} from './types/campus';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CampusUser | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [skybridges, setSkybridges] = useState<SkybridgeLink[]>([]);
  const [telemetry, setTelemetry] = useState<CampusTelemetry | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [rsvps, setRsvps] = useState<string[]>([]);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);

  const [activeSection, setActiveSection] = useState<NavSection>('map');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('quantum-biodome');
  const [plannerDestinationId, setPlannerDestinationId] = useState<string>('quantum-biodome');
  const [activeRoute, setActiveRoute] = useState<ComputedRoute | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => {
      setNotice((prev) => (prev === message ? null : prev));
    }, 3200);
  }, []);

  const loadCampusData = useCallback(async () => {
    const [facRes, telRes] = await Promise.all([
      fetch('/api/facilities'),
      fetch('/api/telemetry'),
    ]);
    if (facRes.ok) {
      const facData = await facRes.json();
      setFacilities(facData.facilities ?? []);
      setSkybridges(facData.skybridges ?? []);
    }
    if (telRes.ok) {
      const telData = await telRes.json();
      setTelemetry(telData);
    }
  }, []);

  useEffect(() => {
    loadCampusData();
  }, [loadCampusData]);

  // Real-time Server-Sent Events live stream for moving shuttles, occupancy & live feed
  useEffect(() => {
    if (!user) return;
    const source = new EventSource('/api/live/stream');
    source.onmessage = (event) => {
      try {
        const nextTelemetry = JSON.parse(event.data) as CampusTelemetry;
        setTelemetry(nextTelemetry);
      } catch {
        // Ignore malformed tick
      }
    };
    return () => {
      source.close();
    };
  }, [user]);

  const refreshTelemetry = useCallback(async () => {
    const res = await fetch('/api/telemetry');
    if (res.ok) {
      const data = await res.json();
      setTelemetry(data);
      showNotice('Hokage School live feed synced.');
    }
  }, [showNotice]);

  const handleAuthSuccess = (payload: {
    token: string;
    user: CampusUser;
    bookmarks: string[];
    rsvps: string[];
    bookings: RoomBooking[];
  }) => {
    setToken(payload.token);
    setUser(payload.user);
    setBookmarks(payload.bookmarks ?? []);
    setRsvps(payload.rsvps ?? []);
    setBookings(payload.bookings ?? []);
    setActiveSection('map');
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    setToken(null);
    setUser(null);
    setBookmarks([]);
    setRsvps([]);
    setBookings([]);
    setActiveRoute(null);
    setRoomModalOpen(false);
  };

  const handleSwitchRole = async (newRole: UserRole) => {
    if (!token || !user || user.role === newRole) return;
    const res = await fetch('/api/auth/role', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      showNotice(
        newRole === 'student'
          ? 'Switched to Student mode (lab & study reservations enabled).'
          : 'Switched to Visitor mode (public halls & guided tours highlighted).'
      );
    }
  };

  const handleToggleBookmark = async (facilityId: string) => {
    if (!token) return;
    const res = await fetch('/api/bookmarks/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ facilityId }),
    });
    if (res.ok) {
      const data = await res.json();
      setBookmarks(data.bookmarks);
      const isNowSaved = data.bookmarks.includes(facilityId);
      showNotice(isNowSaved ? 'Facility saved to bookmarks.' : 'Removed from bookmarks.');
    }
  };

  const handleToggleRsvp = async (eventId: string) => {
    if (!token) return;
    const res = await fetch('/api/rsvps/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventId }),
    });
    if (res.ok) {
      const data = await res.json();
      setRsvps(data.rsvps);
      const saved = data.rsvps.includes(eventId);
      showNotice(saved ? 'Event added to your campus schedule.' : 'Event removed from schedule.');
    }
  };

  const handleGetDirections = async (destinationId: string) => {
    const originId = destinationId === 'central-plaza' ? 'quantum-biodome' : 'central-plaza';
    const res = await fetch(
      `/api/route?origin=${encodeURIComponent(originId)}&destination=${encodeURIComponent(
        destinationId
      )}&mode=walking`
    );
    if (res.ok) {
      const data = await res.json();
      setActiveRoute(data.route);
      setSelectedFacilityId(destinationId);
      setActiveSection('map');
      showNotice(
        `Walking route ready: ${data.route.durationMinutes} min (${data.route.distanceMeters} m).`
      );
    }
  };

  const handleRouteViaSkybridge = async (fromId: string, toId: string) => {
    const res = await fetch(
      `/api/route?origin=${encodeURIComponent(fromId)}&destination=${encodeURIComponent(
        toId
      )}&mode=skybridge`
    );
    if (res.ok) {
      const data = await res.json();
      setActiveRoute(data.route);
      setSelectedFacilityId(toId);
      setActiveSection('map');
      showNotice(
        `Skybridge route ready: ${data.route.durationMinutes} min (${data.route.distanceMeters} m).`
      );
    }
  };

  const handleBookRoom = async (room: FacilityRoom, slot: string, purpose: string) => {
    if (!token) return;
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        facilityId: selectedFacilityId,
        roomId: room.id,
        slot,
        purpose,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not reserve room.');
    }
    setBookings(data.bookings);
    showNotice(`Reserved ${room.name} (${slot}).`);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!token) return;
    const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings);
      showNotice('Room reservation cancelled.');
    }
  };

  if (!user || !token) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const baseSelectedFacility =
    facilities.find((f) => f.id === selectedFacilityId) ?? facilities[0] ?? null;

  const selectedFacility = baseSelectedFacility
    ? {
        ...baseSelectedFacility,
        occupancyPercent:
          telemetry?.occupancyOverrides?.[baseSelectedFacility.id] ??
          baseSelectedFacility.occupancyPercent,
      }
    : null;

  return (
    <div className="bg-[#090e1a] text-slate-200 min-h-screen h-screen flex flex-col overflow-hidden">
      <TopBar
        user={user}
        facilities={facilities}
        telemetry={telemetry}
        bookmarksCount={bookmarks.length}
        bookings={bookings}
        onNavigate={setActiveSection}
        onSelectFacility={(fid) => {
          setSelectedFacilityId(fid);
          setActiveRoute(null);
        }}
        onSwitchRole={handleSwitchRole}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          activeSection={activeSection}
          telemetry={telemetry}
          onNavigate={setActiveSection}
        />

        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {activeSection === 'map' && (
            <>
              <CampusMap
                facilities={facilities}
                skybridges={skybridges}
                telemetry={telemetry}
                selectedFacilityId={selectedFacilityId}
                rsvps={rsvps}
                activeRoute={activeRoute}
                onSelectFacility={(fid) => {
                  setSelectedFacilityId(fid);
                }}
                onGetDirections={handleGetDirections}
                onRouteViaSkybridge={handleRouteViaSkybridge}
                onOpenRoomFinder={(fid) => {
                  setSelectedFacilityId(fid);
                  setRoomModalOpen(true);
                }}
                onToggleRsvp={handleToggleRsvp}
                onClearRoute={() => setActiveRoute(null)}
              />
              {selectedFacility && (
                <FacilityInspector
                  facility={selectedFacility}
                  facilities={facilities}
                  userRole={user.role}
                  isBookmarked={bookmarks.includes(selectedFacility.id)}
                  rsvps={rsvps}
                  activeRoute={activeRoute}
                  onSelectFacility={(fid) => {
                    setSelectedFacilityId(fid);
                    setActiveRoute(null);
                  }}
                  onToggleBookmark={handleToggleBookmark}
                  onToggleRsvp={handleToggleRsvp}
                  onGetDirections={handleGetDirections}
                  onOpenRoomFinder={() => setRoomModalOpen(true)}
                  onOpenFullPlanner={(destId) => {
                    setPlannerDestinationId(destId);
                    setActiveSection('navigation');
                  }}
                />
              )}
            </>
          )}

          {activeSection === 'home' && (
            <HomeView
              user={user}
              facilities={facilities}
              bookmarks={bookmarks}
              rsvps={rsvps}
              bookings={bookings}
              onOpenFacilityOnMap={(fid) => {
                setSelectedFacilityId(fid);
                setActiveRoute(null);
                setActiveSection('map');
              }}
              onStartDirections={handleGetDirections}
              onCancelBooking={handleCancelBooking}
              onToggleRsvp={handleToggleRsvp}
            />
          )}

          {activeSection === 'navigation' && (
            <NavigationView
              facilities={facilities}
              initialDestinationId={plannerDestinationId}
              onShowRouteOnMap={(route) => {
                setActiveRoute(route);
                setSelectedFacilityId(route.destinationId);
                setActiveSection('map');
              }}
            />
          )}

          {activeSection === 'live' && (
            <CampusLiveView
              facilities={facilities}
              telemetry={telemetry}
              rsvps={rsvps}
              onRefreshTelemetry={refreshTelemetry}
              onInspectFacility={(fid) => {
                setSelectedFacilityId(fid);
                setActiveRoute(null);
                setActiveSection('map');
              }}
              onGetDirections={handleGetDirections}
              onToggleRsvp={handleToggleRsvp}
            />
          )}

          {activeSection === 'ai' && (
            <CampusAiView
              token={token}
              facilities={facilities}
              selectedFacilityId={selectedFacilityId}
              onJumpToFacility={(fid) => {
                setSelectedFacilityId(fid);
                setActiveRoute(null);
                setActiveSection('map');
              }}
            />
          )}

          {/* Toast Feedback */}
          {notice && (
            <div
              role="status"
              className="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#0e131f]/95 border border-cyan-500/40 text-xs font-medium text-cyan-200 shadow-2xl"
            >
              {notice}
            </div>
          )}
        </main>
      </div>

      {roomModalOpen && selectedFacility && (
        <RoomFinderModal
          facility={selectedFacility}
          userRole={user.role}
          bookings={bookings}
          onClose={() => setRoomModalOpen(false)}
          onBookRoom={handleBookRoom}
          onCancelBooking={handleCancelBooking}
          onSwitchToStudent={() => handleSwitchRole('student')}
        />
      )}
    </div>
  );
}
