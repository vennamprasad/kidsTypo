"use client";

import React from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Settings as SettingsIcon,
  LogOut,
  Gamepad2,
  ChevronRight,
} from 'lucide-react';
import { CSSBackground } from '@/components/ui/CSSBackground';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/drawings',  icon: ImageIcon,       label: 'Drawings'  },
  { href: '/settings',  icon: SettingsIcon,    label: 'Settings'  },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
        <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400">
          Kiddlr
        </div>
        <div className="w-8 h-8 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white overflow-hidden">

      {/* ── Sidebar / Topbar ── */}
      <aside className="w-full md:w-60 shrink-0 flex flex-col md:h-full bg-white/5 backdrop-blur-md border-b md:border-b-0 md:border-r border-white/10 relative z-20">

        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 shrink-0 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <span className="font-black text-base bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400">
              Kiddlr
            </span>
            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded-full tracking-wide">
              PARENT
            </span>
          </div>
          {/* Mobile Actions */}
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={() => router.push('/play')} className="text-emerald-400 text-sm font-bold flex items-center gap-1">
              <Gamepad2 size={16} /> Play
            </button>
            <button onClick={handleSignOut} className="text-slate-400 hover:text-red-400">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-row md:flex-col overflow-x-auto p-3 gap-2 md:gap-0 md:space-y-1 shrink-0 md:flex-1 no-scrollbar">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`w-auto whitespace-nowrap md:w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all group ${
                  active
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  size={17}
                  className={active
                    ? 'text-sky-400'
                    : 'text-slate-500 group-hover:text-slate-300'}
                />
                {label}
                {active && (
                  <ChevronRight size={13} className="hidden md:block ml-auto text-sky-400/60" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom (Desktop Only) */}
        <div className="hidden md:block p-3 border-t border-white/[0.07] space-y-2">
          {/* Back to Kids App */}
          <button
            onClick={() => router.push('/play')}
            className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-black shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all mb-8 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform shrink-0">
              <Gamepad2 size={24} />
            </div>
            <div className="text-left w-full overflow-hidden">
              <p className="text-sm truncate">Launch</p>
              <p className="text-[10px] opacity-70 uppercase tracking-widest truncate">Playground</p>
            </div>
          </button>

          {/* User row */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-xs font-black text-white shrink-0">
              {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">
                {user.displayName ?? 'Parent'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="relative flex-1 overflow-y-auto">
        <CSSBackground />
        <div className="relative z-10 p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
