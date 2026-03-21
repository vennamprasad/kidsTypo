"use client";

import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Loader2, Trash2, CheckCircle2, ClipboardList, Type, Pencil } from 'lucide-react';
// import { Button } from '@kiddokeys/ui'; // Unused

interface Task {
  id: string;
  title: string;
  type: 'typing' | 'drawing';
  content: string;
  completed: boolean;
  createdAt: number | { seconds: number; nanoseconds: number } | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'tasks'),
        where('parentUid', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Task[];
      setTasks(docs);
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);


  const handleDeleteTask = async (id: string) => {
    if (!confirm("Remove this task?")) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Assignment Center</h1>
          <p className="text-slate-500 font-medium">Create custom challenges for your little explorer.</p>
        </div>
      </div>


      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Loading Tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 border border-white/5 rounded-[40px] backdrop-blur-sm">
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
            <ClipboardList className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">No custom tasks yet!</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Assignments you create here will appear as interactive goals in your child&apos;s Playground.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="group bg-white/8 border border-white/10 p-8 rounded-[32px] backdrop-blur-md hover:border-sky-500/30 transition-all flex items-start gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                task.type === 'typing' ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {task.type === 'typing' ? <Type size={24} /> : <Pencil size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-black text-white text-lg truncate">{task.title}</h4>
                  {task.completed && <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />}
                </div>
                <p className="text-slate-500 text-sm font-medium mb-4 italic truncate">&quot;{task.content}&quot;</p>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    task.completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {task.completed ? 'Completed' : 'Assigned'}
                  </span>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
