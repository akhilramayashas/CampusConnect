import React, { useState } from 'react';
import { CalendarPlus, CheckCircle2, DoorOpen, Lock, Users, X } from 'lucide-react';
import type { Facility, FacilityRoom, RoomBooking, UserRole } from '../types/campus';

interface RoomFinderModalProps {
  facility: Facility;
  userRole: UserRole;
  bookings: RoomBooking[];
  onClose: () => void;
  onBookRoom: (room: FacilityRoom, slot: string, purpose: string) => Promise<void>;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onSwitchToStudent: () => void;
}

const SLOTS = ['Now – +60 min', '15:00 – 16:00', '16:30 – 17:30', '18:00 – 19:00'];

export const RoomFinderModal: React.FC<RoomFinderModalProps> = ({
  facility,
  userRole,
  bookings,
  onClose,
  onBookRoom,
  onCancelBooking,
  onSwitchToStudent,
}) => {
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [purpose, setPurpose] = useState('Focused Study & Research');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rooms = availableOnly
    ? facility.rooms.filter((r) => r.available)
    : facility.rooms;

  const handleConfirmBooking = async (room: FacilityRoom) => {
    setError(null);
    setSubmitting(true);
    try {
      await onBookRoom(room, slot, purpose);
      setSelectedRoomId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to book room.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-finder-title"
    >
      <div className="w-full max-w-2xl bg-[#0e131f] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 id="room-finder-title" className="text-base font-bold text-white flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-cyan-400" />
              <span>Rooms in {facility.name}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {facility.sector} · {facility.quad}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAvailableOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                availableOnly
                  ? 'bg-cyan-500 text-slate-950 border-cyan-500 font-semibold'
                  : 'bg-[#161b28] text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              Available Only
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close room finder"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto custom-scroll space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs">
              {error}
            </div>
          )}

          {rooms.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-[#161b28] rounded-xl border border-slate-800">
              No rooms match the current filter. Turn off &ldquo;Available Only&rdquo; to inspect upcoming slots.
            </div>
          ) : (
            rooms.map((room) => {
              const existingBooking = bookings.find(
                (b) => b.facilityId === facility.id && b.roomId === room.id
              );
              const lockedForVisitor = room.studentOnly && userRole === 'visitor';
              const isExpanding = selectedRoomId === room.id;

              return (
                <div
                  key={room.id}
                  className="bg-[#161b28] border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{room.name}</h3>
                        {room.studentOnly && (
                          <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Student ID
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                        <span>{room.floor}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 tabular-nums">
                          <Users className="w-3 h-3" /> {room.capacity} seats
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{room.equipment.join(', ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {existingBooking ? (
                        <button
                          type="button"
                          onClick={() => onCancelBooking(existingBooking.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-xs font-medium hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/40 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Reserved (Cancel)
                        </button>
                      ) : !room.available ? (
                        <span className="text-xs font-mono text-slate-400">
                          Busy · Next {room.nextFreeSlot}
                        </span>
                      ) : lockedForVisitor ? (
                        <button
                          type="button"
                          onClick={onSwitchToStudent}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium transition cursor-pointer"
                        >
                          Switch to Student Mode
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRoomId(isExpanding ? null : room.id)
                          }
                          className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>{isExpanding ? 'Close' : 'Reserve Room'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanding && (
                    <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <label className="block space-y-1">
                        <span className="text-[11px] text-slate-400">Time Slot</span>
                        <select
                          value={slot}
                          onChange={(e) => setSlot(e.target.value)}
                          className="w-full bg-[#0e131f] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                        >
                          {SLOTS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[11px] text-slate-400">Session Purpose</span>
                        <input
                          type="text"
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          maxLength={80}
                          className="w-full bg-[#0e131f] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleConfirmBooking(room)}
                        className="py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold text-xs transition cursor-pointer"
                      >
                        {submitting ? 'Booking...' : 'Confirm Slot'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
