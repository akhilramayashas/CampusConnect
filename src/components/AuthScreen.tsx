import React, { useState } from 'react';
import { ArrowRight, Compass, KeyRound, Lock, Mail, Network, ShieldCheck, User, UserPlus } from 'lucide-react';
import type { CampusUser, RoomBooking, UserRole } from '../types/campus';

interface AuthSuccessPayload {
  token: string;
  user: CampusUser;
  bookmarks: string[];
  rsvps: string[];
  bookings: RoomBooking[];
}

interface AuthScreenProps {
  onAuthSuccess: (payload: AuthSuccessPayload) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { name, email, password, role, department };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
        return;
      }
      onAuthSuccess(data);
    } catch {
      setError('Unable to connect to CampusConnect authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: demoRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to start demo session.');
        return;
      }
      onAuthSuccess(data);
    } catch {
      setError('Unable to reach server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-200 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-[#0e131f] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Visual Showcase */}
        <div className="lg:col-span-6 relative min-h-[260px] lg:min-h-[580px] flex flex-col justify-between p-8 bg-gradient-to-br from-[#0e172a] via-[#090e1a] to-[#0b1324]">
          <img
            src="/src/assets/images/campus_neoseoul_hero_1795251142305.jpg"
            alt="Hokage School Quantum and BioDome pavilion at twilight"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-55"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090e1a] via-[#090e1a]/65 to-[#090e1a]/45" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white">CampusConnect</div>
              <p className="text-xs text-slate-300">Hokage School · Map & Wayfinding</p>
            </div>
          </div>

          <div className="relative z-10 space-y-5 mt-12">
            <h1 className="text-3xl font-bold text-white leading-tight [text-wrap:balance]">
              Navigate every sector, lab, and study pod across Hokage School.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Sign in with your campus account or visitor pass to view real-time building occupancy, reserve available rooms, and plan step-free routes.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <div className="font-mono tabular-nums text-cyan-400 font-semibold text-base">8</div>
                <div className="text-slate-400 mt-0.5">Campus Sectors</div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-emerald-400 font-semibold text-base">98%</div>
                <div className="text-slate-400 mt-0.5">Air Purity</div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-white font-semibold text-base">24/7</div>
                <div className="text-slate-400 mt-0.5">Transit Sync</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sign In / Create Account Panel */}
        <div className="lg:col-span-6 p-6 md:p-10 flex flex-col justify-between bg-[#0e131f]">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {mode === 'login' ? 'Sign in to CampusConnect' : 'Create Campus Account'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {mode === 'login'
                    ? 'Access your saved buildings, room reservations, and personal schedule.'
                    : 'Register as a Student or Campus Visitor in seconds.'}
                </p>
              </div>
            </div>

            {/* Auth Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#161b28] rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 whitespace-nowrap ${
                  mode === 'login'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" /> Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 whitespace-nowrap ${
                  mode === 'register'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition text-left ${
                        role === 'student'
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                          : 'bg-[#161b28] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold">Student Access</div>
                      <div className="text-[11px] opacity-80 mt-0.5">Lab & study bookings</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('visitor')}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition text-left ${
                        role === 'visitor'
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                          : 'bg-[#161b28] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold">Visitor Pass</div>
                      <div className="text-[11px] opacity-80 mt-0.5">Tours & public halls</div>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-slate-300">Full Name</span>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Sora Kim"
                          className="w-full bg-[#161b28] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-slate-300">
                        {role === 'student' ? 'Department / Year' : 'Affiliation'}
                      </span>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder={role === 'student' ? 'Bio-Informatics IV' : 'Guest Researcher'}
                        className="w-full bg-[#161b28] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </label>
                  </div>
                </>
              )}

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-300">Campus or Guest Email</span>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@hokageschool.edu"
                    className="w-full bg-[#161b28] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-300">Password</span>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-[#161b28] border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Workspace' : 'Create Account & Enter'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Instant Demo Access */}
          <div className="pt-6 mt-6 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Quick Preview Access
              </span>
              <span>No registration required</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('student')}
                className="py-2.5 px-3 rounded-xl bg-[#161b28] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 font-medium transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Demo Student (Kaelen Voss)</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('visitor')}
                className="py-2.5 px-3 rounded-xl bg-[#161b28] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 font-medium transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Demo Visitor (Dr. Elena Park)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
