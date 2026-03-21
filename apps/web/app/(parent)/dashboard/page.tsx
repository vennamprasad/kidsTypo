"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { SessionStats } from '@kiddokeys/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to generate empty week data
const getEmptyWeekData = () => {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      name: DAYS[d.getDay()],
      keyPresses: 0,
      bubblesPopped: 0,
      starsCaught: 0,
      dateStr: d.toDateString(),
    };
  });
};

export default function Dashboard() {
  const { user } = useAuth();
  const [loadingStats, setLoadingStats] = useState(true);
  
  const [totals, setTotals] = useState({ keyPresses: 0, bubblesPopped: 0, starsCaught: 0 });
  const [chartData, setChartData] = useState(getEmptyWeekData());

  useEffect(() => {
    if (!user) return;
    
    const fetchSessionData = async () => {
      setLoadingStats(true);
      try {
        const q = query(collection(db, `parents/${user.uid}/sessions`), orderBy('startedAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        
        let tKeys = 0, tBubbles = 0, tStars = 0;
        const weekData = getEmptyWeekData();

        snapshot.forEach((docSnap) => {
          const s = docSnap.data() as SessionStats;
          
          // Add to totals
          tKeys += s.keyPresses || 0;
          tBubbles += s.bubblesPopped || 0;
          tStars += s.starsCaught || 0;

          // Add to week chart if it falls within the last 7 days
          const sDate = new Date(s.startedAt);
          const dayMatch = weekData.find(wd => wd.dateStr === sDate.toDateString());
          
          if (dayMatch) {
            dayMatch.keyPresses += s.keyPresses || 0;
            dayMatch.bubblesPopped += s.bubblesPopped || 0;
            dayMatch.starsCaught += s.starsCaught || 0;
          }
        });

        setTotals({ keyPresses: tKeys, bubblesPopped: tBubbles, starsCaught: tStars });
        setChartData(weekData);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchSessionData();
  }, [user]);

  if (!user || loadingStats) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-3xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white/5 border border-white/10 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className="p-8 bg-white/8 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-sm group hover:border-sky-500/30 transition-all">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Key Presses</h3>
          <p className="text-4xl font-black text-white mt-3 group-hover:text-sky-400 transition-colors">
            {totals.keyPresses.toLocaleString()}
          </p>
          <div className="mt-4 h-1 w-12 bg-sky-500/30 rounded-full" />
        </div>

        <div className="p-8 bg-white/8 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-sm group hover:border-emerald-500/30 transition-all">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Bubbles Popped</h3>
          <p className="text-4xl font-black text-white mt-3 group-hover:text-emerald-400 transition-colors">
            {totals.bubblesPopped.toLocaleString()}
          </p>
          <div className="mt-4 h-1 w-12 bg-emerald-500/30 rounded-full" />
        </div>

        <div className="p-8 bg-white/8 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-sm group hover:border-amber-500/30 transition-all">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Stars Caught</h3>
          <p className="text-4xl font-black text-white mt-3 group-hover:text-amber-400 transition-colors">
            {totals.starsCaught.toLocaleString()}
          </p>
          <div className="mt-4 h-1 w-12 bg-amber-500/30 rounded-full" />
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="p-8 bg-white/8 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-white">Activity This Week</h3>
            <p className="text-slate-500 text-sm">Engagement across all play modes</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sky-500" />
              <span className="text-slate-400">Keys</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Bubbles</span>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                  backdropFilter: 'blur(8px)'
                }}
                itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="keyPresses" 
                stroke="#0ea5e9" 
                strokeWidth={4} 
                dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4, stroke: '#000' }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="bubblesPopped" 
                stroke="#10b981" 
                strokeWidth={4} 
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#000' }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-8 bg-white/8 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-sm">
          <h3 className="text-lg font-black text-white mb-6">Device Usage</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)'
                  }}
                />
                <Bar dataKey="keyPresses" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-8 bg-white/8 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-sm flex flex-col justify-center text-center">
          <div className="mb-6 mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Keep it up!</h3>
          <p className="text-slate-400 max-w-xs mx-auto text-sm leading-relaxed">
            Your child is showing great progress in tactile learning today.
          </p>
        </div>
      </div>
    </div>
  );
}
