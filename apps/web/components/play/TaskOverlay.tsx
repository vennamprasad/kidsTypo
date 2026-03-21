"use client";

import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { X, Type, Pencil, Star } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface Task {
  id: string;
  title: string;
  type: 'typing' | 'drawing';
  content: string;
  completed: boolean;
}

export const TaskOverlay = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // const [hasNew, setHasNew] = useState(false); // Unused
  const setMode = useAppStore(state => state.setMode);
  const setActiveTask = useAppStore(state => state.setActiveTask);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'tasks'),
          where('parentUid', '==', auth.currentUser.uid),
          where('completed', '==', false)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Task[];
        setTasks(docs);
        if (docs.length > 0) {
          // setHasNew(true);
          // Auto-popup disabled as per user request to "stop showing"
        }
      } catch (e) {
        console.error("Failed to fetch playground tasks", e);
      }
    };

    fetchTasks();
  }, [isOpen]);

  const handleTaskClick = (task: Task) => {
    setActiveTask({
      id: task.id,
      title: task.title,
      type: task.type,
      content: task.content
    });
    setMode(task.type === 'typing' ? 'keyboard' : 'draw');
    setIsOpen(false);
  };

  if (tasks.length === 0 && !isOpen) return null;

  return (
    <>
      {/* Fullscreen Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-[48px] p-12 relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/20 blur-[100px]" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/20 blur-[100px]" />

            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>

            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-amber-400/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 border-2 border-amber-400/20">
                <Star className="w-12 h-12 text-amber-400 fill-amber-400" />
              </div>
              <h2 className="text-4xl font-black text-white mb-2 italic">YOUR SPECIAL GOALS!</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Choose a challenge to earn points</p>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="w-full group bg-white/5 border border-white/10 p-8 rounded-[38px] flex items-center gap-6 hover:bg-white/10 hover:border-sky-500/40 transition-all text-left active:scale-95"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${
                    task.type === 'typing' 
                    ? 'bg-sky-500/10 border-sky-400/20 text-sky-400' 
                    : 'bg-emerald-500/10 border-emerald-400/20 text-emerald-400'
                  }`}>
                    {task.type === 'typing' ? <Type size={32} /> : <Pencil size={32} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white group-hover:text-sky-400 transition-colors uppercase italic">{task.title}</h3>
                    <p className="text-slate-500 font-bold tracking-tight">Challenge: {task.content}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center text-white/20 group-hover:border-sky-500/30 group-hover:text-sky-500 transition-all">
                    <Star size={24} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </>
  );
};
