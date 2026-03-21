"use client";

import React, { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Loader2, Download, Trash2, ImageOff } from 'lucide-react';

interface Drawing {
  id: string;
  url: string;
  createdAt: number;
}

export const DrawingGallery = () => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrawings = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'drawings'),
        where('parentUid', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Drawing[];
      setDrawings(docs);
    } catch (e) {
      console.error("Failed to fetch drawings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawings();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this masterpiece?")) return;
    try {
      await deleteDoc(doc(db, 'drawings', id));
      setDrawings(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleDownload = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiddlr-art-${id}.png`;
    link.target = "_blank"; // Fallback for cross-origin
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
        <p className="font-bold text-sm uppercase tracking-widest">Gathering Artworks...</p>
      </div>
    );
  }

  if (drawings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 border border-white/5 rounded-[40px] backdrop-blur-sm animate-in fade-in duration-1000">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
          <ImageOff className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">No drawings yet!</h3>
        <p className="text-slate-500 max-w-xs mx-auto">
          When your child saves a drawing in the playground, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
      {drawings.map((draw) => (
        <div key={draw.id} className="group relative bg-white/8 rounded-[38px] overflow-hidden shadow-2xl border border-white/10 transition-all hover:border-sky-500/40 hover:-translate-y-2 backdrop-blur-md">
          <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={draw.url} 
              alt="Child drawing" 
              className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
            
            <div className="absolute bottom-4 left-4 right-4 flex gap-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <button 
                onClick={() => handleDownload(draw.url, draw.id)}
                className="flex-1 bg-white/20 hover:bg-white text-white hover:text-black py-2.5 rounded-2xl backdrop-blur-md border border-white/20 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-tight"
              >
                <Download size={14} />
                Save to Device
              </button>
              <button 
                onClick={() => handleDelete(draw.id)}
                className="w-12 h-12 bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl backdrop-blur-md border border-rose-500/20 transition-all flex items-center justify-center"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <div className="px-8 py-6 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase font-mono">
              {new Date(draw.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <div className="w-2 h-2 rounded-full bg-sky-500/50" />
          </div>
        </div>
      ))}
    </div>
  );
};
